// Scrolls through the studio scene and films the stick man's routine.
import { chromium } from 'playwright-core'
const [w, h] = [+(process.argv[2] || 1440), +(process.argv[3] || 900)]
const tag = process.argv[4] || 'st'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: w, height: h } })
const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
let n = 0
const snap = (clip) => p.screenshot({ path: `scripts/.shots/${tag}-${String(n++).padStart(2, '0')}.jpg`, quality: 60, type: 'jpeg', clip })
await p.goto('http://localhost:4330/', { waitUntil: 'load' }); await p.waitForTimeout(1500)
const top = await p.evaluate(() => { const st = window.ScrollTrigger; const el = document.querySelector('[data-st2]'); return el.getBoundingClientRect().top + scrollY })
const go = (y) => p.evaluate((y) => window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y), y)
const span = h * 1.8
for (const q of [0.05, 0.14, 0.24, 0.34, 0.44, 0.56, 0.68, 0.8]) { await go(top + span * q); await p.waitForTimeout(600); await snap() }
await go(top + span * 0.9); await p.waitForTimeout(300)
const board = await p.evaluate(() => { const r = document.querySelector('[data-sb]').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height } })
let last = 300
for (const t of [600, 1100, 1700, 2500, 2850, 3700, 4500, 5300, 6150, 6500, 6800, 7500, 7950, 9200]) { await p.waitForTimeout(t - last); last = t; await snap(board) }
// point at him
const hd = await p.evaluate(() => { const c = document.querySelector('[data-bone="head"]'); const r = c.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
await p.mouse.move(hd.x + 20, hd.y + 10, { steps: 6 }); await p.waitForTimeout(700); await snap(board)
console.log('frames', n, 'errs', errs.slice(0, 3))
await b.close()
