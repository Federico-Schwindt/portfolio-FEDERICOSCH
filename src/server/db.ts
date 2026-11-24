/**
 * Server only. The Neon connection and small helpers shared by the API routes.
 * DATABASE_URL comes from the host's environment (or .env locally) and never reaches the browser.
 */
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import fs from 'node:fs'

let fileEnv: Record<string, string> | null = null
export function env(key: string): string | undefined {
  if (process.env[key]) return process.env[key]
  if (fileEnv === null) {
    fileEnv = {}
    try {
      for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
        if (m) fileEnv[m[1]] = m[2]
      }
    } catch { /* no local file: the host provides the variables */ }
  }
  return fileEnv[key]
}

let client: NeonQueryFunction<false, false> | null = null
export function sql() {
  if (!client) {
    const url = env('DATABASE_URL')
    if (!url) throw new Error('DATABASE_URL is not set')
    client = neon(url)
  }
  return client
}

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } })
export const bad = (error: string, status = 400) => json({ error }, status)

/** state-changing calls must be same-origin JSON with our header (a simple CSRF guard on top of SameSite cookies) */
export function sameOrigin(req: Request) {
  if (req.method === 'GET') return true
  if (req.headers.get('x-studio') !== '1') return false
  const origin = req.headers.get('origin')
  // compare with the Host the browser used (behind a proxy, the forwarded one); the internal request URL can differ
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? new URL(req.url).host
  return !origin || new URL(origin).host === host
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try { return (await req.json()) as T } catch { return {} as T }
}
