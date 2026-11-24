import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { chromium } from 'playwright-core'

const origin = 'http://localhost:' + Number(process.argv[2] ?? 4331)
const browser = await chromium.launch({ channel: 'chrome', headless: true })

async function customerToStudio(lang) {
  const es = lang === 'es'
  const ctx = await browser.newContext({ baseURL: origin, viewport: { width: 1440, height: 900 } })
  try {
    const id = randomUUID()
    await ctx.addInitScript(id => {
      if (localStorage.getItem('fs-demo-v1')) return
      const user = { id, role: 'client', company: '', name: 'Quote check', email: 'quote@example.com', brand: {} }
      const periodEnd = new Date(Date.now() + 12 * 864e5).toISOString()
      const sub = { plan: 'launch', status: 'active', community: false, periodEnd, portalUrl: null }
      localStorage.setItem('fs-demo-v1', JSON.stringify({ user, sub, reqs: [], events: [], invoices: [], seq: 0 }))
    }, id)
    const page = await ctx.newPage()
    const path = (es ? '/es' : '') + '/app/?demo'
    await page.goto(path + '#/billing')
    await page.locator('.bl-card').filter({ has: page.getByRole('heading', { name: 'Grow' }) }).getByRole('button').click()
    await page.locator('.bl-total__go').waitFor()
    const quotedLabels = await page.locator('.bl-total li span').allTextContents()
    assert.equal(quotedLabels.length, 2)
    await page.locator('.bl-total__go').click()
    await page.locator('.bl-demo').waitFor()
    await page.locator('.bl-demo .ap-btn--ghost').click()
    await page.locator('.ap-side__foot button').filter({ hasText: /\(demo\)/ }).click()
    // The transfer reaches the studio a week later, when a fresh quote would cost less.
    await page.clock.setFixedTime(new Date(Date.now() + 7 * 864e5))
    if (es) await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(path + '#/admin/changes/' + id)
    const waiting = page.locator('[data-group=waiting] li[data-change]')
    const summary = waiting.locator('.studio-quote summary')
    await summary.waitFor()
    assert.equal(await summary.textContent(), es ? 'Desglose del pago' : 'Payment breakdown')
    await summary.focus()
    await page.keyboard.press('Enter')
    const items = waiting.locator('.studio-quote dl')
    await items.waitFor()
    assert.deepEqual((await items.locator('dt').allTextContents()).slice(0, 2), quotedLabels)
    const numbers = await items.locator('dd').allTextContents()
    const usd = new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', currencyDisplay: 'code' })
    assert.deepEqual(numbers, [600, 28, 628].map(value => usd.format(value)))
    const overflow = await page.evaluate(() => [...document.querySelectorAll('main *')].filter(el =>
      el.getBoundingClientRect().right > innerWidth + 1).map(el => el.className || el.tagName).slice(0, 12))
    assert.deepEqual(overflow, [], 'payment breakdown fits viewport')
    page.once('dialog', dialog => dialog.accept())
    await waiting.getByRole('button', { name: es ? 'Confirmar pago' : 'Confirm payment', exact: true }).click()
    const history = page.locator('[data-group=history] li[data-change] .studio-quote')
    await history.locator('summary').waitFor()
    await page.reload()
    await history.locator('summary').click()
    assert.deepEqual(await history.locator('dd').allTextContents(), numbers)
    const result = await page.evaluate(() => JSON.parse(localStorage.getItem('fs-demo-v1')))
    assert.equal(result.sub.plan, 'grow')
    assert.deepEqual(result.invoices.map(i => i.amount), [628])
    console.log(lang + ': customer quote, studio review, confirmation, invoice and history passed')

    await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('fs-demo-v1'))
      const original = data.changes[0]
      data.changes.push(
        { ...original, id: 'missing', quote: {} },
        { ...original, id: 'different', quote: { lines: [{ label: 'adjustment', amount: 10 }] } },
        { ...original, id: 'free', amount: 0 },
      )
      localStorage.setItem('fs-demo-v1', JSON.stringify(data))
    })
    await page.reload()
    const missing = page.locator('[data-change=missing] .studio-quote')
    await missing.locator('summary').click()
    assert.match(await missing.innerText(), es ? /no está disponible/ : /unavailable/)
    const different = page.locator('[data-change=different] .studio-quote')
    await different.locator('summary').click()
    assert.match(await different.locator('dt').first().innerText(), es ? /Otro cargo/ : /Other quoted charge/)
    assert.match(await different.locator('p').innerText(), es ? /acuerdo original/ : /original agreement/)
    assert.equal(await page.locator('[data-change=free] .studio-quote').count(), 0)
    console.log(lang + ': historical quotes with missing, inconsistent and zero charges passed')
  } finally { await ctx.close() }
}

// A fixture with a partial-dollar item distinguishes the stored quote from a recomputed one.
async function storedQuote() {
  if (!process.env.DATABASE_URL) process.loadEnvFile()
  const db = neon(process.env.DATABASE_URL)
  const created = []
  const headers = { origin, 'x-studio': '1' }
  async function account(role) {
    const ctx = await browser.newContext({ baseURL: origin })
    const email = 'quote-' + randomUUID() + '@example.com'
    const signup = await ctx.request.post('/api/auth/signup/', { headers, data: { email, password: randomUUID(), name: 'Quote check' } })
    assert.equal(signup.status(), 200)
    created.push(email)
    const [user] = await db`update studio.users set role = ${role} where email = ${email} returning id`
    return { id: user.id, ctx }
  }
  try {
    const admin = await account('admin'), owner = await account('client')
    const quote = { kind: 'upgrade', from: 'launch', to: 'grow', dueNow: 628.25,
      lines: [{ label: 'build:launch:grow', amount: 600 }, { label: 'prorate:12', amount: 28.25 }] }
    await db`insert into studio.plan_changes (user_id,kind,from_plan,to_plan,amount_cents,status,quote,created_at)
      values (${owner.id}, 'upgrade','launch','grow',62825,'awaiting_payment',${JSON.stringify(quote)},now() - interval '20 days')`
    const path = '/api/studio/changes/?client=' + owner.id
    assert.equal((await owner.ctx.request.get(path)).status(), 403)
    const response = await admin.ctx.request.get(path)
    assert.equal(response.status(), 200)
    const rows = await response.json()
    assert.equal(rows.length, 1)
    assert.equal(rows[0].amount, quote.dueNow)
    assert.deepEqual(rows[0].quote.lines, quote.lines)
    console.log('Neon: stored quote and access checks passed')
  } finally {
    if (created.length) {
      await db`delete from studio.users where email = any(${created}::text[])`
      const [row] = await db`select count(*)::int as remaining from studio.users where email = any(${created}::text[])`
      assert.equal(row.remaining, 0)
      console.log('Neon: fixture accounts remaining = 0')
    }
  }
}

try {
  await customerToStudio('en')
  await customerToStudio('es')
  await storedQuote()
} finally { await browser.close() }
