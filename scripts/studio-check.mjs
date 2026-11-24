// Run against a local preview. Only accounts created by this run can own fixture rows.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { chromium } from 'playwright-core'

if (!process.env.DATABASE_URL) process.loadEnvFile()
const db = neon(process.env.DATABASE_URL)
const origin = 'http://localhost:' + Number(process.argv[2] ?? 4330)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const run = randomUUID()
const created = []
const zone = 'America/Argentina/Buenos_Aires'
const context = () => browser.newContext({ baseURL: origin, timezoneId: zone })
const headers = { 'x-studio': '1', origin }
let checks = 0
function check(name, condition) { assert.ok(condition, name); console.log('ok', ++checks, name) }
async function account(label) {
  const ctx = await context()
  const email = `ops-${label}-${run}@example.com`
  const r = await ctx.request.post('/api/auth/signup/', { headers, data: { email, password: randomUUID(), name: 'Ops ' + label } })
  assert.equal(r.status(), 200, 'fixture signup')
  created.push(email)
  const [{ id }] = await db`select id from studio.users where email = ${email}`
  return { ctx, email, id }
}
try {
  const admin = await account('studio'), owner = await account('owner'), other = await account('other')
  const member = await account('teammate')
  await db`update studio.users set account_id = ${owner.id} where id = ${member.id}`
  await db`update studio.users set role = 'admin' where id = ${admin.id}`
  const metrics = async () => {
    const r = await admin.ctx.request.get('/api/studio/metrics/', { params: { tz: zone } })
    assert.equal(r.status(), 200, 'metrics response')
    return r.json()
  }
  // Other checkouts can run concurrently on the shared preview. Measure their contribution around
  // each API read, excluding our fixtures, and only compare snapshots when those totals are stable.
  const background = async () => {
    const [[plans], [work]] = await db.transaction([
      db`select coalesce(sum(p.monthly_cents / 100.0 + case when s.addon_community then 1000 else 0 end) filter (where status='active'), 0)::float8 as mrr,
          coalesce(sum(p.active_slots) filter (where status in ('active','building')),0)::int as capacity,
          count(*) filter (where status='active')::int as active, count(*) filter (where status='paused')::int as paused,
          count(*) filter (where status='pending')::int as pending, count(*) filter (where status='active' and p.id='grow')::int as grow,
          count(*) filter (where status='active' and p.id='scale')::int as scale
        from studio.subscriptions s join studio.plans p on p.id=s.plan_id join studio.users u on u.id=s.user_id
        where u.role='client' and u.account_id is null and u.id not in (${owner.id}, ${other.id})`,
      db`with r as (select r.*, date_trunc('week',now() at time zone ${zone})::date - (r.done_at at time zone ${zone})::date as days_back
        from studio.requests r join studio.users u on u.id=r.user_id where u.role='client' and u.account_id is null
          and u.id not in (${owner.id}, ${other.id}))
        select count(*) filter (where status='active')::int as used,
          count(*) filter (where status in ('active','queued') and due_date < (now() at time zone ${zone})::date)::int as overdue,
          count(*) filter (where status='done' and days_back between 1 and 7)::int as previous,
          count(started_at) filter (where status='done' and days_back <= 49 and done_at <= now())::int as timed,
          coalesce(sum(greatest(0, extract(epoch from (coalesce(review_at, done_at) - started_at)))) filter (where status='done' and days_back <= 49 and done_at <= now()),0)::float8 / 86400 as days from r`,
    ], { isolationLevel: 'RepeatableRead', readOnly: true })
    return { ...plans, ...work }
  }
  const snapshot = async () => {
    for (let i = 0; i < 8; i++) {
      const before = await background(), result = await metrics(), after = await background()
      if (JSON.stringify(before) === JSON.stringify(after)) return [result, after]
    }
    throw new Error('Studio totals changed during all eight comparison reads')
  }
  const profile = '/api/studio/clients/' + owner.id + '/'
  const answers = { what: 'We repair ceramic lamps.', industry: 0, goals: [0, 1], style: 0 }
  const updateProfile = (ctx, data) => ctx.request.patch('/api/profile/', { headers, data })
  check('owner saves a welcome draft', (await updateProfile(owner.ctx, { company: 'Lamp workshop', brand: { business: answers } })).ok())
  check('member can update the shared kit', (await updateProfile(member.ctx, { brand: { colors: ['#123456'], fonts: 'Archivo' } })).ok())
  const draft = (await (await admin.ctx.request.get(profile)).json()).profile
  check('studio sees the owner’s saved answers and the updated kit together', draft.company === 'Lamp workshop' &&
    draft.brand.business.industry === 0 && draft.brand.business.what === answers.what && draft.brand.colors[0] === '#123456' && !draft.brand.onboarded)
  const simultaneous = await Promise.all([
    updateProfile(owner.ctx, { brand: { onboarded: true } }),
    updateProfile(member.ctx, { brand: { colors: ['#654321'] } }),
  ])
  const finished = (await (await admin.ctx.request.get(profile)).json()).profile
  check('concurrent completion and kit edit both persist', simultaneous.every(r => r.ok()) &&
    finished.brand.onboarded && finished.brand.colors[0] === '#654321' && finished.brand.business.what === answers.what)
  const oversized = await updateProfile(owner.ctx, { company: 'Discard this edit', brand: { notes: 'x'.repeat(7950) } })
  check('oversized combined kit leaves the rest of the profile intact', oversized.status() === 400 &&
    (await (await admin.ctx.request.get(profile)).json()).profile.company === 'Lamp workshop')
  const anon = await context()
  check('anonymous profile and metrics require sign-in', (await anon.request.get(profile)).status() === 401 && (await anon.request.get('/api/studio/metrics/')).status() === 401)
  check('client cannot read studio history or metrics', (await owner.ctx.request.get(profile)).status() === 403 && (await owner.ctx.request.get('/api/studio/metrics/')).status() === 403)
  check('team members cannot read notes or become separate client profiles', (await member.ctx.request.get(profile)).status() === 403 && (await admin.ctx.request.get('/api/studio/clients/' + member.id + '/')).status() === 404)
  check('missing account returns 404', (await admin.ctx.request.get('/api/studio/clients/' + randomUUID() + '/')).status() === 404)
  await db`insert into studio.subscriptions (user_id, plan_id, status, addon_community)
    values (${owner.id}, 'grow', 'active', true), (${other.id}, 'scale', 'building', true)`
  const title = 'Deadline ' + run
  const requests = await db`insert into studio.requests (user_id, created_by, title, due_date) values
    (${owner.id}, ${member.id}, ${title}, (now() at time zone ${zone})::date - 1),
    (${other.id}, ${other.id}, 'Due today', (now() at time zone ${zone})::date) returning id, user_id`
  const requestBrief = id => '/api/studio/requests/' + id + '/brief/'
  const requestId = requests.find(r => r.user_id === owner.id).id
  const otherRequest = requests.find(r => r.user_id === other.id).id
  const briefUrl = requestBrief(requestId)
  for (const [ctx, status] of [[anon, 401], [owner.ctx, 403], [member.ctx, 403], [other.ctx, 403]]) {
    assert.equal((await ctx.request.get(briefUrl)).status(), status)
  }
  check('studio looks up the request owner even for work submitted by a teammate',
    (await (await admin.ctx.request.get(briefUrl)).json()).owner === owner.id)
  const otherBrief = await (await admin.ctx.request.get(requestBrief(otherRequest))).json()
  check('a second account has its own brief and missing requests return 404', otherBrief.owner === other.id &&
    !otherBrief.brand.business && (await admin.ctx.request.get(requestBrief(randomUUID()))).status() === 404)
  await db`with dates as (select (date_trunc('week',now() at time zone ${zone}) at time zone ${zone}) - interval '1 day' as approved)
    insert into studio.requests (user_id, title, status, started_at, review_at, done_at, due_date)
    select ${owner.id}, 'Approved earlier', 'done', approved - interval '3 days', approved - interval '12 hours', approved, approved::date from dates`
  await db`insert into studio.requests (user_id, title, status) values (${owner.id}, 'Cancelled work', 'cancelled')`
  await db`insert into studio.files (user_id, uploaded_by, name, size, data) values (${owner.id}, ${member.id}, 'brand.txt', 4, 'demo'::bytea)`
  await db`insert into studio.invoices (user_id, label, amount_cents, currency) values (${owner.id}, 'Grow invoice', 15025, 'USD')`
  const [active, before] = await snapshot()
  check('only recurring active plan and community enter MRR', active.mrr - before.mrr === 1150)
  check('active plan mix and subscription count', active.mix.grow === before.grow + 1 && active.mix.scale === before.scale && active.clients.active === before.active + 1)
  check('builds add capacity and active requests use slots', active.capacity === before.capacity + 10 && active.used === before.used + 2)
  check('overdue excludes due today and approved', active.overdue === before.overdue + 1)
  const prev = active.weeks[6]
  check('eight Monday buckets, approval in previous week', active.weeks.length === 8 && prev.delivered === before.previous + 1 && new Date(prev.start).getUTCDay() === 1)
  check('delivery average stops at review, weighted by requests', Math.abs(active.avgDays - (before.days + 2.5) / (before.timed + 1)) < 0.00001)
  await db`update studio.subscriptions set status = 'paused' where user_id = ${other.id}`
  const [paused, otherPlans] = await snapshot()
  check('paused counted and capacity removed', paused.clients.paused === otherPlans.paused + 1 && paused.capacity === otherPlans.capacity + 4)
  await db`update studio.subscriptions set status = 'pending' where user_id = ${other.id}`
  const [pending, remaining] = await snapshot()
  check('pending activation counted', pending.clients.pending === remaining.pending + 1)

  const notesUrl = profile + 'notes/'
  const payload = { id: randomUUID(), body: 'Private handover ' + run }
  const save = (data, ctx = admin.ctx, h = headers) => ctx.request.post(notesUrl, { headers: h, data })
  check('only studio writes notes', (await save(payload, owner.ctx)).status() === 403)
  check('foreign origin refused', (await save(payload, admin.ctx, { ...headers, origin: 'https://example.com' })).status() === 403)
  check('empty and long notes refused', (await save({ ...payload, body: '  ' })).status() === 400 && (await save({ ...payload, body: 'x'.repeat(2001) })).status() === 400)
  check('note is idempotent on retry', (await save(payload)).ok() && (await save(payload)).ok() && (await save({ ...payload, body: 'Changed' })).status() === 409)
  const detail = await (await admin.ctx.request.get(profile)).json()
  check('owner profile lists its teammate and their request', detail.members.length === 1 && detail.members[0].email === member.email && detail.requests.some(r => r.title === title))
  check('profile includes cancelled history, files, invoices and note author', detail.requests.length === 3 && detail.requests.some(r => r.status === 'cancelled') && detail.files.length === 1 && detail.invoices[0].amount === 150.25 && detail.notes.length === 1 && detail.notes[0].author === 'Ops studio')
  const otherHistory = await (await admin.ctx.request.get('/api/studio/clients/' + other.id + '/')).json()
  check('other profile has its own empty brief', !otherHistory.profile.brand.business && !otherHistory.profile.brand.onboarded)
  check('accounts keep separate histories', !otherHistory.notes.length && !otherHistory.files.length && !otherHistory.invoices.length && otherHistory.requests.length === 1)
  check('client state has no internal note', !(await (await owner.ctx.request.get('/api/state/')).text()).includes(payload.body))
  // A teammate's score belongs to the delivery owner's account. Include an older delivery and an unanswered one.
  await db`insert into studio.requests (user_id, title, status, done_at) values
    (${owner.id}, 'Older delivery', 'done', now() - interval '120 days'),
    (${owner.id}, 'Awaiting feedback', 'done', now()),
    (${other.id}, 'Other delivery', 'done', now())`
  const deliveries = await db`select id, title from studio.requests where user_id in (${owner.id}, ${other.id}) and status='done'`
  const rate = (ctx, title, score, note) => ctx.request.post('/api/requests/' + deliveries.find(r => r.title === title).id + '/rating/', {
    headers, data: { score, note },
  })
  const feedback = 'Keep the new layout ' + run
  assert.ok((await rate(member.ctx, 'Approved earlier', 5, feedback)).ok())
  assert.ok((await rate(owner.ctx, 'Older delivery', 4)).ok())
  assert.ok((await rate(other.ctx, 'Other delivery', 1)).ok())
  const { ratingAccounts, ratings } = await metrics()
  const counts = ({ approved, rated, points }) => [approved, rated, points]
  assert.deepEqual(counts(ratingAccounts.find(r => r.id === owner.id)), [3, 2, 9])
  assert.deepEqual(counts(ratingAccounts.find(r => r.id === other.id)), [1, 1, 1])
  check('rated deliveries include older work and group teammate feedback under the owner', !ratingAccounts.some(r => r.id === member.id))
  assert.deepEqual(counts(ratings), [0, 1, 2].map(i => ratingAccounts.reduce((sum, a) => sum + counts(a)[i], 0)))
  check('global average weights each rating once', ratings.points > 0 && ratings.rated >= 3)
  const ratedProfile = await (await admin.ctx.request.get(profile)).json()
  check('profile keeps the rating and comment with the reviewed delivery',
    ratedProfile.requests.some(r => r.title === 'Approved earlier' && r.rating === 5 && r.ratingNote === feedback))
  const page = await admin.ctx.newPage()
  const errors = []
  page.on('pageerror', () => errors.push('page error'))
  for (const [prefix, width, label] of [['', 1440, 'Business'], ['/es', 390, 'Negocio']]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto(prefix + '/app/#/admin')
    await page.locator('.adm__filter select').selectOption(other.id)
    await page.getByRole('tab', { name: label }).click()
    await page.locator('.ops__weekly li').nth(7).waitFor()
    check(label + ' fits viewport', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    const ratingsCard = page.getByRole('region', { name: prefix ? 'Calificaciones de entregas' : 'Delivery ratings', exact: true })
    await ratingsCard.locator('summary').click()
    const ratingLink = ratingsCard.locator('a[href="#/admin/clients/' + owner.id + '"]')
    const row = ratingLink.locator('xpath=ancestor::tr')
    assert.deepEqual(await row.locator('td').allTextContents(), ['3', '2', prefix ? '4,5 / 5' : '4.5 / 5'])
    await ratingLink.click()
    const brief = page.getByRole('region', { name: prefix ? 'Ficha del negocio' : 'Business brief' })
    await brief.getByText(answers.what).waitFor()
    await brief.getByText(prefix ? 'Completada' : 'Completed', { exact: true }).waitFor()
    await brief.getByText(prefix ? 'Tienda o ecommerce' : 'Shop or ecommerce').waitFor()
    await brief.locator('summary').focus()
    await page.keyboard.press('Enter')
    const material = brief.getByRole('link', { name: 'brand.txt' })
    const file = await admin.ctx.request.get(await material.getAttribute('href'))
    check(label + ' client material downloads from the brief', file.ok() && (await file.text()) === 'demo')
    await page.getByText(feedback, { exact: true }).waitFor()
    check(label + ' rating links to the matching account and comment', page.url().endsWith('/clients/' + owner.id))
    await page.getByRole('tab', { name: label }).click()
    await page.locator('.ops__kpis a').click()
    await page.locator('.adm__priorities li').filter({ hasText: title }).locator('.ops__account-link').click()
    await page.locator('.ops__notes').getByText(payload.body).waitFor()
    await page.locator('.ops__profile').getByText(member.email, { exact: true }).waitFor()
    const note = 'Follow-up ' + label + ' ' + run
    await page.locator('#ops-note').fill(note)
    if (prefix === '') {
      // Simulate a lost response after commit, then retry through the same form.
      await page.route('**' + notesUrl, async route => {
        assert.ok((await route.fetch()).ok())
        await route.fulfill({ status: 503, body: '{}' })
      }, { times: 1 })
      await page.locator('.ops__notes button[type=submit]').click()
      await page.locator('.ops__notes [role=alert]').waitFor()
      check('retry preserves typed note', await page.locator('#ops-note').inputValue() === note)
    }
    await page.locator('.ops__notes button[type=submit]').click()
    await page.locator('.ops__notes li').getByText(note).waitFor()
    await page.reload()
    await page.locator('.ops__notes li').getByText(note).waitFor()
    assert.equal(await page.locator('.ops__notes li').getByText(note).count(), 1)
    check(label + ' notes persist and profile fits viewport', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    const library = page.locator('.ops__profile > section').filter({ has: page.getByRole('heading', { name: prefix ? 'Archivos del cliente' : 'Client files', exact: true }) })
    assert.equal(await library.locator('a[download]').getAttribute('download'), 'brand.txt')
    await page.route('**' + briefUrl, route => route.fulfill({ status: 503, body: '{}' }), { times: 1 })
    await page.locator('.ops__profile').getByRole('link', { name: title }).click()
    const requestContext = page.locator('.dr__business')
    await requestContext.getByRole('alert').getByRole('button').click()
    assert.match(await requestContext.locator('.dr__goals').innerText(), prefix ? /Más ventas/ : /More sales/)
    await requestContext.locator('summary').focus()
    await page.keyboard.press('Enter')
    await requestContext.getByText(answers.what).waitFor()
    await requestContext.getByText('#654321').waitFor()
    await requestContext.getByRole('link', { name: /Lamp workshop/ }).click()
    await page.locator('.ops__notes').waitFor()
    await page.goto(prefix + '/app/#/admin/' + otherRequest)
    await requestContext.getByText(prefix ? /aún no ha compartido/ : /hasn’t shared/).waitFor()
    check(label + ' request brief retries, opens by keyboard and switches to the other account',
      !await requestContext.getByText(answers.what).count())
    await page.goto(prefix + '/app/#/admin/clients')
    await page.locator('.adm__table tr').filter({ hasText: owner.email }).getByText(prefix ? /1 compañero/ : /1 teammate/).waitFor()
    await page.locator('.adm__table tr').filter({ hasText: owner.email }).locator('.ops__profile-link').click()
    await page.locator('.ops__notes').waitFor()
    check(label + ' client list opens the account', page.url().endsWith('/clients/' + owner.id))
  }
  const demo = await context()
  await demo.addInitScript(() => {
    if (localStorage.getItem('fs-demo-v1')) return
    const user = { id: 'demo-ops', name: 'Demo', email: 'ops@example.com', company: '', role: 'admin', brand: {} }
    localStorage.setItem('fs-demo-v1', JSON.stringify({ user, reqs: [], invoices: [], events: [], seq: 0, sub: null }))
  })
  const local = await demo.newPage()
  local.on('pageerror', () => errors.push('demo error'))
  await local.goto('/es/app/?demo#/admin/business')
  await local.locator('.ops__weekly').waitFor()
  check('empty demo has eight zero weeks and no invented average', await local.locator('.ops__weekly li b').allTextContents().then(labels => labels.length === 8 && labels.every(x => x === '0')) && await local.locator('.ops__kpis strong').nth(2).innerText() === '—')
  await local.goto('/es/app/?demo#/admin/clients/demo-ops')
  await local.locator('.ops__notes').waitFor()
  await local.getByRole('region', { name: 'Ficha del negocio' }).getByText('Este cliente aún no ha compartido sus respuestas de bienvenida.').waitFor()
  await local.getByRole('combobox', { name: 'Plan', exact: true }).selectOption('grow')
  await local.locator('.ops__plan select').nth(1).selectOption('active')
  await local.locator('.ops__plan input[type=checkbox]').check()
  await local.locator('.ops__plan button').click()
  await local.locator('#ops-note').fill('Solo para la demo')
  await local.locator('.ops__notes button').click()
  await local.reload()
  await local.locator('.ops__notes li').getByText('Solo para la demo').waitFor()
  await local.getByRole('tab', { name: 'Negocio' }).click()
  await local.locator('.ops__weekly').waitFor()
  check('demo activation updates MRR and retains notes on reload', (await local.locator('.ops__kpis strong').first().innerText()).replace(/\D/g, '') === '1150')
  await local.locator('.ap-side__foot button').first().click()
  await local.getByRole('tab', { name: 'Negocio' }).waitFor({ state: 'detached' })
  await local.goto('/es/app/?demo#/admin/clients/demo-ops')
  await local.locator('.kb').waitFor()
  check('client role cannot reopen internal notes', await local.locator('.ops__notes').count() === 0)
  check('browser had no runtime errors', !errors.length)
} finally {
  await browser.close()
  if (created.length) {
    await db`delete from studio.users where email = any(${created}::text[])`
    const [left] = await db`select count(*)::int as n from studio.users where email = any(${created}::text[])`
    check('fixture cleanup', left.n === 0)
  }
}
