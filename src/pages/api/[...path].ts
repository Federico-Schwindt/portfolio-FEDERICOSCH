/**
 * The studio API: one router for the client app. Runs on the server (never prerendered).
 * Every route checks the session; clients only ever touch their own rows, the studio (admin) touches all.
 */
import type { APIRoute } from 'astro'
import { activityPage, validId } from '../../server/workspace-activity'
import { mailSettings, notices, startMailer } from '../../server/outbox'
import { workspaceSearch } from '../../server/workspace-search'
import { revisionTag, stateResponse } from '../../server/state-response'
import { maxQueryLength } from '../../app/workspace-search'
import { KINDS as CHANGE_KINDS, applyChange, applyDue, cancelChange, changeCheckout, openChange, quote as planQuote, toChange, type ChangeKind } from '../../server/plans'
import { createHash, randomUUID } from 'node:crypto'
import { sql, json, bad, body, sameOrigin, env } from '../../server/db'
import { hashPassword, checkPassword, startSession, endSession, currentUser, sessionRevision, isAdminEmail, tooMany, type SessionUser } from '../../server/auth'
import { payConfig, masked, savePayConfig, createCheckout, verifyWebhook, type PayConfig, type PlanId, type Step } from '../../server/payments'

export const prerender = false

/** repeating requests whose date came: one new request each, then the next date */
async function makeRecurring(acct?: string) {
  const db = sql()
  const due = acct ? await db`select * from studio.recurring where active and next_at <= now() and user_id = ${acct}` : await db`select * from studio.recurring where active and next_at <= now() limit 100`
  for (const x of due) {
    const position = Date.now() / 1000 - (x.priority === 1 ? 1e6 : 0)
    // one statement: claim the date (so two dashboards loading at once create one request), create the request, log it.
    // If any part fails nothing is written, and the next load tries again.
    try { await db`
      with c as (
        update studio.recurring set next_at = next_at + (case when every = 'week' then interval '7 days' else interval '1 month' end), made = made + 1
        where id = ${x.id} and active and next_at <= now() returning *
      ), r as (
        insert into studio.requests (user_id, created_by, title, kind, brief, checklist, files, priority, position, recurring_id)
        select c.user_id, c.created_by, c.title, c.kind::studio.request_kind, c.brief, c.checklist, '[]', c.priority, ${position}, c.id from c
        returning id, user_id
      ), e as (
        insert into studio.request_events (request_id, user_id, kind, body)
        select r.id, r.user_id, 'ai', ${x.every === 'week' ? 'Weekly request, created on schedule.' : 'Monthly request, created on schedule.'} from r returning id
      )
      select (select count(*) from r)::int as made` } catch (e) { console.error("[recurring]", x.id, e) } // one broken schedule never blocks the dashboard
  }
}
const sha256 = (t: string) => createHash('sha256').update(t).digest('hex')
/** a pending invite for this email, or null */
async function openInvite(token: string, email: string) {
  if (typeof token !== 'string' || token.length < 30) return null
  const [i] = await sql()`select id, account_id, email from studio.invites where token_hash = ${sha256(token)} and accepted_at is null and revoked_at is null and expires_at > now()`
  return i && String(i.email).toLowerCase() === email.toLowerCase() ? (i as { id: string; account_id: string; email: string }) : null
}

const KINDS = ['page', 'design', 'copy', 'campaign', 'fix', 'social', 'automation', 'other']
const PLANS: PlanId[] = ['launch', 'grow', 'scale']
const emailOk = (e: unknown): e is string => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length < 200
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '')

const toReq = (r: any) => ({
  id: r.id, number: r.number, owner: r.user_id, ownerName: r.company || r.full_name || r.email, title: r.title, kind: r.kind, brief: r.brief, checklist: r.checklist, files: r.files,
  priority: r.priority, status: r.status, position: r.position, progress: r.progress, deliverable: r.deliverable_url,
  createdAt: r.created_at, startedAt: r.started_at, reviewAt: r.review_at, doneAt: r.done_at, dueDate: r.due_date ? new Date(r.due_date).toISOString().slice(0, 10) : null, rating: r.rating ?? null, ratingNote: r.rating_note ?? null, recurringId: r.recurring_id ?? null,
})
const toRec = (x: any) => ({ id: x.id, title: x.title, kind: x.kind, every: x.every, nextAt: x.next_at, made: x.made, active: x.active })
const toFile = (x: any) => ({ id: x.id, owner: x.user_id, requestId: x.request_id, kind: x.kind, version: x.version, name: x.name, mime: x.mime, size: x.size, at: x.created_at, byStudio: x.by_admin })
const MAX_FILE = 8 * 1024 * 1024
const toUser = (u: SessionUser) => ({ id: u.id, email: u.email, name: u.full_name, company: u.account_id ? (u.owner_company || u.owner_name || '') : u.company, role: u.role, brand: u.account_id ? (u.owner_brand ?? {}) : u.brand, account: u.acct, member: !!u.account_id, phone: u.phone, jobTitle: u.job_title, timezone: u.timezone, avatar: u.avatar, notify: u.notify, lang: u.lang, since: u.created_at, accountName: u.account_id ? (u.owner_company || u.owner_name || '') : u.company || u.full_name })
const toSub = (s: any) => (s ? { plan: s.plan_id, status: s.status, community: s.addon_community, periodEnd: s.current_period_end, portalUrl: s.portal_url } : null)

async function state(me: SessionUser) {
  const db = sql(), admin = me.role === 'admin'
  await applyDue(admin ? undefined : me.acct)
  await makeRecurring(admin ? undefined : me.acct)
  const recurring = admin ? [] : await db`select * from studio.recurring where user_id = ${me.acct} and active order by next_at`
  const changes = await db`select * from studio.plan_changes where user_id = ${me.acct} order by created_at desc limit 20`
  const [subs, reqs, events, invoices, files, seen, pins] = await Promise.all([
    db`select * from studio.subscriptions where user_id = ${me.acct}`,
    admin
      ? db`select r.*, u.full_name, u.company, u.email from studio.requests r join studio.users u on u.id = r.user_id where r.status <> 'cancelled' order by r.position`
      : db`select r.*, u.full_name, u.company, u.email from studio.requests r join studio.users u on u.id = r.user_id where r.user_id = ${me.acct} and r.status <> 'cancelled' order by r.position`,
    admin
      ? db`select * from (select e.*, (u.role = 'admin') as by_admin, u.full_name as by_name from studio.request_events e left join studio.users u on u.id = e.author order by e.created_at desc limit 400) e order by created_at`
      : db`select * from (select e.*, (u.role = 'admin') as by_admin, u.full_name as by_name from studio.request_events e left join studio.users u on u.id = e.author where e.user_id = ${me.acct} order by e.created_at desc limit 400) e order by created_at`,
    me.account_id ? Promise.resolve([]) : db`select * from studio.invoices where user_id = ${me.id} order by created_at desc`, // billing stays with the owner
    admin
      ? db`select f.id, f.user_id, f.request_id, f.kind, f.version, f.name, f.mime, f.size, f.created_at, (u.role = 'admin') as by_admin from studio.files f left join studio.users u on u.id = f.uploaded_by order by f.created_at desc limit 500`
      : db`select f.id, f.user_id, f.request_id, f.kind, f.version, f.name, f.mime, f.size, f.created_at, (u.role = 'admin') as by_admin from studio.files f left join studio.users u on u.id = f.uploaded_by where f.user_id = ${me.acct} order by f.created_at desc limit 500`,
    db`select last_seen_at from studio.users where id = ${me.id}`,
    admin
      ? db`select a.*, (u.role = 'admin') as by_admin from studio.annotations a left join studio.users u on u.id = a.author order by a.created_at limit 2000`
      : db`select a.*, (u.role = 'admin') as by_admin from studio.annotations a left join studio.users u on u.id = a.author where a.user_id = ${me.acct} order by a.created_at limit 2000`,
  ])
  return { recurring: recurring.map(toRec), changes: changes.map(toChange),
    user: toUser(me), sub: toSub(subs[0]), reqs: reqs.map((r) => ({ ...toReq(r), ownerEmail: admin ? r.email : undefined })),
    events: events.map((e: any) => ({ id: e.id, requestId: e.request_id, who: e.kind === 'ai' ? 'ai' : !e.author ? 'system' : e.by_admin ? 'studio' : 'client', by: e.by_name || undefined, kind: e.kind, body: e.body, at: e.created_at })),
    invoices: invoices.map((i: any) => ({ id: i.id, label: i.label, amount: i.amount_cents / 100, status: i.status, url: i.url, at: i.created_at })),
    files: files.map(toFile),
    pins: pins.map((a: any) => ({ id: a.id, fileId: a.file_id, x: a.x, y: a.y, body: a.body, resolved: a.resolved, byStudio: a.by_admin, mine: a.author === me.id, at: a.created_at })),
    lastSeen: seen[0]?.last_seen_at ?? null,
  }
}

export const ALL: APIRoute = async ({ request, params, url }) => {
  const path = params.path ?? ''
  const m = request.method
  try {
    startMailer()
    if (path === 'health') return json({ ok: true })
    // the payment provider posts here, with its own signature instead of a session
    if (path === 'billing/webhook' && m === 'POST') return webhook(request)
    // a file download is a plain GET with the session cookie
    const fm = path.match(/^files\/([0-9a-f-]{36})$/)
    if (fm && m === 'GET') {
      const viewer = await currentUser(request)
      if (!viewer) return bad('sign in', 401)
      const [x] = await sql()`select name, mime, user_id, encode(data, 'base64') as b64 from studio.files where id = ${fm[1]}`
      if (!x || (viewer.role !== 'admin' && x.user_id !== viewer.acct)) return bad('not found', 404)
      const safe = String(x.name).replace(/[^\w.\- ]+/g, '_')
      return new Response(Buffer.from(x.b64, 'base64'), { headers: { 'Content-Type': x.mime, 'Content-Disposition': `${url.searchParams.has('dl') ? 'attachment' : 'inline'}; filename="${safe}"`, 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox" } })
    }
    if (!sameOrigin(request)) return bad('forbidden', 403)
    const secure = url.protocol === 'https:'
    const db = sql()

    // ── accounts ──
    if (path === 'auth/signup' && m === 'POST') {
      const b = await body<{ email: string; password: string; name: string; invite?: string; lang?: string }>(request)
      if (!emailOk(b.email)) return bad('Enter a valid email.')
      if (typeof b.password !== 'string' || b.password.length < 8) return bad('Use at least 8 characters for the password.')
      const email = b.email.trim().toLowerCase()
      // ALLOW_SIGNUP=1 only for local test runs, never on the live server
      if (!b.invite && !isAdminEmail(email) && env('ALLOW_SIGNUP') !== '1') return bad('Accounts are created by the studio. Ask Federico for your access.', 403)
      const exists = await db`select 1 from studio.users where email = ${email}`
      if (exists.length) return bad('There is already an account with this email. Sign in instead.', 409)
      const inv = b.invite ? await openInvite(b.invite, email) : null
      if (b.invite && !inv) return bad('This invitation is not valid anymore, or it was sent to another email.', 410)
      const rows = await db`insert into studio.users (email, password_hash, full_name, role, account_id, lang) values (${email}, ${await hashPassword(b.password)}, ${str(b.name, 120)}, ${isAdminEmail(email) ? 'admin' : 'client'}, ${inv?.account_id ?? null}, ${b.lang === 'es' ? 'es' : 'en'}) returning id`
      if (inv) await db`update studio.invites set accepted_at = now(), accepted_by = ${rows[0].id} where id = ${inv.id}`
      return json({ ok: true }, 200, { 'Set-Cookie': await startSession(rows[0].id, secure, request.headers.get('user-agent') ?? '') })
    }
    if (path === 'auth/login' && m === 'POST') {
      const b = await body<{ email: string; password: string; invite?: string }>(request)
      const login = typeof b.email === 'string' ? b.email.trim().toLowerCase() : ''
      if (login.length < 3 || typeof b.password !== 'string') return bad('Wrong username or password.', 401)
      if (tooMany(login)) return bad('Too many attempts. Try again in a few minutes.', 429)
      const rows = await db`select id, password_hash, disabled_at from studio.users where lower(email) = ${login} or lower(username) = ${login} limit 1`
      if (!rows.length || !(await checkPassword(b.password, rows[0].password_hash))) return bad('Wrong username or password.', 401)
      if (rows[0].disabled_at) return bad('This account is switched off. Ask Federico to turn it back on.', 403)
      if (b.invite) {
        const inv = await openInvite(b.invite, login)
        if (!inv) return bad('This invitation is not valid anymore, or it was sent to another email.', 410)
        if (inv.account_id !== rows[0].id) { await db`update studio.users set account_id = ${inv.account_id} where id = ${rows[0].id} and role = 'client'`; await db`update studio.invites set accepted_at = now(), accepted_by = ${rows[0].id} where id = ${inv.id}` }
      }
      return json({ ok: true }, 200, { 'Set-Cookie': await startSession(rows[0].id, secure, request.headers.get('user-agent') ?? '') })
    }
    if (path === 'team/invite-info' && m === 'POST') {
      const b = await body<{ token: string }>(request)
      const [i] = typeof b.token === 'string' ? await db`select i.email, o.company, o.full_name from studio.invites i join studio.users o on o.id = i.account_id where i.token_hash = ${sha256(b.token)} and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()` : []
      return i ? json({ email: i.email, account: i.company || i.full_name }) : bad('This invitation is not valid anymore.', 410)
    }
    if (path === 'auth/logout' && m === 'POST') return json({ ok: true }, 200, { 'Set-Cookie': await endSession(request) })

    if (path === 'state' && m === 'GET') {
      const previous = request.headers.get('x-studio-version')
      // Read the marker before any snapshot fields. A concurrent commit will be picked up next poll.
      const probe = previous !== null ? await sessionRevision(request) : null
      const scope = probe && [probe.id, probe.acct, probe.role].join('/')
      const [collections, tag] = previous?.split('~') ?? []
      if (scope && probe?.revision && tag === revisionTag(scope, probe.revision, collections)) {
        return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store', 'Server-Timing': 'state-revision' } })
      }
      const me = await currentUser(request)
      if (!me) return bad('sign in', 401)
      const viewer = [me.id, me.acct, me.role].join('/')
      return stateResponse(await state(me), viewer, previous, viewer === scope ? probe?.revision : undefined)
    }
    const me = await currentUser(request)
    if (!me) return bad('sign in', 401)
    const admin = me.role === 'admin'

    if (path === 'activity' && m === 'GET') return await activityPage(me, url.searchParams)
    if (path === 'activity' && m === 'POST') {
      const search = await body(request)
      if (typeof search?.query !== 'string') return bad('query')
      return await activityPage(me, url.searchParams, search.query)
    }
    if (path === 'notices' && m === 'GET') {
      const id = url.searchParams.get('request')
      if (id !== null && !validId(id)) return bad('request')
      return await notices(me, url.searchParams.get('before'), url.origin + import.meta.env.BASE_URL, id)
    }
    if (path === 'admin/mail') {
      if (!admin) return bad('forbidden', 403)
      if (m === 'GET') return await mailSettings()
      if (m === 'PUT') return await mailSettings(await body(request))
    }
    if (path === 'search' && m === 'POST') {
      const b = await body<{ query?: unknown; offset?: number }>(request)
      const q = typeof b?.query === 'string' ? b.query.trim() : ''
      if (!q || q.length > maxQueryLength) return bad('query')
      const offset = b.offset ?? 0
      if (!Number.isSafeInteger(offset) || offset < 0) return bad('offset')
      return json(await workspaceSearch(me, q, offset))
    }

    // ── the client's team: the owner invites and removes; members see who is on the account ──
    if (path === 'team' && m === 'GET') {
      const [members, invites] = await Promise.all([
        db`select id, email, full_name, created_at, (id = ${me.acct}) as owner from studio.users where id = ${me.acct} or account_id = ${me.acct} order by created_at`,
        me.account_id ? Promise.resolve([]) : db`select id, email, created_at, accepted_at, revoked_at, expires_at from studio.invites where account_id = ${me.acct} and accepted_at is null and revoked_at is null and expires_at > now() order by created_at desc`,
      ])
      return json({ members: members.map((u: any) => ({ id: u.id, email: u.email, name: u.full_name, since: u.created_at, owner: u.owner })), invites: invites.map((i: any) => ({ id: i.id, email: i.email, at: i.created_at, expires: i.expires_at })) })
    }
    if (path === 'team/invites' && m === 'POST') {
      if (me.account_id || admin) return bad('Only the account owner can invite.', 403)
      const b = await body<{ email: string }>(request)
      if (!emailOk(b.email)) return bad('Enter a valid email.')
      const email = b.email.trim().toLowerCase()
      if (email === me.email) return bad('That is your own email.')
      const [{ n }] = await db`select count(*)::int as n from studio.users where account_id = ${me.id}`
      if (n >= 10) return bad('Up to 10 teammates per account.', 409)
      const token = randomUUID() + randomUUID()
      await db`update studio.invites set revoked_at = now() where account_id = ${me.id} and email = ${email} and accepted_at is null and revoked_at is null`
      const [i] = await db`insert into studio.invites (account_id, email, token_hash, created_by) values (${me.id}, ${email}, ${sha256(token)}, ${me.id}) returning id`
      return json({ id: i.id, link: `${request.headers.get('origin') || url.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}/app/?invite=${token}` })
    }
    const tim = path.match(/^team\/invites\/([0-9a-f-]{36})$/)
    if (tim && m === 'DELETE') {
      if (me.account_id) return bad('not allowed', 403)
      await db`update studio.invites set revoked_at = now() where id = ${tim[1]} and account_id = ${me.id}`
      return json({ ok: true })
    }
    const tmm = path.match(/^team\/members\/([0-9a-f-]{36})$/)
    if (tmm && m === 'DELETE') {
      // the owner removes anyone; a member can leave
      if (me.account_id ? tmm[1] !== me.id : false) return bad('not allowed', 403)
      const owner = me.account_id ?? me.id
      await db`update studio.users set account_id = null where id = ${tmm[1]} and account_id = ${owner}`
      return json({ ok: true })
    }

    if (path === 'profile/password' && m === 'POST') {
      const b = await body<{ current: string; next: string }>(request)
      if (typeof b.next !== 'string' || b.next.length < 8) return bad('Use at least 8 characters for the new password.')
      if (tooMany('pw:' + me.id)) return bad('Too many attempts. Try again in a few minutes.', 429)
      const [u] = await db`select password_hash from studio.users where id = ${me.id}`
      if (typeof b.current !== 'string' || !(await checkPassword(b.current, u.password_hash))) return bad('The current password is not right.', 403)
      await db`update studio.users set password_hash = ${await hashPassword(b.next)} where id = ${me.id}`
      // every other device is signed out; this one stays
      await db`delete from studio.sessions where user_id = ${me.id} and id <> ${me.session}`
      return json({ ok: true })
    }
    if (path === 'profile/sessions' && m === 'GET') {
      const rows = await db`select id, user_agent, created_at, expires_at from studio.sessions where user_id = ${me.id} and expires_at > now() order by created_at desc limit 30`
      return json(rows.map((x: any) => ({ id: x.id, agent: x.user_agent, at: x.created_at, current: x.id === me.session })))
    }
    const sm = path.match(/^profile\/sessions\/([0-9a-f-]{36}|others)$/)
    if (sm && m === 'DELETE') {
      if (sm[1] === 'others') await db`delete from studio.sessions where user_id = ${me.id} and id <> ${me.session}`
      else await db`delete from studio.sessions where user_id = ${me.id} and id = ${sm[1]} and id <> ${me.session}`
      return json({ ok: true })
    }
    if (path === 'profile' && m === 'PATCH') {
      const b = await body<{ name?: string; company?: string; brand?: unknown; phone?: string; jobTitle?: string; timezone?: string; lang?: string; avatar?: string | null; notify?: Record<string, unknown> }>(request)
      const opt = (v: unknown, n: number) => (v === undefined ? null : str(v, n))
      if (b.brand != null && (typeof b.brand !== 'object' || Array.isArray(b.brand))) return bad('Invalid brand details.')
      const brand = b.brand ? JSON.stringify(b.brand) : null
      if (brand && brand.length > 8000) return bad('Brand details are too long.')
      if (b.avatar !== undefined && b.avatar !== null && b.avatar !== '' && !(typeof b.avatar === 'string' && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(b.avatar) && b.avatar.length <= 220000)) return bad('The picture must be a PNG, JPG or WebP under 150 KB.')
      const notify = b.notify && typeof b.notify === 'object' ? Object.fromEntries(['review', 'comments', 'weekly', 'billing'].map((k) => [k, (b.notify as Record<string, unknown>)[k] !== false])) : null
      // Lock the shared kit before merging. A teammate may save it while the owner finishes welcome.
      const [updated] = await db`with account_brand as (
        select (case when jsonb_typeof(brand) = 'object' then brand else '{}'::jsonb end) || ${brand}::jsonb as merged
        from studio.users where id = ${me.acct} and ${brand}::jsonb is not null for update
      ), allowed as (
        select merged from account_brand where length(merged::text) <= 8000
        union all select null::jsonb where ${brand}::jsonb is null
      ), shared_kit as (
        update studio.users set brand = allowed.merged from allowed
        where id = ${me.acct} and ${!!me.account_id} and allowed.merged is not null
      )
      update studio.users set phone = coalesce(${opt(b.phone, 40)}, phone), job_title = coalesce(${opt(b.jobTitle, 80)}, job_title), timezone = coalesce(${opt(b.timezone, 60)}, timezone),
        lang = coalesce(${b.lang === 'es' || b.lang === 'en' ? b.lang : null}, lang), notify = coalesce(${notify ? JSON.stringify(notify) : null}::jsonb, notify),
        avatar = case when ${b.avatar === undefined} then avatar else ${b.avatar || null} end,
        full_name = coalesce(${opt(b.name, 120)}, full_name), company = coalesce(${opt(b.company, 120)}, company),
        brand = case when ${!me.account_id} then coalesce(allowed.merged, brand) else brand end
        from allowed where id = ${me.id} returning id`
      if (!updated) return bad('Brand details are too long.')
      return json({ ok: true })
    }

    // ── requests ──
    if (path === 'requests' && m === 'POST') {
      const b = await body<{ title: string; kind: string; brief: string; checklist: { text: string; done: boolean }[]; priority: number; files: string[]; dueDate?: string }>(request)
      const due = typeof b.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.dueDate) ? b.dueDate : null
      const title = str(b.title, 140).trim()
      if (title.length < 3) return bad('Give the request a title.')
      const kind = KINDS.includes(b.kind) ? b.kind : 'other'
      const priority = [1, 2, 3].includes(b.priority) ? b.priority : 2
      const check = Array.isArray(b.checklist) ? b.checklist.slice(0, 20).map((c) => ({ text: str(c?.text, 240), done: false })) : []
      const files = Array.isArray(b.files) ? b.files.slice(0, 20).map((f) => str(f, 200)) : []
      const position = Date.now() / 1000 - (priority === 1 ? 1e6 : 0)
      const rows = await db`insert into studio.requests (user_id, created_by, title, kind, brief, checklist, files, priority, position, due_date) values (${me.acct}, ${me.id}, ${title}, ${kind}, ${str(b.brief, 6000)}, ${JSON.stringify(check)}, ${JSON.stringify(files)}, ${priority}, ${position}, ${due}) returning *`
      if (check.length) await db`insert into studio.request_events (request_id, user_id, kind, body) values (${rows[0].id}, ${me.acct}, 'ai', ${`Brief structured into ${check.length} steps.`})`
      return json(toReq(rows[0]))
    }
    // ── requests that repeat ──
    if (path === 'recurring' && m === 'POST') {
      if (admin) return bad('not for the studio', 403)
      const b = await body<{ title: string; kind: string; brief: string; checklist: { text: string }[]; priority: number; every: 'week' | 'month' }>(request)
      const title = str(b.title, 140).trim()
      if (title.length < 3 || !['week', 'month'].includes(b.every)) return bad('Give the request a title and how often it repeats.')
      const [{ n }] = await db`select count(*)::int as n from studio.recurring where user_id = ${me.acct} and active`
      if (n >= 20) return bad('Up to 20 repeating requests.', 409)
      const check = Array.isArray(b.checklist) ? b.checklist.slice(0, 20).map((c) => ({ text: str(c?.text, 240), done: false })) : []
      const [x] = await db`insert into studio.recurring (user_id, created_by, title, kind, brief, checklist, priority, every, next_at)
        values (${me.acct}, ${me.id}, ${title}, ${KINDS.includes(b.kind) ? b.kind : 'other'}, ${str(b.brief, 6000)}, ${JSON.stringify(check)}, ${[1, 2, 3].includes(b.priority) ? b.priority : 2}, ${b.every}, now() + ${b.every === 'week' ? '7 days' : '1 month'}::interval) returning *`
      return json(toRec(x))
    }
    const rcm = path.match(/^recurring\/([0-9a-f-]{36})$/)
    if (rcm && m === 'DELETE') {
      await db`update studio.recurring set active = false where id = ${rcm[1]} and user_id = ${me.acct}`
      return json({ ok: true })
    }
    if (path === 'requests/reorder' && m === 'POST') {
      const b = await body<{ owner: string; expected: string[]; order: string[] }>(request)
      if (!b || !validId(b.owner) || !Array.isArray(b.expected) || !Array.isArray(b.order)
        || !b.order.length || b.expected.length !== b.order.length || !b.order.every(validId)
        || !b.expected.every(validId) || new Set(b.order).size !== b.order.length) return bad('order')
      if (!admin && b.owner !== me.acct) return bad('forbidden', 403)
      const [row] = await db`select studio.reorder_queue(${b.owner},${b.expected}::uuid[],${b.order}::uuid[]) as ok`
      return row.ok ? json({ ok: true }) : bad('Queue changed', 409)
    }
    const rtm = path.match(/^requests\/([0-9a-f-]{36})\/rating$/)
    if (rtm && m === 'POST') {
      if (admin) return bad('Only the client rates a delivery.', 403)
      const b = await body<{ score: number; note?: string }>(request)
      if (![1, 2, 3, 4, 5].includes(b.score)) return bad('score')
      const rows = await db`update studio.requests set rating = ${b.score}, rating_note = ${str(b.note, 1000) || null} where id = ${rtm[1]} and user_id = ${me.acct} and status = 'done' returning id`
      if (!rows.length) return bad('not found', 404)
      await db`insert into studio.request_events (request_id, user_id, author, kind, body) values (${rtm[1]}, ${me.acct}, ${me.id}, 'comment', ${'★'.repeat(b.score) + '☆'.repeat(5 - b.score) + (b.note ? ' ' + str(b.note, 1000) : '')})`
      return json({ ok: true })
    }
    const rm = path.match(/^requests\/([0-9a-f-]{36})(\/comments)?$/)
    if (rm) {
      const [cur] = await db`select * from studio.requests where id = ${rm[1]}`
      if (!cur || (!admin && cur.user_id !== me.acct)) return bad('not found', 404)
      if (rm[2] && m === 'POST') {
        const b = await body<{ body: string }>(request)
        const text = str(b.body, 4000).trim()
        if (!text) return bad('empty')
        await db`insert into studio.request_events (request_id, user_id, author, kind, body) values (${cur.id}, ${cur.user_id}, ${me.id}, 'comment', ${text})`
        return json({ ok: true })
      }
      if (!rm[2] && m === 'PATCH') {
        const b = await body<{ status?: string; title?: string; brief?: string; checklist?: { text: string; done: boolean }[]; priority?: number; progress?: number; deliverable?: string | null; dueDate?: string | null; note?: string }>(request)
        if (!admin) {
          // what a client may do: approve or send back a review, cancel a queued one, edit while it waits
          if (b.status && b.status !== cur.status && !((cur.status === 'review' && ['done', 'active'].includes(b.status)) || (cur.status === 'queued' && b.status === 'cancelled'))) return bad('not allowed', 403)
          if (b.progress !== undefined || b.deliverable !== undefined) return bad('not allowed', 403)
          if (cur.status !== 'queued' && (b.title !== undefined || b.brief !== undefined || b.priority !== undefined || b.checklist !== undefined || b.dueDate !== undefined)) return bad('not allowed', 403)
        }
        const status = b.status && ['queued', 'active', 'review', 'done', 'cancelled'].includes(b.status) ? b.status : null
        const progress = typeof b.progress === 'number' ? Math.max(0, Math.min(100, Math.round(b.progress))) : null
        const backToWork = status === 'active' && cur.status === 'review' ? 70 : null
        const note = str(b.note, 4000).trim()
        if (backToWork && !admin && note.length < 3) return bad('Tell the studio what should change.')
        const [{ v }] = backToWork ? await db`select coalesce(max(version), 0) as v from studio.files where request_id = ${cur.id} and kind = 'deliverable'` : [{ v: 0 }]
        await db.transaction([
          db`select set_config('studio.actor', ${me.id}, true)`,
          db`update studio.requests set
              status = coalesce(${status}::studio.request_status, status),
              title = coalesce(${b.title === undefined ? null : str(b.title, 140)}, title),
              brief = coalesce(${b.brief === undefined ? null : str(b.brief, 6000)}, brief),
              checklist = coalesce(${b.checklist ? JSON.stringify(b.checklist.slice(0, 20)) : null}::jsonb, checklist),
              priority = coalesce(${[1, 2, 3].includes(b.priority as number) ? b.priority : null}::smallint, priority),
              progress = coalesce(${backToWork ?? progress}::smallint, progress),
              deliverable_url = case when ${b.deliverable !== undefined} then ${b.deliverable ? str(b.deliverable, 500) : null} else deliverable_url end,
              due_date = case when ${b.dueDate !== undefined} then ${typeof b.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.dueDate) ? b.dueDate : null}::date else due_date end
            where id = ${cur.id}`,
          ...(backToWork && note ? [db`insert into studio.request_events (request_id, user_id, author, kind, body) values (${cur.id}, ${cur.user_id}, ${me.id}, 'changes', ${(v ? 'v' + v + ': ' : '') + note})`] : []),
        ])
        return json({ ok: true })
      }
    }

    if (path === 'seen' && m === 'POST') { await db`update studio.users set last_seen_at = now() where id = ${me.id}`; return json({ ok: true }) }

    // ── files ──
    if (path === 'files' && m === 'POST') {
      const form = await request.formData().catch(() => null)
      const file = form?.get('file')
      if (!form || !(file instanceof File)) return bad('No file.')
      if (file.size > MAX_FILE) return bad('Files up to 8 MB. For bigger ones, paste a link in the brief.', 413)
      const reqId = String(form.get('requestId') ?? '') || null
      let kind = String(form.get('kind') ?? 'asset')
      if (!['brief', 'deliverable', 'asset', 'brand'].includes(kind)) kind = 'asset'
      if (kind === 'deliverable' && !admin) kind = 'brief'
      let owner = me.acct
      if (reqId) {
        const [r] = await db`select user_id from studio.requests where id = ${reqId}`
        if (!r || (!admin && r.user_id !== me.acct)) return bad('not found', 404)
        owner = r.user_id
      } else if (admin && form.get('owner')) owner = String(form.get('owner'))
      const [{ v }] = kind === 'deliverable' && reqId ? await db`select coalesce(max(version), 0) + 1 as v from studio.files where request_id = ${reqId} and kind = 'deliverable'` : [{ v: 1 }]
      const b64 = Buffer.from(await file.arrayBuffer()).toString('base64')
      const name = file.name.slice(0, 200) || 'file'
      const [row] = await db`insert into studio.files (user_id, request_id, uploaded_by, kind, version, name, mime, size, data) values (${owner}, ${reqId}, ${me.id}, ${kind}, ${v}, ${name}, ${(file.type || 'application/octet-stream').slice(0, 120)}, ${file.size}, decode(${b64}, 'base64')) returning id, user_id, request_id, kind, version, name, mime, size, created_at`
      if (reqId) await db`insert into studio.request_events (request_id, user_id, author, kind, body) values (${reqId}, ${owner}, ${me.id}, 'file', ${kind === 'deliverable' ? 'v' + v + ' · ' + name : name})`
      return json(toFile({ ...row, by_admin: admin }))
    }
    if (fm && m === 'DELETE') {
      const [x] = await db`select user_id, uploaded_by from studio.files where id = ${fm[1]}`
      if (!x || (!admin && x.uploaded_by !== me.id)) return bad('not found', 404)
      await db`delete from studio.files where id = ${fm[1]}`
      return json({ ok: true })
    }

    // ── pins on images ──
    if (path === 'pins' && m === 'POST') {
      const b = await body<{ fileId: string; x: number; y: number; body: string }>(request)
      const text = str(b.body, 2000).trim()
      const inside = (v: unknown) => typeof v === 'number' && v >= 0 && v <= 1
      if (!text || !inside(b.x) || !inside(b.y)) return bad('Say what to change at that point.')
      const [f] = await db`select id, user_id, request_id, version, kind from studio.files where id = ${b.fileId}`
      if (!f || (!admin && f.user_id !== me.acct)) return bad('not found', 404)
      const [a] = await db`insert into studio.annotations (file_id, user_id, author, x, y, body) values (${f.id}, ${f.user_id}, ${me.id}, ${b.x}, ${b.y}, ${text}) returning id`
      if (f.request_id) await db`insert into studio.request_events (request_id, user_id, author, kind, body) values (${f.request_id}, ${f.user_id}, ${me.id}, 'comment', ${(f.kind === 'deliverable' ? 'v' + f.version + ' · ' : '') + text})`
      return json({ id: a.id })
    }
    const pm = path.match(/^pins\/([0-9a-f-]{36})$/)
    if (pm && (m === 'PATCH' || m === 'DELETE')) {
      const [a] = await db`select user_id, author from studio.annotations where id = ${pm[1]}`
      if (!a || (!admin && a.user_id !== me.acct)) return bad('not found', 404)
      if (m === 'DELETE') {
        if (!admin && a.author !== me.id) return bad('not allowed', 403)
        await db`delete from studio.annotations where id = ${pm[1]}`
      } else {
        if (!admin) return bad('Only the studio can resolve pins.', 403)
        const b = await body<{ resolved: boolean }>(request)
        await db`update studio.annotations set resolved = ${!!b.resolved} where id = ${pm[1]}`
      }
      return json({ ok: true })
    }

    // ── checkout: the provider's page, or a pending plan the studio activates by hand ──
    // ── plan changes: preview, request, undo (the owner only; members see them) ──
    if (path === 'plan/quote' && m === 'POST') {
      const b = await body<{ kind: ChangeKind; to?: PlanId }>(request)
      if (!CHANGE_KINDS.includes(b.kind)) return bad('change')
      const [sub] = await db`select * from studio.subscriptions where user_id = ${me.acct}`
      try { return json(planQuote((sub as any) ?? null, b.kind, b.to)) } catch (e) { return bad((e as Error).message, 409) }
    }
    if (path === 'plan/changes' && m === 'POST') {
      if (me.account_id) return bad('Only the account owner can change the plan.', 403)
      if (admin) return bad('The studio changes plans from the client page.', 403)
      const b = await body<{ kind: ChangeKind; to?: PlanId; returnUrl?: string }>(request)
      if (!CHANGE_KINDS.includes(b.kind)) return bad('change')
      let r
      try { r = await openChange(me.id, me.id, b.kind, b.to) } catch (e) { return bad((e as Error).message, 409) }
      const origin = request.headers.get('origin') || url.origin
      const back = typeof b.returnUrl === 'string' && b.returnUrl.startsWith(origin) ? b.returnUrl : `${origin}/app/#/billing`
      const checkout = r.change.status === 'awaiting_payment' && r.change.amount_cents > 0 ? await changeCheckout(r.change, { id: me.id, email: me.email, name: me.full_name }, back) : null
      return json({ change: toChange(r.change), url: checkout })
    }
    const pcm = path.match(/^plan\/changes\/([0-9a-f-]{36})$/)
    if (pcm && m === 'DELETE') {
      if (me.account_id) return bad('Only the account owner can change the plan.', 403)
      return (await cancelChange(pcm[1], me.id)) ? json({ ok: true }) : bad('This change is already closed.', 409)
    }
    if (path === 'checkout' && m === 'POST') {
      if (me.account_id) return bad('Only the account owner can change the plan.', 403)
      const b = await body<{ plan: PlanId; step: Step; returnUrl: string; community?: boolean }>(request)
      if (!PLANS.includes(b.plan) || !['build', 'monthly', 'community'].includes(b.step)) return bad('plan')
      const back = typeof b.returnUrl === 'string' && b.returnUrl.startsWith(url.origin) ? b.returnUrl : `${url.origin}/app/`
      const link = await createCheckout({ plan: b.plan, step: b.step, userId: me.id, email: me.email, name: me.full_name, returnUrl: back })
      if (link) return json({ url: link })
      if (b.step !== 'community') {
        await db`insert into studio.subscriptions (user_id, plan_id, status, addon_community) values (${me.id}, ${b.plan}, 'pending', ${!!b.community})
                 on conflict (user_id) do update set plan_id = excluded.plan_id, addon_community = studio.subscriptions.addon_community or excluded.addon_community, updated_at = now()`
      }
      return json({ pending: true })
    }

    // ── the studio (admin) ──
    if (path.startsWith('admin/')) {
      if (!admin) return bad('forbidden', 403)
      if (path === 'admin/users' && m === 'GET') {
        const rows = await db`select u.id, u.username, u.email, u.full_name, u.company, u.role, u.lang, u.created_at, u.last_seen_at, u.disabled_at, u.account_id, o.full_name as owner_name, o.company as owner_company,
            s.plan_id, s.status, (select count(*) from studio.requests r where r.user_id = u.id and r.status in ('queued','active','review'))::int as open
          from studio.users u left join studio.users o on o.id = u.account_id left join studio.subscriptions s on s.user_id = u.id order by u.created_at desc`
        return json(rows.map((r: any) => ({ id: r.id, username: r.username, email: r.email, name: r.full_name, company: r.company, role: r.role, lang: r.lang, since: r.created_at, lastSeen: r.last_seen_at, disabled: !!r.disabled_at, accountId: r.account_id, accountName: r.account_id ? (r.owner_company || r.owner_name) : null, plan: r.plan_id, status: r.status, open: r.open, me: r.id === me.id })))
      }
      if (path === 'admin/users' && m === 'POST') {
        const b = await body<{ name: string; username: string; email?: string; password: string; role?: string; company?: string; lang?: string; plan?: string }>(request)
        const username = typeof b.username === 'string' ? b.username.trim().toLowerCase() : ''
        if (!/^[a-z0-9._-]{3,32}$/.test(username)) return bad('Use 3 to 32 letters, numbers, dots, dashes or underscores for the username.')
        const email = typeof b.email === 'string' && b.email.trim() ? b.email.trim().toLowerCase() : null
        if (email && !emailOk(email)) return bad('Enter a valid email, or leave it empty.')
        if (typeof b.password !== 'string' || b.password.length < 8) return bad('Use at least 8 characters for the password.')
        const name = str(b.name, 120).trim()
        if (name.length < 2) return bad('Write the person\'s name.')
        const taken = await db`select 1 from studio.users where lower(username) = ${username} or (${email}::text is not null and lower(email) = ${email})`
        if (taken.length) return bad('That username or email is already in use.', 409)
        const role = b.role === 'admin' ? 'admin' : 'client'
        const [u] = await db`insert into studio.users (username, email, password_hash, full_name, company, role, lang, created_by)
          values (${username}, ${email}, ${await hashPassword(b.password)}, ${name}, ${str(b.company, 120)}, ${role}, ${b.lang === 'es' ? 'es' : 'en'}, ${me.id}) returning id`
        // optionally start the client on a plan right away (the studio bills by hand)
        if (role === 'client' && typeof b.plan === 'string' && PLANS.includes(b.plan as PlanId))
          await db`insert into studio.subscriptions (user_id, plan_id, status, provider, current_period_end) values (${u.id}, ${b.plan}, 'active', 'manual', now() + interval '1 month')`
        return json({ id: u.id })
      }
      const um = path.match(/^admin\/users\/([0-9a-f-]{36})$/)
      if (um && m === 'PATCH') {
        const b = await body<{ name?: string; company?: string; role?: string; password?: string; disabled?: boolean; username?: string; email?: string | null }>(request)
        const self = um[1] === me.id
        if (self && (b.disabled === true || b.role === 'client')) return bad('You cannot switch off or demote your own account.', 409)
        if (b.password !== undefined && (typeof b.password !== 'string' || b.password.length < 8)) return bad('Use at least 8 characters for the password.')
        const username = typeof b.username === 'string' ? b.username.trim().toLowerCase() : null
        if (username !== null && !/^[a-z0-9._-]{3,32}$/.test(username)) return bad('Use 3 to 32 letters, numbers, dots, dashes or underscores for the username.')
        if (username) { const t = await db`select 1 from studio.users where lower(username) = ${username} and id <> ${um[1]}`; if (t.length) return bad('That username is already in use.', 409) }
        await db`update studio.users set
            full_name = coalesce(${b.name === undefined ? null : str(b.name, 120)}, full_name),
            company = coalesce(${b.company === undefined ? null : str(b.company, 120)}, company),
            role = coalesce(${b.role === 'admin' || b.role === 'client' ? b.role : null}, role),
            username = coalesce(${username}, username),
            password_hash = coalesce(${b.password ? await hashPassword(b.password) : null}, password_hash),
            disabled_at = case when ${b.disabled === undefined} then disabled_at when ${!!b.disabled} then coalesce(disabled_at, now()) else null end
          where id = ${um[1]}`
        // a new password or a switched-off account signs every device out
        if (b.password || b.disabled) await db`delete from studio.sessions where user_id = ${um[1]}`
        return json({ ok: true })
      }
      if (um && m === 'DELETE') {
        if (um[1] === me.id) return bad('You cannot delete your own account.', 409)
        await db`delete from studio.users where id = ${um[1]}`
        return json({ ok: true })
      }
      if (path === 'admin/clients' && m === 'GET') {
        const rows = await db`select u.id, u.email, u.full_name, u.company, u.role, u.created_at, s.plan_id, s.status, s.addon_community,
          (select count(*) from studio.requests r where r.user_id = u.id and r.status in ('queued','active','review'))::int as open, (select count(*) from studio.users m where m.account_id = u.id)::int as team
          from studio.users u left join studio.subscriptions s on s.user_id = u.id where u.account_id is null order by u.created_at desc`
        return json(rows.map((r: any) => ({ id: r.id, email: r.email, name: r.full_name, company: r.company, role: r.role, since: r.created_at, plan: r.plan_id, status: r.status, community: r.addon_community, open: r.open, team: r.team })))
      }
      const cm = path.match(/^admin\/clients\/([0-9a-f-]{36})$/)
      if (cm && m === 'PATCH') {
        const b = await body<{ plan?: PlanId; status?: string; community?: boolean }>(request)
        const plan = b.plan && PLANS.includes(b.plan) ? b.plan : 'launch'
        const status = b.status && ['pending', 'building', 'active', 'past_due', 'paused', 'cancelled'].includes(b.status) ? b.status : 'pending'
        await db`insert into studio.subscriptions (user_id, plan_id, status, addon_community, provider) values (${cm[1]}, ${plan}, ${status}, ${!!b.community}, 'manual')
                 on conflict (user_id) do update set plan_id = excluded.plan_id, status = excluded.status, addon_community = excluded.addon_community, updated_at = now(),
                 current_period_end = case when excluded.status = 'active' and studio.subscriptions.current_period_end is null then now() + interval '1 month' else studio.subscriptions.current_period_end end`
        return json({ ok: true })
      }
      if (path === 'admin/changes' && m === 'GET') {
        await applyDue()
        const rows = await db`select c.*, u.email, u.full_name, u.company from studio.plan_changes c join studio.users u on u.id = c.user_id
          where c.status in ('awaiting_payment', 'scheduled') or c.closed_at > now() - interval '30 days' order by (c.status = 'awaiting_payment') desc, c.created_at desc limit 200`
        return json(rows.map((r: any) => ({ ...toChange(r), client: { id: r.user_id, email: r.email, name: r.full_name, company: r.company } })))
      }
      const acm = path.match(/^admin\/changes\/([0-9a-f-]{36})\/(paid|apply)$/)
      if (acm && m === 'POST') return (await applyChange(acm[1], me.id, acm[2] === 'paid')) ? json({ ok: true }) : bad('This change is already closed.', 409)
      const adm = path.match(/^admin\/changes\/([0-9a-f-]{36})$/)
      if (adm && m === 'DELETE') return (await cancelChange(adm[1], null)) ? json({ ok: true }) : bad('This change is already closed.', 409)
      if (path === 'admin/payments' && m === 'GET') return json({ ...masked(await payConfig()), webhook: `${url.origin}/api/billing/webhook/` })
      if (path === 'admin/payments' && m === 'PUT') {
        const b = await body<PayConfig>(request)
        await savePayConfig({ provider: b.provider === 'lemonsqueezy' ? 'lemonsqueezy' : 'none', apiKey: str(b.apiKey, 2000), storeId: str(b.storeId, 40), webhookSecret: str(b.webhookSecret, 200), variants: Object.fromEntries(Object.entries(b.variants ?? {}).map(([k, v]) => [k, str(v, 40)])) })
        return json(masked(await payConfig()))
      }
    }
    return bad('not found', 404)
  } catch (e) {
    console.error('[api]', path, path === 'admin/mail' ? 'Mail settings operation failed' : e)
    return bad('Something went wrong on the server.', 500)
  }
}

async function webhook(request: Request) {
  const raw = await request.text()
  if (!(await verifyWebhook(raw, request.headers.get('x-signature')))) return bad('signature', 401)
  const evt = JSON.parse(raw)
  const name: string = evt.meta?.event_name ?? ''
  const c = evt.meta?.custom_data ?? {}
  const a = evt.data?.attributes ?? {}
  const userId = c.user_id as string | undefined, plan = PLANS.includes(c.plan) ? (c.plan as PlanId) : 'launch'
  if (!userId) return json({ ok: true })
  const db = sql()
  const statusMap: Record<string, string> = { active: 'active', on_trial: 'active', past_due: 'past_due', unpaid: 'past_due', paused: 'paused', cancelled: 'cancelled', expired: 'cancelled' }
  if (name === 'order_created' && c.step === 'change' && typeof c.change_id === 'string') {
    await applyChange(c.change_id, null, true, a.urls?.receipt ?? null)
  } else if (name === 'order_created' && c.step === 'build') {
    await db`insert into studio.subscriptions (user_id, plan_id, status, provider) values (${userId}, ${plan}, 'building', 'lemonsqueezy') on conflict (user_id) do update set plan_id = excluded.plan_id, status = 'building', updated_at = now()`
    await db`insert into studio.invoices (user_id, label, amount_cents, url) values (${userId}, ${plan + ' build'}, ${a.total ?? 0}, ${a.urls?.receipt ?? null})`
  } else if (name.startsWith('subscription_') && !name.startsWith('subscription_payment')) {
    if (c.step === 'community') await db`update studio.subscriptions set addon_community = ${a.status === 'active'}, updated_at = now() where user_id = ${userId}`
    else await db`insert into studio.subscriptions (user_id, plan_id, status, provider, provider_subscription_id, provider_customer_id, portal_url, current_period_end)
                  values (${userId}, ${plan}, ${statusMap[a.status] ?? 'active'}, 'lemonsqueezy', ${String(evt.data?.id)}, ${a.customer_id ? String(a.customer_id) : null}, ${a.urls?.customer_portal ?? null}, ${a.renews_at ?? null})
                  on conflict (user_id) do update set plan_id = excluded.plan_id, status = excluded.status, provider = excluded.provider, provider_subscription_id = excluded.provider_subscription_id,
                  provider_customer_id = excluded.provider_customer_id, portal_url = excluded.portal_url, current_period_end = excluded.current_period_end, updated_at = now()`
  } else if (name === 'subscription_payment_success') {
    await db`insert into studio.invoices (user_id, label, amount_cents, url) values (${userId}, ${c.step === 'community' ? 'Community management' : plan + ' monthly'}, ${a.total ?? 0}, ${a.urls?.invoice_url ?? null})`
  }
  return json({ ok: true })
}
