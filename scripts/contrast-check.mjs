// Readability of the dashboard: every visible piece of text is compared with the colour really behind it
// (WCAG contrast), in light and dark, on desktop and on a phone, on every client view and in the "More" sheet.
// Text under 3:1 fails. Usage: node scripts/contrast-check.mjs [port]. Uses the in-browser demo; nothing is written.
import { chromium } from 'playwright-core'
const port = Number(process.argv[2] || process.env.FS_PORT || 4330), origin = `http://localhost:${port}`
const VIEWS = ['overview', 'board', 'calendar', 'deliveries', 'files', 'activity', 'reports', 'billing', 'brand', 'team', 'profile']
const MIN = 3

// runs in the page: returns the worst offenders
const scan = () => {
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { rgb: p.slice(0, 3), a: p[3] === undefined ? 1 : p[3] } }
  const over = (top, a, under) => top.map((v, i) => v * a + under[i] * (1 - a))
  // the colour behind an element: its own and its ancestors' backgrounds, composited from the page up
  const behind = (el) => {
    const stack = []
    for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.backgroundImage !== 'none' && /gradient|url/.test(cs.backgroundImage) && !parse(cs.backgroundColor)?.a) return null; const c = parse(cs.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break } }
    let base = [255, 255, 255]
    for (const c of stack.reverse()) base = over(c.rgb, c.a, base)
    return base
  }
  const bad = [], seen = new Set()
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.textContent.trim(); if (text.length < 2) continue
    const el = n.parentElement; if (!el || seen.has(el)) continue
    seen.add(el)
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
    if (parseFloat(cs.fontSize) < 4) continue // a dot that only carries its text for screen readers
    if (r.width < 2 || r.height < 2 || cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.4) continue
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue
    // only what is really on top at that point (nothing covered by a sheet or a dialog)
    const hit = document.elementFromPoint(Math.min(innerWidth - 1, r.left + Math.min(r.width / 2, 8)), Math.min(innerHeight - 1, r.top + r.height / 2))
    if (!hit || !(el === hit || el.contains(hit) || hit.contains(el))) continue
    if (el.closest('[disabled], [aria-disabled="true"], .is-ok, del, s')) continue // disabled and struck-through are meant to recede
    const fg = parse(cs.color), bg = behind(el); if (!fg || !bg) continue
    const c = over(fg.rgb, fg.a * Number(cs.opacity), bg)
    const a = lum(c), b = lum(bg), ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    if (ratio < 3) bad.push({ ratio: +ratio.toFixed(2), text: text.slice(0, 40), el: el.tagName.toLowerCase() + '.' + String(el.className).split(' ').slice(0, 2).join('.'), fg: cs.color, bg: 'rgb(' + bg.map(Math.round).join(',') + ')' })
  }
  return bad.sort((x, y) => x.ratio - y.ratio).slice(0, 12)
}

const b = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
let fails = 0
for (const theme of ['light', 'dark']) for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 })
  await ctx.addInitScript((t) => localStorage.setItem('theme', t), theme)
  const p = await ctx.newPage()
  await p.goto(origin + '/app/?demo', { waitUntil: 'load' }); await p.waitForSelector('.af')
  await p.fill('.af input[autocomplete=username]', 'ana@studio.test'); await p.fill('.af input[type=password]', 'x'); await p.click('.af button[type=submit]'); await p.waitForSelector('.eng')
  const report = async (where) => { const bad = await p.evaluate(scan); if (bad.length) { fails += bad.length; console.log(`FAIL ${theme} ${w}px ${where}`); console.table(bad) } }
  for (const v of VIEWS) { await p.evaluate((x) => (location.hash = '/' + x), v); await p.waitForTimeout(900); await report(v) }
  if (w < 900) { await p.locator('.ap-dock button').last().tap(); await p.waitForSelector('.ap-sheet[open]'); await p.waitForTimeout(500); await report('more sheet'); await p.keyboard.press('Escape') }
  else { await p.click('.ap-top .up__btn'); await p.waitForSelector('.up__panel'); await p.waitForTimeout(400); await report('updates panel'); await p.keyboard.press('Escape'); await p.keyboard.press('n'); await p.waitForSelector('.nr'); await p.waitForTimeout(500); await report('new request'); await p.keyboard.press('Escape') }
  await ctx.close()
}
await b.close()
console.log(fails ? `CONTRAST FAIL (${fails})` : 'CONTRAST OK'); if (fails) process.exitCode = 1
