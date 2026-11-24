// Home on a phone (390 px): no sideways scroll anywhere, the product block and the plans popup work. Needs :4330.
import { chromium } from 'playwright-core'
const b = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
let bad = 0
for (const [path, theme] of [['/', 'light'], ['/es/', 'dark']]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  await ctx.addInitScript((t) => { sessionStorage.setItem('pre', '1'); localStorage.setItem('theme', t) }, theme)
  const p = await ctx.newPage()
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(('http://localhost:' + (process.env.FS_PORT || 4330)) + path, { waitUntil: 'load' }); await p.waitForTimeout(2500)
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  for (const id of ['dashboard', 'about', 'contact']) {
    await p.evaluate((i) => document.getElementById(i).scrollIntoView(), id); await p.waitForTimeout(1200)
    await p.screenshot({ path: `scripts/.shots/hm-${theme}-${id}.jpg`, type: 'jpeg', quality: 60 })
  }
  await p.evaluate(() => document.getElementById('dashboard').scrollIntoView()); await p.locator('[data-app-tab="2"]').tap(); await p.waitForTimeout(700)
  const tabOk = await p.evaluate(() => document.querySelector('[data-app-shot="2"]').classList.contains('is-on'))
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500); await p.evaluate(() => document.querySelector('[data-hx-cta]').click()); await p.waitForSelector('#plans-dialog[open]'); await p.waitForTimeout(700)
  await p.screenshot({ path: `scripts/.shots/hm-${theme}-popup.jpg`, type: 'jpeg', quality: 60 })
  const pop = await p.evaluate(() => { const r = document.getElementById('plans-dialog').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 })
  const ok = over <= 2 && tabOk && pop && !errs.length
  if (!ok) bad++
  console.log(ok ? 'ok' : 'FAIL', path, theme, { over, tabOk, pop, errs })
  await ctx.close()
}
await b.close()
console.log(bad ? 'HOME MOBILE FAIL' : 'HOME MOBILE OK'); if (bad) process.exitCode = 1
