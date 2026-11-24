// Block mode check at three window sizes: every block is one screen and its content fits (nothing clipped),
// one wheel gesture = one block, every piece gets laid out, scenes play on arrival. Films 1440x900.
import { chromium } from 'playwright-core'
const path = process.argv[2] || '/'
const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=d3d11', '--enable-gpu'] })
for (const [w, h] of [[1440, 900], [1366, 768], [1920, 1080]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } })
  await ctx.addInitScript(() => sessionStorage.setItem('pre', '1'))
  const p = await ctx.newPage()
  const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
  await p.goto(('http://localhost:' + (process.env.FS_PORT || 4330)) + path, { waitUntil: 'load' })
  await p.mouse.move(60, h - 40)
  await p.waitForTimeout(2000)
  const film = w === 1440
  const rows = []
  for (let i = 0; i < 11; i++) {
    if (i > 0) { await p.mouse.move(w / 2, h / 2); await p.mouse.wheel(0, 120) }
    if (film) { await p.waitForTimeout(i === 10 ? 700 : 900); await p.screenshot({ path: `scripts/.shots/sl-${i}a.jpg`, type: 'jpeg', quality: 50 }) }
    await p.waitForTimeout(film ? 2600 : 3000)
    if (film) await p.screenshot({ path: `scripts/.shots/sl-${i}b.jpg`, type: 'jpeg', quality: 50 })
    rows.push(await p.evaluate(() => {
      const y = scrollY, vh = innerHeight
      const sec = [...document.querySelectorAll('main > section')].find((s) => Math.abs(s.getBoundingClientRect().top) < 3)
      if (!sec) return { y, block: 'footer' }
      const sr = sec.getBoundingClientRect()
      // the lowest visible bit of content inside the block
      let low = 0
      sec.querySelectorAll('*').forEach((e) => { const r = e.getBoundingClientRect(); if (r.height > 0 && r.width > 0 && getComputedStyle(e).position !== 'absolute' && !e.closest('.sold')) low = Math.max(low, r.bottom) })
      const hidden = [...sec.querySelectorAll('[data-bd]:not(.bd-done)')].length
      return { y, block: sec.id || sec.className.split(' ')[0], h: Math.round(sr.height), vh, fit: sec.dataset.fit, overflowPx: Math.max(0, Math.round(low - sr.bottom)), notLaidOut: hidden }
    }))
  }
  console.log(`${w}x${h}`); console.table(rows)
  console.log(errs.length ? errs : 'no errors')
  await ctx.close()
}
await b.close()
