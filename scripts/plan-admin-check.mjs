// Exercise studio decisions through the real UI. Seed the priced quotes so a configured
// provider never receives a checkout request from this test.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { chromium } from 'playwright-core'

if (!process.env.DATABASE_URL) process.loadEnvFile()
const db = neon(process.env.DATABASE_URL)
const origin = 'http://localhost:' + Number(process.argv[2] || 4330)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const run = randomUUID()
const created = []
const headers = { origin, 'x-studio': '1' }
let checks = 0
function check(label, condition) { assert.ok(condition, label); console.log('ok', ++checks, label) }
async function account(label) {
  const ctx = await browser.newContext({ baseURL: origin })
  const email = `plan-admin-${label}-${run}@example.com`
  const response = await ctx.request.post('/api/auth/signup/', { headers, data: { email, name: label, password: randomUUID() } })
  assert.equal(response.status(), 200, 'fixture signup')
  created.push(email)
  const [{ id }] = await db`select id from studio.users where email=${email}`
  return { ctx, id, email }
}
async function json(response) { assert.ok(response.ok(), 'HTTP ' + response.status()); return response.json() }
try {
  // Loading the studio also processes due plan changes and recurring requests across accounts.
  const [due] = await db`select
    exists(select 1 from studio.plan_changes where status='scheduled' and effective_at <= now() + interval '10 minutes')
    or exists(select 1 from studio.recurring where active and next_at <= now() + interval '10 minutes') as pending`
  assert.equal(due.pending, false, 'use an isolated database while other accounts have scheduled work coming due')
  const admin = await account('studio'), owner = await account('owner'), second = await account('second')
  await db`update studio.users set role='admin' where id=${admin.id}`
  await db`insert into studio.subscriptions (user_id,plan_id,status,current_period_end)
    values (${owner.id},'launch','active',now() + interval '15 days'), (${second.id},'grow','active',now() + interval '15 days')`
  await db`insert into studio.requests (user_id,title) values (${second.id},'Work already in progress')`
  const requestQuote = async (kind, to) => json(await owner.ctx.request.post('/api/plan/quote/', { headers, data: { kind, to } }))
  const seed = async (q) => {
    const [change] = await db`insert into studio.plan_changes (user_id,created_by,kind,from_plan,to_plan,amount_cents,status,quote)
      values (${owner.id},${owner.id},${q.kind},${q.from},${q.to},${Math.round(q.dueNow * 100)},'awaiting_payment',${JSON.stringify(q)}) returning id`
    return change.id
  }
  const upgradeQuote = await requestQuote('upgrade', 'grow')
  const upgrade = await seed(upgradeQuote), addon = await seed(await requestQuote('community_on'))
  const schedule = async (acct, kind) => (await json(await acct.ctx.request.post('/api/plan/changes/', { headers, data: { kind } }))).change
  const pause = await schedule(owner, 'pause'), otherPause = await schedule(second, 'pause')
  const [old] = await db`insert into studio.plan_changes (user_id,kind,from_plan,to_plan,status,created_at,closed_at)
    values (${owner.id},'pause','launch','launch','cancelled',now()-interval '40 days',now()-interval '31 days') returning id`
  const [recent] = await db`insert into studio.plan_changes (user_id,kind,from_plan,to_plan,amount_cents,status,created_at,closed_at)
    values (${owner.id},'upgrade','launch','grow',62075,'cancelled',now()-interval '40 days',now()-interval '1 day') returning id`
  const scope = '?client=' + owner.id
  const scopedPath = '/api/studio/changes/' + scope
  const anonymous = await browser.newContext({ baseURL: origin })
  check('queue and counts require studio access', (await anonymous.request.get(scopedPath)).status() === 401 &&
    (await owner.ctx.request.get(scopedPath)).status() === 403 && (await owner.ctx.request.get('/api/studio/changes/count/')).status() === 403)
  check('client cannot approve their own payment', (await owner.ctx.request.post('/api/admin/changes/' + upgrade + '/paid/', { headers })).status() === 403)
  const rows = await json(await admin.ctx.request.get(scopedPath))
  check('account queue excludes other owners and closed changes older than 30 days',
    rows.length === 4 && !rows.some(c => c.id === otherPause.id || c.id === old.id))
  check('history uses closing date and preserves quoted cents', rows.find(c => c.id === recent.id)?.amount === 620.75)
  const counts = async () => json(await admin.ctx.request.get('/api/studio/changes/count/' + scope))
  assert.deepEqual(await counts(), { waiting: 2, scheduled: 1 })
  const page = await admin.ctx.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', e => errors.push(e.name))
  await page.goto('/es/app/#/admin')
  await page.locator('.adm__filter select').selectOption(owner.id)
  const counter = page.locator('.ops__change-count')
  await counter.getByText('3', { exact: true }).waitFor()
  await counter.getByRole('link').click()
  const change = id => page.locator('[data-change="' + id + '"]')
  const waiting = page.locator('[data-group="waiting"]'), history = page.locator('[data-group="history"]')
  await waiting.locator('[data-change]').first().waitFor()
  check('priorities open the correct account with waiting payments first', page.url().endsWith('/changes/' + owner.id) &&
    await page.locator('.ops__change-group').first().getAttribute('data-group') === 'waiting')
  check('scheduled change shows its date and has no early payment action',
    await change(pause.id).locator('time').last().getAttribute('datetime') === pause.effectiveAt && await change(pause.id).getByRole('button', { name: 'Confirmar pago' }).count() === 0)
  async function decide(id, button, accept) {
    const dialog = page.waitForEvent('dialog').then(async d => {
      const namesAccount = d.message().includes(owner.email)
      if (accept) await d.accept(); else await d.dismiss()
      assert.ok(namesAccount, 'confirmation identifies the account')
    })
    await Promise.all([dialog, change(id).getByRole('button', { name: button, exact: true }).click()])
    if (accept) await history.locator('[data-change="' + id + '"]').waitFor()
  }
  await decide(upgrade, 'Confirmar pago', false)
  check('dismissing the confirmation preserves payment and plan', (await counts()).waiting === 2 &&
    (await db`select plan_id from studio.subscriptions where user_id=${owner.id}`)[0].plan_id === 'launch')
  await decide(upgrade, 'Confirmar pago', true)
  check('settling a closed change again is refused', (await admin.ctx.request.post('/api/admin/changes/' + upgrade + '/paid/', { headers })).status() === 409)
  await decide(addon, 'Aplicar sin cobrar', true)
  await page.route('**/api/admin/changes/' + pause.id + '/', async route => {
    assert.ok((await route.fetch()).ok())
    await route.fulfill({ status: 503, body: '{}' })
  }, { times: 1 })
  await decide(pause.id, 'Rechazar', true)
  check('lost acknowledgement reloads the closed decision', await history.locator('[data-change="' + pause.id + '"]').isVisible() &&
    await page.locator('.ops__changes [role=alert]').isVisible())
  const [sub] = await db`select plan_id,status,addon_community from studio.subscriptions where user_id=${owner.id}`
  const invoices = await db`select id, amount_cents from studio.invoices where user_id=${owner.id}`
  check('paid upgrade and waived community apply, rejected pause leaves account active', sub.plan_id === 'grow' && sub.status === 'active' && sub.addon_community)
  check('only the confirmed transfer creates an invoice for the original quote', invoices.length === 1 && invoices[0].amount_cents === Math.round(upgradeQuote.dueNow * 100))
  check('all three decisions leave the open counts', Object.values(await counts()).every(n => n === 0))
  const decisions = await json(await admin.ctx.request.get(scopedPath))
  const paid = decisions.find(c => c.id === upgrade)
  check('only a paid decision links its exact invoice', paid.resolution === 'paid' && paid.invoiceId === invoices[0].id &&
    decisions.find(c => c.id === addon).resolution === 'waived' && decisions.find(c => c.id === pause.id).resolution === 'rejected' &&
    decisions.filter(c => c.invoiceId).length === 1 && decisions.find(c => c.id === recent.id).resolution === null)
  await change(upgrade).getByRole('link', { name: 'Abrir factura' }).click()
  await page.locator('.ops__finance').getByText(invoices[0].id, { exact: true }).waitFor()
  await page.getByRole('link', { name: 'Cambios de plan de la cuenta' }).click()
  await change(upgrade).getByText('Pago recibido').waitFor()
  check('internal invoice returns to the same account history', page.url().endsWith('/changes/' + owner.id))
  for (const section of ['finance', 'recurring', 'feedback']) {
    const path = '/api/studio/' + section + '/'
    check(section + ' is limited to the studio', (await anonymous.request.get(path)).status() === 401 && (await owner.ctx.request.get(path)).status() === 403)
  }
  await db`insert into studio.invoices(user_id, label, amount_cents, currency, status)
    values (${second.id}, 'Open invoice', 1299, 'EUR', 'unpaid')`
  const ledger = await json(await admin.ctx.request.get('/api/studio/finance/'))
  check('ledger includes both accounts and preserves currency, cents and status',
    ledger.some(i => i.id === paid.invoiceId && i.owner === owner.id && i.cents === invoices[0].amount_cents) &&
    ledger.some(i => i.owner === second.id && i.currency === 'EUR' && i.cents === 1299 && i.status === 'unpaid'))
  await page.getByRole('tab', { name: 'Finanzas' }).click()
  const finance = page.locator('.ops__finance')
  const filter = finance.getByLabel('Cliente', { exact: true })
  await filter.selectOption(second.id)
  await finance.getByRole('link', { name: 'Open invoice' }).waitFor()
  check('unpaid invoice contributes zero to its account total', /0,00/.test(await finance.locator('.ops__collected strong').innerText()) &&
    await finance.locator('.ops__entry').count() === 1)
  await filter.selectOption(owner.id)
  check('account filter shows only the transfer', await finance.locator('a[href$="' + paid.invoiceId + '"]').isVisible() &&
    await finance.getByRole('link', { name: 'Open invoice' }).count() === 0)
  await db`insert into studio.recurring(user_id,title,every,next_at,active) values
    (${owner.id}, 'Next newsletter', 'week', now() + interval '8 days', true),
    (${owner.id}, 'Stopped newsletter', 'month', now() + interval '1 month', false)`
  const recurringRows = await json(await admin.ctx.request.get('/api/studio/recurring/'))
  check('studio sees active recurrence from the client account', recurringRows.some(r => r.owner === owner.id && r.title === 'Next newsletter') &&
    !recurringRows.some(r => r.owner === owner.id && r.title === 'Stopped newsletter'))
  await db`update studio.users set job_title='Brand lead', timezone='America/Buenos_Aires', phone='555-0100',
    notify=jsonb_set(notify,'{comments}','false') where id=${owner.id}`
  const contact = (await json(await admin.ctx.request.get('/api/studio/clients/' + owner.id + '/'))).profile
  check('client history includes profile and stored preferences', contact.jobTitle === 'Brand lead' && contact.phone === '555-0100' &&
    contact.timezone === 'America/Buenos_Aires' && contact.notify.comments === false)
  await db`insert into studio.requests(user_id,title,status,rating,rating_note,done_at) values
    (${owner.id}, 'Customer feedback', 'done', 2, 'More contrast', now()),
    (${owner.id}, 'Awaiting feedback', 'done', null, null, now()),
    (${admin.id}, 'Internal trial', 'done', 5, null, now())`
  const feedback = await json(await admin.ctx.request.get('/api/studio/feedback/'))
  check('feedback includes unrated approvals in coverage and excludes internal trials',
    feedback.filter(r => r.owner === owner.id).length === 2 && feedback.some(r => r.owner === owner.id && r.rating === 2 && r.ratingNote === 'More contrast') &&
    !feedback.some(r => r.owner === admin.id))
  await db`update studio.subscriptions set status='paused' where user_id=${second.id}`
  const metrics = await json(await admin.ctx.request.get('/api/studio/metrics/'))
  const sum = key => metrics.breakdown.reduce((n, a) => n + a[key], 0)
  const a = metrics.breakdown.find(c => c.id === owner.id), b = metrics.breakdown.find(c => c.id === second.id)
  check('account contributions reconcile with all three headline amounts', Math.abs(sum('base') + sum('addon') - metrics.mrr) < 0.00001 &&
    sum('used') === metrics.used && sum('slots') === metrics.capacity)
  check('waived community is recurring and paused work remains visible with zero slots',
    a.base === 150 && a.addon === 1000 && a.slots === 4 && b.base === 0 && b.addon === 0 && b.slots === 0 && b.used === 1)
  for (const [prefix, width, label] of [['', 1440, 'Business'], ['/es', 390, 'Negocio']]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto(prefix + '/app/#/admin/business')
    await page.locator('.ops__kpis button').first().click()
    const table = page.locator('#ops-breakdown')
    await table.getByText(owner.email).waitFor()
    check(label + ' revenue fits viewport and excludes paused account', !(await table.getByText(second.email).count()) &&
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.locator('.ops__kpis button').nth(1).click()
    await table.getByText(second.email).waitFor()
    await table.locator('tr').filter({ hasText: owner.email }).getByRole('link').click()
    await counter.getByText('0', { exact: true }).waitFor()
    await counter.getByRole('link').click()
    await history.locator('[data-change="' + upgrade + '"]').waitFor()
    check(label + ' drilldown opens the account and its history', page.url().endsWith('/changes/' + owner.id) &&
      await history.locator('[data-change]').count() === 4 && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  }
  const demo = await browser.newContext({ baseURL: origin, viewport: { width: 390, height: 844 } })
  await demo.addInitScript(() => {
    if (localStorage.getItem('fs-demo-v1')) return
    const at = new Date().toISOString()
    const user = { id: 'demo-plan', role: 'admin', name: 'Demo', email: 'demo-plan@example.com', company: '', brand: {} }
    const sub = { plan: 'launch', status: 'active', community: false, periodEnd: null, portalUrl: null }
    const changes = [{ id: 'demo-up', kind: 'upgrade', from: 'launch', to: 'grow', amount: 635, status: 'awaiting_payment', at, closedAt: null }]
    localStorage.setItem('fs-demo-v1', JSON.stringify({ user, sub, changes, reqs: [], events: [], invoices: [], seq: 0 }))
  })
  const local = await demo.newPage()
  local.on('pageerror', e => errors.push(e.name))
  await local.goto('/app/?demo#/admin/changes/demo-plan')
  local.once('dialog', d => d.accept())
  await local.getByRole('button', { name: 'Confirm payment', exact: true }).click()
  await local.locator('[data-group=history] [data-change=demo-up]').waitFor()
  await local.reload()
  await local.locator('[data-change=demo-up]').getByText('Payment received').waitFor()
  await local.locator('[data-change=demo-up]').getByRole('link', { name: 'Open invoice' }).click()
  await local.locator('.ops__finance').getByText('Upgrade Launch → Grow', { exact: true }).waitFor()
  check('demo invoice and decision survive reload', await local.evaluate(() => {
    const { changes, invoices } = JSON.parse(localStorage.getItem('fs-demo-v1'))
    return changes[0].resolution === 'paid' && changes[0].invoiceId === invoices[0].id
  }))
  await local.getByRole('tab', { name: 'Business' }).click()
  await local.locator('.ops__kpis button').first().click()
  await local.locator('#ops-breakdown').getByText('demo-plan@example.com').waitFor()
  check('demo payment persists and updates account revenue', await local.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('fs-demo-v1'))
    return state.sub.plan === 'grow' && state.invoices.length === 1 && state.invoices[0].amount === 635
  }) && (await local.locator('#ops-breakdown tfoot td').last().innerText()).includes('150'))
  check('browser has no runtime errors', !errors.length)
} finally {
  try { await browser.close() } finally {
    if (created.length) {
      await db`delete from studio.users where email=any(${created}::text[])`
      const [remaining] = await db`select count(*)::int as n from studio.users where email=any(${created}::text[])`
      check('all accounts created by this test were removed', remaining.n === 0)
    }
  }
}
