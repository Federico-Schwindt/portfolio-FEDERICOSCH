import type { APIRoute } from 'astro'
import { currentUser } from '../../../server/auth'
import { bad, body, json, sameOrigin, sql } from '../../../server/db'
import { calendarWeeks, studioMetrics, type PlanGroup, type Workload } from '../../../app/studio-metrics'
import { COMMUNITY } from '../../../app/types'
import { toChange } from '../../../server/plans'

export const prerender = false
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function metrics(zone: string) {
  let today: string
  try {
    today = new Intl.DateTimeFormat('sv-SE', { timeZone: zone }).format(new Date())
  } catch { return bad('Invalid time zone') }
  const weeks = calendarWeeks(today)
  const db = sql()
  // Keep work on paused accounts in the numerator. Starting from subscriptions would lose orphaned capacity use.
  const [accounts, weekly, ratingRows] = await db.transaction([
    db`with work as (
         select user_id, count(*) filter (where status = 'active')::int as used,
           count(*) filter (where due_date < ${today}::date)::int as overdue
         from studio.requests where status in ('active','queued') group by user_id
       )
       select u.id, coalesce(nullif(u.company,''), nullif(u.full_name,''), u.email) as name, u.email,
         s.plan_id as plan, s.status, s.addon_community as community, p.monthly_cents / 100.0::float8 as monthly,
         p.active_slots as slots, coalesce(w.used,0) as used, coalesce(w.overdue,0) as overdue
       from studio.users u left join studio.subscriptions s on s.user_id=u.id
       left join studio.plans p on p.id=s.plan_id left join work w on w.user_id=u.id
       where u.role='client' and u.account_id is null and (s.user_id is not null or w.user_id is not null)
       order by name, u.email`,
    db`select date_trunc('week', r.done_at at time zone ${zone})::date::text as start,
         count(*)::int as delivered, count(r.started_at)::int as timed,
         coalesce(sum(greatest(0, extract(epoch from (coalesce(r.review_at, r.done_at) - r.started_at)))) / 86400, 0)::float8 as days
       from studio.requests r join studio.users u on u.id = r.user_id
       where u.role = 'client' and u.account_id is null and r.status = 'done'
         and r.done_at >= (${weeks[0].start}::date::timestamp at time zone ${zone}) and r.done_at <= now()
       group by 1`,
    db`select u.id, coalesce(nullif(u.company,''), nullif(u.full_name,''), u.email) as name,
         count(*)::int as approved, count(r.rating)::int as rated, coalesce(sum(r.rating), 0)::float8 as points
       from studio.requests r join studio.users u on u.id = r.user_id
       where r.status = 'done' and u.role = 'client' and u.account_id is null
       group by u.id order by name, u.id`,
  ], { isolationLevel: 'RepeatableRead', readOnly: true })
  for (const week of weeks) {
    const row = weekly.find(r => r.start === week.start)
    if (row) Object.assign(week, row)
  }
  const plans = accounts.filter(a => a.plan).map(a => ({
    plan: a.plan, status: a.status, clients: 1, monthly: a.monthly, addons: Number(a.community), slots: a.slots,
  })) as PlanGroup[]
  const workload = accounts.reduce<Workload>((sum, a) => ({ used: sum.used + a.used, overdue: sum.overdue + a.overdue }), { used: 0, overdue: 0 })
  const breakdown = accounts.map(a => ({
    id: a.id, name: a.name, email: a.email, plan: a.plan, status: a.status, used: a.used,
    base: a.status === 'active' ? a.monthly : 0, addon: a.status === 'active' && a.community ? COMMUNITY : 0,
    slots: a.status === 'active' || a.status === 'building' ? a.slots : 0,
  })).filter(a => a.base || a.addon || a.used || a.slots)
  const ratingAccounts = ratingRows.map(r => ({ id: r.id, name: r.name, approved: r.approved, rated: r.rated, points: r.points }))
  return json({ ...studioMetrics(plans, weeks, workload, ratingAccounts), breakdown })
}

async function changes(client: string | null, countOnly: boolean) {
  if (client !== null && !uuid.test(client)) return bad('Invalid client')
  const db = sql()
  if (countOnly) {
    const [counts] = await db`select count(*) filter (where status='awaiting_payment')::int as waiting,
      count(*) filter (where status='scheduled')::int as scheduled from studio.plan_changes
      where status in ('awaiting_payment','scheduled') and (${client}::uuid is null or user_id=${client}::uuid)`
    return json(counts)
  }
  // Filter before reading history so heavy activity on one account cannot hide another account's open changes.
  const rows = await db`select c.*, u.email, u.full_name, u.company from studio.plan_changes c
    join studio.users u on u.id=c.user_id where (${client}::uuid is null or c.user_id=${client}::uuid)
    and (c.status in ('awaiting_payment','scheduled') or c.closed_at >= now() - interval '30 days')`
  return json(rows.map(c => ({ ...toChange(c), amount: c.amount_cents / 100, resolution: c.resolution, invoiceId: c.invoice_id,
    client: { id: c.user_id, email: c.email, name: c.full_name, company: c.company } })))
}

async function clientHistory(id: string) {
  const db = sql()
  const [requests, files, invoices, notes, members, profiles] = await db.transaction([
    db`select id, number, title, status, rating, rating_note as "ratingNote", created_at as at from studio.requests
       where user_id = ${id} order by created_at desc, number desc`,
    db`select f.id, f.name, f.kind, f.version, f.size, f.created_at as at,
         (f.request_id is null and f.kind in ('asset', 'brand') and u.role = 'client') is true as material
       from studio.files f left join studio.users u on u.id = f.uploaded_by
       where f.user_id = ${id} order by f.created_at desc, f.id`,
    db`select id, label, amount_cents / 100.0::float8 as amount, currency, status, url, created_at as at
       from studio.invoices where user_id = ${id} order by created_at desc, id`,
    db`select n.id, n.body, coalesce(nullif(a.full_name, ''), a.email) as author, n.created_at as at
       from studio.client_notes n left join studio.users a on a.id = n.author_id
       where n.client_id = ${id} order by n.created_at desc, n.id`,
    db`select id, full_name as name, email from studio.users where account_id = ${id} order by full_name, email`,
    db`select full_name as name, email, lang, phone, timezone, job_title as "jobTitle", avatar, notify, company,
         jsonb_strip_nulls(jsonb_build_object('business', brand->'business', 'colors', brand->'colors', 'onboarded', brand->'onboarded')) as brand
       from studio.users where id = ${id}`,
  ], { isolationLevel: 'RepeatableRead', readOnly: true })
  return json({ requests, files, invoices, notes, members, profile: profiles[0] })
}

export const ALL: APIRoute = async ({ request, params, url }) => {
  try {
    if (!sameOrigin(request)) return bad('Forbidden', 403)
    const me = await currentUser(request)
    if (!me) return bad('Sign in required', 401)
    if (me.role !== 'admin') return bad('Forbidden', 403)
    const [section, id, action, ...rest] = (params.path ?? '').split('/')
    if (section === 'requests' && uuid.test(id) && action === 'brief' && !rest.length && request.method === 'GET') {
      // A teammate can create the request. The welcome answers belong to its account.
      const [brief] = await sql()`select u.id as owner, coalesce(nullif(u.company,''), nullif(u.full_name,''), u.email) as company,
        jsonb_strip_nulls(jsonb_build_object('business', u.brand->'business', 'onboarded', u.brand->'onboarded',
          'colors', u.brand->'colors')) as brand
        from studio.requests r join studio.users u on u.id = r.user_id where r.id = ${id}`
      return brief ? json(brief) : bad('Request not found', 404)
    }
    if (!id && !action && !rest.length && request.method === 'GET') {
      const db = sql()
      if (section === 'finance') return json(await db`
        select i.id, i.label, i.amount_cents as cents, i.currency, i.status, i.url, i.created_at as at,
          u.id as owner, coalesce(nullif(u.company,''), nullif(u.full_name,''), u.email) as name, u.email
        from studio.invoices i join studio.users u on u.id = i.user_id order by i.created_at desc, i.id`)
      if (section === 'recurring') return json(await db`
        select r.id, r.title, r.next_at as "nextAt", r.every, u.id as owner,
          coalesce(nullif(u.company,''), nullif(u.full_name,''), u.email) as name
        from studio.recurring r join studio.users u on u.id = r.user_id where r.active order by r.next_at, r.id`)
      if (section === 'feedback') return json(await db`
        select r.id, r.number, r.title, r.status, r.rating, r.rating_note as "ratingNote", r.created_at as "createdAt",
          r.done_at as "doneAt", u.id as owner, coalesce(nullif(u.company,''), nullif(u.full_name,''), u.email) as "ownerName"
        from studio.requests r join studio.users u on u.id = r.user_id
        where r.status = 'done' and u.role = 'client' and u.account_id is null`)
    }
    if (section === 'metrics' && !id && request.method === 'GET') return await metrics(url.searchParams.get('tz') ?? 'UTC')
    if (section === 'changes' && (!id || id === 'count') && !action && !rest.length && request.method === 'GET')
      return await changes(url.searchParams.get('client'), id === 'count')
    if (section !== 'clients' || !uuid.test(id) || rest.length) return bad('Not found', 404)
    const db = sql()
    const [client] = await db`select id from studio.users where id = ${id} and account_id is null`
    if (!client) return bad('Client not found', 404)
    if (!action && request.method === 'GET') return await clientHistory(id)
    if (action !== 'notes' || request.method !== 'POST') return bad('Not found', 404)
    const input = await body<{ id?: string; body?: string }>(request)
    const note = typeof input?.body === 'string' ? input.body.trim() : ''
    if (typeof input?.id !== 'string' || !uuid.test(input.id) || !note || note.length > 2000) return bad('Invalid note')
    // The browser keeps this id on retry if the insert succeeded but the response was lost.
    await db`insert into studio.client_notes (id, client_id, author_id, body)
      values (${input.id}, ${id}, ${me.id}, ${note}) on conflict (id) do nothing`
    const [saved] = await db`select id, body, created_at as at from studio.client_notes
      where id = ${input.id} and client_id = ${id} and author_id = ${me.id} and body = ${note}`
    return saved ? json({ ...saved, author: me.full_name || me.email }) : bad('Note id already used', 409)
  } catch { return bad('Studio data unavailable', 500) }
}
