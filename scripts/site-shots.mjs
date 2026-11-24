// Full-page pictures of the public pages (not the home). Usage: node scripts/site-shots.mjs pricing,services [es] [mobile]
import { chromium } from 'playwright-core'
const pages = (process.argv[2] || 'pricing,services').split(','), es = process.argv.includes('es'), mobile = process.argv.includes('mobile')
const b = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
const ctx = await b.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 } })
await ctx.addInitScript(() => sessionStorage.setItem('pre', '1'))
for (const pg of pages) {
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(`http://localhost:${process.env.FS_PORT || 4330}${es ? '/es' : ''}/${pg}/`, { waitUntil: 'load' }); await p.waitForTimeout(1800)
  // walk down so reveal animations run, then back up
  const h = await p.evaluate(() => document.documentElement.scrollHeight)
  for (let y = 0; y < h; y += 600) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(220) }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500)
  const name = `scripts/.shots/site-${pg.replace(/\//g, '_')}${es ? '-es' : ''}${mobile ? '-m' : ''}.jpg`
  await p.screenshot({ path: name, fullPage: true, type: 'jpeg', quality: 55 })
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  console.log(pg, 'height', h, 'overflow', over, errs.length ? errs.slice(0, 2) : 'no errors')
  await p.close()
}
await b.close()
