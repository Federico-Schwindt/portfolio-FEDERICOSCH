import { chromium } from 'playwright-core'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []; p.on('pageerror', (e) => errs.push(String(e)))
await p.goto('http://localhost:4330/?pre', { waitUntil: 'commit' })
const T = [500, 1300, 1900, 2500, 2950, 3250, 4200]
let last = 0, n = 0
for (const t of T) { await p.waitForTimeout(t - last); last = t; await p.screenshot({ path: `scripts/.shots/pre-${n++}.jpg`, quality: 55, type: 'jpeg' }) }
console.log('errs', errs)
await b.close()
