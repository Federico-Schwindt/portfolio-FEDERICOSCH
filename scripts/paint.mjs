import { chromium } from 'playwright-core'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errs = []; p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push(String(e)))
await p.goto('http://localhost:4330/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
const stroke = async () => { await p.mouse.move(200, 650); for (let i = 0; i <= 40; i++) { await p.mouse.move(200 + i * 26, 650 - Math.sin(i / 6) * 260 - i * 6); await p.waitForTimeout(16) } }
await stroke(); await p.waitForTimeout(120)
await p.screenshot({ path: 'scripts/.shots/paint-hero.jpg', type: 'jpeg', quality: 72 })
await p.evaluate(() => { const e = document.querySelector('.svc'); window.scrollTo(0, scrollY + e.getBoundingClientRect().top) })
await p.waitForTimeout(1600); await stroke(); await p.waitForTimeout(120)
await p.screenshot({ path: 'scripts/.shots/paint-svc.jpg', type: 'jpeg', quality: 72 })
console.log(errs.length ? errs.join(' | ') : 'no errors')
await b.close()
