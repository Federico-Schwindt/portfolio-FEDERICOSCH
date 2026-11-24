import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { chromium } from 'playwright-core'
import { neon } from '@neondatabase/serverless'

const origin = 'http://localhost:' + Number(process.argv[2] || 4331)
const browser = await chromium.launch({ channel: 'chrome' })
const run = randomUUID(), created = []
const ownerEmail = 'search-owner-' + run + '@example.com'
const name = 'Estudio Ámbar', title = 'Cartel de temporada', brief = 'Folleto para la exposición'
const fileName = 'Catálogo-' + run + '.txt'
const repeated = 'Prueba-' + run + '.txt'
const titleQuery = 'exposicion'
let db

async function account(context, email, label) {
  const reply = await context.request.post('/api/auth/signup/', {
    headers: { 'x-studio': '1', origin }, data: { email, password: randomUUID(), name: label },
  })
  assert.equal(reply.status(), 200, 'temporary account')
  created.push(email)
  const [row] = await db`select id from studio.users where email = ${email}`
  return row.id
}

async function testScreen(ctx, { es, studio, live, requestId, number, clientId }) {
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', e => errors.push(e.name))
  page.setDefaultTimeout(8000)
  try {
    await page.setViewportSize({ width: es ? 390 : 1440, height: 900 })
    await page.emulateMedia({ colorScheme: es ? 'dark' : 'light' })
    await page.addInitScript(dark => localStorage.setItem('theme', dark ? 'dark' : 'light'), es)
    await page.goto((es ? '/es' : '') + '/app/' + (live ? '' : '?demo') + '#/activity')
    await page.locator('.ac').waitFor()
    const input = page.locator('dialog.pl').getByRole('combobox')
    const open = async () => {
      if (es) { await page.locator('.ap-dock button').last().click(); await page.locator('.ap-sheet .ap-search').click() }
      else await page.locator('.ap-top__search').click()
      await input.waitFor()
      assert(await input.evaluate(el => el === document.activeElement))
      assert(await page.locator('dialog.pl').evaluate(el => el.scrollWidth <= el.clientWidth + 1))
    }
    const options = page.locator('dialog.pl').getByRole('option')
    const option = text => options.filter({ hasText: text }).first()
    await open()
    await input.fill(titleQuery)
    await option(title).waitFor()
    assert((await option(title).innerText()).includes(brief))
    await input.press('Enter')
    await page.locator('.dr__t').filter({ hasText: title }).waitFor()
    assert(page.url().endsWith('#/' + (studio ? 'admin/' : 'board/') + requestId))
    await page.keyboard.press('Escape')
    await page.locator('.dr').waitFor({ state: 'hidden' })
    await open()
    await input.fill('#' + number)
    await option(title).waitFor()
    await input.fill('catalogo-' + run)
    await option(fileName).waitFor()
    assert((await option(fileName).innerText()).includes('v2'))
    await input.press('Enter')
    await page.getByRole('dialog', { name: fileName, exact: true }).waitFor()
    await page.keyboard.press('Escape')
    assert.equal(await input.inputValue(), 'catalogo-' + run)
    assert(await input.evaluate(el => el === document.activeElement), 'return focus from the file to the query')
    await input.fill(repeated)
    const next = page.getByRole('button', { name: es ? 'Resultados siguientes' : 'Next results' })
    await next.waitFor()
    assert.equal(await page.locator('.pl [id^="pl-file-"]').count(), 8)
    await next.click()
    const tenth = options.filter({ hasText: repeated }).filter({ has: page.locator('small', { hasText: /^v10\b/ }) })
    await tenth.click()
    await page.locator('.pv__bar b').filter({ hasText: 'v10' }).waitFor()
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('.pl [id^="pl-file-"]').count(), 2)
    await page.getByRole('button', { name: es ? 'Resultados anteriores' : 'Previous results' }).click()
    await next.waitFor()
    await input.fill('no-such-record-' + run)
    await page.getByText(es ? /Sin coincidencias/ : /No matches/).waitFor()
    assert.equal(await options.count(), 0)
    await input.fill(ownerEmail)
    if (studio) {
      await option(ownerEmail).click()
      await page.locator('.adm h1').filter({ hasText: name }).waitFor()
      assert(page.url().endsWith('#/admin/clients/' + clientId))
    } else {
      await page.getByText(es ? /Sin coincidencias/ : /No matches/).waitFor()
      await input.fill(es ? 'Calendario' : 'Calendar')
      await option(es ? 'Calendario' : 'Calendar').waitFor()
      await input.press('Enter')
      await page.waitForURL(url => url.hash === '#/calendar')
    }
    await open()
    await input.fill('')
    await input.press('ArrowUp')
    const selected = await input.getAttribute('aria-activedescendant')
    assert(await page.locator('.pl [aria-selected=true]').evaluate((el, id) => {
      const list = el.closest('.pl__list').getBoundingClientRect(), row = el.getBoundingClientRect()
      return el.id === id && row.top >= list.top - 1 && row.bottom <= list.bottom + 1
    }, selected))
    await input.press('Escape')
    assert.equal(await page.locator('dialog.pl').count(), 0)
    const opener = page.locator(es ? '.ap-dock button:last-child' : '.ap-top__search')
    assert(await opener.evaluate(el => el === document.activeElement), 'return focus to search or More')
    if (live && !studio) {
      await page.route('**/api/search/', r => r.fulfill({ status: 503, json: {} }), { times: 1 })
      await open()
      await input.fill(fileName)
      await page.locator('.pl__status button').click()
      await option(fileName).waitFor()
    }
    assert.deepEqual(errors, [])
    console.log('OK', live ? 'Neon' : 'demo', studio ? 'studio' : 'client', es ? 'ES 390 dark' : 'EN 1440 light')
  } finally { await page.close() }
}

try {
  const demoOnly = process.argv.includes('--demo-only')
  if (!demoOnly) {
    if (!process.env.DATABASE_URL) process.loadEnvFile()
    db = neon(process.env.DATABASE_URL)
  }
  for (const live of demoOnly ? [false] : [false, true]) {
    const contexts = []
    try {
      for (const studio of [false, true]) {
        contexts.push({ studio, ctx: await browser.newContext({ baseURL: origin }) })
      }
      let requestId = 'request-73', number = 73, clientId = 'owner'
      if (live) {
        const owner = contexts[0].ctx
        clientId = await account(owner, ownerEmail, name)
        const admin = await account(contexts[1].ctx, 'search-studio-' + run + '@example.com', 'Search QA')
        await db`update studio.users set role='admin' where id=${admin}`
        const [request] = await db`insert into studio.requests(user_id,title,kind,brief) values (${clientId},${title},'design',${brief}) returning id,number`
        requestId = request.id; number = request.number
        await db`insert into studio.files(user_id,request_id,kind,version,name,mime,size,data,created_at)
          values (${clientId},${requestId},'deliverable',2,${fileName},'text/plain',0,''::bytea, now() - interval '1 day')`
        await db`insert into studio.files(user_id,request_id,kind,version,name,mime,size,data,created_at)
          select ${clientId},${requestId},'deliverable',i,case when i<=10 then ${repeated} else 'Recent ' || i end,
            'text/plain',0,''::bytea,now()-i*interval '1 second' from generate_series(1,500) i`
        const state = await (await owner.request.get('/api/state/')).json()
        assert.equal(state.files.length, 500)
        assert(!state.files.some(f => f.name === fileName), 'test file is outside the dashboard snapshot')
      }
      for (const { ctx, studio } of contexts) {
        if (!live) await ctx.addInitScript(data => {
          if (localStorage.getItem('fs-demo-v1')) return
          const { clientId, studio, ownerEmail, name, number, requestId, title, brief, fileName, repeated } = data
          const at = new Date().toISOString()
          const user = { id: clientId, email: ownerEmail, name, role: studio ? 'admin' : 'client', brand: {} }
          const req = { id: requestId, number, owner: clientId, title, brief, status: 'queued', kind: 'design', checklist: [], files: [], createdAt: at, priority: 2, position: 1 }
          const file = { id: 'version2', requestId, owner: clientId, name: fileName, mime: 'text/plain', kind: 'deliverable', version: 2, size: 0, at }
          const versions = Array.from({ length: 10 }, (_, i) => ({
            ...file, id: 'repeated-' + i, name: repeated, version: i + 1, at: new Date(Date.now() - i * 1000).toISOString(),
          }))
          localStorage.setItem('fs-demo-v1', JSON.stringify({ user, reqs: [req], files: [file, ...versions], seq: number, events: [], invoices: [], sub: null }))
        }, { clientId, studio, ownerEmail, name, number, requestId, title, brief, fileName, repeated })
        for (const es of [false, true]) await testScreen(ctx, { es, studio, live, requestId, number, clientId })
      }
    } finally { for (const { ctx } of contexts) await ctx.close() }
  }
} finally {
  try {
    if (created.length) {
      await db`delete from studio.users where email = any(${created}::text[])`
      const [remaining] = await db`select count(*)::int as n from studio.users where email = any(${created}::text[])`
      assert.equal(remaining.n, 0)
      console.log('OK temporary accounts removed')
    }
  } finally { await browser.close() }
}
