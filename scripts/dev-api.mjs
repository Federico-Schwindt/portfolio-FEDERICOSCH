// Runs the `api` Neon Function locally on http://127.0.0.1:8787 against the database in .env.local.
// Prefer `neon dev` once you are signed in to the Neon CLI; this runner needs no Neon login.
// Node strips the TypeScript types natively (Node ≥ 22.18). DB_DRIVER=http uses Neon's HTTPS SQL
// endpoint for networks that block port 5432.
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

for (const f of ['.env.local', '.env']) {
  const p = resolve(f)
  if (!existsSync(p)) continue
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
process.env.DB_DRIVER ??= 'http'
const port = Number(process.env.PORT ?? 8787)

const { default: app } = await import(pathToFileURL(resolve('functions/api/index.ts')).href)

createServer(async (req, res) => {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v)
  const body = chunks.length && req.method !== 'GET' && req.method !== 'HEAD' ? Buffer.concat(chunks) : undefined
  const response = await app.fetch(new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers, body }))
  res.writeHead(response.status, Object.fromEntries(response.headers))
  res.end(Buffer.from(await response.arrayBuffer()))
}).listen(port, '127.0.0.1', () => console.log(`api listening on http://127.0.0.1:${port}/ (DB_DRIVER=${process.env.DB_DRIVER})`))
