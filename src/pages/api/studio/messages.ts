import type { APIRoute } from 'astro'
import { currentUser } from '../../../server/auth'
import { bad, body, json, sameOrigin, sql } from '../../../server/db'
import { validId } from '../../../server/workspace-activity'

export const prerender = false

export const ALL: APIRoute = async ({ request, url }) => {
  if (!sameOrigin(request)) return bad('origin', 403)
  const me = await currentUser(request)
  if (!me) return bad('session', 401)
  if (me.role !== 'client') return bad('client only', 403)
  if (url.searchParams.get('viewer') !== me.id + '/' + me.acct) return bad('session changed', 409)
  const db = sql()
  if (request.method === 'GET') {
    // A busy request can fill the entire dashboard snapshot. Read the last human turn per open request.
    const rows = await db`select r.id as "requestId", r.number, r.title, e.id, e.body, e.created_at as at
      from studio.requests r
      cross join lateral (select id, author, body, created_at from studio.request_events
        where request_id=r.id and user_id=r.user_id and kind in ('comment','changes')
        order by created_at desc, id desc limit 1) e
      join studio.users u on u.id=e.author and u.role='admin'
      where r.user_id=${me.acct} and r.status in ('active','queued','review')
      order by e.created_at desc, e.id desc`
    return json(rows)
  }
  if (request.method !== 'POST') return bad('method', 405)
  const data = await body(request)
  const message = typeof data?.text === 'string' ? data.text.trim() : ''
  if (!message || message.length > 4000 || !validId(data?.eventId) || !validId(data?.requestId)) return bad('invalid reply')
  // Both teammates are answering the same turn. Its stable reply ID also makes a lost acknowledgement retryable.
  const [result] = await db`with target as (
      select r.id, r.user_id, md5('studio-message-reply/' || ${data.eventId}::text)::uuid as reply_id
      from studio.requests r where r.user_id=${me.acct} and r.id=${data.requestId}
    ), sent as (
      insert into studio.request_events (id, request_id, user_id, author, kind, body)
      select t.reply_id, t.id, t.user_id, ${me.id}, 'comment', ${message} from target t
      join studio.requests r on r.id=t.id and r.status in ('active','queued','review')
      cross join lateral (select id,author from studio.request_events
        where request_id=t.id and user_id=t.user_id and kind in ('comment','changes')
        order by created_at desc,id desc limit 1) e
      join studio.users u on u.id=e.author and u.role='admin'
      where e.id=${data.eventId} on conflict (id) do nothing returning id
    ) select exists(select 1 from sent) or exists(select 1 from target t join studio.request_events e
      on e.id=t.reply_id and e.request_id=t.id where e.author=${me.id} and e.body=${message}) as ok`
  return result.ok ? json({ ok: true }) : bad('conversation changed', 409)
}
