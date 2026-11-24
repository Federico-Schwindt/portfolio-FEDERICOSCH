import type { Backend } from '../types'
import { demo } from './demo'
import { api } from './api'

/**
 * Live when the studio API answers (the site runs on a server with DATABASE_URL), otherwise the in-browser demo
 * (a static host such as GitHub Pages). ?demo forces the demo for the rest of the visit.
 */
export async function getBackend(): Promise<Backend> {
  const explicitDemo = new URLSearchParams(location.search).has('demo')
  // A shared live request must verify the session even after a previous demo visit or a network error.
  const privateRequest = !explicitDemo && location.hash.startsWith('#/request/')
  try {
    if (privateRequest) sessionStorage.removeItem('fs-demo')
    if (explicitDemo) sessionStorage.setItem('fs-demo', '1')
    if (sessionStorage.getItem('fs-demo')) return demo
  } catch { /* private mode */ }
  if (privateRequest) return api
  if (explicitDemo) return demo
  try {
    const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '')
    const r = await fetch(`${base}/api/health/`, { cache: 'no-store' })
    if (r.ok && (await r.json()).ok) return api
  } catch { /* no server */ }
  return demo
}
