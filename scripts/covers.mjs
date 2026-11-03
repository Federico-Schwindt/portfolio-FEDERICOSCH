/**
 * Generates placeholder project covers (public/work/*.jpg) for projects without
 * screenshots, plus the Open Graph image (public/og.jpg), by rendering HTML
 * compositions with Playwright.   npm run covers
 */
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

// Playwright may be installed globally (e.g. in CI containers); resolve it via require.
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const out = resolve(root, 'public')
mkdirSync(resolve(out, 'work'), { recursive: true })

const font = (p) => readFileSync(resolve(root, 'node_modules', p)).toString('base64')
const syne = font('@fontsource-variable/syne/files/syne-latin-wght-normal.woff2')
const serif = font('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')
const grotesk = font('@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2')

const fonts = `
@font-face{font-family:'Syne';src:url(data:font/woff2;base64,${syne}) format('woff2');font-weight:400 800}
@font-face{font-family:'Serif';src:url(data:font/woff2;base64,${serif}) format('woff2');font-style:italic}
@font-face{font-family:'Grotesk';src:url(data:font/woff2;base64,${grotesk}) format('woff2');font-weight:300 700}
`
const grain = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;opacity:.16;mix-blend-mode:overlay"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`

const covers = [
  {
    file: 'havat-aliza.jpg', word: 'HAVAT ALIZA', sub: 'Horse riding · family business · Israel', c1: '#1a120a', c2: '#8c6a3f', c3: '#e8d3b0', ink: '#f8efe2',
    art: `<div style="position:absolute;left:-20%;bottom:-60%;width:120%;aspect-ratio:1;border-radius:50%;border:140px solid #8c6a3f;opacity:.75"></div>
          <div style="position:absolute;right:10%;top:12%;width:26%;aspect-ratio:1;border-radius:50%;background:#e8d3b0;opacity:.9"></div>`,
  },
  {
    file: 'dogstore.jpg', word: 'DOGSTORE', sub: 'Premium dog food & vet supplies · WooCommerce', c1: '#0a1030', c2: '#4a6fff', c3: '#dfe6ff', ink: '#f2f5ff',
    art: `<div style="position:absolute;right:12%;top:16%;width:30%;aspect-ratio:1;display:grid;grid-template-columns:1fr 1fr;gap:6%;transform:rotate(-18deg)">
            ${[0, 1, 2, 3].map((i) => `<div style="width:60%;aspect-ratio:1;border-radius:50%;background:#dfe6ff;justify-self:${i % 2 ? 'start' : 'end'};align-self:${i < 2 ? 'end' : 'start'}"></div>`).join('')}
          </div>
          <div style="position:absolute;right:16%;top:40%;width:24%;aspect-ratio:1.2;border-radius:50% 50% 45% 45%;background:#dfe6ff;transform:rotate(-18deg)"></div>
          <div style="position:absolute;inset:0;background:radial-gradient(circle at 20% 90%,#4a6fff55,transparent 50%)"></div>`,
  },
  {
    file: 'reel.jpg', word: 'MOTION REEL', sub: 'Services · stack · achievements in 60 seconds', c1: '#070707', c2: '#ff2b2b', c3: '#2a0a0a', ink: '#ffffff',
    art: `<div style="position:absolute;left:0;right:0;top:8%;height:12%;background:repeating-linear-gradient(90deg,#1a1a1a 0 60px,#0d0d0d 60px 80px);border-top:3px solid #222;border-bottom:3px solid #222"></div>
          <div style="position:absolute;left:0;right:0;bottom:30%;height:12%;background:repeating-linear-gradient(90deg,#1a1a1a 0 60px,#0d0d0d 60px 80px);border-top:3px solid #222;border-bottom:3px solid #222"></div>
          <div style="position:absolute;right:10%;top:28%;width:0;height:0;border-left:170px solid #ff2b2b;border-top:110px solid transparent;border-bottom:110px solid transparent;filter:drop-shadow(0 0 60px #ff2b2b88)"></div>`,
  },
]

function cover({ word, sub, c1, c2, c3, ink, art }) {
  return `<!doctype html><html><head><style>${fonts}
  html,body{margin:0;width:1440px;height:900px;overflow:hidden;background:${c1};color:${ink};font-family:Grotesk}
  .bg{position:absolute;inset:0;background:radial-gradient(circle at 20% 80%,${c3}33,transparent 50%),radial-gradient(circle at 80% 20%,${c2}33,transparent 50%)}
  .word{position:absolute;left:64px;bottom:110px;font-family:Syne;font-weight:800;font-size:150px;letter-spacing:-.06em;line-height:.8;white-space:nowrap}
  .sub{position:absolute;left:64px;bottom:64px;font-size:20px;letter-spacing:.16em;text-transform:uppercase;opacity:.75}
  .tag{position:absolute;left:64px;top:56px;font-size:18px;letter-spacing:.2em;text-transform:uppercase;opacity:.7}
  .yr{position:absolute;right:64px;top:50px;font-family:Serif;font-style:italic;font-size:40px;opacity:.9}
  </style></head><body><div class="bg"></div>${art}
  <div class="tag">Case study</div><div class="yr">Zyneteq</div>
  <div class="word">${word}</div><div class="sub">${sub}</div>${grain}</body></html>`
}

function og() {
  return `<!doctype html><html><head><style>${fonts}
  html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#060606;color:#f2efe9;font-family:Grotesk}
  .bg{position:absolute;inset:0;background:radial-gradient(circle at 85% 50%,#ff2b2b44,transparent 45%),radial-gradient(circle at 70% 60%,#ff2b2b22,transparent 40%)}
  .orb{position:absolute;right:90px;top:50%;width:360px;height:360px;border-radius:50%;transform:translateY(-50%);background:radial-gradient(circle at 35% 35%,#ff6b6b,#5a0b0b 55%,#060606 75%);box-shadow:0 0 140px #ff2b2b55}
  .ring{position:absolute;right:50px;top:50%;width:440px;height:440px;border-radius:50%;border:1px solid #ff2b2b99;transform:translateY(-50%) rotateX(65deg)}
  .name{position:absolute;left:72px;top:150px;font-family:Syne;font-weight:800;font-size:112px;letter-spacing:-.05em;line-height:.84;text-transform:uppercase}
  .tag{position:absolute;left:72px;top:72px;font-size:18px;letter-spacing:.2em;text-transform:uppercase;opacity:.65}
  .sub{position:absolute;left:72px;bottom:72px;font-family:Serif;font-style:italic;font-size:40px;color:#ff2b2b}
  </style></head><body><div class="bg"></div><div class="orb"></div><div class="ring"></div>
  <div class="tag">Portfolio — Website Development, Design &amp; Marketing</div>
  <div class="name">Federico<br>Schwindt</div>
  <div class="sub">Designer &amp; Developer</div>${grain}</body></html>`
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
for (const c of covers) {
  await page.setContent(cover(c), { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: resolve(out, 'work', c.file), type: 'jpeg', quality: 86 })
  console.log('wrote work/' + c.file)
}
await page.setViewportSize({ width: 1200, height: 630 })
await page.setContent(og(), { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: resolve(out, 'og.jpg'), type: 'jpeg', quality: 88 })
console.log('wrote og.jpg')
await browser.close()
