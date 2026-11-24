// Demo by default. workflow-check --suite also runs the live cases inside its disposable Neon schema.
import assert from 'node:assert/strict'
import { randomUUID, scryptSync } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { chromium } from 'playwright-core'

const origin = 'http://localhost:' + Number(process.argv[2] || 4366)
const live = process.argv.includes('--live')
const ids = { owner: randomUUID(), member: randomUUID(), studio: randomUUID(), outsider: randomUUID() }
const password = randomUUID()
const email = role => ids[role] + '@example.com'
const username = role => 'qa-' + ids[role].slice(0, 12)
const reqs = Array.from({ length: 7 }, (_, i) => ({
  id: randomUUID(), owner: ids.owner, number: i + 1, title: 'Artwork ' + (i + 1), kind: 'design',
  brief: '', checklist: [], files: [], priority: 2, progress: 0, status: i === 6 ? 'done' : 'queued',
  position: i + 1, createdAt: '2026-01-01T00:00:00Z', startedAt: null, reviewAt: null, doneAt: null,
}))
const main = reqs[0]
const messages = reqs.map((r, i) => ({ id: randomUUID(), requestId: r.id, who: 'studio', kind: 'comment',
  body: 'Which artwork goes to print? ' + r.title, at: new Date(Date.UTC(2026, 0, 8 - i)).toISOString() }))
messages.push({ ...messages[5], id: randomUUID(), who: 'client', kind: 'changes', body: 'Please change the blue.', at: '2026-01-09T00:00:00Z' })
const browser = await chromium.launch({ channel: 'chrome' })
const created = []
let db

async function context(role, es, width, theme, demo, empty = false) {
  const ctx = await browser.newContext({ baseURL: origin, viewport: { width, height: width === 390 ? 844 : 900 } })
  const user = { id: ids[role], account: ids.owner, member: role === 'member', role: 'client', name: role, email: email(role), brand: {} }
  const fixture = demo && { user, reqs: empty ? [] : reqs, events: empty ? [] : messages, invoices: [], sub: null, seq: 7 }
  await ctx.addInitScript(({ fixture, theme, empty }) => {
    if (empty) Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false })
    localStorage.setItem('theme', theme)
    if (fixture && !localStorage.getItem('fs-demo-v1')) localStorage.setItem('fs-demo-v1', JSON.stringify(fixture))
  }, { fixture, theme, empty })
  if (!demo && !empty) {
    const login = await ctx.request.post('/api/auth/login/', { data: { email: email(role), password }, headers: { 'x-studio': '1', origin } })
    assert.equal(login.status(), 200, 'existing test account signs in')
  }
  const page = await ctx.newPage()
  page.setDefaultTimeout(8000)
  const path = (es ? '/es' : '') + '/app/' + (demo ? '?demo' : '')
  return { ctx, page, path }
}

async function firstVisit(demo) {
  const { ctx, page, path } = await context('owner', true, 390, 'dark', demo, true)
  await page.goto(path)
  if (!demo) {
    const login = page.locator('.af input[autocomplete=username], .af input[type=email]')
    await login.waitFor()
    const privateLogin = await login.getAttribute('autocomplete') === 'username'
    await login.fill(privateLogin ? username('owner') : email('owner'))
    await page.locator('.af input[type=password]').fill(password)
    await page.locator('.af button[type=submit]').click()
    await page.locator('.ov').waitFor()
    console.log('OK · first visit with an existing', privateLogin ? 'username' : 'email')
  }
  await page.locator('.wl .wl__x').click()
  await page.getByText('Envía tu primer pedido a Federico.', { exact: false }).waitFor()
  assert.equal(await page.locator('.onb__list li').count(), 3)
  await page.locator('.onb').getByRole('button', { name: 'Envía tu primer pedido' }).click()
  await page.getByRole('dialog').waitFor()
  await page.locator('.nr__kinds button').last().click()
  await page.locator('.nr__f input').fill('Primera pieza para imprenta')
  await page.locator('.nr button[type=submit]').click()
  await page.locator('.dr').getByRole('heading', { name: 'Primera pieza para imprenta' }).waitFor()
  await page.locator('.dr .pill--queued').waitFor()
  await ctx.close()
}

async function exercise(demo, es, width, theme, role) {
  const { ctx, page, path } = await context(role, es, width, theme, demo)
  const errors = []
  page.on('pageerror', e => errors.push(e.name))
  if (!demo) {
    await db`insert into studio.request_events (request_id,user_id,author,kind,body)
      values (${main.id},${ids.owner},${ids.studio},'comment',${messages[0].body})`
    // A newer status event does not answer a message, even when the message is outside /state's 400 events.
    await db`insert into studio.request_events (request_id,user_id,kind,body)
      select ${reqs[6].id},${ids.owner},'status','queued' from generate_series(1,405)`
    await page.route('**/api/studio/messages/**', route => route.fulfill({ status: 503 }), { times: 1 })
  }
  await page.goto(path)
  const panel = page.getByRole('region', { name: es ? 'Mensajes de Federico' : 'Messages from Federico' })
  if (!demo) await panel.getByRole('alert').getByRole('button').click()
  await panel.getByText(messages[0].body, { exact: true }).waitFor()
  assert.equal(await panel.locator('li').count(), 3)
  await panel.getByRole('button', { name: es ? 'Mostrar 2 más' : 'Show 2 more' }).click()
  assert.equal(await panel.locator('li').count(), 5)
  assert.equal(await panel.getByText(messages[5].body).count(), 0)
  const row = panel.locator('li').filter({ hasText: main.title })
  assert.equal(await row.getByRole('link').getAttribute('href'), '#/request/' + main.id)
  await row.getByRole('button').focus()
  await page.keyboard.press('Enter')
  const editor = panel.getByRole('textbox')
  assert.equal(await editor.evaluate(el => el === document.activeElement), true)
  const answer = 'Use artwork 1 · ' + randomUUID()
  await editor.fill(answer)
  if (!demo) {
    await page.route('**/api/studio/messages/**', route => route.request().method() === 'POST'
      ? route.fulfill({ status: 503 }) : route.continue(), { times: 1 })
    await panel.getByRole('button', { name: es ? 'Enviar' : 'Send', exact: true }).click()
    await panel.getByRole('alert').waitFor()
    assert.equal(await editor.inputValue(), answer)
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'viewport fits')
  await panel.getByRole('button', { name: es ? 'Enviar' : 'Send', exact: true }).click()
  await editor.waitFor({ state: 'detached' })
  await row.waitFor({ state: 'detached' })
  await page.goto(path + '#/request/' + main.id)
  await page.locator('.dr-page .tl__msg').getByText(answer, { exact: true }).waitFor()
  if (!demo) {
    const [saved] = await db`select count(*)::int as n from studio.request_events
      where request_id=${main.id} and user_id=${ids.owner} and author=${ids[role]} and body=${answer}`
    assert.equal(saved.n, 1)
  }
  assert.deepEqual(errors, [])
  await ctx.close()
  console.log('OK', demo ? 'demo' : 'Neon', es ? 'es' : 'en', width, theme, role)
}

async function prepare() {
  assert.match(process.env.STUDIO_TEST_SCHEMA ?? '', /^studio_test_[a-f0-9]{32}$/)
  db = neon(process.env.DATABASE_URL)
  const [schema] = await db`select n.nspname as name from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.oid='studio.users'::regclass`
  assert.equal(schema.name, process.env.STUDIO_TEST_SCHEMA)
  const salt = Buffer.from(randomUUID())
  const hash = ['scrypt', salt.toString('base64'), scryptSync(password, salt, 64).toString('base64')].join('$')
  for (const [role, id] of Object.entries(ids)) {
    await db`insert into studio.users (id,email,password_hash,full_name,role,account_id) values
      (${id},${email(role)},${hash},${role},${role === 'studio' ? 'admin' : 'client'},${role === 'member' ? ids.owner : null})`
    created.push(id)
  }
  await db`update studio.users set username=${username('owner')} where id=${ids.owner}`
  await firstVisit(false)
  for (const r of reqs) await db`insert into studio.requests (id,user_id,title,status) values (${r.id},${r.owner},${r.title},${r.status})`
  for (const e of messages) await db`insert into studio.request_events (id,request_id,user_id,author,kind,body,created_at)
    values (${e.id},${e.requestId},${ids.owner},${e.who === 'studio' ? ids.studio : ids.member},${e.kind},${e.body},${e.at})`
}

async function permissions() {
  const client = async role => {
    const { ctx } = await context(role, false, 1440, 'light', false)
    const account = role === 'member' ? ids.owner : ids[role]
    const url = '/api/studio/messages/?viewer=' + encodeURIComponent(ids[role] + '/' + account)
    return { ctx, url, send: data => ctx.request.post(url, { data, headers: { 'x-studio': '1', origin } }) }
  }
  const owner = await client('owner'), member = await client('member'), outsider = await client('outsider')
  const data = { eventId: messages[1].id, requestId: reqs[1].id, text: 'Confirmed by the team' }
  const anonymous = await browser.newContext({ baseURL: origin })
  assert.equal((await anonymous.request.get(owner.url)).status(), 401)
  if (process.env.ALLOW_SIGNUP === '0') {
    const publicSignup = await anonymous.request.post('/api/auth/signup/', {
      data: { email: email('outsider'), name: 'QA', password }, headers: { 'x-studio': '1', origin },
    })
    assert.equal(publicSignup.status(), 403, 'a private preview refuses public registration')
  }
  await anonymous.close()
  assert.equal((await outsider.ctx.request.get(owner.url)).status(), 409)
  assert.deepEqual(await (await outsider.ctx.request.get(outsider.url)).json(), [])
  assert.equal((await outsider.send(data)).status(), 409)
  assert.equal((await owner.ctx.request.post(owner.url, { data })).status(), 403)
  assert.equal((await owner.send({ ...data, text: '  ' })).status(), 400)
  const results = await Promise.all([owner.send(data), member.send(data)])
  assert.deepEqual(results.map(r => r.status()).sort(), [200,409])
  const winner = results[0].ok() ? owner : member
  assert.equal((await winner.send(data)).status(), 200)
  const [n] = await db`select count(*)::int as n from studio.request_events where request_id=${reqs[1].id} and body=${data.text}`
  assert.equal(n.n, 1)
  const { ctx, page, path } = await context('owner', true, 390, 'dark', false)
  await page.goto(path)
  const panel = page.locator('.studio-messages')
  await panel.getByRole('button', { name: 'Responder sobre ' + reqs[2].title }).click()
  const editor = panel.getByRole('textbox')
  await editor.fill('Mi respuesta en curso')
  assert.equal((await member.send({ eventId: messages[2].id, requestId: reqs[2].id, text: 'Already handled' })).status(), 200)
  await panel.getByRole('button', { name: 'Enviar', exact: true }).click()
  await panel.getByRole('alert').getByRole('link', { name: 'Abrir página completa' }).waitFor()
  assert.equal(await editor.inputValue(), 'Mi respuesta en curso')
  assert.ok(await panel.getByRole('button', { name: 'Enviar', exact: true }).isDisabled())
  await ctx.close()
  console.log('OK · account isolation, concurrent replies, retry after acknowledgement loss')
}

try {
  if (live) await prepare()
  else await firstVisit(true)
  for (const es of [false, true]) for (const width of [390, 1440]) for (const theme of ['light', 'dark']) {
    await exercise(!live, es, width, theme, theme === 'dark' ? 'member' : 'owner')
  }
  if (live) await permissions()
} finally {
  await browser.close()
  if (created.length) await db`delete from studio.users where id=any(${created}::uuid[]) and email=any(${Object.keys(ids).map(email)}::text[])`
}
