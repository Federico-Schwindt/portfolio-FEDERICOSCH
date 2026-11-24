/**
 * Live backend: the studio API (src/pages/api) on top of Neon Postgres. The session is an httpOnly cookie.
 * One call (/api/state/) loads everything the dashboard shows; the other getters read from that snapshot.
 * Live updates: a light poll every few seconds while the tab is visible.
 */
import type { AdminUser, SessionRow, Recurring, PlanChange, Backend, Client, Ev, FileItem, Invoice, PayView, Pin, Req, Subscription, TeamView, User } from '../types'

const BASE = (import.meta.env.BASE_URL as string).replace(/\/$/, '')
async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(`${BASE}/api/${path}`, { credentials: 'same-origin', ...init, headers: { 'Content-Type': 'application/json', 'x-studio': '1', ...(init.headers ?? {}) } })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(data.error ?? `Error ${r.status}`), { status: r.status })
  return data as T
}
const post = <T>(p: string, b: unknown, method = 'POST') => call<T>(p, { method, body: JSON.stringify(b) })

type State = { recurring?: Recurring[]; changes?: PlanChange[]; user: User; sub: Subscription | null; reqs: Req[]; events: Ev[]; invoices: Invoice[]; files: FileItem[]; lastSeen: string | null; pins: Pin[] }
let snap: State | null = null
let version = ''

export const api: Backend = {
  mode: 'live',
  studioRevision() { return snap?.user.role === 'admin' && version.includes('~') ? version : null },
  search(query, offset, signal) { return call('search/', { method: 'POST', body: JSON.stringify({ query, offset }), signal }) },
  async session() {
    const previous = snap
    const response = await fetch(BASE + '/api/state/', {
      credentials: 'same-origin', cache: 'no-store',
      headers: { 'x-studio': '1', 'x-studio-version': previous ? version : '' },
    })
    if (response.status === 401) { snap = null; version = ''; return null }
    if (!response.ok) throw new Error('Workspace HTTP ' + response.status)
    if (response.status === 204 && previous) {
      version = response.headers.get('x-studio-version') ?? version
      return previous.user
    }
    // Both the versions and their matching values are kept only in this tab's memory.
    const data = await response.json()
    const next: State = response.headers.has('x-studio-delta') ? { ...previous, ...data } : data
    snap = next
    version = response.headers.get('x-studio-version') ?? ''
    return next.user
  },
  async signIn(mode, email, password, name, invite) { await post(`auth/${mode}/`, { email, password, name, invite, lang: document.documentElement.lang === 'es' ? 'es' : 'en' }) },
  async team() { return call<TeamView>('team/') },
  async invite(email) { return post<{ link: string }>('team/invites/', { email }) },
  async revokeInvite(id) { await call(`team/invites/${id}/`, { method: 'DELETE' }) },
  async removeMember(id) { await call(`team/members/${id}/`, { method: 'DELETE' }) },
  async inviteInfo(token) { try { return await post<{ email: string; account: string }>('team/invite-info/', { token }) } catch { return null } },
  async signOut() { await post('auth/logout/', {}); snap = null },
  async updateProfile(p) { await post('profile/', p, 'PATCH') },
  async changePassword(current, next) { await post('profile/password/', { current, next }) },
  async sessions() { return call<SessionRow[]>('profile/sessions/') },
  async closeSession(id) { await call(`profile/sessions/${id}/`, { method: 'DELETE' }) },
  async subscription() { return snap?.sub ?? null },
  async invoices() { return snap?.invoices ?? [] },
  async requests() { return snap?.reqs ?? [] },
  async create(n) {
    const r = await post<Req>('requests/', { title: n.title, kind: n.kind, brief: n.brief, checklist: n.checklist, priority: n.priority, files: [], dueDate: n.dueDate ?? null })
    for (const f of n.files) await api.upload(f, { requestId: r.id, kind: 'brief' })
    return r
  },
  async files() { return snap?.files ?? [] },
  async upload(file, o) {
    const fd = new FormData(); fd.append('file', file); fd.append('kind', o.kind); if (o.requestId) fd.append('requestId', o.requestId)
    const r = await fetch(`${BASE}/api/files/`, { method: 'POST', body: fd, credentials: 'same-origin', headers: { 'x-studio': '1' } })
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(data.error ?? `Error ${r.status}`)
    return data as FileItem
  },
  async removeFile(id) { await call(`files/${id}/`, { method: 'DELETE' }) },
  fileUrl(f, dl) { return `${BASE}/api/files/${f.id}/${dl ? '?dl=1' : ''}` },
  async pins() { return snap?.pins ?? [] },
  async addPin(fileId, x, y, body) { await post('pins/', { fileId, x, y, body }) },
  async setPin(id, resolved) { await post(`pins/${id}/`, { resolved }, 'PATCH') },
  async removePin(id) { await call(`pins/${id}/`, { method: 'DELETE' }) },
  lastSeen() { return snap?.lastSeen ?? null },
  async markSeen() { await post('seen/', {}) },
  async update(id, patch) { await post(`requests/${id}/`, patch, 'PATCH') },
  async reorder(owner, expected, order) { await post('requests/reorder/', { owner, expected, order }) },
  activity(who, cursor, query, download) {
    const path = 'activity/?' + new URLSearchParams({ who, ...(cursor && { cursor }), ...(download && { exportFor: download.viewer }) })
    return call(path, { ...(query && { method: 'POST', body: JSON.stringify({ query }) }), signal: download?.signal })
  },
  notices(before, request) { return call('notices/?' + new URLSearchParams({ ...(before && { before }), ...(request && { request }) })) },
  mailConfig() { return call('admin/mail/') },
  saveMailConfig(config) { return post('admin/mail/', config, 'PUT') },
  async events(requestId) { const all = snap?.events ?? []; return requestId ? all.filter(e => e.requestId === requestId) : all },
  async comment(requestId, body) { await post(`requests/${requestId}/comments/`, { body }) },
  listen(cb) {
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') cb() }, 6000)
    const v = () => { if (document.visibilityState === 'visible') cb() }
    document.addEventListener('visibilitychange', v)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', v) }
  },
  async checkout(plan, step, returnUrl, community) { return post<{ url?: string; pending?: boolean }>('checkout/', { plan, step, returnUrl, community }) },
  async rate(id, score, note) { await post(`requests/${id}/rating/`, { score, note }) },
  async recurring() { return snap?.recurring ?? [] },
  async addRecurring(r) { await post('recurring/', r) },
  async stopRecurring(id) { await call(`recurring/${id}/`, { method: 'DELETE' }) },
  async changes() { return snap?.changes ?? [] },
  async quote(kind, to) { return post('plan/quote/', { kind, to }) },
  async requestChange(kind, to, returnUrl) { return post('plan/changes/', { kind, to, returnUrl }) },
  async undoChange(id) { await call(`plan/changes/${id}/`, { method: 'DELETE' }) },
  async adminChanges() { return call<PlanChange[]>('admin/changes/') },
  async settleChange(id, how) { await post(`admin/changes/${id}/${how}/`, {}) },
  async rejectChange(id) { await call(`admin/changes/${id}/`, { method: 'DELETE' }) },
  async adminUsers() { return call<AdminUser[]>('admin/users/') },
  async createUser(u) { await post('admin/users/', u) },
  async updateUser(id, p) { await post(`admin/users/${id}/`, p, 'PATCH') },
  async deleteUser(id) { await call(`admin/users/${id}/`, { method: 'DELETE' }) },
  async clients() { return call<Client[]>('admin/clients/') },
  async updateClient(id, p) { await post(`admin/clients/${id}/`, p, 'PATCH') },
  async payments() { return call<PayView>('admin/payments/') },
  async savePayments(p) { return post<PayView>('admin/payments/', p, 'PUT') },
}
