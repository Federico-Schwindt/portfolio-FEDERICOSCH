// Conversion path check: from the home, a visitor must reach a price and a contextual form in 3 interactions or fewer.
// Scrolling is not counted; every click or tap is.
import { chromium } from 'playwright-core'
const base = 'http://localhost:4330'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const out = []
for (const [w, h] of [[1440, 900], [390, 844]]) {
  // Path A: pricing ticket on the home -> contact form with the plan preselected
  {
    const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: w < 500 })
    await p.goto(base + '/', { waitUntil: 'load' }); await p.waitForTimeout(1500)
    let clicks = 0
    const price = await p.locator('.pk__price b').first().textContent()
    const choose = p.locator('.pc a[href*="/checkout/?plan="]').first()
    await choose.scrollIntoViewIfNeeded(); await p.waitForTimeout(900)
    await choose.click(); clicks++
    await p.waitForURL(/checkout/); await p.waitForTimeout(1500)
    const sel = await p.locator('.co2__plan.is-on .co2__pn b').textContent().catch(() => null)
    const form = await p.locator('.co2__acct input[type=email]').isVisible().catch(() => false)
    out.push({ vp: `${w}x${h}`, path: 'home > plan ticket > checkout', clicks, price: price?.trim(), preselected: sel, formVisible: form, ok: clicks <= 3 && !!price && form && sel === 'Launch' })
    await p.close()
  }
  // Path B: work card -> case study -> contact form that names the case
  {
    const p = await b.newPage({ viewport: { width: w, height: h }, hasTouch: w < 500 })
    await p.goto(base + '/', { waitUntil: 'load' }); await p.waitForTimeout(1500)
    let clicks = 0
    const card = p.locator('.wk2__big')
    await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(900)
    await card.click({ position: { x: 40, y: 40 } }); clicks++
    await p.waitForURL(/work\//); await p.waitForTimeout(600)
    const price = await p.locator('.cs-offer dd').last().textContent().catch(() => null)
    await p.locator('.cs-cta .btn').click(); clicks++
    await p.waitForURL(/contact/); await p.waitForTimeout(800)
    const ctx = await p.locator('.form__ctx').textContent().catch(() => null)
    const form = await p.locator('form [name=email]').isVisible()
    out.push({ vp: `${w}x${h}`, path: 'home > case > form', clicks, price: price?.trim(), context: ctx, formVisible: form, ok: clicks <= 3 && !!price && form && !!ctx })
    await p.close()
  }
}
await b.close()
console.table(out)
console.log(out.every((o) => o.ok) ? 'PATHS OK' : 'PATHS FAIL')
