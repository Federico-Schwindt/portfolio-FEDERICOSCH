// Flight check: scrolls the whole page in small steps and reports sudden jumps of the glasses.
import { chromium } from 'playwright-core'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:4330/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1800)
const total = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight)
const STEP = 50, rows = []
let prev = null
for (let y = 0; y <= total; y += STEP) {
  await p.evaluate((y) => window.scrollTo(0, y), y)
  await p.waitForTimeout(70)
  const g = await p.evaluate(() => { const c = window.__key; return { x: c.x, y: c.y, w: c.w, rx: c.rx, ry: c.ry, rz: c.rz, on: document.documentElement.classList.contains('key-on'), sec: [...document.querySelectorAll('main > section, main > div')].find((s) => { const r = s.getBoundingClientRect(); return r.top <= 450 && r.bottom > 450 })?.className.split(' ')[0] } })
  if (prev && !g.on && !prev.on) {
    const d = Math.hypot(g.x - prev.x, g.y - prev.y), dr = Math.max(Math.abs(g.rx - prev.rx), Math.abs(g.ry - prev.ry), Math.abs(g.rz - prev.rz)), dw = Math.abs(g.w - prev.w) / Math.max(g.w, 1)
    rows.push({ y, sec: g.sec, d: Math.round(d), dr: +dr.toFixed(2), dw: +dw.toFixed(2), x: Math.round(g.x), gy: Math.round(g.y), w: Math.round(g.w) })
  }
  prev = g
}
const bad = rows.filter((r) => r.d > 170 || r.dr > 0.9 || r.dw > 0.3)
console.log('steps', rows.length, 'total', total, 'jumps', bad.length)
console.log(bad.slice(0, 30).map((r) => JSON.stringify(r)).join('\n'))
const off = rows.filter((r) => r.x < -50 || r.x > 1490 || r.gy < -80 || r.gy > 980)
console.log('offscreen steps', off.length, off.slice(0, 6).map((r) => `${r.y}:${r.sec}`).join(' '))
await b.close()
