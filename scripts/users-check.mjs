// Accounts made by the studio: a studio account creates a client with a username and password, the client signs in
// with the username (and with the email when there is one), a new password signs every device out, a switched-off
// account cannot sign in or keep a session, clients cannot reach the people API, and deleting removes the account.
// Needs the preview on :4330 started with ALLOW_SIGNUP=1 (test accounts are made by signing up). Cleans up after itself.
import { neon } from '@neondatabase/serverless'
import fs from 'node:fs'
const origin = `http://localhost:${Number(process.argv[2] || 4330)}`, base = origin + '/api/'
const sql = neon(fs.readFileSync('.env', 'utf8').match(/^DATABASE_URL=(.+)$/m)[1].trim())
const out = [], ok = (n, c, x = '') => out.push([n, c ? 'ok' : 'FAIL', x])
const client = () => { let cookie = ''; return async (path, method = 'GET', body) => { const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'x-studio': '1', origin, cookie }, body: body ? JSON.stringify(body) : undefined }); const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0]; return { status: r.status, data: await r.json().catch(() => null) } } }
const stamp = Date.now(), adminEmail = `users-admin-${stamp}@example.com`, uname = `ana.check.${stamp % 100000}`
const A = client(), C = client(), C2 = client()
let userId = null
try {
  const s = await A('auth/signup/', 'POST', { email: adminEmail, password: 'admin check 123', name: 'Studio Check' })
  ok('test studio account', s.status === 200, String(s.status))
  await sql`update studio.users set role = 'admin' where email = ${adminEmail}`
  ok('clients cannot list people', (await C('admin/users/')).status === 401 || (await C('admin/users/')).status === 403)
  ok('bad username refused', (await A('admin/users/', 'POST', { name: 'Ana', username: 'a b', password: 'client pass 1' })).status === 400)
  ok('short password refused', (await A('admin/users/', 'POST', { name: 'Ana', username: uname, password: 'short' })).status === 400)
  const made = await A('admin/users/', 'POST', { name: 'Ana Check', username: uname, password: 'client pass 1', role: 'client', company: 'Check Café', plan: 'grow', lang: 'es' })
  userId = made.data?.id
  ok('studio creates a client with username and password', made.status === 200 && !!userId, String(made.status))
  ok('same username refused', (await A('admin/users/', 'POST', { name: 'Other', username: uname.toUpperCase(), password: 'client pass 1' })).status === 409)
  const list = (await A('admin/users/')).data
  const row = list.find((u) => u.id === userId)
  ok('listed with username, no email, plan', row?.username === uname && row.email === null && row.plan === 'grow' && row.status === 'active', JSON.stringify(row && { u: row.username, e: row.email, p: row.plan }))
  ok('wrong password refused', (await C('auth/login/', 'POST', { email: uname, password: 'nope nope' })).status === 401)
  ok('client signs in with the username', (await C('auth/login/', 'POST', { email: uname.toUpperCase(), password: 'client pass 1' })).status === 200)
  const st = (await C('state/')).data
  ok('client sees their account and plan', st?.user?.name === 'Ana Check' && st.sub?.plan === 'grow' && st.user.role === 'client')
  ok('client cannot open people API', (await C('admin/users/')).status === 403)
  await C2('auth/login/', 'POST', { email: uname, password: 'client pass 1' })
  ok('new password signs every device out', (await A(`admin/users/${userId}/`, 'PATCH', { password: 'client pass 2' })).status === 200 && (await C('state/')).status === 401 && (await C2('state/')).status === 401)
  ok('old password no longer works', (await C('auth/login/', 'POST', { email: uname, password: 'client pass 1' })).status === 401)
  ok('new password works', (await C('auth/login/', 'POST', { email: uname, password: 'client pass 2' })).status === 200)
  ok('switch off ends the session', (await A(`admin/users/${userId}/`, 'PATCH', { disabled: true })).status === 200 && (await C('state/')).status === 401)
  ok('switched-off account cannot sign in', (await C('auth/login/', 'POST', { email: uname, password: 'client pass 2' })).status === 403)
  ok('switch on again', (await A(`admin/users/${userId}/`, 'PATCH', { disabled: false })).status === 200 && (await C('auth/login/', 'POST', { email: uname, password: 'client pass 2' })).status === 200)
  const meId = list.find((u) => u.me)?.id
  ok('studio cannot switch itself off', (await A(`admin/users/${meId}/`, 'PATCH', { disabled: true })).status === 409)
  ok('studio cannot delete itself', (await A(`admin/users/${meId}/`, 'DELETE')).status === 409)
  ok('delete removes the account', (await A(`admin/users/${userId}/`, 'DELETE')).status === 200 && (await C('auth/login/', 'POST', { email: uname, password: 'client pass 2' })).status === 401)
  userId = null
} catch (e) { out.push(['crash', 'FAIL', String(e)]) } finally {
  if (userId) await sql`delete from studio.users where id = ${userId}`
  await sql`delete from studio.users where email = ${adminEmail} or username = ${uname}`
  const [{ n }] = await sql`select count(*)::int as n from studio.users where email = ${adminEmail} or username = ${uname}`
  ok('cleanup', n === 0, `${n} left`)
}
console.table(out)
console.log(out.every((r) => r[1] === 'ok') ? 'USERS OK' : 'USERS FAIL')
if (out.some((r) => r[1] === 'FAIL')) process.exitCode = 1
