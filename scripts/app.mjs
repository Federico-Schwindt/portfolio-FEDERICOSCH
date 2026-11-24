// Client app, demo mode, end to end: sign in → dashboard → new request → board → drawer → billing → studio view.
import { chromium } from 'playwright-core'
const lang = process.argv[2] === 'es' ? 'es/' : ''
const theme = process.argv[3] || 'light'
const base = 'http://localhost:' + Number(process.env.STUDIO_TEST_PORT || 4330) + '/' + lang
const b = await chromium.launch({ channel: 'chrome', headless: true })
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } })
await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t) } catch {} }, theme)
const p = await ctx.newPage()
const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
const shot = (n) => p.screenshot({ path: `scripts/.shots/app-${lang ? 'es-' : ''}${theme}-${n}.jpg`, type: 'jpeg', quality: 62 })
const steps = []
const step = async (name, fn) => { try { await fn(); steps.push([name, 'ok']) } catch (e) { steps.push([name, 'FAIL ' + String(e).split('\n')[0]]) } }

await step('sign in (demo)', async () => { await p.goto(base + 'app/?demo', { waitUntil: 'load' }); await p.waitForSelector('.af'); await shot('1-login'); await p.fill('.af input[autocomplete=username]', 'ana@studio.test'); await p.fill('.af input[type=password]', 'demo'); await p.click('.af button[type=submit]') })
await step('dashboard', async () => { await p.waitForSelector('.eng'); await p.waitForTimeout(1600); await shot('5-overview') })
await step('new request', async () => {
  await p.keyboard.press('n'); await p.waitForSelector('.nr'); await p.waitForTimeout(400)
  // a fix: the brief asks for the page, the device, what happens and what should happen
  await p.click('.nr__kinds button:nth-child(6)')
  await p.fill('.nr__f input', 'Contact form does not send on iPhone')
  await p.click('.nr__f2 .ap-btn'); await p.waitForSelector('.nr__miss'); await shot('6a-missing')
  const qs = p.locator('.nr__q')
  await qs.nth(0).locator('input').fill('https://example.com/contact')
  await qs.nth(1).locator('button').first().click()
  await qs.nth(2).locator('textarea').fill('The Send button does nothing')
  await qs.nth(3).locator('input').fill('It sends and shows a thank-you message')
  await p.click('.nr__ai .ap-btn'); await p.waitForSelector('.nr__check li'); await p.waitForTimeout(500); await shot('6-new')
  await p.click('.nr__f2 .ap-btn'); await p.waitForSelector('.dr'); await p.waitForTimeout(900); await shot('7-drawer')
})
await step('board', async () => { await p.keyboard.press('Escape'); await p.waitForTimeout(500); await p.evaluate(() => (location.hash = '/board')); await p.waitForSelector('.kb'); await p.waitForTimeout(900); await shot('8-board') })
await step('review drawer + approve', async () => { const c = p.locator('.kb__col--review .kc__open').first(); if (await c.count()) { await c.click(); await p.waitForSelector('.dr__review'); await p.waitForTimeout(600); await shot('9-review'); await p.click('.dr__review .ap-btn--red'); await p.waitForTimeout(700) } })
await step('palette', async () => { await p.keyboard.press('Escape'); await p.keyboard.press('Control+k'); await p.waitForSelector('.pl'); await p.keyboard.type('land'); await p.waitForTimeout(300); await shot('10-palette'); await p.keyboard.press('Escape') })
await step('billing', async () => { await p.evaluate(() => (location.hash = '/billing')); await p.waitForSelector('.bl-now'); await p.waitForTimeout(600); await shot('11-billing') })
await step('change plan in three steps, pay, applied', async () => {
  const cur = await p.locator('.bl-card.is-cur h3').innerText()
  const up = p.locator('.bl-card:not(.is-cur) .ap-btn--red').first(); if (!(await up.count())) return
  await up.click(); await p.waitForSelector('.bl-total__v'); await p.waitForTimeout(500); await shot('11b-review')
  await p.click('.bl-total__go'); await p.waitForSelector('.bl-demo', { timeout: 15000 }); await p.click('.bl-demo .ap-btn--red')
  await p.waitForFunction((c) => { const h = document.querySelector('.bl-card.is-cur h3'); return h && h.textContent !== c }, cur, { timeout: 10000 }); await p.waitForTimeout(400); await shot('11c-upgraded')
  if (!(await p.locator('.bl-inv tbody tr').count())) throw new Error('no invoice')
})
await step('studio view', async () => { await p.click('.ap-side__foot button:first-child'); await p.waitForTimeout(400); await p.evaluate(() => (location.hash = '/admin')); await p.waitForSelector('.kb'); await p.waitForTimeout(800); await shot('12-admin') })
await step('deliver from the board and prepare a bilingual review notice', async () => {
  const card = p.locator('.kb__col--active .kc').first()
  const title = await card.locator('.kc__t').innerText()
  await card.locator('.kc__adv').click()
  const notice = p.locator('.dr__notice')
  await notice.waitFor()
  const id = new URL(p.url()).hash.split('/').pop()
  for (const language of ['es', 'en']) {
    await notice.locator('select').selectOption(language)
    const body = await notice.locator('textarea').inputValue()
    const path = language === 'es' ? '/es/app/' : '/app/'
    const link = new URL(body.match(/^https?:\/\/.+$/m)[0])
    if (link.pathname !== path || link.hash !== '#/request/' + id || !link.searchParams.has('demo')) throw new Error('Wrong demo review link')
    if (!body.includes(title) || !body.includes(language === 'es' ? 'aprobarla' : 'approve it')) throw new Error('Wrong review message')
  }
  await p.keyboard.press('Escape')
})
await step('brand kit', async () => { await p.evaluate(() => (location.hash = '/brand')); await p.waitForSelector('.bk__grid'); await p.waitForTimeout(500); await shot('13-brand') })
await step('mobile image reviews stay on the selected version', async () => {
  // Upload through the studio drawer, then review those same versions as the client.
  await p.evaluate(() => (location.hash = '/admin'))
  await p.locator('.kb__col--review .kc__open').first().click()
  const id = new URL(p.url()).hash.split('/').pop()
  const sharp = (await import('sharp')).default
  const buffer = await sharp({ create: { width: 800, height: 500, channels: 3, background: '#f3e2cc' } }).png().toBuffer()
  const names = ['mobile-review-v1.png', 'mobile-review-v2.png']
  const tile = (name) => p.locator('.dr__deliv2 .ft').filter({ hasText: name }).locator('.ft__prev')
  for (const name of names) {
    await p.setInputFiles('.dr .dz input', { name, mimeType: 'image/png', buffer })
    await tile(name).waitFor()
  }
  await p.keyboard.press('Escape')
  await p.locator('.ap-side__foot button').first().click()
  await p.setViewportSize({ width: 390, height: 844 })
  await p.evaluate((id) => (location.hash = '/board/' + id), id)
  await tile(names[0]).click()
  const image = p.locator('.pv__img img')
  const markCorner = async () => {
    await image.waitFor()
    const box = await image.boundingBox()
    await image.click({ position: { x: box.width - 4, y: box.height - 4 } })
  }
  const note = p.locator('.pin-new__box textarea')
  await markCorner()
  await note.fill('Only for the first version')
  const save = p.locator('.pin-new__box button[type=submit]')
  const bounds = await save.boundingBox()
  if (!bounds || bounds.x < 0 || bounds.y < 0 || bounds.x + bounds.width > 390 || bounds.y + bounds.height > 844) throw new Error('Save button outside viewport')
  await save.click()
  await p.locator('.pv__side li').filter({ hasText: 'Only for the first version' }).waitFor()
  await image.click()
  await note.fill('Unsent draft')
  await p.locator('.pv .dr__x').click()
  await tile(names[1]).click()
  if (await note.count() || await p.locator('.pv__side li').count()) throw new Error('Version inherited a draft or pin')
  await markCorner()
  await p.keyboard.press('Escape')
  await note.waitFor({ state: 'detached' })
  await p.keyboard.press('Escape')
  await p.locator('.pv').waitFor({ state: 'detached' })
  await p.locator('.dr').waitFor()
  await p.keyboard.press('Escape')
  await p.evaluate(() => (location.hash = '/files'))
  await p.locator('.fl__grid .ft').filter({ hasText: names[0] }).locator('.ft__prev').click()
  await p.locator('.pv__side li').filter({ hasText: 'Only for the first version' }).waitFor()
  if (await note.count()) throw new Error('Library reopened an abandoned draft')
  await p.keyboard.press('Escape')
})
await step('queue rule: active never above slots', async () => {
  const r = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('fs-demo-v1')); const slots = { launch: 2, grow: 4, scale: 6 }[s.sub.plan]; return { active: s.reqs.filter((x) => x.status === 'active').length, slots, queued: s.reqs.filter((x) => x.status === 'queued').length } })
  if (r.active > r.slots) throw new Error(JSON.stringify(r))
  steps.push(['  queue', JSON.stringify(r)])
})
await step('mobile', async () => { await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => (location.hash = '/overview')); await p.waitForTimeout(900); await shot('14-mobile') })
console.table(steps)
console.log(errs.length ? errs.slice(0, 5) : 'no errors')
await b.close()
if (errs.length || steps.some(([, result]) => result.startsWith('FAIL'))) process.exitCode = 1
