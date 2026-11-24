import { COMMUNITY, type PlanId, type Req, type Subscription } from './types'

export type PlanGroup = { plan: PlanId; status: Subscription['status']; clients: number; addons: number; monthly: number; slots: number }
export type Week = { start: string; delivered: number; timed: number; days: number }
export type Workload = { used: number; overdue: number }
export type RatingTotals = { approved: number; rated: number; points: number }
export type AccountRatings = RatingTotals & { id: string; name: string }

export function requestRatings(requests: Pick<Req, 'status' | 'rating'>[]): RatingTotals {
  const totals = { approved: 0, rated: 0, points: 0 }
  for (const r of requests) {
    if (r.status !== 'done') continue
    totals.approved++
    if (r.rating != null) {
      totals.rated++
      totals.points += r.rating
    }
  }
  return totals
}

export function ratingScore({ rated, points }: RatingTotals, lang: string) {
  return rated ? (points / rated).toLocaleString(lang, { maximumFractionDigits: 1 }) + ' / 5' : '—'
}

// Do calendar arithmetic on date labels so even a week containing a clock change has seven days.
export function calendarWeeks(today: string): Week[] {
  const monday = new Date(today + 'T00:00:00Z')
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7)
  return Array.from({ length: 8 }, (_, i) => ({
    start: new Date(monday.getTime() - (7 - i) * 7 * 864e5).toISOString().slice(0, 10),
    delivered: 0, timed: 0, days: 0,
  }))
}

export function studioMetrics(groups: PlanGroup[], weeks: Week[], workload: Workload, ratingAccounts: AccountRatings[]) {
  const mix = { launch: 0, grow: 0, scale: 0 }
  const clients = { active: 0, pending: 0, paused: 0 }
  let mrr = 0, capacity = 0
  for (const g of groups) {
    if (g.status === 'active') {
      mix[g.plan] += g.clients
      mrr += g.monthly * g.clients + COMMUNITY * g.addons
    }
    if (g.status === 'active' || g.status === 'building') capacity += g.slots * g.clients
    if (g.status === 'active' || g.status === 'pending' || g.status === 'paused') clients[g.status] += g.clients
  }
  const timed = weeks.reduce((sum, w) => sum + w.timed, 0)
  const avgDays = timed ? weeks.reduce((sum, w) => sum + w.days, 0) / timed : null
  // Weight each approved delivery equally even when accounts have different numbers of ratings.
  const ratings = ratingAccounts.reduce<RatingTotals>((sum, a) => ({
    approved: sum.approved + a.approved, rated: sum.rated + a.rated, points: sum.points + a.points,
  }), { approved: 0, rated: 0, points: 0 })
  return { mrr, capacity, clients, mix, weeks, avgDays, ratings, ratingAccounts, ...workload }
}
export type Metrics = ReturnType<typeof studioMetrics>
