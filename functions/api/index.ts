/**
 * Portfolio API — a Neon Function (Hono on Node 24).
 *
 * Public:
 *   GET  /health                 liveness + branch name
 *   POST /leads                  capture a lead (contact form, free audit, pricing CTA)
 *   POST /leads/:id/brief        attach one file (≤10 MB) to a lead → private `briefs` bucket
 *
 * Admin (Bearer JWT from Neon Auth, email must be in ADMIN_EMAILS):
 *   GET   /leads                 latest 200 leads
 *   PATCH /leads/:id             { status?, notes? }
 *   GET   /leads/:id/brief       presigned download URL for the attachment
 *   POST  /leads/live            sealed Realtime query for the live admin list
 *
 * Env: DATABASE_URL, NEON_AUTH_BASE_URL, NEON_AUTH_JWKS_URL, AWS_* (injected by Neon);
 *      ADMIN_EMAILS, WEB_ORIGINS, REALTIME_SECRET (declared in neon.ts, from .env.local).
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createRealtime, rawSql } from '@neon/realtime/server'
import { query } from './db.ts'

// ── config ────────────────────────────────────────────────────────────────────
const DEFAULT_ORIGINS = ['https://federico-schwindt.github.io', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://127.0.0.1:4173']
const ORIGINS = (process.env.WEB_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
const allowedOrigins = ORIGINS.length ? ORIGINS : DEFAULT_ORIGINS
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? 'leonel.sch2003@gmail.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)
const BRIEFS_BUCKET = 'briefs'
const MAX_BRIEF_BYTES = 10 * 1024 * 1024

// ── object storage ────────────────────────────────────────────────────────────
const s3 = () =>
  new S3Client({
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    region: process.env.AWS_REGION ?? 'us-east-2',
    forcePathStyle: true,
  })

// ── auth ──────────────────────────────────────────────────────────────────────
const jwks = process.env.NEON_AUTH_JWKS_URL ? createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL)) : null
const issuer = process.env.NEON_AUTH_BASE_URL ? new URL(process.env.NEON_AUTH_BASE_URL).origin : undefined

type Admin = { userId: string; email: string }

async function verifyAdmin(authorization: string | undefined): Promise<Admin | null> {
  if (!jwks || !authorization?.toLowerCase().startsWith('bearer ')) return null
  let sub: string | undefined
  try {
    const { payload } = await jwtVerify(authorization.slice(7), jwks, issuer ? { issuer } : {})
    sub = payload.sub
  } catch {
    return null
  }
  if (!sub) return null
  // Managed auth keeps users in the neon_auth schema of the same database.
  let email: string | undefined
  for (const table of ['neon_auth."user"', 'neon_auth.users', 'neon_auth.users_sync']) {
    try {
      const r = await query<{ email: string }>(`select email from ${table} where id = $1 limit 1`, [sub])
      email = r.rows[0]?.email
      if (email) break
    } catch {
      /* try the next table name */
    }
  }
  if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) return null
  return { userId: sub, email }
}

// ── realtime ──────────────────────────────────────────────────────────────────
const realtimeSecret = process.env.REALTIME_SECRET ?? process.env.NEON_REALTIME_SECRET
const dbName = (() => {
  try {
    return new URL(process.env.DATABASE_URL ?? '').pathname.replace(/^\//, '') || 'neondb'
  } catch {
    return 'neondb'
  }
})()
const realtime = realtimeSecret ? createRealtime({ secret: realtimeSecret, db: dbName }) : null
const LIVE_LEADS_SQL =
  'SELECT id, created_at, updated_at, source, status, name, email, company, website, package, budget, message, page, brief_key, brief_name, notes FROM leads ORDER BY created_at DESC LIMIT 200'
const liveLeads = rawSql<LeadRow>(LIVE_LEADS_SQL)

// ── helpers ───────────────────────────────────────────────────────────────────
type LeadRow = {
  id: string
  created_at: string
  updated_at: string
  source: string
  status: string
  name: string
  email: string
  company: string | null
  website: string | null
  package: string | null
  budget: string | null
  message: string | null
  page: string | null
  brief_key: string | null
  brief_name: string | null
  notes: string | null
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PACKAGES = new Set(['launch', 'grow', 'scale', 'unsure'])
const STATUSES = new Set(['new', 'contacted', 'won', 'lost'])
const SOURCES = new Set(['contact', 'audit', 'pricing'])

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const opt = (v: unknown, max: number) => str(v, max) || null

// Tiny in-memory rate limit: the isolate persists between invocations, which is enough to blunt form spam.
const hits = new Map<string, { n: number; t: number }>()
function limited(ip: string, max = 8, windowMs = 10 * 60_000) {
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || now - h.t > windowMs) {
    hits.set(ip, { n: 1, t: now })
    return false
  }
  h.n += 1
  return h.n > max
}
const clientIp = (h: Headers) => (h.get('x-forwarded-for') ?? h.get('cf-connecting-ip') ?? 'unknown').split(',')[0].trim()

// ── app ───────────────────────────────────────────────────────────────────────
const app = new Hono()

app.use(
  '*',
  cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]),
    allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
)

// cors() does not run on thrown errors: set the header by hand so the browser can read the failure.
app.onError((err, c) => {
  console.error(err)
  const origin = c.req.header('origin')
  if (origin && allowedOrigins.includes(origin)) c.header('Access-Control-Allow-Origin', origin)
  return c.json({ error: 'Internal error' }, 500)
})

app.get('/', (c) => c.json({ name: 'portfolio-api', ok: true }))
app.get('/health', async (c) => {
  const { rows } = await query<{ now: string }>('select now() as now')
  return c.json({ ok: true, branch: process.env.NEON_BRANCH ?? null, now: rows[0].now, realtime: Boolean(realtime), auth: Boolean(jwks) })
})

app.post('/leads', async (c) => {
  if (limited(clientIp(c.req.raw.headers))) return c.json({ error: 'Too many requests, try again later.' }, 429)
  const body = await c.req.json().catch(() => null)
  if (!body || typeof body !== 'object') return c.json({ error: 'Invalid JSON' }, 400)
  const b = body as Record<string, unknown>
  // honeypot: real users never fill this field
  if (str(b.company_url, 10)) return c.json({ ok: true, id: null }, 200)
  const name = str(b.name, 120)
  const email = str(b.email, 200).toLowerCase()
  const message = str(b.message, 4000)
  const source = SOURCES.has(str(b.source, 20)) ? str(b.source, 20) : 'contact'
  if (!name) return c.json({ error: 'Name is required' }, 400)
  if (!EMAIL.test(email)) return c.json({ error: 'A valid email is required' }, 400)
  if (source === 'contact' && !message) return c.json({ error: 'Tell me a little about the project' }, 400)
  const pkg = PACKAGES.has(str(b.package, 20)) ? str(b.package, 20) : null
  const { rows } = await query<{ id: string; txid: string }>(
    `insert into leads (source, name, email, company, website, package, budget, message, page, user_agent)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     returning id, pg_current_xact_id()::text as txid`,
    [source, name, email, opt(b.company, 200), opt(b.website, 300), pkg, opt(b.budget, 60), message || null, opt(b.page, 200), c.req.header('user-agent')?.slice(0, 300) ?? null],
  )
  return c.json({ ok: true, id: rows[0].id, txid: rows[0].txid }, 201)
})

app.post('/leads/:id/brief', async (c) => {
  const id = c.req.param('id')
  if (!UUID.test(id)) return c.json({ error: 'Bad id' }, 400)
  const lead = await query<{ id: string; brief_key: string | null; created_at: string }>('select id, brief_key, created_at from leads where id = $1', [id])
  if (!lead.rowCount) return c.json({ error: 'Unknown lead' }, 404)
  // only allow attaching once, shortly after the lead was created
  if (lead.rows[0].brief_key) return c.json({ error: 'A file is already attached' }, 409)
  if (Date.now() - new Date(lead.rows[0].created_at).getTime() > 30 * 60_000) return c.json({ error: 'Attachment window closed' }, 410)
  const form = await c.req.parseBody()
  const file = form.file
  if (!(file instanceof File)) return c.json({ error: 'No file' }, 400)
  if (file.size > MAX_BRIEF_BYTES) return c.json({ error: 'File is larger than 10 MB' }, 413)
  const safeName = file.name.replace(/[^\w.\-]+/g, '_').slice(0, 120) || 'brief'
  const key = `${id}/${Date.now()}-${safeName}`
  await s3().send(
    new PutObjectCommand({ Bucket: BRIEFS_BUCKET, Key: key, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type || 'application/octet-stream' }),
  )
  await query('update leads set brief_key = $2, brief_name = $3, updated_at = now() where id = $1', [id, key, file.name.slice(0, 200)])
  return c.json({ ok: true, key })
})

// ── admin ─────────────────────────────────────────────────────────────────────
const admin = new Hono<{ Variables: { admin: Admin } }>()
admin.use('*', async (c, next) => {
  const who = await verifyAdmin(c.req.header('authorization'))
  if (!who) return c.json({ error: 'Unauthorized' }, 401)
  c.set('admin', who)
  await next()
})

admin.get('/leads', async (c) => {
  const { rows } = await query<LeadRow>(LIVE_LEADS_SQL)
  return c.json({ leads: rows, admin: c.get('admin').email })
})

admin.patch('/leads/:id', async (c) => {
  const id = c.req.param('id')
  if (!UUID.test(id)) return c.json({ error: 'Bad id' }, 400)
  const b = (await c.req.json().catch(() => ({}))) as Record<string, unknown>
  const status = STATUSES.has(str(b.status, 20)) ? str(b.status, 20) : null
  const notes = typeof b.notes === 'string' ? b.notes.slice(0, 4000) : null
  const { rows } = await query<{ id: string; txid: string }>(
    `update leads set status = coalesce($2, status), notes = coalesce($3, notes), updated_at = now()
     where id = $1 returning id, pg_current_xact_id()::text as txid`,
    [id, status, notes],
  )
  if (!rows.length) return c.json({ error: 'Unknown lead' }, 404)
  return c.json({ ok: true, txid: rows[0].txid })
})

admin.get('/leads/:id/brief', async (c) => {
  const id = c.req.param('id')
  if (!UUID.test(id)) return c.json({ error: 'Bad id' }, 400)
  const { rows } = await query<{ brief_key: string | null }>('select brief_key from leads where id = $1', [id])
  if (!rows[0]?.brief_key) return c.json({ error: 'No attachment' }, 404)
  const url = await getSignedUrl(s3(), new GetObjectCommand({ Bucket: BRIEFS_BUCKET, Key: rows[0].brief_key }), { expiresIn: 600 })
  return c.json({ url })
})

admin.post('/leads/live', async (c) => {
  if (!realtime) return c.json({ error: 'Realtime is not configured on this branch' }, 503)
  return c.json(await realtime.seal({ query: liveLeads }))
})

app.route('/', admin)

export default app
