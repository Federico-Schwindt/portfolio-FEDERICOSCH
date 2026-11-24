// The plans popup: three answers pick a plan. Needs the preview on :4330.
import { chromium } from 'playwright-core'
const b = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
let bad = 0
const cases = [[[0, 0, 0], 'launch'], [[0, 0, 2], 'grow'], [[1, 1, 0], 'grow'], [[0, 2, 0], 'scale'], [[2, 0, 1], 'scale']]
for (const [w, path] of [[1440, '/'], [390, '/es/']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 860 } })
  await ctx.addInitScript(() => sessionStorage.setItem('pre', '1'))
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(('http://localhost:' + (process.env.FS_PORT || 4330)) + path, { waitUntil: 'load' }); await p.waitForTimeout(2500)
  await p.evaluate(() => document.querySelector('[data-hx-cta]').click()); await p.waitForSelector('#plans-dialog[open]')
  for (const [ans, want] of cases) {
    await p.click('[data-pq-open]'); await p.waitForSelector('[data-pq-q="0"]:not([hidden])')
    for (let i = 0; i < 3; i++) await p.click(`[data-pq-q="${i}"] [data-pq-a="${ans[i]}"]`)
    const got = await p.evaluate(() => document.querySelector('.pd__card.is-pick')?.dataset.pdPlan)
    const visible = await p.evaluate(() => [...document.querySelectorAll('[data-pq-q]')].filter((q) => q.offsetParent).length)
    if (got !== want || visible !== 0) { bad++; console.log('FAIL', w, ans, 'got', got, 'want', want, 'questions still visible', visible) }
    if (ans === cases[2][0]) await p.screenshot({ path: `scripts/.shots/quiz-${w}.jpg`, type: 'jpeg', quality: 65 })
    await p.click('[data-pq-open]')
  }
  const over = await p.evaluate(() => { const r = document.getElementById('plans-dialog').getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < 0 })
  if (over || errs.length) { bad++; console.log('FAIL', w, { over, errs }) }
  await ctx.close()
}
await b.close()
console.log(bad ? 'QUIZ FAIL' : 'QUIZ OK'); if (bad) process.exitCode = 1
