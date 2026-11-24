// Visual check: scrolls a page in real Chrome and saves viewport screenshots.
// usage: node scripts/shots.mjs <path> <name> [width] [height] [selectors,comma,separated]
import { chromium } from 'playwright-core'
import sharp from 'sharp'
import fs from 'node:fs'
const [rawPath = 'home', name = 'home', W = '1440', H = '900', sels = ''] = process.argv.slice(2)
const out = process.env.SHOTS_DIR || 'scripts/.shots'
fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: +W, height: +H } })
const errs = []
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
p.on('pageerror', (e) => errs.push(String(e)))
const path = rawPath === 'home' ? '/' : `/${rawPath}/`
await p.goto('http://localhost:4330' + path, { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
const shots = []
const snap = async () => shots.push(await p.screenshot({ type: 'jpeg', quality: 70 }))
if (sels) {
  for (const s of sels.split(',')) {
    const [sel, off = '0'] = s.split('@')
    await p.evaluate(([sel, off]) => { const e = document.querySelector(sel); if (e) window.scrollTo(0, scrollY + e.getBoundingClientRect().top + +off) }, [sel, off])
    await p.waitForTimeout(1900); await snap()
  }
} else {
  const total = await p.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < total; y += +H) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(1700); await snap() }
}
const cols = +W > 700 ? 3 : 6, tw = +W > 700 ? 640 : 300, th = Math.round((tw * +H) / +W)
for (let s = 0; s * cols * 2 < shots.length; s++) {
  const part = shots.slice(s * cols * 2, (s + 1) * cols * 2)
  const comp = await Promise.all(part.map(async (buf, k) => ({ input: await sharp(buf).resize(tw, th).toBuffer(), left: (k % cols) * (tw + 6), top: Math.floor(k / cols) * (th + 6) })))
  await sharp({ create: { width: cols * (tw + 6), height: Math.ceil(part.length / cols) * (th + 6), channels: 3, background: '#ff00aa' } }).composite(comp).jpeg({ quality: 78 }).toFile(`${out}/${name}-${s}.jpg`)
}
console.log(shots.length, 'shots', errs.length ? 'ERRORS: ' + errs.join(' | ') : 'no console errors')
await b.close()
