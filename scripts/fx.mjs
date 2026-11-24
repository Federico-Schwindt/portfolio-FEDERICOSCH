// Captures the Figma layer mid-animation: typed eyebrow, a heading selection, auto-layout gaps, a hover frame.
import { chromium } from 'playwright-core'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addInitScript(() => sessionStorage.setItem('pre', '1'))
const p = await ctx.newPage()
const errs = []; p.on('pageerror', (e) => errs.push(String(e)))
await p.goto('http://localhost:4330' + (process.argv[2] || '/'), { waitUntil: 'load' })
await p.waitForTimeout(700)
await p.screenshot({ path: 'scripts/.shots/fx-0.jpg', type: 'jpeg', quality: 60, clip: { x: 300, y: 60, width: 840, height: 200 } })
const go = async (sel, wait, name, off = 120) => {
  await p.evaluate(([s, o]) => { const el = document.querySelector(s); const y = el.getBoundingClientRect().top + scrollY - o; window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y) }, [sel, off])
  await p.waitForTimeout(wait)
  await p.screenshot({ path: `scripts/.shots/${name}.jpg`, type: 'jpeg', quality: 60 })
}
await go('#pricing h2', 1500, 'fx-1')
await go('#pricing .pk__grid', 1700, 'fx-2', 200)
await go('#services .pt__ends', 600, 'fx-3', 200)
const end = p.locator('.pt__end').nth(1); const bx = await end.boundingBox()
await p.mouse.move(bx.x + 40, bx.y + 20); await p.waitForTimeout(400)
await p.screenshot({ path: 'scripts/.shots/fx-4.jpg', type: 'jpeg', quality: 60 })
console.log(errs.length ? errs : 'no errors')
await b.close()
