import type { Backend, Req, User } from '../types'

export type LedgerRow = {
  id: string; owner: string; name: string; email: string; at: string; label: string; currency: string
  cents: number; status: string; url: string | null
}
type Schedule = { id: string; owner: string; name: string; title: string; nextAt: string; every: 'week' | 'month' }
type Feedback = Pick<Req, 'id' | 'owner' | 'ownerName' | 'number' | 'title' | 'status' | 'rating' | 'ratingNote' | 'doneAt' | 'createdAt'>
const api = import.meta.env.BASE_URL.replace(/\/$/, '') + '/api/'
async function studioList<T>(section: string): Promise<T[]> {
  const response = await fetch(api + 'studio/' + section + '/', { cache: 'no-store' })
  if (!response.ok) throw new Error('Studio HTTP ' + response.status)
  return response.json()
}
async function demoOwner(be: Backend) {
  const user = await be.session()
  if (user?.role !== 'admin') throw new Error('Studio access required')
  return user
}
export async function loadLedger(be: Backend): Promise<LedgerRow[]> {
  if (be.mode === 'live') return studioList('finance')
  const user = await demoOwner(be)
  return (await be.invoices()).map(i => ({
    ...i, owner: user.id, name: user.company || user.name || user.email, email: user.email,
    currency: 'USD', cents: Math.round(i.amount * 100),
  })).sort((a, b) => b.at.localeCompare(a.at))
}
export async function loadSchedule(be: Backend): Promise<Schedule[]> {
  if (be.mode === 'live') return studioList('recurring')
  const user = await demoOwner(be)
  return (await be.recurring()).filter(r => r.active).map(r => ({
    ...r, owner: user.id, name: user.company || user.name || user.email,
  })).sort((a, b) => Date.parse(a.nextAt) - Date.parse(b.nextAt))
}
export async function loadFeedback(be: Backend): Promise<Feedback[]> {
  if (be.mode === 'live') return studioList('feedback')
  await demoOwner(be)
  return (await be.requests(true)).filter(r => r.status === 'done')
}
export function dateKey(day: Date) {
  return [day.getFullYear(), String(day.getMonth() + 1).padStart(2, '0'), String(day.getDate()).padStart(2, '0')].join('-')
}
export function byOwner<T extends { owner: string }>(requests: T[]) {
  const groups = new Map<string, T[]>()
  for (const r of requests) {
    const group = groups.get(r.owner)
    if (group) group.push(r)
    else groups.set(r.owner, [r])
  }
  return Array.from(groups.values())
}
export function ownerName(r: Pick<Req, 'owner' | 'ownerName' | 'ownerEmail'>, user: User | null) {
  return r.ownerName || r.ownerEmail || (r.owner === user?.id && (user.company || user.name || user.email)) || r.owner
}

