// Renders the social preview image (1200 x 630) from the site's own fonts and colours.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
const font = (f) => `data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}`
const archivo = font('node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2')
const serif = font('node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')
const mono = font('node_modules/@fontsource-variable/martian-mono/files/martian-mono-latin-wght-normal.woff2')
const html = `<html><head><style>
@font-face{font-family:A;src:url(${archivo}) format('woff2');font-weight:100 900;font-stretch:62% 125%}
@font-face{font-family:S;src:url(${serif}) format('woff2');font-style:italic}
@font-face{font-family:M;src:url(${mono}) format('woff2');font-weight:100 800}
body{margin:0;width:1200px;height:630px;background:#fff1e0;font-family:A;position:relative;overflow:hidden}
.g{position:absolute;inset:0;background-image:radial-gradient(rgba(11,11,11,.14) 1.2px,transparent 1.6px);background-size:22px 22px}
.t{margin:0;position:absolute;left:70px;top:150px;font-weight:900;font-size:150px;line-height:.86;letter-spacing:-.045em;color:#f01111}
.t i{display:block;font-family:S;font-weight:400;letter-spacing:0;color:#0b0b0b;font-size:162px;padding-left:180px}
.b{margin:0;position:absolute;left:70px;top:64px;font-family:M;font-size:18px;letter-spacing:.08em;text-transform:uppercase;color:#0b0b0b;display:flex;gap:14px;align-items:center}
.b:before{content:'';width:12px;height:12px;border-radius:50%;background:#f01111}
.f{margin:0;position:absolute;left:70px;right:70px;bottom:52px;display:flex;justify-content:space-between;font-family:M;font-size:17px;letter-spacing:.06em;text-transform:uppercase;color:#0b0b0b;border-top:2px solid #0b0b0b;padding-top:18px}
.s{position:absolute;border:2px solid #f01111;left:52px;top:136px;width:850px;height:300px}
.s b{position:absolute;width:12px;height:12px;background:#fff;border:2px solid #f01111;transform:translate(-50%,-50%)}
</style></head><body><div class="g"></div>
<p class="b">Federico Schwindt</p>
<div class="s"><b style="left:0;top:0"></b><b style="left:100%;top:0"></b><b style="left:100%;top:100%"></b><b style="left:0;top:100%"></b></div>
<p class="t">From sketch<i>to sold.</i></p>
<p class="f"><span>Design · Development · Branding · Marketing</span><span>From $300</span></p>
</body></html>`
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await b.newPage({ viewport: { width: 1200, height: 630 } })
await p.setContent(html); await p.waitForTimeout(500)
// the selection box hugs the headline exactly
await p.evaluate(() => { const r = document.querySelector('.t').getBoundingClientRect(), s = document.querySelector('.s'); Object.assign(s.style, { left: r.left - 16 + 'px', top: r.top - 10 + 'px', width: r.width + 32 + 'px', height: r.height + 14 + 'px' }) })
await p.screenshot({ path: 'public/og.jpg', type: 'jpeg', quality: 88 })
await b.close()
console.log('og ok')
