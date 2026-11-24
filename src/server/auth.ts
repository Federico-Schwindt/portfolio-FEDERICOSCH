/**
 * Accounts and sessions. Passwords: scrypt with a random salt. Sessions: a random 32-byte token in an
 * httpOnly, SameSite=Lax cookie; only its SHA-256 is stored. Sessions last 30 days.
 */
import { randomBytes, scrypt as _scrypt, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
import { sql, env } from './db'

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>
const COOKIE = 'fs_session'
const DAYS = 30

export type SessionUser = { id: string; email: string; full_name: string; company: string; role: 'client' | 'admin'; brand: Record<string, unknown>; lang: string
  /** the client account this person acts for: their own id, or the owner who invited them */
  phone: string; job_title: string; timezone: string; avatar: string | null; notify: Record<string, boolean>; created_at: string
  /** this session's row id, to mark it in the list of sessions */
  session: string; acct: string; account_id: string | null; owner_name: string | null; owner_company: string | null; owner_brand: Record<string, unknown> | null }

export async function hashPassword(pw: string) {
  const salt = randomBytes(16)
  const key = await scrypt(pw, salt, 64)
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}
export async function checkPassword(pw: string, stored: string) {
  const [, s, k] = stored.split('$')
  if (!s || !k) return false
  const key = await scrypt(pw, Buffer.from(s, 'base64'), 64)
  const want = Buffer.from(k, 'base64')
  return want.length === key.length && timingSafeEqual(want, key)
}
const sha = (t: string) => createHash('sha256').update(t).digest('hex')

export async function startSession(userId: string, secure: boolean, userAgent = '') {
  const token = randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + DAYS * 864e5)
  // expired sessions of this account are cleared on each new sign-in, so the table never grows without bound
  await sql()`delete from studio.sessions where user_id = ${userId} and expires_at < now()`
  await sql()`insert into studio.sessions (token_hash, user_id, expires_at, user_agent) values (${sha(token)}, ${userId}, ${expires.toISOString()}, ${userAgent.slice(0, 300)})`
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DAYS * 86400}${secure ? '; Secure' : ''}`
}
export async function endSession(req: Request) {
  const t = readCookie(req)
  if (t) await sql()`delete from studio.sessions where token_hash = ${sha(t)}`
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}
const readCookie = (req: Request) => req.headers.get('cookie')?.split(/;\s*/).find((c) => c.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1)

export async function sessionRevision(req: Request) {
  const token = readCookie(req)
  if (!token) return null
  try {
    const [row] = await sql()`select u.id, coalesce(u.account_id, u.id) as acct, u.role,
      studio.state_revision(coalesce(u.account_id, u.id), u.role = 'admin') as revision
      from studio.sessions s join studio.users u on u.id = s.user_id
      where s.token_hash = ${sha(token)} and s.expires_at > now() and u.disabled_at is null`
    return row ?? null
  } catch (err) {
    // During a rolling update, the previous schema can still serve collection deltas.
    if ((err as { code?: string }).code === '42883') return null
    throw err
  }
}

export async function currentUser(req: Request): Promise<SessionUser | null> {
  const t = readCookie(req)
  if (!t) return null
  const rows = await sql()`select u.id, u.email, u.full_name, u.company, u.role, u.brand, u.lang, u.phone, u.job_title, u.timezone, u.avatar, u.notify, u.created_at, s.id as session, u.account_id, coalesce(u.account_id, u.id) as acct, o.full_name as owner_name, o.company as owner_company, o.brand as owner_brand
    from studio.sessions s join studio.users u on u.id = s.user_id left join studio.users o on o.id = u.account_id where s.token_hash = ${sha(t)} and s.expires_at > now() and u.disabled_at is null`
  return (rows[0] as SessionUser) ?? null
}

export const isAdminEmail = (email: string) => (env('ADMIN_EMAILS') ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase())

// a small brake on password guessing: 8 tries per email per 10 minutes, per server instance
const tries = new Map<string, { n: number; t: number }>()
export function tooMany(email: string) {
  const k = email.toLowerCase(), now = Date.now(), e = tries.get(k)
  if (!e || now - e.t > 6e5) { tries.set(k, { n: 1, t: now }); return false }
  e.n++
  return e.n > 8
}
