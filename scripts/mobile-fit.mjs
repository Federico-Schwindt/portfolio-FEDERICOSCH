// Every client view at 390 px: nothing may be wider than the screen. Needs the preview on :4330.
import { chromium } from 'playwright-core'
const b = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage()
await p.goto('http://localhost:' + Number(process.env.STUDIO_TEST_PORT || 4330) + '/app/?demo', { waitUntil: 'load' }); await p.waitForSelector('.af')
await p.fill('.af input[autocomplete=username]', 'ana@studio.test'); await p.fill('.af input[type=password]', 'x'); await p.click('.af button[type=submit]'); await p.waitForSelector('.ap-dock')
let bad = 0
for (const h of ['/profile', '/calendar', '/deliveries', '/activity', '/billing', '/team', '/overview']) {
  await p.evaluate((x) => (location.hash = x), h); await p.waitForTimeout(900)
  const r = await p.evaluate(() => {
    const chain = []; let e = document.querySelector('.ap-main > div:last-of-type > *') ?? document.querySelector('.ap-main')
    const first = e
    while (e) { chain.push((e.className ? '.' + String(e.className).split(' ')[0] : e.tagName) + ':' + Math.round(e.getBoundingClientRect().width)); e = e.parentElement }
    const wide = [...(first?.querySelectorAll('*') ?? [])].filter((x) => x.scrollWidth > x.clientWidth + 4 && getComputedStyle(x).overflowX === 'visible').slice(0, 4).map((x) => x.tagName + '.' + String(x.className).slice(0, 24) + ' sw' + x.scrollWidth + ' cw' + x.clientWidth)
    return { over: document.documentElement.scrollWidth - innerWidth, chain: chain.slice(0, 6).join(' < '), wide }
  })
  if (r.over > 2) { bad++; console.log('FAIL', h, r) } else console.log('ok', h)
}
await b.close()
console.log(bad ? 'MOBILE FAIL' : 'MOBILE OK'); if (bad) process.exitCode = 1
