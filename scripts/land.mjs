// Landing check: scrolls through the approach in small steps and crops around the face.
import { chromium } from 'playwright-core'
import sharp from 'sharp'
const [W = '1440', H = '900'] = process.argv.slice(2)
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: +W, height: +H }, deviceScaleFactor: 2 })
const errs = []; p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push(String(e)))
await p.goto('http://localhost:4330/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1800)
const top = await p.evaluate(() => { const e = document.querySelector('.land__photo'); return e.getBoundingClientRect().top + scrollY })
const offs = [-700, -520, -400, -300, -200, 0, 250, 500]
const tiles = []
for (const o of offs) {
  await p.evaluate((y) => window.scrollTo(0, y), top + o)
  await p.waitForTimeout(900)
  const st = await p.evaluate(() => { const e = document.querySelector('.land__photo').getBoundingClientRect(); return { x: e.left, y: e.top, w: e.width, h: e.height, on: document.documentElement.classList.contains('glasses-on') } })
  const clip = { x: Math.max(0, st.x + st.w * 0.12), y: Math.max(0, Math.min(+H - 10, st.y + st.h * 0.1)), width: st.w * 0.76, height: st.h * 0.4 }
  clip.height = Math.max(10, Math.min(clip.height, +H - clip.y))
  const buf = await p.screenshot({ clip, type: 'png' })
  tiles.push({ buf, label: `${o} ${st.on ? 'LANDED' : 'flying'}` })
}
const tw = 470, th = 250
const comp = await Promise.all(tiles.map(async (t, k) => ({ input: await sharp(t.buf).resize(tw, th, { fit: 'contain', background: '#222' }).composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${tw}" height="26"><rect width="100%" height="100%" fill="#000"/><text x="6" y="19" fill="#fff" font-size="16" font-family="monospace">${t.label}</text></svg>`), left: 0, top: 0 }]).png().toBuffer(), left: (k % 4) * (tw + 4), top: Math.floor(k / 4) * (th + 4) })))
await sharp({ create: { width: 4 * (tw + 4), height: 2 * (th + 4), channels: 3, background: '#00c2ff' } }).composite(comp).jpeg({ quality: 86 }).toFile(`scripts/.shots/land-${W}.jpg`)
console.log(errs.length ? errs.join(' | ') : 'no errors')
await b.close()
