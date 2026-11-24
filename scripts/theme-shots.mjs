// Full-page strips of a route in light and dark. Usage: node scripts/theme-shots.mjs <path> <name>
import { chromium } from 'playwright-core'
const [path = '/', name = 'home'] = process.argv.slice(2)
const b = await chromium.launch({ channel: 'chrome', headless: true })
for (const theme of ['light', 'dark']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript((t) => { sessionStorage.setItem('pre', '1'); localStorage.setItem('theme', t) }, theme)
  const p = await ctx.newPage()
  await p.goto('http://localhost:4330' + path, { waitUntil: 'load' })
  await p.waitForTimeout(1200)
  const H = await p.evaluate(() => document.documentElement.scrollHeight)
  // walk down so reveals and scroll scenes run, then shoot viewport frames
  const stops = []
  for (let y = 0; y < H; y += 900) stops.push(y)
  let i = 0
  for (const y of stops) {
    await p.evaluate((y) => { window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y) }, y)
    await p.waitForTimeout(700)
    await p.screenshot({ path: `scripts/.shots/${name}-${theme}-${String(i++).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 55 })
  }
  console.log(theme, stops.length, 'frames')
  await ctx.close()
}
await b.close()
