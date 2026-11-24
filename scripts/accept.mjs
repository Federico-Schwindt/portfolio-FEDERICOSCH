// Acceptance checks from PLAN.md: JS per route, home length, sitemap, landing precision.
import { chromium } from 'playwright-core'
import zlib from 'node:zlib'
const base = 'http://localhost:4330'
const b = await chromium.launch({ channel: 'chrome', headless: true })
const jsFor = async (path, w = 1440, h = 900) => {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  const initial = [], later = [], errs = []
  let loaded = false
  p.on('pageerror', (e) => errs.push(String(e)))
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
  p.on('response', async (r) => { if (/\.js(\?|$)/.test(r.url())) { try { const buf = await r.body(); (loaded ? later : initial).push(zlib.gzipSync(buf).length) } catch {} } })
  const res = await p.goto(base + path, { waitUntil: 'load' })
  loaded = true
  await p.waitForTimeout(3500)
  const sum = (a) => Math.round(a.reduce((x, y) => x + y, 0) / 1024)
  const out = { path, status: res.status(), initialKB: sum(initial), deferredKB: sum(later), height: await p.evaluate(() => document.documentElement.scrollHeight), errs: errs.slice(0, 2) }
  await p.close()
  return out
}
for (const path of ['/', '/contact/', '/services/', '/services/web-development/', '/services/branding/', '/services/community-management/', '/pricing/', '/audit/', '/work/universal-driveshafts/']) console.log(JSON.stringify(await jsFor(path)))

// sitemap
const xml = await (await fetch(base + '/sitemap.xml')).text()
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
console.log('sitemap urls', locs.length, 'unique', new Set(locs).size, 'sample', locs[1])

// landing: just before the hand-over, the 3D key must sit on the gap (centre and width), going down and coming back up
for (const [w, h] of [[1440, 900], [1366, 768]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await p.goto(base + '/', { waitUntil: 'networkidle' })
  await p.waitForFunction(() => document.documentElement.classList.contains('gl-on'), null, { timeout: 20000 })
  const top = await p.evaluate(() => { const e = document.querySelector('.kbs'); return e.getBoundingClientRect().top + scrollY })
  const read = () => p.evaluate(() => { const g = document.querySelector('.k--gap').getBoundingClientRect(), k = window.__key; return { on: document.documentElement.classList.contains('key-on'), dx: k.x - (g.left + g.width / 2), dy: k.y - (g.top + g.height / 2), dw: k.w - g.width, tilt: Math.abs(k.rx - Math.PI / 2) % (Math.PI * 2) } })
  const res = {}
  let last = null
  for (let y = top - 100; y < top + h * 0.5; y += 4) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(40); const s = await read(); if (s.on) break; last = s }
  res.down = last && { dx: +last.dx.toFixed(1), dy: +last.dy.toFixed(1), dw: +last.dw.toFixed(1), tilt: +last.tilt.toFixed(3) }
  const yOn = await p.evaluate(() => scrollY)
  for (let y = yOn; y > top - 100; y -= 4) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(40); const s = await read(); if (!s.on) { res.up = { dx: +s.dx.toFixed(1), dy: +s.dy.toFixed(1), dw: +s.dw.toFixed(1) }; break } }
  console.log(`landing ${w}x${h}`, JSON.stringify(res))
  await p.close()
}
await b.close()
