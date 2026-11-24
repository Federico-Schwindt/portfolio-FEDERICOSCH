// The client app against the real API and Neon: sign up at checkout, reserve a plan (no payment provider yet),
// add requests, get activated, see the queue run, then the studio screens. Uses a throwaway account and deletes it.
import { chromium } from 'playwright-core'
import { neon } from '@neondatabase/serverless'
if (!process.env.DATABASE_URL) process.loadEnvFile()
const sql = neon(process.env.DATABASE_URL)
const origin = 'http://localhost:' + Number(process.argv[2] || 4330)
const email = `ui-${Date.now()}@example.com`
const mate = `ui-mate-${Date.now()}@example.com`
const adminEmail = `ui-admin-${Date.now()}@example.com`, uname = `ui.check.${Date.now() % 100000}`
const b = await chromium.launch({ channel: 'chrome', headless: true })
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const created = new Set()
function trackSignup(page, address) {
  page.on('response', r => {
    if (r.ok() && r.url() === origin + '/api/auth/signup/' && r.request().method() === 'POST') created.add(address)
  })
}
trackSignup(p, email)
const errs = []; p.on('pageerror', (e) => errs.push(String(e)))
const shot = (n) => p.screenshot({ path: `scripts/.shots/live-${n}.jpg`, type: 'jpeg', quality: 62, mask: [p.locator('.tm__link input')] })
const steps = []
const step = async (name, fn) => { try { await fn(); steps.push([name, 'ok']) } catch (e) { steps.push([name, 'FAIL ' + String(e).split('\n')[0]]) } }
try {
  await step('the studio creates the account', async () => {
    // an admin made the way Federico's account works: created, then promoted, then it creates the client
    const api = async (path, method, body, cookie = '') => { const r = await fetch(origin + '/api/' + path, { method, headers: { 'content-type': 'application/json', 'x-studio': '1', origin, cookie }, body: body ? JSON.stringify(body) : undefined }); return { r, data: await r.json().catch(() => null) } }
    const s = await api('auth/signup/', 'POST', { email: adminEmail, password: 'ui check admin', name: 'UI Studio' })
    if (s.r.status !== 200) throw new Error('admin sign-up ' + s.r.status + ' (start the preview with ALLOW_SIGNUP=1)')
    created.add(adminEmail)
    await sql`update studio.users set role = 'admin' where email = ${adminEmail}`
    const cookie = s.r.headers.get('set-cookie').split(';')[0]
    const c = await api('admin/users/', 'POST', { name: 'UI Check', username: uname, email, password: 'ui check password', role: 'client', company: 'UI Check Co', plan: 'grow' }, cookie)
    if (c.r.status !== 200) throw new Error('create user ' + c.r.status + ' ' + JSON.stringify(c.data))
    created.add(email)
    // the plan starts on hold, so the queue can be reordered before the studio switches it on
    await sql`update studio.subscriptions set status = 'pending' where user_id = (select id from studio.users where email = ${email})`
  })
  await step('client signs in with the username', async () => { await p.goto(origin + '/app/', { waitUntil: 'load' }); await p.waitForSelector('.af'); if (await p.locator('.ap-demo').count()) throw new Error('demo mode'); await p.fill('.af input[autocomplete=username]', uname); await p.fill('.af input[type=password]', 'ui check password'); await p.click('.af button[type=submit]'); await p.waitForSelector('.ov', { timeout: 15000 }); await p.waitForTimeout(800); await shot('3-overview-pending') })
  await step('three requests', async () => {
    for (const [t, k] of [['Homepage redesign', 9], ['Logo refresh', 9], ['Booking automation', 9]]) {
      await p.keyboard.press('n'); await p.waitForSelector('.nr')
      await p.click(`.nr__kinds button:nth-child(${k})`); await p.fill('.nr__f input', t)
      await p.click('.nr__f2 .ap-btn'); await p.waitForSelector('.dr', { timeout: 15000 }); await p.keyboard.press('Escape'); await p.waitForTimeout(400)
    }
  })
  await step('tap to start next, on a phone, survives a reload', async () => {
    await p.setViewportSize({ width: 390, height: 844 })
    await p.evaluate(() => (location.hash = '/board')); await p.waitForSelector('.kb__col--queued .kc')
    const last = p.locator('.kb__col--queued .kc', { hasText: 'Booking automation' })
    await last.locator('.kc__mvn').click()
    // Reload only after the board acknowledges that it saved the new queue order.
    await p.locator('.ap-toast', { hasText: 'Moved to the front of your queue' }).waitFor()
    await p.reload({ waitUntil: 'load' }); await p.waitForSelector('.kb__col--queued .kc')
    const first = await p.locator('.kb__col--queued .kc__t').first().textContent()
    await shot('4b-mobile-queue')
    await p.setViewportSize({ width: 1440, height: 900 })
    if (first !== 'Booking automation') throw new Error(`first is ${first}`)
  })
  await step('activated by the studio → queue runs', async () => {
    if (!created.has(email)) throw new Error('Test account was not created')
    await sql`update studio.subscriptions set status = 'active' where user_id = (select id from studio.users where email = ${email})`
    await p.evaluate(() => (location.hash = '/overview')); await p.reload({ waitUntil: 'load' }); await p.waitForSelector('.slot', { timeout: 15000 }); await p.waitForTimeout(1200)
    const n = await p.locator('.slot:not(.slot--free)').count()
    if (n !== 3) throw new Error(`${n} running`)
    await shot('4-overview-active')
  })
  await step('board', async () => { await p.evaluate(() => (location.hash = '/board')); await p.waitForSelector('.kb'); await p.waitForTimeout(700); await shot('5-board') })
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  await step('attach a file in a request', async () => {
    await p.locator('.kb__col--active .kc__open').first().click(); await p.waitForSelector('.dr .dz')
    await p.setInputFiles('.dr .dz input[type=file]', { name: 'moodboard.png', mimeType: 'image/png', buffer: png })
    await p.waitForSelector('.dr .ft', { timeout: 15000 }); await p.waitForTimeout(500); await shot('5b-drawer-file')
    await p.keyboard.press('Escape')
  })
  await step('files library + upload', async () => {
    await p.evaluate(() => (location.hash = '/files')); await p.waitForSelector('.fl')
    await p.setInputFiles('.fl .dz input[type=file]', { name: 'brand-guide.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\n%test\n') })
    await p.waitForFunction(() => document.querySelectorAll('.fl__grid .ft').length >= 2, null, { timeout: 15000 }); await p.waitForTimeout(400); await shot('5c-files')
  })
  await step('invite a teammate, who joins from the link', async () => {
    await p.evaluate(() => (location.hash = '/team')); await p.waitForSelector('.tm')
    await p.fill('.tm__form input[type=email]', mate); await p.click('.tm__form button[type=submit]')
    await p.waitForSelector('.tm__link input'); const link = await p.inputValue('.tm__link input'); await p.waitForTimeout(400); await shot('5d-team')
    const q = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
    trackSignup(q, mate)
    await q.goto(link, { waitUntil: 'load' }); await q.waitForSelector('.af__invite')
    await q.waitForFunction((m) => document.querySelector('.af input[type=email]')?.value === m, mate, { timeout: 10000 })
    await q.fill('.af input[autocomplete=name]', 'Mate Check'); await q.fill('.af input[type=password]', 'ui check password'); await q.click('.af button[type=submit]')
    await q.waitForSelector('.ov', { timeout: 15000 })
    if (new URL(q.url()).searchParams.has('invite')) throw new Error('invite left in the address')
    await q.evaluate(() => (location.hash = '/billing')); await q.waitForSelector('.tm__billing')
    if (await q.locator('.bl__start button, .bl button.ap-btn--red').count()) throw new Error('member can pay')
    await q.evaluate(() => (location.hash = '/board')); await q.waitForSelector('.kb'); const n = await q.locator('.kb .kc, .kb [data-id]').count()
    await q.screenshot({ path: 'scripts/.shots/live-5e-teammate.png' }); await q.context().close()
    if (!n) throw new Error('teammate sees no requests')
    await p.evaluate(() => (location.hash = '/files')); await p.waitForSelector('.fl')
  })
  await step('pin a point on an image', async () => {
    const sharp = (await import('sharp')).default
    const img = await sharp({ create: { width: 800, height: 500, channels: 3, background: '#f3e2cc' } }).composite([{ input: Buffer.from('<svg width="800" height="500"><rect x="60" y="60" width="300" height="80" fill="#f01111"/><rect x="60" y="180" width="680" height="24" fill="#0b0b0b"/><rect x="60" y="230" width="520" height="24" fill="#0b0b0b"/></svg>'), top: 0, left: 0 }]).png().toBuffer()
    await p.setInputFiles('.fl .dz input[type=file]', { name: 'homepage-v1.png', mimeType: 'image/png', buffer: img })
    await p.waitForFunction(() => document.querySelectorAll('.fl__grid .ft').length >= 3, null, { timeout: 15000 })
    await p.locator('.fl__grid .ft', { hasText: 'homepage-v1.png' }).locator('.ft__prev').click()
    await p.waitForSelector('.pv__img img'); await p.waitForTimeout(500)
    const box = await p.locator('.pv__img img').boundingBox()
    await p.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.2)
    await p.fill('.pin-new__box textarea', 'Make the headline block bigger')
    await p.click('.pin-new__box .ap-btn--red')
    await p.waitForSelector('.pv__side li', { timeout: 15000 }); await p.waitForTimeout(400); await shot('5c2-pins')
    await p.keyboard.press('Escape'); await p.locator('.pv').waitFor({ state: 'detached' })
  })
  await step('reports', async () => { await p.evaluate(() => (location.hash = '/reports')); await p.waitForSelector('.rp'); await p.waitForTimeout(500); await shot('5d-reports') })
  await step('updates + shortcuts', async () => { await p.click('.up__btn'); await p.waitForSelector('.up__panel'); await p.waitForTimeout(300); await shot('5e-updates'); await p.click('.up__btn'); await p.keyboard.press('?'); await p.waitForSelector('.hp'); await shot('5f-help'); await p.keyboard.press('Escape'); await p.click('.hp .dr__x').catch(() => {}) })
  await step('studio screens', async () => {
    if (!created.has(email)) throw new Error('Test account was not created')
    await sql`update studio.users set role = 'admin' where email = ${email}`
    await p.reload({ waitUntil: 'load' }); await p.evaluate(() => (location.hash = '/admin/clients')); await p.waitForSelector('.adm__table table', { timeout: 15000 }); await p.waitForTimeout(500); await shot('6-clients')
    await p.evaluate(() => (location.hash = '/admin/payments')); await p.waitForSelector('.bk__fields select'); await p.waitForTimeout(400); await shot('7-payments')
  })
  await step('sign out', async () => { await p.evaluate(() => (location.hash = '/overview')); await p.waitForSelector('.ap-side__foot'); await p.locator('.ap-side__foot button').last().click(); await p.waitForSelector('.lg__card', { timeout: 10000 }); await shot('8-login') })
} finally {
  for (const address of created) await sql`delete from studio.users where email = ${address}`
  const left = await sql`select count(*)::int n from studio.users where email = any(${[...created]}::text[])`
  steps.push(['cleanup', left[0].n === 0 ? 'ok' : `FAIL ${left[0].n}`])
}
console.table(steps)
console.log(errs.length ? errs.slice(0, 5) : 'no errors')
await b.close()
if (errs.length || steps.some(([, result]) => result.startsWith('FAIL'))) process.exitCode = 1
