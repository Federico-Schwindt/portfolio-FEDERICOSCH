// The new client sections in the demo: profile, calendar, deliveries, activity, and the plans popup on the home.
// Needs `npx astro preview --port 4330`. Screenshots land in scripts/.shots/sec-*.jpg.
import { chromium } from 'playwright-core'
const port = Number(process.argv[2] || 4330), origin = `http://localhost:${port}`
const b = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const errors = []
p.on('pageerror', (e) => errors.push(String(e)))
p.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()) })
const steps = []
const step = async (name, fn) => { try { await fn(); steps.push([name, 'ok']) } catch (e) { steps.push([name, 'FAIL ' + String(e).split('\n')[0]]) } }
const shot = (n) => p.screenshot({ path: `scripts/.shots/sec-${n}.jpg`, type: 'jpeg', quality: 70 })
const go = async (hash, sel) => { await p.evaluate((h) => (location.hash = h), hash); await p.waitForSelector(sel); await p.waitForTimeout(600) }

await step('home: hero button goes to the contact page', async () => {
  await p.goto(origin + '/', { waitUntil: 'load' }); await p.waitForTimeout(2500)
  const href = await p.locator('[data-hx-cta]').getAttribute('href'); if (!/\/contact\/$/.test(href)) throw new Error('hero link: ' + href)
})
await step('demo sign-in with a plan', async () => {
  await p.goto(origin + '/app/?demo', { waitUntil: 'load' }); await p.waitForSelector('.af')
  await p.fill('.af input[autocomplete=username]', 'ana@studio.test'); await p.fill('.af input[type=password]', 'x'); await p.click('.af button[type=submit]'); await p.waitForSelector('.eng')
})
await step('profile: edit, picture, notices', async () => {
  await go('/profile', '.pf')
  await p.fill('.pf__form input[autocomplete="organization-title"]', 'Marketing lead'); await p.fill('.pf__form input[type=tel]', '+1 555 010 2030')
  await p.click('.pf__form button[type=submit]'); await p.waitForFunction(() => /Marketing lead/.test(document.querySelector('.pf__who')?.textContent ?? ''))
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  await p.setInputFiles('.pf__av input[type=file]', { name: 'me.png', mimeType: 'image/png', buffer: png }); await p.waitForSelector('.pf__av img'); await p.waitForSelector('.ap-me .ap-av img')
  await p.click('.pf__sw li:nth-child(3) .sw'); await p.waitForTimeout(300)
  if ((await p.getAttribute('.pf__sw li:nth-child(3) .sw', 'aria-checked')) !== 'false') throw new Error('switch did not turn off')
  await p.reload({ waitUntil: 'load' }); await p.waitForSelector('.pf'); if ((await p.getAttribute('.pf__sw li:nth-child(3) .sw', 'aria-checked')) !== 'false') throw new Error('notice not saved')
  await shot('1-profile')
})
await step('calendar', async () => { await go('/calendar', '.cal__grid'); if ((await p.locator('.cal__day').count()) !== 42) throw new Error('42 days'); await shot('2-calendar'); await p.click('.cal__nav .cal__arrow:last-child'); await p.waitForTimeout(300) })
await step('deliveries', async () => { await go('/deliveries', '.dl'); await p.waitForTimeout(400); await shot('3-deliveries'); if (await p.locator('.dl__card').count()) { await p.locator('.dl__card h3 button').first().click(); await p.waitForSelector('.dr'); await p.waitForTimeout(500); await shot('3b-delivery-open'); await p.keyboard.press('Escape') } })
await step('activity', async () => { await go('/activity', '.ac'); await p.waitForTimeout(300); await shot('4-activity'); const tabs = p.locator('.ac__tabs button'); await tabs.nth(3).click(); await p.waitForTimeout(300) })
await step('overview', async () => { await go('/overview', '.ov'); await shot('5-overview') })
await step('mobile: profile and calendar fit', async () => {
  await p.setViewportSize({ width: 390, height: 844 }); await go('/profile', '.pf'); await shot('6-profile-mobile')
  const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (over > 2) throw new Error('profile overflows by ' + over)
  await go('/calendar', '.cal__grid'); await shot('7-calendar-mobile')
  const over2 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (over2 > 2) throw new Error('calendar overflows by ' + over2)
})
await b.close()
console.table(steps)
console.log(errors.length ? errors.slice(0, 5).join('\n') : 'no errors')
if (errors.length || steps.some((s) => s[1] !== 'ok')) process.exitCode = 1
