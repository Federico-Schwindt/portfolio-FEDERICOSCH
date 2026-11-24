import { useEffect, useState } from 'react'
import { PLANS, type Backend, type FileItem, type Invoice, type Req, type User } from './types'
import { calendarWeeks, requestRatings, studioMetrics, type Metrics, type PlanGroup } from './studio-metrics'

export type Note = { id: string; body: string; author: string | null; at: string }
type HistoryFile = Pick<FileItem, 'id' | 'name' | 'size' | 'kind' | 'version' | 'at'> & { url?: string; material: boolean }
type ClientProfile = Pick<User, 'name' | 'email' | 'phone' | 'jobTitle' | 'avatar' | 'timezone' | 'lang' | 'notify' | 'company' | 'brand'>
export type History = {
  profile: ClientProfile
  requests: (Pick<Req, 'id' | 'number' | 'title' | 'status' | 'rating' | 'ratingNote'> & { at: string })[]
  files: HistoryFile[]
  invoices: (Invoice & { currency: string })[]
  notes: Note[]
  members: { id: string; name: string; email: string }[]
}
const base = import.meta.env.BASE_URL.replace(/\/$/, '')
async function call<T>(path: string, payload?: object): Promise<T> {
  const response = await fetch(base + '/api/studio/' + path, payload ? {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-studio': '1' }, body: JSON.stringify(payload),
  } : { cache: 'no-store' })
  if (!response.ok) throw new Error('Studio HTTP ' + response.status)
  return response.json()
}

async function demoAdmin(be: Backend, client?: string): Promise<User> {
  const user = await be.session()
  if (user?.role !== 'admin' || (client && client !== user.id)) throw new Error('Forbidden')
  return user
}
const demoNotes = (id: string): Note[] => JSON.parse(localStorage.getItem('fs-demo-studio-notes-' + id) ?? '[]')

export async function loadRequestBrief(be: Backend, requestId: string): Promise<Pick<User, 'company' | 'brand'> & { owner: string }> {
  if (be.mode === 'live') return call('requests/' + encodeURIComponent(requestId) + '/brief/')
  const user = await demoAdmin(be)
  const request = (await be.requests(true)).find(r => r.id === requestId && r.owner === user.id)
  if (!request) throw new Error('Request not found')
  return { owner: request.owner, company: user.company || user.name || user.email, brand: user.brand }
}

export async function loadMetrics(be: Backend): Promise<Metrics> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (be.mode === 'live') return call('metrics/?tz=' + encodeURIComponent(tz))
  await demoAdmin(be)
  const [clients, requests] = await Promise.all([be.clients(), be.requests(true)])
  const groups: PlanGroup[] = clients.flatMap(c => c.plan && c.status ? [{
    plan: c.plan, status: c.status, clients: 1, addons: Number(!!c.community), monthly: PLANS[c.plan].monthly, slots: PLANS[c.plan].slots,
  }] : [])
  const date = new Intl.DateTimeFormat('sv-SE', { timeZone: tz })
  const now = new Date(), today = date.format(now)
  const weeks = calendarWeeks(today)
  let used = 0, overdue = 0
  for (const r of requests) {
    if (r.status === 'active') used++
    if ((r.status === 'active' || r.status === 'queued') && r.dueDate && r.dueDate < today) overdue++
    if (r.status !== 'done' || !r.doneAt || new Date(r.doneAt) > now) continue
    const approved = date.format(new Date(r.doneAt))
    const week = weeks.findLast(w => w.start <= approved)
    if (!week) continue
    week.delivered++
    if (r.startedAt) {
      week.timed++
      week.days += Math.max(0, Date.parse(r.reviewAt ?? r.doneAt) - Date.parse(r.startedAt)) / 864e5
    }
  }
  const ratingAccounts = clients.map(c => ({
    id: c.id, name: c.company || c.name || c.email, ...requestRatings(requests.filter(r => r.owner === c.id)),
  })).filter(c => c.approved)
  return studioMetrics(groups, weeks, { used, overdue }, ratingAccounts)
}

export async function loadHistory(be: Backend, id: string): Promise<History> {
  if (be.mode === 'live') return call('clients/' + encodeURIComponent(id) + '/')
  const profile = await demoAdmin(be, id)
  const [visible, files, invoices, team] = await Promise.all([be.requests(true), be.files(), be.invoices(), be.team()])
  // The demo board omits cancelled requests. They still belong in the account history.
  const stored: { reqs?: Req[] } = JSON.parse(localStorage.getItem('fs-demo-v1') ?? '{}')
  const requests = visible.concat(stored.reqs?.filter(r => r.status === 'cancelled') ?? [])
  return {
    profile,
    requests: requests.filter(r => r.owner === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.number - a.number)
      .map(({ id, number, title, status, rating, ratingNote, createdAt: at }) => ({ id, number, title, status, at, rating, ratingNote })),
    files: files.filter(f => f.owner === id).map(f => ({ ...f,
      material: !f.requestId && f.byStudio === false && (f.kind === 'asset' || f.kind === 'brand'),
    })),
    invoices: invoices.map(i => ({ ...i, currency: 'USD' })),
    notes: demoNotes(id),
    members: team.members.filter(m => !m.owner),
  }
}

export async function saveNote(be: Backend, clientId: string, id: string, body: string): Promise<Note> {
  if (be.mode === 'live') return call('clients/' + encodeURIComponent(clientId) + '/notes/', { id, body })
  const user = await demoAdmin(be, clientId)
  const notes = demoNotes(clientId), saved = notes.find(n => n.id === id)
  if (saved) return saved
  const note = { id, body, author: user.name || user.email, at: new Date().toISOString() }
  localStorage.setItem('fs-demo-studio-notes-' + clientId, JSON.stringify([note, ...notes]))
  return note
}

export function fileDownload(be: Backend, file: HistoryFile) {
  return be.mode === 'demo' ? file.url : base + '/api/files/' + encodeURIComponent(file.id) + '/?dl=1'
}

export function useStudioRead<T>(read: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let current = true
    setData(null)
    setFailed(false)
    read().then(result => { if (current) setData(result) }, () => { if (current) setFailed(true) })
    return () => { current = false }
  }, [read, attempt])
  return { data, setData, failed, refresh: () => setAttempt(n => n + 1) }
}
