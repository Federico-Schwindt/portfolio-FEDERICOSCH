/**
 * Renders the Open Graph image (public/og.jpg, 2400×1260) in the brand style with Playwright.
 *   npm run og
 */
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const b64 = (p) => readFileSync(resolve(root, 'node_modules', p)).toString('base64')
const geist = b64('@fontsource-variable/geist/files/geist-latin-wght-normal.woff2')
const mono = b64('@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2')

const html = `<!doctype html><html><head><style>
@font-face{font-family:G;src:url(data:font/woff2;base64,${geist}) format('woff2');font-weight:100 900}
@font-face{font-family:M;src:url(data:font/woff2;base64,${mono}) format('woff2');font-weight:100 900}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#0b0b0b;color:#fff;font-family:G;padding:48px 56px;display:flex;flex-direction:column;overflow:hidden}
.top{display:flex;justify-content:space-between;align-items:center;font-family:M;font-size:15px;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.64)}
.logo{display:flex;align-items:center;gap:14px;font-family:G;font-weight:700;font-size:22px;letter-spacing:-.03em;color:#fff;text-transform:none}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;background:#ff2a1a;margin-right:10px}
h1{margin-top:auto;font-weight:800;font-size:184px;line-height:.8;letter-spacing:-.045em;text-transform:uppercase}
h1 span{color:#ff2a1a}
.bot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:36px;font-size:24px;color:rgba(255,255,255,.72);letter-spacing:-.01em}
.bot b{color:#fff}
.chip{font-family:M;font-size:15px;letter-spacing:.06em;text-transform:uppercase;background:#ff2a1a;color:#0b0b0b;padding:10px 14px}
</style></head><body>
<div class="top"><span class="logo"><svg width="40" height="40" viewBox="0 0 30 30"><rect width="30" height="30" fill="#ff2a1a"/><g fill="#0b0b0b"><rect x="6.5" y="7" width="3.5" height="16"/><rect x="6.5" y="7" width="7.5" height="3.5"/><rect x="6.5" y="12.5" width="6" height="3.5"/><rect x="16" y="7" width="8" height="3.5"/><rect x="16" y="7" width="3.5" height="9"/><rect x="16" y="12.5" width="8" height="3.5"/><rect x="20.5" y="12.5" width="3.5" height="10.5"/><rect x="16" y="19.5" width="8" height="3.5"/></g></svg>Federico Schwindt</span><span><i class="dot"></i>Open for work</span></div>
<h1>Websites<br>that <span>sell.</span></h1>
<div class="bot"><p><b>Design · Code · Marketing</b> — +551% sales for Universal Driveshafts</p><span class="chip">From $300</span></div>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })
await page.setContent(html)
await page.waitForTimeout(300)
await page.screenshot({ path: resolve(root, 'public/og.jpg'), type: 'jpeg', quality: 86 })
await browser.close()
console.log('public/og.jpg')
