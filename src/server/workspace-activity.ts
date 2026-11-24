import { bad, json, sql } from './db'
import type { SessionUser } from './auth'
import { activityExportSize, activityViewer } from '../app/types'
import { accents, fold, maxQueryLength, plain } from '../app/workspace-search'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const validId = (value: unknown): value is string => typeof value === 'string' && uuid.test(value)

export async function activityPage(me: SessionUser, params: URLSearchParams, query = '') {
  if (query.length > maxQueryLength) return bad('query')
  const term = fold(query.trim())
  const number = /^#\d+$/.test(term) ? term.slice(1) : null
  const who = params.get('who') || ''
  if (!['', 'studio', 'client', 'ai'].includes(who)) return bad('filter')
  const cursor = params.get('cursor')
  // A second tab can switch the session between two pages of one download.
  const viewer = params.get('exportFor')
  if (viewer !== null && viewer !== activityViewer(me.id, me.acct, me.role)) return bad('session changed', 409)
  const size = viewer === null ? 40 : activityExportSize
  const [at, id, extra] = cursor?.split('|') ?? []
  if (cursor !== null && (extra !== undefined || !validId(id) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{6}Z$/.test(at)
    || !Number.isFinite(Date.parse(at)) || new Date(at).toISOString().slice(0,19) !== at.slice(0,19))) return bad('cursor')
  const rows = await sql()`select e.id, e.request_id as "requestId", e.kind, e.body, e.created_at as at,
      to_char(e.created_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as stamp,
      u.full_name as by, actor.who, r.title as "requestTitle", r.number as "requestNumber"
    from studio.request_events e left join studio.users u on u.id=e.author
    join studio.requests r on r.id=e.request_id and r.user_id=e.user_id
    cross join lateral (select case when e.kind='ai' then 'ai' when e.author is null then 'system'
      when u.role='admin' then 'studio' else 'client' end as who) actor
    where (${me.role === 'admin'} or e.user_id=${me.acct})
      and (${!cursor} or (e.created_at,e.id)<(${at ?? null}::timestamptz,${id ?? null}::uuid))
      and (${!who} or actor.who=${who} or (${who === 'studio'} and actor.who='system'))
      and (case when ${!term} then true when ${number !== null} then r.number::text = ${number}
        else strpos(translate(lower(normalize(r.title)), ${accents}, ${plain}), ${term}) > 0
          or (e.kind <> 'status' and strpos(translate(lower(normalize(e.body)), ${accents}, ${plain}), ${term}) > 0) end)
    order by e.created_at desc,e.id desc limit ${size + 1}`
  const items = rows.slice(0,size), last = items.at(-1)
  return json({ items: items.map(({stamp, ...event}) => event), next: rows.length > size ? last!.stamp + '|' + last!.id : null })
}
