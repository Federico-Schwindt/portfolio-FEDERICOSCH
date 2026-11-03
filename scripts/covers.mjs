/**
 * Generates placeholder project covers (public/work/*.jpg) and the OG image
 * (public/og.jpg) by rendering HTML compositions with Playwright.
 *   npm run covers
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

const grain = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;opacity:.18;mix-blend-mode:overlay"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`

const covers = [
  { file: '01.jpg', word: 'AURORA', sub: 'Creative studio — brand & website', c1: '#120f33', c2: '#5b4bff', c3: '#ff7ad9', ink: '#f4f2ff', shape: 'orb' },
  { file: '02.jpg', word: 'NORDIC', sub: 'Specialty coffee — e-commerce', c1: '#1b110b', c2: '#d9a066', c3: '#f3e2c7', ink: '#f8efe2', shape: 'arc' },
  { file: '03.jpg', word: 'VELA', sub: 'Fintech — product & dashboard', c1: '#04100c', c2: '#19c37d', c3: '#0b3b2a', ink: '#e6fff4', shape: 'grid' },
  { file: '04.jpg', word: 'KŌYŌ', sub: 'Boutique hotel — website & identity', c1: '#1e0a05', c2: '#e8663d', c3: '#f6c9a0', ink: '#fff2e6', shape: 'sun' },
  { file: '05.jpg', word: 'PULSE', sub: 'Fitness — campaign & landing', c1: '#120206', c2: '#ff3b5c', c3: '#4a0a18', ink: '#ffffff', shape: 'bars' },
  { file: '06.jpg', word: 'ORBIT', sub: 'Agency — motion & 3D', c1: '#0a0b06', c2: '#c8ff3b', c3: '#2d3a0c', ink: '#f4ffd6', shape: 'rings' },
]

function shape(kind, c2, c3, ink) {
  switch (kind) {
    case 'orb':
      return `<div style="position:absolute;right:-10%;top:-20%;width:70%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 35% 35%,${c3},${c2} 45%,transparent 72%);filter:blur(2px)"></div>`
    case 'arc':
      return `<div style="position:absolute;left:-30%;bottom:-70%;width:120%;aspect-ratio:1;border-radius:50%;border:120px solid ${c2};opacity:.9"></div>`
    case 'grid':
      return `<div style="position:absolute;inset:0;background-image:linear-gradient(${c2}33 1px,transparent 1px),linear-gradient(90deg,${c2}33 1px,transparent 1px);background-size:70px 70px"></div><div style="position:absolute;left:12%;top:20%;width:46%;height:52%;border:2px solid ${c2};border-radius:24px;background:${c3}66"></div><div style="position:absolute;left:18%;top:28%;width:34%;height:3px;background:${c2}"></div><div style="position:absolute;left:18%;top:36%;width:22%;height:3px;background:${c2}99"></div>`
    case 'sun':
      return `<div style="position:absolute;right:8%;top:14%;width:34%;aspect-ratio:1;border-radius:50%;background:${c2}"></div><div style="position:absolute;left:0;right:0;bottom:0;height:34%;background:linear-gradient(180deg,transparent,${c3}55)"></div>`
    case 'bars':
      return `<div style="position:absolute;inset:0;display:flex;align-items:flex-end;gap:2%;padding:0 8%">${[40, 65, 30, 85, 55, 95, 45, 70].map((h) => `<div style="flex:1;height:${h}%;background:linear-gradient(180deg,${c2},${c3});border-radius:12px 12px 0 0;opacity:.85"></div>`).join('')}</div>`
    case 'rings':
      return [1.2, 0.9, 0.6, 0.3].map((s, i) => `<div style="position:absolute;left:50%;top:50%;width:${s * 90}%;aspect-ratio:1;border-radius:50%;border:${3 + i * 2}px solid ${c2};opacity:${0.25 + i * 0.2};transform:translate(-50%,-50%) rotateX(${60 + i * 6}deg)"></div>`).join('') + `<div style="position:absolute;left:50%;top:50%;width:16%;aspect-ratio:1;border-radius:50%;background:${ink};transform:translate(-50%,-50%);box-shadow:0 0 120px ${c2}"></div>`
    default:
      return ''
  }
}

function cover({ word, sub, c1, c2, c3, ink, shape: kind }) {
  return `<!doctype html><html><head><style>${fonts}
  html,body{margin:0;width:1400px;height:1050px;overflow:hidden;background:${c1};color:${ink};font-family:Grotesk}
  .bg{position:absolute;inset:0;background:radial-gradient(circle at 20% 80%,${c3}44,transparent 50%),radial-gradient(circle at 80% 20%,${c2}33,transparent 50%)}
  .word{position:absolute;left:64px;bottom:120px;font-family:Syne;font-weight:800;font-size:170px;letter-spacing:-.06em;line-height:.8}
  .sub{position:absolute;left:64px;bottom:72px;font-size:22px;letter-spacing:.16em;text-transform:uppercase;opacity:.75}
  .tag{position:absolute;left:64px;top:64px;font-size:20px;letter-spacing:.2em;text-transform:uppercase;opacity:.7}
  .yr{position:absolute;right:64px;top:64px;font-family:Serif;font-style:italic;font-size:44px;opacity:.9}
  </style></head><body><div class="bg"></div>${shape(kind, c2, c3, ink)}
  <div class="tag">Case study</div><div class="yr">Concept</div>
  <div class="word">${word}</div><div class="sub">${sub}</div>${grain}</body></html>`
}

function og() {
  return `<!doctype html><html><head><style>${fonts}
  html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#09090b;color:#ecebe6;font-family:Grotesk}
  .bg{position:absolute;inset:0;background:radial-gradient(circle at 85% 50%,#5b4bff44,transparent 45%),radial-gradient(circle at 70% 60%,#c8ff3b22,transparent 40%)}
  .orb{position:absolute;right:90px;top:50%;width:360px;height:360px;border-radius:50%;transform:translateY(-50%);background:radial-gradient(circle at 35% 35%,#8d85ff,#2a2258 55%,#09090b 75%);box-shadow:0 0 140px #5b4bff55}
  .ring{position:absolute;right:50px;top:50%;width:440px;height:440px;border-radius:50%;border:1px solid #c8ff3b99;transform:translateY(-50%) rotateX(65deg)}
  .name{position:absolute;left:72px;top:150px;font-family:Syne;font-weight:800;font-size:112px;letter-spacing:-.05em;line-height:.84;text-transform:uppercase}
  .tag{position:absolute;left:72px;top:72px;font-size:18px;letter-spacing:.2em;text-transform:uppercase;opacity:.65}
  .sub{position:absolute;left:72px;bottom:72px;font-family:Serif;font-style:italic;font-size:40px;color:#c8ff3b}
  </style></head><body><div class="bg"></div><div class="orb"></div><div class="ring"></div>
  <div class="tag">Portfolio — Website Development, Design &amp; Marketing</div>
  <div class="name">Federico<br>Schwindt</div>
  <div class="sub">Designer &amp; Developer</div>${grain}</body></html>`
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1400, height: 1050 }, deviceScaleFactor: 1 })
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
