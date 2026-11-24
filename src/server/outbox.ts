import type { MailConfig } from '../app/types'
import { blankMail, composeMail, mailMask, type Topic } from '../app/mail'
import { bad, env, json, sql } from './db'
import type { SessionUser } from './auth'

const configKey = 'email_provider'
const mask = (c: MailConfig) => ({ ...c, apiKey: c.apiKey ? mailMask : '' })
async function config(): Promise<MailConfig> {
  const [row] = await sql()`select value from studio.settings where key=${configKey}`
  return { ...blankMail, ...row?.value }
}
export async function mailSettings(input?: Partial<MailConfig> | null) {
  const old = await config()
  if (input === undefined) return json(mask(old))
  if (!input || !['none','resend'].includes(input.provider ?? '') || typeof input.sender !== 'string'
    || typeof input.appUrl !== 'string' || typeof input.apiKey !== 'string') return bad('settings')
  const next: MailConfig = { provider: input.provider!, sender: input.sender.trim(), appUrl: input.appUrl.trim().replace(/\/$/, ''),
    apiKey: input.apiKey === mailMask ? old.apiKey : input.apiKey.trim() }
  if (next.appUrl) {
    let u: URL
    try { u = new URL(next.appUrl) } catch { return bad('portal URL') }
    const local = u.protocol === 'http:' && ['localhost','127.0.0.1','[::1]'].includes(u.hostname)
    if ((!local && u.protocol !== 'https:') || u.username || u.password || u.search || u.hash) return bad('portal URL')
  }
  if ((next.sender && !/^[^\s@,;:<>"]+@[^\s@,;:<>"]+\.[^\s@,;:<>"]+$/.test(next.sender))
    || next.apiKey.length > 512 || /\s/.test(next.apiKey) || next.sender.length > 254
    || (next.provider === 'resend' && !(next.sender && next.apiKey && next.appUrl))) return bad('settings')
  // A masked form may have been opened before another admin rotated the key.
  const keepKey = input.apiKey === mailMask
  const [saved] = await sql()`insert into studio.settings(key,value) values(${configKey},${JSON.stringify(next)}::jsonb)
    on conflict(key) do update set value=case when ${keepKey} then
      jsonb_set(excluded.value,'{apiKey}',coalesce(studio.settings.value->'apiKey','""'::jsonb))
      else excluded.value end, updated_at=now()
    where not ${keepKey} or excluded.value->>'provider'='none' or coalesce(studio.settings.value->>'apiKey','') <> ''
    returning value`
  return saved ? json(mask(saved.value)) : bad('settings',409)
}

type Notice = { id: string; topic: Topic; lang: string; title: string; detail: string; request_id: string; email: string }
function envelope(row: Notice, settings: MailConfig, fallback: string) {
  return { from: settings.sender, to: row.email,
    ...composeMail(row.topic, row.lang, row.title, row.detail, settings.appUrl || fallback, row.request_id) }
}

export async function notices(me: SessionUser, before: string | null, fallback: string, requestId: string | null) {
  if (before !== null && !/^[1-9]\d{0,17}$/.test(before)) return bad('cursor')
  const settings = await config()
  const rows = await sql()`select o.*, u.email, case when o.status='queued' and
      (u.role <> 'client' or coalesce(u.account_id,u.id) <> o.owner_id or not coalesce((u.notify->>o.topic)::boolean,true))
      then 'skipped' else o.status end as visible_status from studio.outbox o join studio.users u on u.id=o.recipient_id
    where (${me.role === 'admin'} or (o.recipient_id=${me.id} and o.owner_id=${me.acct} and o.status='sent'))
      and (${requestId}::uuid is null or o.request_id=${requestId}::uuid)
      and (${before}::bigint is null or o.id<${before}::bigint)
    order by o.id desc limit 21`
  const items = rows.slice(0,20).map(r => {
    const msg = r.envelope ?? envelope(r as Notice, settings, fallback)
    return { id: String(r.id), email: msg.to, subject: msg.subject, text: msg.text, status: r.visible_status, at: r.created_at, sentAt: r.sent_at }
  })
  return json({ items, next: rows.length > 20 ? items.at(-1)!.id : null })
}

// Claim one message at a time. The lease outlasts the HTTP timeout. After a crash
// another process retries the identical envelope and key within Resend's 24-hour window.
async function deliverOne(c: MailConfig) {
  const db = sql()
  const [r] = await db`with candidate as (
      select id from studio.outbox where status='queued' and available_at<=now()
      order by available_at,id limit 1 for update skip locked
    ) update studio.outbox o set available_at=now()+interval '2 minutes', attempts=attempts+1,
      first_attempt=coalesce(first_attempt,now()) from candidate, studio.users u
    where candidate.id=o.id and u.id=o.recipient_id returning o.*, u.email,
      (u.role='client' and coalesce(u.account_id,u.id)=o.owner_id and coalesce((u.notify->>o.topic)::boolean,true)) as enabled,
      (o.first_attempt < now()-interval '23 hours') as expired`
  if (!r) return false
  const msg = r.envelope ?? envelope(r as Notice, c, c.appUrl)
  let status = 'failed'
  // accounts made with a username only have no email: their notices stay in the app
  if (!r.enabled || !r.email || msg.to !== r.email) status = 'skipped'
  else if (!r.expired) {
    await db`update studio.outbox set envelope=${JSON.stringify(msg)}::jsonb where id=${r.id} and attempts=${r.attempts}`
    try {
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', redirect: 'error',
        headers: { Authorization: 'Bearer ' + c.apiKey, 'Content-Type': 'application/json', 'Idempotency-Key': 'studio/' + r.source_id + '/' + r.recipient_id },
        // jsonb can reorder keys after a restart. Use the same HTTP body on every attempt.
        body: JSON.stringify({ from: msg.from, to: msg.to, subject: msg.subject, text: msg.text }), signal: AbortSignal.timeout(10000) })
      if (response.ok && typeof (await response.json()).id === 'string') status = 'sent'
      else if ([408,409,429].includes(response.status) || response.status >= 500) status = 'queued'
    } catch { status = 'queued' }
  }
  await db`update studio.outbox set status=${status}, sent_at=case when ${status}='sent' then now() end,
    available_at=now()+make_interval(secs=>least(3600,15*power(2,least(attempts,8)))::int)
    where id=${r.id} and attempts=${r.attempts}`
  return true
}
let timer: ReturnType<typeof setInterval> | undefined
let busy = false
async function drain() {
  if (busy) return
  busy = true
  try {
    for (let i = 0; i < 20; i++) {
      const c = await config()
      if (c.provider !== 'resend' || !await deliverOne(c)) break
    }
  } catch { /* The durable queue will be retried on the next tick. */ }
  finally { busy = false }
}
export function startMailer() {
  if (timer || env('STUDIO_MAIL_PAUSED') === '1') return
  timer = setInterval(() => { void drain() }, 15000)
  timer.unref()
  void drain()
}
