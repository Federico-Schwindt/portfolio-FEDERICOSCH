// Scroll through hero -> work in steps to watch the line write the heading; plus preloader frames.
import { chromium } from 'playwright-core'
const [w, h] = [+(process.argv[2] || 1440), +(process.argv[3] || 900)]
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: w, height: h } })
const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
let n = 0
const snap = () => p.screenshot({ path: `scripts/.shots/w-${String(n++).padStart(2, '0')}.jpg`, quality: 50, type: 'jpeg' })
await p.goto('http://localhost:4330/?pre', { waitUntil: 'commit' })
let last = 0
for (const t of [600, 1500, 2200, 2700, 3100, 3400, 3700, 4500]) { await p.waitForTimeout(t - last); last = t; await snap() }
await p.waitForTimeout(1800)
const go = (y) => p.evaluate((y) => window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y), y)
const end = await p.evaluate(() => document.querySelector('[data-written]').getBoundingClientRect().top + scrollY)
for (let i = 0; i <= 6; i++) { await go(Math.round((end - h * 0.3) * i / 6)); await p.waitForTimeout(500); await snap() }
console.log('frames', n, 'errs', errs.slice(0, 3))
await b.close()
