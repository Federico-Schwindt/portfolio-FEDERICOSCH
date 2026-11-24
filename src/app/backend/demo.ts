/**
 * Demo backend: the whole product running in the browser (localStorage), so the flow can be tried before the
 * Supabase and Lemon Squeezy accounts exist. It follows the same queue rule as the database, and a small
 * "studio" ticker moves active requests forward so the dashboard is alive. Nothing leaves the browser.
 */
import { quote as ruleQuote, type Sub as RuleSub } from '../../lib/plan-rules'
import { fold, searchLimit } from '../workspace-search'
import { activityExportSize, activityViewer } from '../types'
import { PLANS, runningSlots, type Recurring, type PlanChange, type TeamView, type Backend, type Ev, type FileItem, type Invoice, type PayView, type Pin, type PlanId, type Req, type Subscription, type User } from '../types'

import { blankMail, composeMail, mailMask, type Topic } from '../mail'
import type { MailItem, MailConfig } from '../types'

type DemoNotice = MailItem & { topic: Topic; recipient: string; requestId?: string }
type State = { mail?: MailConfig; outbox?: DemoNotice[]; recurring?: Recurring[]; changes?: PlanChange[]; team?: TeamView; user: User | null; sub: Subscription | null; invoices: Invoice[]; reqs: Req[]; events: Ev[]; seq: number; pay?: PayView; files?: FileItem[]; seen?: string; pins?: Pin[] }
const KEY = 'fs-demo-v1'
const now = () => new Date().toISOString()
const ES = typeof document !== 'undefined' && document.documentElement.lang === 'es'
const TR: Record<string, string> = {"Homepage hero and offer":"Hero y oferta de la home","Logo refresh and colour palette":"Logo renovado y paleta de colores","Services page copy":"Textos de la página de servicios","Google Business profile setup":"Perfil de Empresa de Google","Booking form with WhatsApp alert":"Formulario de turnos con aviso por WhatsApp","Fix mobile menu on Safari":"Arreglar el menú móvil en Safari","Instagram launch carousel (5 slides)":"Carrusel de lanzamiento para Instagram (5 slides)","Pricing page with FAQ":"Página de precios con preguntas","Email welcome sequence":"Secuencia de emails de bienvenida","Summer promo landing page":"Landing de la promo de verano","Product photos: background clean-up":"Fotos de producto: limpiar el fondo"}
const L = (en: string) => (ES ? TR[en] ?? en : en)
const ago = (d: number, h = 0) => new Date(Date.now() - d * 864e5 - h * 36e5).toISOString()
const uid = () => Math.random().toString(36).slice(2, 10)

const load = (fallback?: State): State => {
  try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s) } catch { /* private mode */ }
  return fallback ?? { user: null, sub: null, invoices: [], reqs: [], events: [], seq: 0 }
}
let S = load()
const subs = new Set<() => void>()
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)) } catch { /* private mode */ } subs.forEach((f) => f()) }
function demoNotice(topic: Topic, title: string, detail: string, at: string, requestId?: string) {
  const u = S.user
  if (!u || u.notify?.[topic] === false) return
  const lang = u.lang ?? (ES ? 'es' : 'en')
  const base = S.mail?.appUrl || new URL(import.meta.env.BASE_URL, location.origin).href
  const msg = composeMail(topic, lang, title, detail, base, requestId)
  msg.text = msg.text.replace('/app/#/', '/app/?demo#/')
  const sent = S.mail?.provider === 'resend'
  const list = S.outbox ??= []
  list.unshift({ ...msg, id: uid(), recipient: u.id, requestId, email: u.email, topic, status: sent ? 'sent' : 'queued', at, sentAt: sent ? now() : null })
}
const ev = (requestId: string, who: Ev['who'], kind: Ev['kind'], body: string, at = now()) => {
  S.events.push({ id: uid(), requestId, who, kind, body, at })
  const r = S.reqs.find(item => item.id === requestId)
  if (r && kind === 'status' && body === 'review') demoNotice('review', r.title, '', at, requestId)
  if (r && kind === 'comment' && who === 'studio') demoNotice('comments', r.title, body, at, requestId)
}

/** the queue rule: fill free slots in priority, then queue order */
function promote() {
  const slots = runningSlots(S.sub)
  if (!slots) return
  let active = S.reqs.filter((r) => r.status === 'active').length
  const waiting = S.reqs.filter((r) => r.status === 'queued').sort((a, b) => a.position - b.position)
  for (const r of waiting) {
    if (active >= slots) break
    r.status = 'active'; r.startedAt = now(); active++
    ev(r.id, 'system', 'status', 'active')
  }
}

const AI_LINES = typeof document !== 'undefined' && document.documentElement.lang === 'es'
  ? ['El agente propuso tres títulos.', 'El agente adaptó las imágenes a celular y escritorio.', 'El agente revisó links y ortografía.', 'El agente comprimió imágenes: 1.8 MB menos.', 'El agente escribió el texto alternativo de cada imagen.']
  : ['Agent drafted three headline options.', 'Agent resized assets for mobile and desktop.', 'Agent checked links and spelling.', 'Agent compressed images: 1.8 MB saved.', 'Agent wrote alt text for every image.']

/** a believable first month, so the dashboard has history */
function seed(plan: PlanId) {
  const mk = (n: number, title: string, kind: Req['kind'], status: Req['status'], days: number, progress = 0, brief = ''): Req => ({
    id: uid(), number: n, owner: S.user!.id, title: L(title), kind, brief, checklist: [], priority: 2, status, position: n, progress,
    deliverable: status === 'done' || status === 'review' ? 'https://www.figma.com/' : null, files: [],
    createdAt: ago(days + 2), startedAt: status === 'queued' ? null : ago(days + 1), reviewAt: status === 'review' || status === 'done' ? ago(days) : null, doneAt: status === 'done' ? ago(Math.max(0, days - 0.5)) : null,
  })
  const list: Req[] = [
    mk(1, 'Homepage hero and offer', 'page', 'done', 24), mk(2, 'Logo refresh and colour palette', 'design', 'done', 21),
    mk(3, 'Services page copy', 'copy', 'done', 17), mk(4, 'Google Business profile setup', 'campaign', 'done', 13),
    mk(5, 'Booking form with WhatsApp alert', 'automation', 'done', 9), mk(6, 'Fix mobile menu on Safari', 'fix', 'done', 6),
    mk(7, 'Instagram launch carousel (5 slides)', 'social', 'review', 1, 100, 'Five slides announcing the new site. Brand colours, one idea per slide, last slide sends to the booking page.'),
    mk(8, 'Pricing page with FAQ', 'page', 'active', 0, 64, 'Three tiers, a comparison table and the six questions customers ask on WhatsApp.'),
    mk(9, 'Email welcome sequence', 'copy', 'active', 0, 28, 'Three emails over a week for new leads from the form.'),
    mk(10, 'Summer promo landing page', 'campaign', 'queued', 0, 0, 'One page, one offer, for the July campaign. Countdown to the 31st.'),
    mk(11, 'Product photos: background clean-up', 'design', 'queued', 0),
  ]
  S.reqs = list.slice(0, plan === 'launch' ? 9 : list.length)
  S.seq = S.reqs.length
  for (const r of S.reqs) {
    ev(r.id, 'client', 'status', 'queued', r.createdAt)
    if (r.startedAt) ev(r.id, 'system', 'status', 'active', r.startedAt)
    if (r.startedAt) ev(r.id, 'ai', 'ai', AI_LINES[r.number % AI_LINES.length], r.startedAt)
    if (r.reviewAt) ev(r.id, 'studio', 'status', 'review', r.reviewAt)
    if (r.doneAt) ev(r.id, 'client', 'status', 'done', r.doneAt)
  }
  ev(S.reqs[6].id, 'studio', 'comment', ES ? 'Listo para que lo veas. Dejé el título corto para que se lea en el celular; la slide 5 lleva a los turnos.' : 'Ready for you. I kept the headline short so it reads on a phone; slide 5 links to the booking page.', ago(1))
}

// the studio, simulated: active requests advance, reach review, and agents report what they did
let ticker = 0
function startTicker() {
  if (ticker) return
  ticker = window.setInterval(() => {
    if (!S.user || !S.sub) return
    const act = S.reqs.filter((r) => r.status === 'active')
    if (!act.length) return
    const r = act[Math.floor(Math.random() * act.length)]
    r.progress = Math.min(100, r.progress + 4 + Math.round(Math.random() * 7))
    if (Math.random() < 0.18) ev(r.id, 'ai', 'ai', AI_LINES[Math.floor(Math.random() * AI_LINES.length)])
    if (r.progress >= 100) { r.status = 'review'; r.reviewAt = now(); r.deliverable = 'https://www.figma.com/'; ev(r.id, 'studio', 'status', 'review'); ev(r.id, 'studio', 'comment', ES ? 'Listo de mi lado. Míralo y apruébalo, o dime qué cambiar.' : 'Done on my side. Have a look and approve, or tell me what to change.') }
    promote(); save()
  }, 4200)
}

export const demo: Backend = {
  async search(query, offset) {
    const q = fold(query.trim()), u = S.user
    if (!q || !u) return { files: [], clients: [] }
    const admin = u.role === 'admin'
    const label = u.company || u.name || u.email
    const files = (S.files ?? []).filter(f => (admin || f.owner === (u.account ?? u.id)) && fold(f.name).includes(q))
      .sort((a, b) => Number(fold(b.name) === q) - Number(fold(a.name) === q) || b.at.localeCompare(a.at) || a.id.localeCompare(b.id))
      .slice(offset, offset + searchLimit + 1).map(file => ({
        file, ownerName: label, requestTitle: S.reqs.find(r => r.id === file.requestId)?.title ?? null,
      }))
    const clients = !offset && admin && [u.company, u.name, u.email].some(v => v && fold(v).includes(q))
      ? [{ id: u.id, label, email: u.email }] : []
    return { files, clients }
  },
  mode: 'demo',
  async session() { if (S.user) startTicker(); return S.user },
  async signIn(_mode, email, _password, name) {
    S.user = { id: 'demo-' + uid(), email, name: name || email.split('@')[0], company: '', lang: ES ? 'es' : 'en', role: 'client', brand: { colors: ['#F01111', '#0B0B0B', '#FFF1E0'], fonts: 'Archivo, Hanken Grotesk' } }
    save(); startTicker()
  },
  async team() {
    const t = S.team ?? { members: [], invites: [] }
    return { members: [{ id: S.user!.id, email: S.user!.email, name: S.user!.name, since: now(), owner: true }, ...t.members], invites: t.invites }
  },
  async invite(email) {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error(ES ? 'Escribe un email válido.' : 'Enter a valid email.')
    const t = S.team ?? { members: [], invites: [] }
    t.invites = [{ id: uid(), email: email.toLowerCase(), at: now(), expires: new Date(Date.now() + 14 * 864e5).toISOString() }, ...t.invites.filter((i) => i.email !== email.toLowerCase())]
    S.team = t; save()
    return { link: location.origin + location.pathname + '?invite=demo-' + uid() + uid() }
  },
  async revokeInvite(id) { if (S.team) { S.team.invites = S.team.invites.filter((i) => i.id !== id); save() } },
  async removeMember(id) { if (S.team) { S.team.members = S.team.members.filter((m) => m.id !== id); save() } },
  async inviteInfo() { return null },
  async signOut() { S = { user: null, sub: null, invoices: [], reqs: [], events: [], seq: 0 }; save() },
  async updateProfile({ brand, ...profile }) {
    if (!S.user) return
    if (brand) {
      const merged = { ...S.user.brand, ...brand }
      if (JSON.stringify(merged).length > 8000) throw new Error(ES ? 'Los datos de marca son demasiado largos.' : 'Brand details are too long.')
      S.user.brand = merged
    }
    Object.assign(S.user, profile)
    save()
  },
  async changePassword(_c, next) { if (next.length < 8) throw new Error(ES ? 'Usa al menos 8 caracteres.' : 'Use at least 8 characters for the new password.') },
  async sessions() { return [{ id: 'this', agent: navigator.userAgent, at: now(), current: true }] },
  async closeSession() {},
  async subscription() { return S.sub },
  async invoices() { return [...S.invoices].reverse() },
  async requests() {
    const u = S.user
    if (!u) return []
    return S.reqs.filter(r => r.status !== 'cancelled' && (u.role === 'admin' || r.owner === (u.account ?? u.id))).map((r) => ({
      ...r, ownerName: r.ownerName || (r.owner === (u.account ?? u.id) ? u.company || u.name : undefined),
      ownerEmail: S.user?.role === 'admin' && S.user.id === r.owner ? S.user.email : undefined,
    }))
  },
  async create(n) {
    const owner = S.user!.account ?? S.user!.id
    const r: Req = { id: uid(), number: ++S.seq, owner, title: n.title, kind: n.kind, brief: n.brief, checklist: n.checklist, priority: n.priority, status: 'queued', position: Date.now() / 1000 - (n.priority === 1 ? 1e6 : 0), progress: 0, deliverable: null, files: n.files.map((f) => f.name), createdAt: now(), startedAt: null, reviewAt: null, doneAt: null }
    r.dueDate = n.dueDate ?? null
    S.reqs.push(r); ev(r.id, 'client', 'status', 'queued')
    for (const f of n.files) await demo.upload(f, { requestId: r.id, kind: 'brief' })
    if (n.checklist.length) ev(r.id, 'ai', 'ai', `Brief structured into ${n.checklist.length} steps.`)
    promote(); save(); return r
  },
  async update(id, patch) {
    const r = S.reqs.find((x) => x.id === id); if (!r) return
    const was = r.status
    const { note: _n, ...rest } = patch
    Object.assign(r, rest)
    if (patch.status && patch.status !== was) {
      if (patch.status === 'done') { r.doneAt = now(); r.progress = 100 }
      if (patch.status === 'active' && was === 'review') {
        r.progress = 70
        const v = (S.files ?? []).filter((x) => x.requestId === r.id && x.kind === 'deliverable').reduce((m, x) => Math.max(m, x.version), 0)
        ev(r.id, 'client', 'changes', (v ? `v${v}: ` : '') + (patch.note ?? ''))
      }
      ev(r.id, patch.status === 'done' || patch.status === 'cancelled' ? 'client' : 'system', 'status', patch.status)
    }
    promote(); save()
  },
  async files() { return [...(S.files ?? [])].reverse() },
  async upload(file, o) {
    // images up to 1.5 MB are kept as data URLs so previews work; bigger files keep their name only
    const url = file.size < 1.5e6 ? await new Promise<string>((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.readAsDataURL(file) }) : undefined
    const same = (S.files ?? []).filter((x) => x.requestId === o.requestId && x.kind === 'deliverable').length
    const f: FileItem = { id: uid(), owner: S.user!.id, requestId: o.requestId ?? null, kind: o.kind, version: o.kind === 'deliverable' ? same + 1 : 1, name: file.name, mime: file.type || 'application/octet-stream', size: file.size, at: now(), byStudio: S.user?.role === 'admin', url }
    S.files = [...(S.files ?? []), f]
    if (o.requestId) ev(o.requestId, S.user?.role === 'admin' ? 'studio' : 'client', 'file', o.kind === 'deliverable' ? `v${f.version} · ${f.name}` : f.name)
    save(); return f
  },
  async removeFile(id) { S.files = (S.files ?? []).filter((x) => x.id !== id); save() },
  fileUrl(f) { return f.url ?? '#' },
  async pins() { return S.pins ?? [] },
  async addPin(fileId, x, y, body) {
    const f = (S.files ?? []).find((z) => z.id === fileId)
    S.pins = [...(S.pins ?? []), { id: uid(), fileId, x, y, body, resolved: false, byStudio: S.user?.role === 'admin', mine: true, at: now() }]
    if (f?.requestId) ev(f.requestId, S.user?.role === 'admin' ? 'studio' : 'client', 'comment', (f.kind === 'deliverable' ? `v${f.version} · ` : '') + body)
    save()
  },
  async setPin(id, resolved) {
    if (S.user?.role !== 'admin') throw new Error('Only the studio can resolve pins.')
    const p = (S.pins ?? []).find((z) => z.id === id)
    if (p) { p.resolved = resolved; save() }
  },
  async removePin(id) { S.pins = (S.pins ?? []).filter((z) => z.id !== id); save() },
  lastSeen() { return S.seen ?? null },
  async markSeen() { S.seen = now(); save() },
  async reorder(owner, expected, order) {
    const write = () => {
      S = load(S)
      const queue = S.reqs.filter(r => r.owner === owner && r.status === 'queued').sort((a,b) => a.position-b.position || a.id.localeCompare(b.id))
      const byId = new Map(queue.map(r => [r.id,r]))
      if ((!S.user || (S.user.role !== 'admin' && owner !== (S.user.account || S.user.id)))
        || expected.length !== queue.length || expected.some((id,i) => queue[i].id !== id)
        || order.length !== queue.length || new Set(order).size !== queue.length || order.some(id => !byId.has(id)))
        throw Object.assign(new Error('Queue changed'), {status:409})
      const positions = queue.map(r => r.position)
      for (let i=1; i<positions.length; i++) positions[i] = Math.max(positions[i], positions[i-1]+0.000001)
      order.forEach((id,i) => { byId.get(id)!.position = positions[i] })
      save()
    }
    if (navigator.locks) await navigator.locks.request(KEY + '-queue', write)
    else write()
  },
  async activity(who, cursor, query = '', download) {
    const key = (e: Ev) => e.at + '|' + e.id
    const user = S.user
    if (download && (!user || download.viewer !== activityViewer(user.id, user.account ?? user.id, user.role))) throw new Error('Session changed')
    const size = download ? activityExportSize : 40
    const requests = new Map(S.reqs.filter(r => user && (user.role === 'admin' || r.owner === (user.account ?? user.id))).map(r => [r.id, r]))
    const term = fold(query.trim())
    const number = /^#\d+$/.test(term) ? term.slice(1) : null
    const rows = S.events.flatMap(e => {
      const request = requests.get(e.requestId)
      if (!request || (cursor && key(e) >= cursor)) return []
      if (who && who !== e.who && !(who === 'studio' && e.who === 'system')) return []
      if (number !== null ? String(request.number) !== number :
        term && !fold(request.title).includes(term) && (e.kind === 'status' || !fold(e.body).includes(term))) return []
      return [{ ...e, requestTitle: request.title, requestNumber: request.number }]
    }).sort((a,b) => key(a) < key(b) ? 1 : -1)
    const items = rows.slice(0,size)
    return { items, next: rows.length > size ? key(items[size - 1]) : null }
  },
  async notices(before, requestId) {
    const rows = (S.outbox ?? []).filter(r => (!requestId || r.requestId === requestId) && (S.user?.role === 'admin' || (r.recipient === S.user?.id && r.status === 'sent')))
    const start = before ? rows.findIndex(r => r.id === before)+1 : 0
    const items = rows.slice(start,start+20)
    return { items, next: rows.length > start+20 ? items[19].id : null }
  },
  async mailConfig() { return S.mail ?? blankMail },
  async saveMailConfig(c) {
    S.mail = { ...c, apiKey: c.apiKey ? mailMask : '' }
    if (c.provider === 'resend') for (const r of S.outbox ?? []) {
      if (r.status !== 'queued') continue
      if (r.recipient !== S.user?.id || S.user?.notify?.[r.topic] === false) r.status = 'skipped'
      else { r.status = 'sent'; r.sentAt = now() }
    }
    save(); return S.mail
  },
  async events(requestId) { return S.events.filter((e) => !requestId || e.requestId === requestId).sort((a, b) => a.at.localeCompare(b.at)) },
  async comment(requestId, body) {
    ev(requestId, S.user?.role === 'admin' ? 'studio' : 'client', 'comment', body)
    save()
    // the studio answers in demo mode, so the thread feels real
    if (S.user?.role !== 'admin') setTimeout(() => { ev(requestId, 'studio', 'comment', ES ? 'Perfecto, lo sumo.' : 'Got it, I will include that.'); save() }, 2400)
  },
  listen(cb) { subs.add(cb); const st = (e: StorageEvent) => { if (e.key === KEY) { S = load(); cb() } }; addEventListener('storage', st); return () => { subs.delete(cb); removeEventListener('storage', st) } },
  async checkout(plan, step, returnUrl) {
    // demo: an in-app test page stands in for the provider's hosted checkout
    const u = new URL(returnUrl, location.href)
    u.searchParams.set('demo_pay', `${plan}:${step}`)
    return { url: u.toString() }
  },
  async rate(id, score, note) { const r = S.reqs.find((x) => x.id === id); if (r) { r.rating = score; r.ratingNote = note ?? null; ev(id, 'client', 'comment', '★'.repeat(score) + '☆'.repeat(5 - score) + (note ? ' ' + note : '')); save() } },
  async recurring() { return (S.recurring ?? []).filter((x) => x.active) },
  async addRecurring(r) { S.recurring = [...(S.recurring ?? []), { id: uid(), title: r.title, kind: r.kind, every: r.every, nextAt: new Date(Date.now() + (r.every === 'week' ? 7 : 30) * 864e5).toISOString(), made: 0, active: true }]; save() },
  async stopRecurring(id) { const x = (S.recurring ?? []).find((z) => z.id === id); if (x) { x.active = false; save() } },
  async changes() { applyDemoDue(); return S.changes ?? [] },
  async quote(kind, to) { return ruleQuote(demoSub(), kind, to) },
  async requestChange(kind, to) {
    const q = ruleQuote(demoSub(), kind, to)
    const group = (k: string) => (k === 'upgrade' || k === 'downgrade' ? 'plan' : k.startsWith('community') ? 'community' : 'state')
    for (const c of S.changes ?? []) if ((c.status === 'awaiting_payment' || c.status === 'scheduled') && group(c.kind) === group(kind)) { c.status = 'cancelled'; c.closedAt = now() }
    const c: PlanChange = { id: uid(), kind, from: q.from, to: q.to, amount: q.dueNow, status: q.when === 'period_end' ? 'scheduled' : 'awaiting_payment', effectiveAt: q.effectiveAt, at: now(), closedAt: null, quote: q }
    S.changes = [c, ...(S.changes ?? [])]
    if (q.when === 'now') demoApply(c, false)
    save()
    // demo: an in-app test page stands in for the hosted checkout
    if (c.status === 'awaiting_payment') { const u = new URL(location.href); u.searchParams.set('demo_change', c.id); return { change: c, url: u.toString() } }
    return { change: c, url: null }
  },
  async undoChange(id) { const c = (S.changes ?? []).find((x) => x.id === id); if (c && (c.status === 'awaiting_payment' || c.status === 'scheduled')) { c.status = 'cancelled'; c.closedAt = now(); save() } },
  async adminChanges() { return (S.changes ?? []).map((c) => ({ ...c, client: { id: S.user!.id, email: S.user!.email, name: S.user!.name, company: S.user!.company } })) },
  async settleChange(id, how) { const c = (S.changes ?? []).find((x) => x.id === id); if (c) { demoApply(c, how === 'paid'); save() } },
  async rejectChange(id) { const c = (S.changes ?? []).find((x) => x.id === id); if (c && (c.status === 'awaiting_payment' || c.status === 'scheduled')) { c.status = 'cancelled'; c.resolution = 'rejected'; c.closedAt = now(); save() } },
  async clients() {
    if (!S.user) return []
    return [{ id: S.user.id, email: S.user.email, name: S.user.name, company: S.user.company, role: S.user.role, since: now(), plan: S.sub?.plan ?? null, status: S.sub?.status ?? null, community: S.sub?.community ?? null, open: S.reqs.filter((r) => ['queued', 'active', 'review'].includes(r.status)).length }]
  },
  async updateClient(_id, p) { S.sub = { plan: p.plan, status: p.status, community: p.community, periodEnd: S.sub?.periodEnd ?? null, portalUrl: null }; if (!S.reqs.length) seed(p.plan); promote(); save() },
  async payments() { return S.pay ?? { provider: 'none', apiKey: '', storeId: '', webhookSecret: '', variants: {}, webhook: location.origin + '/api/billing/webhook/' } },
  async savePayments(p) { S.pay = { ...p, apiKey: p.apiKey ? '••••' + p.apiKey.slice(-4) : '', webhookSecret: p.webhookSecret ? '••••' + p.webhookSecret.slice(-4) : '' }; save(); return S.pay },
}

/** demo only: what a successful payment would do through the webhook */
export function demoPaid(plan: PlanId, step: 'build' | 'monthly' | 'community') {
  const p = PLANS[plan]
  if (step === 'build') {
    S.sub = { plan, status: 'building', community: S.sub?.community ?? false, periodEnd: null, portalUrl: null }
    S.invoices.push({ id: uid(), label: `${p.name} build`, amount: p.setup, status: 'paid', url: null, at: now() })
    if (!S.reqs.length) seed(plan)
  } else if (step === 'monthly') {
    S.sub = { plan, status: 'active', community: S.sub?.community ?? false, periodEnd: new Date(Date.now() + 30 * 864e5).toISOString(), portalUrl: null }
    S.invoices.push({ id: uid(), label: `${p.name} monthly`, amount: p.monthly, status: 'paid', url: null, at: now() })
  } else if (S.sub) {
    S.sub.community = true
    S.invoices.push({ id: uid(), label: 'Community management', amount: 1000, status: 'paid', url: null, at: now() })
  }
  promote(); save()
}
/** demo only: see the studio side (all clients' requests, move them through the board) */
export function demoToggleAdmin() { if (S.user) { S.user.role = S.user.role === 'admin' ? 'client' : 'admin'; save() } }

const demoSub = (): RuleSub | null => S.sub ? { plan_id: S.sub.plan, status: S.sub.status, addon_community: S.sub.community, current_period_end: S.sub.periodEnd, provider: null, provider_subscription_id: null } : null
function demoApply(c: PlanChange, paid: boolean) {
  if (!S.sub || (c.status !== 'awaiting_payment' && c.status !== 'scheduled')) return
  c.status = 'applied'; c.closedAt = now()
  demoNotice('billing', c.to, c.kind, c.closedAt)
  if (c.kind === 'upgrade' || c.kind === 'downgrade') S.sub.plan = c.to
  else if (c.kind === 'community_on') S.sub.community = true
  else if (c.kind === 'community_off') S.sub.community = false
  else if (c.kind === 'pause') S.sub.status = 'paused'
  else if (c.kind === 'cancel') S.sub.status = 'cancelled'
  else if (c.kind === 'resume') { S.sub.status = 'active'; S.sub.periodEnd = new Date(Date.now() + 30 * 864e5).toISOString() }
  if (c.amount > 0) c.resolution = paid ? 'paid' : 'waived'
  if (paid && c.amount > 0) c.invoiceId = uid()
  if (paid && c.amount > 0) S.invoices.push({ id: c.invoiceId!, label: c.kind === 'upgrade' ? `Upgrade ${PLANS[c.from].name} → ${PLANS[c.to].name}` : c.kind === 'community_on' ? 'Community management' : `${PLANS[c.to].name} monthly`, amount: c.amount, status: 'paid', url: null, at: now() })
  promote()
}
function applyDemoDue() { for (const c of S.changes ?? []) if (c.status === 'scheduled' && c.effectiveAt && new Date(c.effectiveAt).getTime() <= Date.now()) demoApply(c, false) }
/** demo only: what a paid change checkout would do through the webhook */
export function demoPaidChange(id: string) { const c = (S.changes ?? []).find((x) => x.id === id); if (c) { demoApply(c, true); save() } }
