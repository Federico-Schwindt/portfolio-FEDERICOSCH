/**
 * Plan changes: the one place that decides what a change costs, when it applies and what it does.
 *
 * The rules (shown to the client before they confirm):
 * - Upgrade: applies as soon as it is paid. Due now = the difference between the two builds + the monthly
 *   difference for the days left in the current period. More slots start working the moment it is paid.
 * - Downgrade: free, applies at the end of the paid period. Nothing in progress stops; fewer requests start after.
 * - Community management on: due now = one month ($1,000). Off: at the end of the period.
 * - Pause: at the end of the period. The queue stops and nothing is billed until it resumes.
 * - Resume: due now = one month of the plan; the queue starts again once paid.
 * - Cancel: at the end of the period. Work in progress is finished; queued requests stay saved. Undo any time before.
 *
 * Paying: with a provider (Lemon Squeezy) the change opens a hosted checkout and the webhook applies it.
 * Without one, it waits as "awaiting payment" and the studio confirms the transfer in Studio → Plan changes.
 * Scheduled changes apply the first time anyone loads the dashboard after their date.
 */
import { sql } from './db'
import { payConfig } from './payments'

import { KINDS, PRICES, quote, type ChangeKind, type PlanId, type Quote, type Sub } from '../lib/plan-rules'
export { KINDS, PRICES, quote }
export type { ChangeKind, PlanId, Quote }

/** the groups that replace each other: a new plan change replaces an older open one */
const group = (k: ChangeKind) => (k === 'upgrade' || k === 'downgrade' ? 'plan' : k.startsWith('community') ? 'community' : 'state')

export async function openChange(userId: string, by: string, kind: ChangeKind, to?: PlanId) {
  const db = sql()
  const [s] = (await db`select * from studio.subscriptions where user_id = ${userId}`) as Sub[]
  const q = quote(s ?? null, kind, to)
  const same = KINDS.filter((k) => group(k) === group(kind))
  await db`update studio.plan_changes set status = 'cancelled', closed_at = now() where user_id = ${userId} and status in ('awaiting_payment', 'scheduled') and kind = any(${same}::text[])`
  const status = q.when === 'now' ? 'applied' : q.when === 'on_payment' ? 'awaiting_payment' : 'scheduled'
  const [c] = await db`insert into studio.plan_changes (user_id, kind, from_plan, to_plan, amount_cents, status, effective_at, created_by, quote)
    values (${userId}, ${kind}, ${q.from}, ${q.to}, ${q.dueNow * 100}, ${status === 'applied' ? 'awaiting_payment' : status}, ${q.effectiveAt}, ${by}, ${JSON.stringify(q)}) returning *`
  if (status === 'applied') await applyChange(c.id, by, false)
  return { change: c, quote: q }
}

/** does what the change says, once; `paid` adds the invoice */
export async function applyChange(id: string, by: string | null, paid: boolean, receipt: string | null = null) {
  // one statement: the change closes, the subscription moves and the invoice is written together, or none of them
  const rows = await sql()`
    with c as (
      update studio.plan_changes set status = 'applied', closed_at = now(), applied_by = ${by},
        resolution = case when amount_cents > 0 then case when ${paid} then 'paid' else 'waived' end end,
        invoice_id = case when ${paid} and amount_cents > 0 then gen_random_uuid() end
      where id = ${id} and status in ('awaiting_payment', 'scheduled') returning *
    ), s as (
      update studio.subscriptions s set
        plan_id = case when c.kind in ('upgrade', 'downgrade') then c.to_plan else s.plan_id end,
        addon_community = case c.kind when 'community_on' then true when 'community_off' then false else s.addon_community end,
        status = case c.kind when 'pause' then 'paused' when 'cancel' then 'cancelled' when 'resume' then 'active' else s.status end,
        current_period_end = case when c.kind = 'resume' then now() + interval '1 month' else s.current_period_end end,
        updated_at = now()
      from c where s.user_id = c.user_id returning s.id
    ), i as (
      insert into studio.invoices (id, user_id, label, amount_cents, url)
      select c.invoice_id, c.user_id,
        case c.kind when 'upgrade' then 'Upgrade ' || initcap(c.from_plan) || ' → ' || initcap(c.to_plan)
                    when 'community_on' then 'Community management'
                    when 'resume' then initcap(c.to_plan) || ' monthly (resumed)' else 'Plan change' end,
        c.amount_cents, ${receipt}
      from c where c.invoice_id is not null returning id
    )
    select c.id from c`
  return rows.length > 0
}

/** scheduled changes whose date has passed: apply them (cheap; runs when a dashboard loads) */
export async function applyDue(userId?: string) {
  const db = sql()
  const due = userId
    ? await db`select id from studio.plan_changes where status = 'scheduled' and effective_at <= now() and user_id = ${userId}`
    : await db`select id from studio.plan_changes where status = 'scheduled' and effective_at <= now() limit 200`
  for (const d of due) await applyChange(d.id, null, false)
}

export async function cancelChange(id: string, userId: string | null) {
  const db = sql()
  const rows = userId
    ? await db`update studio.plan_changes set status = 'cancelled', closed_at = now() where id = ${id} and user_id = ${userId} and status in ('awaiting_payment', 'scheduled') returning id`
    : await db`update studio.plan_changes set status = 'cancelled', resolution = 'rejected', closed_at = now() where id = ${id} and status in ('awaiting_payment', 'scheduled') returning id`
  return rows.length > 0
}

/** a hosted checkout for the amount due, when a provider is set up; null means the studio confirms by hand */
export async function changeCheckout(c: { id: string; amount_cents: number; to_plan: PlanId; kind: string }, who: { id: string; email: string; name: string }, returnUrl: string): Promise<string | null> {
  const p = await payConfig()
  if (p.provider !== 'lemonsqueezy' || !p.apiKey || !p.storeId) return null
  const variant = p.variants?.[c.kind === 'community_on' ? 'community' : c.kind === 'resume' ? `${c.to_plan}_monthly` : `${c.to_plan}_build`]
  if (!variant) return null
  const r = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: { Accept: 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json', Authorization: `Bearer ${p.apiKey}` },
    body: JSON.stringify({ data: { type: 'checkouts', attributes: {
      custom_price: c.amount_cents,
      checkout_data: { email: who.email, name: who.name, custom: { user_id: who.id, step: 'change', change_id: c.id } },
      product_options: { redirect_url: returnUrl, enabled_variants: [Number(variant)] },
      checkout_options: { button_color: '#F01111' },
    }, relationships: { store: { data: { type: 'stores', id: p.storeId } }, variant: { data: { type: 'variants', id: variant } } } } }),
  })
  if (!r.ok) throw new Error(`checkout ${r.status}`)
  return (await r.json()).data.attributes.url as string
}

export const toChange = (c: any) => ({ id: c.id, kind: c.kind, from: c.from_plan, to: c.to_plan, amount: Math.round(c.amount_cents / 100), status: c.status, effectiveAt: c.effective_at, at: c.created_at, closedAt: c.closed_at, quote: c.quote, resolution: c.resolution ?? null, invoiceId: c.invoice_id ?? null })
