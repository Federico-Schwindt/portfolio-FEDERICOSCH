// Exports stills of the 3D keycap from the built site (npx astro preview --port 4330) into public/img.
import { chromium } from 'playwright-core'
import sharp from 'sharp'
const poses = {
  'key-top': { r: [90, 0, 0], size: 300, pad: 0, shadow: false, blank: true }, // tight, from above: worn by every DOM key
  key: { r: [58, 0, -20], size: 520, pad: 0.35, shadow: true },
  'key-b': { r: [48, 24, 12], size: 420, pad: 0.35, shadow: true },
}
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', (e) => console.log('pageerror', String(e)))
await p.goto('http://localhost:4330/?gexport', { waitUntil: 'networkidle' })
await p.waitForFunction(() => typeof window.__exportKey === 'function', null, { timeout: 30000 })
await p.waitForTimeout(800)
for (const [name, pose] of Object.entries(poses)) {
  const url = await p.evaluate((o) => window.__exportKey(o), pose)
  const out = await sharp(Buffer.from(url.split(',')[1], 'base64')).webp({ quality: 92, alphaQuality: 96 }).toFile(`public/img/${name}.webp`)
  console.log(name, out.width, out.height, Math.round(out.size / 1024) + ' KB')
}
await b.close()
