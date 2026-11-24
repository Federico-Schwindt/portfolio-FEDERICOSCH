/**
 * Payments, configured from the studio view (Admin → Payments) and stored in studio.settings.
 * Until a provider is set up, a checkout records the plan as "pending" and the studio activates it by hand
 * (for a bank transfer, for example). Lemon Squeezy is the first provider; another one is one more `case`.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { sql } from './db'

export type PayConfig = {
  provider: 'none' | 'lemonsqueezy'
  apiKey?: string; storeId?: string; webhookSecret?: string
  variants?: Partial<Record<'launch_build' | 'launch_monthly' | 'grow_build' | 'grow_monthly' | 'scale_build' | 'scale_monthly' | 'community', string>>
}
export type Step = 'build' | 'monthly' | 'community'
export type PlanId = 'launch' | 'grow' | 'scale'

export async function payConfig(): Promise<PayConfig> {
  const rows = await sql()`select value from studio.settings where key = 'payments'`
  return (rows[0]?.value as PayConfig) ?? { provider: 'none' }
}
/** what the admin screen may show: everything except the secrets, which come back masked */
export const masked = (c: PayConfig) => ({
  provider: c.provider, storeId: c.storeId ?? '', variants: c.variants ?? {},
  apiKey: c.apiKey ? `••••${c.apiKey.slice(-4)}` : '', webhookSecret: c.webhookSecret ? `••••${c.webhookSecret.slice(-4)}` : '',
})
export async function savePayConfig(next: PayConfig) {
  const cur = await payConfig()
  // a masked value sent back unchanged keeps the stored secret
  const keep = (v: string | undefined, old: string | undefined) => (v && !v.startsWith('••••') ? v : old)
  const merged: PayConfig = { provider: next.provider, storeId: next.storeId, variants: next.variants, apiKey: keep(next.apiKey, cur.apiKey), webhookSecret: keep(next.webhookSecret, cur.webhookSecret) }
  await sql()`insert into studio.settings (key, value, updated_at) values ('payments', ${JSON.stringify(merged)}, now()) on conflict (key) do update set value = excluded.value, updated_at = now()`
}

/** a hosted checkout URL, or null when no provider is configured (the studio will activate by hand) */
export async function createCheckout(o: { plan: PlanId; step: Step; userId: string; email: string; name: string; returnUrl: string }): Promise<string | null> {
  const c = await payConfig()
  if (c.provider !== 'lemonsqueezy' || !c.apiKey || !c.storeId) return null
  const variant = c.variants?.[o.step === 'community' ? 'community' : (`${o.plan}_${o.step}` as keyof NonNullable<PayConfig['variants']>)]
  if (!variant) return null
  const r = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: { Accept: 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json', Authorization: `Bearer ${c.apiKey}` },
    body: JSON.stringify({ data: { type: 'checkouts', attributes: {
      checkout_data: { email: o.email, name: o.name, custom: { user_id: o.userId, plan: o.plan, step: o.step } },
      product_options: { redirect_url: o.returnUrl, enabled_variants: [Number(variant)] },
      checkout_options: { button_color: '#F01111' },
    }, relationships: { store: { data: { type: 'stores', id: c.storeId } }, variant: { data: { type: 'variants', id: variant } } } } }),
  })
  if (!r.ok) throw new Error(`checkout ${r.status}`)
  return (await r.json()).data.attributes.url as string
}

export async function verifyWebhook(raw: string, signature: string | null) {
  const c = await payConfig()
  if (!c.webhookSecret || !signature) return false
  const mac = createHmac('sha256', c.webhookSecret).update(raw).digest('hex')
  return mac.length === signature.length && timingSafeEqual(Buffer.from(mac), Buffer.from(signature))
}
