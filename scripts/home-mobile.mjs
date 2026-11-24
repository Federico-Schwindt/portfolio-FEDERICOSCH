// Home on a phone (390 px): no sideways scroll anywhere, the product block works and the hero button leads to the contact page. Needs :4330 (or FS_PORT).
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
  const want = path === '/es/' ? '/es/contact/' : '/contact/'
  const cta = await p.evaluate(() => new URL(document.querySelector('[data-hx-cta]').href).pathname)
  const ctaOk = cta.endsWith(want) && !(await p.evaluate(() => document.querySelector('[data-plans], #plans-dialog')))
  const ok = over <= 2 && tabOk && ctaOk && !errs.length
  if (!ok) bad++
  console.log(ok ? 'ok' : 'FAIL', path, theme, { over, tabOk, cta, ctaOk, errs })
  await ctx.close()
}
await b.close()
console.log(bad ? 'HOME MOBILE FAIL' : 'HOME MOBILE OK'); if (bad) process.exitCode = 1
