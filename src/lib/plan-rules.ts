/** The price and timing rules for plan changes, shared by the server and the in-browser demo. See src/server/plans.ts. */
export type PlanId = 'launch' | 'grow' | 'scale'
export type ChangeKind = 'upgrade' | 'downgrade' | 'community_on' | 'community_off' | 'pause' | 'resume' | 'cancel'
export const KINDS: ChangeKind[] = ['upgrade', 'downgrade', 'community_on', 'community_off', 'pause', 'resume', 'cancel']
export const PRICES: Record<PlanId, { setup: number; monthly: number; slots: number }> = {
  launch: { setup: 600, monthly: 80, slots: 2 }, grow: { setup: 1200, monthly: 150, slots: 4 }, scale: { setup: 3000, monthly: 250, slots: 6 },
}
const ORDER: PlanId[] = ['launch', 'grow', 'scale']
export const COMMUNITY = 1000

export type Sub = { plan_id: PlanId; status: string; addon_community: boolean; current_period_end: string | null; provider: string | null; provider_subscription_id: string | null }
export type Quote = { kind: ChangeKind; from: PlanId; to: PlanId; dueNow: number; lines: { label: string; amount: number }[]; when: 'now' | 'on_payment' | 'period_end'; effectiveAt: string | null; slotsFrom: number; slotsTo: number }

/** end of the paid period: the subscription's renewal date, or the 1st of next month when billed by hand */
const periodEnd = (s: Sub) => {
  if (s.current_period_end && new Date(s.current_period_end).getTime() > Date.now()) return new Date(s.current_period_end)
  const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
}
const daysLeft = (s: Sub) => Math.max(0, Math.min(31, Math.ceil((periodEnd(s).getTime() - Date.now()) / 864e5)))

/** what a change would cost and when it would apply; throws a readable message when it is not possible */
export function quote(s: Sub | null, kind: ChangeKind, to?: PlanId): Quote {
  if (!s) throw new Error('Pick a plan first.')
  const from = s.plan_id, live = s.status === 'active' || s.status === 'building'
  const base = { kind, from, to: from, slotsFrom: PRICES[from].slots, slotsTo: PRICES[from].slots }
  if (kind === 'upgrade' || kind === 'downgrade') {
    if (!to || !ORDER.includes(to) || to === from) throw new Error('Choose a different plan.')
    if (!live && s.status !== 'pending') throw new Error('Resume the plan before changing it.')
    const up = ORDER.indexOf(to) > ORDER.indexOf(from)
    if ((kind === 'upgrade') !== up) throw new Error(up ? 'That is an upgrade.' : 'That is a downgrade.')
    const q = { ...base, to, slotsTo: PRICES[to].slots }
    if (s.status === 'pending') return { ...q, dueNow: 0, lines: [], when: 'now', effectiveAt: null } // nothing paid yet: just switch the reservation
    if (!up) return { ...q, dueNow: 0, lines: [], when: 'period_end', effectiveAt: periodEnd(s).toISOString() }
    const build = PRICES[to].setup - PRICES[from].setup
    const monthly = s.status === 'active' ? Math.round(((PRICES[to].monthly - PRICES[from].monthly) * daysLeft(s)) / 30) : 0
    const lines = [{ label: `build:${from}:${to}`, amount: build }, ...(monthly ? [{ label: `prorate:${daysLeft(s)}`, amount: monthly }] : [])]
    return { ...q, dueNow: build + monthly, lines, when: 'on_payment', effectiveAt: null }
  }
  if (kind === 'community_on') {
    if (s.addon_community) throw new Error('Community management is already on.')
    if (!live) throw new Error('Community management needs a running plan.')
    return { ...base, dueNow: COMMUNITY, lines: [{ label: 'community', amount: COMMUNITY }], when: 'on_payment', effectiveAt: null }
  }
  if (kind === 'community_off') {
    if (!s.addon_community) throw new Error('Community management is off.')
    return { ...base, dueNow: 0, lines: [], when: 'period_end', effectiveAt: periodEnd(s).toISOString() }
  }
  if (kind === 'pause') {
    if (s.status !== 'active') throw new Error('Only a running monthly plan can be paused.')
    return { ...base, dueNow: 0, lines: [], when: 'period_end', effectiveAt: periodEnd(s).toISOString(), slotsTo: 0 }
  }
  if (kind === 'resume') {
    if (s.status !== 'paused' && s.status !== 'cancelled') throw new Error('The plan is not paused.')
    return { ...base, dueNow: PRICES[from].monthly + (s.addon_community ? COMMUNITY : 0), lines: [{ label: `monthly:${from}`, amount: PRICES[from].monthly }, ...(s.addon_community ? [{ label: 'community', amount: COMMUNITY }] : [])], when: 'on_payment', effectiveAt: null, slotsFrom: 0 }
  }
  if (kind === 'cancel') {
    if (!live) throw new Error('There is nothing running to cancel.')
    return { ...base, dueNow: 0, lines: [], when: 'period_end', effectiveAt: periodEnd(s).toISOString(), slotsTo: 0 }
  }
  throw new Error('Unknown change.')
}

