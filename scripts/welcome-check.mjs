// The welcome conversation, end to end: opens by itself on the first visit, every answer is saved as it is given,
// it can be left and resumed, files upload, and the studio's data is right afterwards.
// Runs against Neon with a throwaway @example.com account (deleted at the end) and in the demo. Needs :4330.
import { chromium } from 'playwright-core'
import { neon } from '@neondatabase/serverless'
import { randomUUID } from 'node:crypto'
const port = Number(process.argv[2] || 4330), origin = `http://localhost:${port}`
if (!process.env.DATABASE_URL) process.loadEnvFile()
const sql = neon(process.env.DATABASE_URL)
const email = `welcome-${randomUUID()}@example.com`
let created = false
const b = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
const steps = [], errors = []
const step = async (name, fn) => {
  try { await fn(); steps.push([name, 'ok']); console.log('OK', name) }
  catch (error) { throw new Error(name + ' — ' + String(error).split('\n')[0]) }
}
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
// a real visitor: the wizard only opens by itself outside automation, so hide the automation flag for this test
const human = async (ctx) => ctx.addInitScript(() => Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }))
const title = (p) => p.locator('.wl__h').innerText()

try {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await human(ctx)
  const p = await ctx.newPage()
  p.on('response', r => { if (r.ok() && r.url() === origin + '/api/auth/signup/' && r.request().method() === 'POST') created = true })
  p.on('pageerror', (e) => errors.push(String(e)))
  await step('sign up → the conversation opens by itself', async () => {
    await p.goto(origin + '/app/', { waitUntil: 'load' }); await p.waitForSelector('.af')
    await p.click('.af__swap'); await p.fill('.af input[autocomplete=name]', 'Wanda Check'); await p.fill('.af input[type=email]', email); await p.fill('.af input[type=password]', 'welcome check 1'); await p.click('.af button[type=submit]')
    await p.waitForSelector('.wl'); if (!/Wanda/.test(await title(p))) throw new Error('greeting: ' + await title(p))
    await p.screenshot({ path: 'scripts/.shots/wl-0-hello.jpg', type: 'jpeg', quality: 70 })
  })
  await step('name with Enter, sentence with Enter', async () => {
    await p.keyboard.press('Enter'); await p.waitForSelector('.wl__in'); await p.keyboard.type('Wanda Coffee'); await p.keyboard.press('Enter')
    await p.waitForFunction(() => /Wanda Coffee do/.test(document.querySelector('.wl__h')?.textContent ?? ''))
    await p.screenshot({ path: 'scripts/.shots/wl-1-text.jpg', type: 'jpeg', quality: 70 })
    await p.keyboard.type('We roast coffee and sell it online.'); await p.keyboard.press('Enter')
    await p.waitForSelector('.wl__opts--2')
  })
  await step('a letter key picks the industry', async () => {
    await p.waitForTimeout(500); await p.screenshot({ path: 'scripts/.shots/wl-2-choice.jpg', type: 'jpeg', quality: 70 })
    await p.keyboard.press('b'); await p.waitForSelector('textarea.wl__in')
    const [u] = await sql`select company, brand from studio.users where email = ${email}`
    if (u.company !== 'Wanda Coffee' || u.brand.business.industry !== 1 || !u.brand.business.what.startsWith('We roast')) throw new Error('not saved: ' + JSON.stringify(u.brand.business))
  })
  await step('leave in the middle, come back, it resumes on the same question', async () => {
    await p.keyboard.press('Escape'); await p.waitForSelector('.wl', { state: 'detached' })
    await p.waitForSelector('.wlc'); await p.screenshot({ path: 'scripts/.shots/wl-3-card.jpg', type: 'jpeg', quality: 70 })
    await p.click('.wlc .ap-btn'); await p.waitForSelector('textarea.wl__in')
    if (!/Who buys/.test(await title(p))) throw new Error('resumed on: ' + await title(p))
    await p.keyboard.type('People who love coffee.'); await p.keyboard.press('Enter'); await p.waitForSelector('.wl__opts')
  })
  await step('goals (two), links, style and colours', async () => {
    await p.waitForTimeout(500); await p.keyboard.press('a'); await p.keyboard.press('c'); await p.waitForTimeout(150); await p.keyboard.press('Enter'); await p.waitForSelector('.wl__fields')
    await p.keyboard.type('wandacoffee.example.com'); await p.keyboard.press('Enter'); await p.waitForSelector('.wl__styles')
    await p.waitForTimeout(400); await p.screenshot({ path: 'scripts/.shots/wl-4-style.jpg', type: 'jpeg', quality: 70 })
    await p.keyboard.press('c'); await p.click('.wl__add'); await p.waitForTimeout(150); await p.click('.wl__go .ap-btn--red'); await p.waitForSelector('.wl__up')
  })
  await step('upload a logo and two files, remove one', async () => {
    await p.setInputFiles('.wl__up > div:first-child input[type=file]', { name: 'logo.png', mimeType: 'image/png', buffer: png })
    await p.waitForSelector('.wl__up > div:first-child .wl__file')
    await p.setInputFiles('.wl__up > div:last-child input[type=file]', [{ name: 'shop.png', mimeType: 'image/png', buffer: png }, { name: 'menu.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n') }])
    await p.waitForFunction(() => document.querySelectorAll('.wl__up > div:last-child .wl__file').length === 2, null, { timeout: 20000 })
    await p.screenshot({ path: 'scripts/.shots/wl-5-files.jpg', type: 'jpeg', quality: 70 })
    await p.locator('.wl__up > div:last-child .wl__file button').first().click()
    await p.waitForFunction(() => document.querySelectorAll('.wl__up > div:last-child .wl__file').length === 1)
    await p.click('.wl__go .ap-btn'); await p.waitForSelector('textarea.wl__in')
  })
  await step('notes → done, the guide is gone, the studio has everything', async () => {
    // Hold an older poll until after the final save has committed.
    const snapshot = Promise.withResolvers(), release = Promise.withResolvers()
    await p.route('**/api/state/', async route => {
      const response = await route.fetch()
      snapshot.resolve()
      await release.promise
      await route.fulfill({ response })
    }, { times: 1 })
    await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
    const timer = setTimeout(() => snapshot.reject(new Error('Poll did not start')), 10000)
    try {
      await snapshot.promise
      const saved = p.waitForResponse(r => r.url() === origin + '/api/profile/' && r.request().method() === 'PATCH' && r.ok())
      await p.keyboard.type('No green.'); await p.keyboard.press('Enter')
      await saved
    } finally { clearTimeout(timer); release.resolve() }
    await p.waitForSelector('.wl__av--ok'); await p.waitForTimeout(500)
    await p.screenshot({ path: 'scripts/.shots/wl-6-done.jpg', type: 'jpeg', quality: 70 })
    const [u] = await sql`select brand from studio.users where email = ${email}`
    const x = u.brand.business
    if (!u.brand.onboarded || x.goals.join() !== '0,2' || x.style !== 2 || x.site !== 'wandacoffee.example.com' || x.notes !== 'No green.' || u.brand.colors.length !== 1) throw new Error(JSON.stringify(u.brand))
    const fl = await sql`select kind, name from studio.files f join studio.users u on u.id = f.user_id where u.email = ${email} order by name`
    if (fl.length !== 2 || !fl.some((f) => f.kind === 'brand' && f.name === 'logo.png')) throw new Error('files: ' + JSON.stringify(fl))
    await p.click('.wl__go .ap-btn--red'); await p.waitForSelector('.nr'); await p.keyboard.press('Escape')
    if (await p.locator('.wlc').count()) throw new Error('the card is still there')
    await p.reload({ waitUntil: 'load' }); await p.waitForSelector('.ov'); await p.waitForTimeout(600)
    if (await p.locator('.wl').count()) throw new Error('it opened again after finishing')
  })
  await ctx.close()

  await step('phone, Spanish, demo: opens, fits, choices work by tap', async () => {
    const c2 = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }); await human(c2)
    const q = await c2.newPage(); q.on('pageerror', (e) => errors.push(String(e)))
    await q.goto(origin + '/es/app/?demo', { waitUntil: 'load' }); await q.waitForSelector('.af')
    await q.fill('.af input[type=email]', 'ana@studio.test'); await q.fill('.af input[type=password]', 'x'); await q.click('.af button[type=submit]')
    await q.waitForSelector('.wl'); await q.locator('.wl__go .ap-btn--red').tap(); await q.waitForSelector('.wl__in')
    await q.fill('.wl__in', 'Café Ana'); await q.locator('.wl__go .ap-btn--red').tap()
    await q.waitForFunction(() => /Café Ana/.test(document.querySelector('.wl__h')?.textContent ?? '')); await q.fill('.wl__in', 'Vendemos café.'); await q.locator('.wl__go .ap-btn--red').tap()
    await q.waitForSelector('.wl__opts--2'); await q.waitForTimeout(400); await q.screenshot({ path: 'scripts/.shots/wl-7-mobile.jpg', type: 'jpeg', quality: 70 })
    const over = await q.evaluate(() => document.querySelector('.wl').scrollWidth - innerWidth); if (over > 2) throw new Error('overflows by ' + over)
    await q.locator('.wl__opt').first().tap(); await q.waitForSelector('textarea.wl__in')
    await q.locator('.wl__skip').tap()
    await q.getByRole('heading', { name: /próximos tres meses/ }).waitFor()
    await q.locator('.wl__x').tap()
    await q.reload(); await q.locator('.wlc .ap-btn').tap()
    await q.getByRole('heading', { name: /próximos tres meses/ }).waitFor()
    await q.locator('.wl__opt').first().tap(); await q.locator('.wl__go .ap-btn').tap()
    await q.locator('.wl__fields').waitFor(); await q.locator('.wl__skip').tap()
    await q.locator('.wl__style').first().tap(); await q.locator('.wl__go .ap-btn').tap()
    await q.locator('.wl__up').waitFor(); await q.locator('.wl__x').tap()
    await q.reload(); await q.locator('.wlc .ap-btn').tap(); await q.locator('.wl__up').waitFor()
    await c2.close()
  })
} finally {
  if (created) await sql`delete from studio.users where email = ${email}`
  const [{ n }] = await sql`select count(*)::int as n from studio.users where email = ${email}`
  steps.push(['cleanup', n === 0 ? 'ok' : 'FAIL'])
  await b.close()
}
console.table(steps)
console.log(errors.length ? errors.slice(0, 4).join('\n') : 'no errors')
if (errors.length || steps.some((s) => s[1] !== 'ok')) process.exitCode = 1
