// Applies db/schema.sql to the branch in .env.local.
// Uses Neon's HTTPS SQL endpoint (@neondatabase/serverless), so it also works where port 5432 is blocked.
// Usage: npm run db:migrate   (set NODE_USE_ENV_PROXY=1 behind an HTTPS proxy)
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { neon } from '@neondatabase/serverless'

for (const f of ['.env.local', '.env']) {
  const p = resolve(f)
  if (!existsSync(p)) continue
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set. Run `neon deploy --env .env.local` (or add it to .env.local) first.')
  process.exit(1)
}
const sql = neon(url)
const statements = readFileSync(resolve('db/schema.sql'), 'utf8')
  .split('\n')
  .filter((l) => !l.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean)
for (const s of statements) await sql.query(s)
const [{ n }] = await sql.query('select count(*)::int as n from leads')
console.log(`schema applied (${statements.length} statements); leads table has ${n} row(s)`)
