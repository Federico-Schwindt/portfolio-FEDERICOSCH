// Research tool: records a reference site while scrolling (video + frame sheets + structure dump).
import { chromium } from 'playwright-core'
import sharp from 'sharp'
import fs from 'node:fs'
const [site, name, stepArg = '300', maxArg = '0'] = process.argv.slice(2)
const out = `_research/${name}`
fs.mkdirSync(out, { recursive: true })
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-gpu', '--use-angle=default'] })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: out, size: { width: 1440, height: 900 } } })
const p = await ctx.newPage()
const reqs = []
p.on('response', (r) => { const u = r.url(); if (/\.(js|css|riv|glb|gltf|mp4|webm|json|wasm|woff2)(\?|$)/.test(u)) reqs.push(u) })
await p.goto(site, { waitUntil: 'networkidle', timeout: 90000 }).catch((e) => console.log('goto', e.message))
await p.waitForTimeout(4000)
const total = await p.evaluate(() => document.documentElement.scrollHeight)
const step = +stepArg, max = +maxArg || total
const frames = []
await p.mouse.move(700, 450)
for (let y = 0; y <= Math.min(total, max); y += step) {
  await p.mouse.wheel(0, y === 0 ? 0 : step)
  await p.waitForTimeout(420)
  // move the mouse a little so cursor-driven effects show up
  await p.mouse.move(500 + ((y / step) % 5) * 110, 380 + ((y / step) % 3) * 90, { steps: 3 })
  frames.push({ y, buf: await p.screenshot({ type: 'jpeg', quality: 60 }) })
}
const info = await p.evaluate(() => {
  const sticky = [...document.querySelectorAll('*')].filter((e) => getComputedStyle(e).position === 'sticky').slice(0, 60).map((e) => ({ tag: e.tagName, cls: String(e.className).slice(0, 70), h: Math.round(e.getBoundingClientRect().height), parentH: Math.round(e.parentElement.getBoundingClientRect().height) }))
  const sections = [...document.querySelectorAll('main > *, #root > * > *, body > section, section')].slice(0, 60).map((s) => ({ tag: s.tagName, id: s.id, cls: String(s.className).slice(0, 60), h: Math.round(s.getBoundingClientRect().height), canvases: s.querySelectorAll('canvas').length, svgs: s.querySelectorAll('svg').length, videos: s.querySelectorAll('video').length, text: s.innerText.replace(/\s+/g, ' ').slice(0, 220) }))
  const fonts = [...new Set([...document.querySelectorAll('h1,h2,h3,p,a,span')].slice(0, 400).map((e) => getComputedStyle(e).fontFamily.split(',')[0]))]
  const colors = {}
  ;[...document.querySelectorAll('section,div,header,footer')].slice(0, 1500).forEach((e) => { const c = getComputedStyle(e).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)') colors[c] = (colors[c] || 0) + 1 })
  return { total: document.documentElement.scrollHeight, sticky, sections, fonts, colors: Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 14), globals: Object.keys(window).filter((k) => /gsap|lenis|three|scrolltrigger|rive|lottie|barba|swiper|pixi|ogl|framer|locomotive|splitting/i.test(k)) }
})
fs.writeFileSync(`${out}/info.json`, JSON.stringify({ ...info, reqs: [...new Set(reqs)] }, null, 1))
const cols = 4, tw = 480, th = 300, per = 12
for (let s = 0; s * per < frames.length; s++) {
  const part = frames.slice(s * per, (s + 1) * per)
  const comp = await Promise.all(part.map(async (f, k) => ({ input: await sharp(f.buf).resize(tw, th).toBuffer(), left: (k % cols) * (tw + 4), top: Math.floor(k / cols) * (th + 4) })))
  await sharp({ create: { width: cols * (tw + 4), height: Math.ceil(part.length / cols) * (th + 4), channels: 3, background: '#00c2ff' } }).composite(comp).jpeg({ quality: 72 }).toFile(`${out}/sheet-${String(s).padStart(2, '0')}.jpg`)
}
await ctx.close(); await b.close()
console.log(name, 'total', total, 'frames', frames.length, 'sheets', Math.ceil(frames.length / per))
