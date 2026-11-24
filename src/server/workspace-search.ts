import type { SessionUser } from './auth'
import { sql } from './db'
import { accents, fold, plain, searchLimit } from '../app/workspace-search'

/** Search beyond the recent-file snapshot. Neither file bytes nor session data belong in results. */
export async function workspaceSearch(me: SessionUser, query: string, offset: number) {
  const db = sql(), q = fold(query), admin = me.role === 'admin'
  const limit = searchLimit + 1 // An extra row detects another page without a separate count.
  const [files, clients] = await Promise.all([
    db`select f.id, f.user_id, f.request_id, f.kind, f.version, f.name, f.mime, f.size, f.created_at,
        coalesce(nullif(u.company, ''), nullif(u.full_name, ''), u.email) as owner_name, r.title as request_title
      from studio.files f join studio.users u on u.id = f.user_id left join studio.requests r on r.id = f.request_id
      where (${admin} or f.user_id = ${me.acct}) and strpos(translate(lower(normalize(f.name)), ${accents}, ${plain}), ${q}) > 0
      order by (translate(lower(normalize(f.name)), ${accents}, ${plain}) = ${q}) desc, f.created_at desc, f.id limit ${limit} offset ${offset}`,
    admin ? db`select id, email, coalesce(nullif(company, ''), nullif(full_name, ''), email) as label
      from studio.users where account_id is null and role = 'client'
        and strpos(translate(lower(normalize(concat_ws(' ', company, full_name, email))), ${accents}, ${plain}), ${q}) > 0
      order by (email = ${q}) desc, label, id limit ${limit} offset ${offset}` : [],
  ])
  return {
    files: files.map(f => ({
      file: { id: f.id, owner: f.user_id, requestId: f.request_id, kind: f.kind, version: f.version, name: f.name, mime: f.mime, size: f.size, at: f.created_at },
      ownerName: f.owner_name, requestTitle: f.request_title,
    })), clients,
  }
}
