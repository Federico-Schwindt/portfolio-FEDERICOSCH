// Your way into the studio: sets a new password (and the username "federico") on the admin account
// named in ADMIN_EMAILS, makes sure it is an admin, and signs out its old sessions.
// Usage:  npm run admin            → generates a password and prints it once
//         npm run admin -- "my own password"
import { neon } from '@neondatabase/serverless'
import { randomBytes, scryptSync } from 'node:crypto'
if (!process.env.DATABASE_URL) process.loadEnvFile()
const email = (process.env.ADMIN_EMAILS || '').split(',')[0].trim().toLowerCase()
if (!email) { console.error('ADMIN_EMAILS is empty in .env'); process.exit(1) }
const words = ['rojo', 'tinta', 'papel', 'norte', 'faro', 'trazo', 'pixel', 'marca', 'brillo', 'ruta', 'cobre', 'nube']
const pick = () => words[randomBytes(1)[0] % words.length]
const password = process.argv[2] || `${pick()}-${pick()}-${pick()}-${randomBytes(2).readUInt16BE() % 9000 + 1000}`
if (password.length < 8) { console.error('Use at least 8 characters.'); process.exit(1) }
const salt = randomBytes(16)
const hash = `scrypt$${salt.toString('base64')}$${scryptSync(password, salt, 64).toString('base64')}`
const sql = neon(process.env.DATABASE_URL)
let [u] = await sql`update studio.users set password_hash = ${hash}, role = 'admin', disabled_at = null,
  username = coalesce(username, case when exists(select 1 from studio.users where lower(username) = 'federico') then null else 'federico' end)
  where lower(email) = ${email} returning id, username`
if (!u) [u] = await sql`insert into studio.users (email, password_hash, full_name, role, username) values (${email}, ${hash}, 'Federico', 'admin', 'federico') returning id, username`
await sql`delete from studio.sessions where user_id = ${u.id}`
console.log('\nStudio access ready')
console.log('  Sign in at  /app/  (local: http://localhost:4321/app/)')
console.log('  User        ' + (u.username || 'your admin email'))
console.log('  Password    ' + password)
console.log('\nThen open "Studio view" in the sidebar → People to create client accounts.\n')
