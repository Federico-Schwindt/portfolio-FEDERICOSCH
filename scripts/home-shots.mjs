// Home, block by block, at rest (after the arrival animation). Usage: node scripts/home-shots.mjs [path] [tag] [w] [h] [blocks,comma]
import { chromium } from 'playwright-core'
const path = (process.argv[2] || 'en') === 'es' ? '/es/' : '/', tag = process.argv[3] || 'h', w = Number(process.argv[4] || 1440), h = Number(process.argv[5] || 900)
const only = process.argv[6] ? process.argv[6].split(',').map(Number) : null
const dark = process.argv.includes('dark')
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu'] })
const ctx = await b.newContext({ viewport: { width: w, height: h } })
await ctx.addInitScript((d) => { sessionStorage.setItem('pre', '1'); if (d) localStorage.setItem('theme', 'dark') }, dark)
const p = await ctx.newPage()
const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
await p.goto(('http://localhost:' + (process.env.FS_PORT || 4330)) + path, { waitUntil: 'load' })
await p.mouse.move(60, h - 40); await p.waitForTimeout(2500)
const n = await p.evaluate(() => document.querySelectorAll('main > section').length + 1)
for (let i = 0; i < n; i++) {
  if (i > 0) { await p.mouse.move(w / 2, h / 2); await p.mouse.wheel(0, 120); await p.waitForTimeout(1500) }
  if (only && !only.includes(i)) continue
  await p.waitForTimeout(6500)
  await p.screenshot({ path: `scripts/.shots/${tag}-${i}.jpg`, type: 'jpeg', quality: 60 })
}
console.log(errs.length ? errs.slice(0, 4) : 'no errors', n, 'blocks')
await b.close()
