// Every route in both languages: status, lang attribute, hreflang twins, leftover English in the Spanish pages, console errors.
import { chromium } from 'playwright-core'
const base = 'http://localhost:' + (process.env.FS_PORT || 4330)
const xml = await (await fetch(base + '/sitemap.xml')).text()
const locs = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace('/portfolio-FEDERICOSCH', '')))]
const b = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addInitScript(() => sessionStorage.setItem('pre', '1'))
const EN = /\b(Start a project|See the|Choose |Ready when|What you get|How it works|Read more|Next project|Client work|Pricing|Services|Contact)\b/
let bad = 0
for (const path of locs) {
  const p = await ctx.newPage(); const errs = []
  p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
  const r = await p.goto(base + path, { waitUntil: 'load' }); await p.waitForTimeout(600)
  const info = await p.evaluate(() => ({ lang: document.documentElement.lang, alts: [...document.querySelectorAll('link[hreflang]')].length, title: document.title, text: document.querySelector('main')?.innerText ?? '' }))
  const es = path.startsWith('/es/')
  const leak = es ? (info.text.match(EN) || [])[0] : null
  const ok = r.status() === 200 && info.lang === (es ? 'es' : 'en') && info.alts === 3 && !leak && !errs.length
  if (!ok) { bad++; console.log('FAIL', path, r.status(), info.lang, info.alts, leak || '', errs.slice(0, 2).join(' | ')) }
  await p.close()
}
console.log(locs.length, 'routes,', bad, 'failing')
await b.close()
