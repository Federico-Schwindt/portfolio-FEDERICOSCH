// End-to-end studio navigation, using browser-local fixtures in both languages.
import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const baseURL = 'http://localhost:' + Number(process.argv[2] || 4331)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  for (const es of [false, true]) {
    const ctx = await browser.newContext({ baseURL, viewport: { width: es ? 390 : 1440, height: 900 }, timezoneId: 'America/Buenos_Aires' })
    await ctx.addInitScript(complete => {
      if (localStorage.getItem('fs-demo-v1')) return
      const now = new Date(), day = d => d.toLocaleDateString('sv-SE')
      const next = new Date(now)
      next.setDate(next.getDate() + 7)
      const user = { id: 'owner', role: 'admin', name: 'QA Owner', email: 'ops@example.com', company: 'QA Studio', brand: {},
        phone: '555-0142', timezone: 'America/Buenos_Aires', jobTitle: 'Art director', notify: { review: true, comments: false }, lang: 'es',
        avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp1sAAAAASUVORK5CYII=' }
      const reqs = ['done','done','queued','active'].map((status, i) => ({
        id: 'op-' + i, number: i + 1, owner: user.id, title: ['Late delivery','Approved design','Next deadline','Current deadline'][i],
        rating: [2,5,null,null][i], ratingNote: i === 0 ? 'Please check the margins.' : null,
        kind: 'design', status, brief: '', checklist: [], files: [], priority: 2, position: i, progress: 30,
        dueDate: i === 2 ? day(next) : day(now), doneAt: status === 'done' ? now.toISOString() : null, createdAt: now.toISOString(),
      }))
      user.brand = { onboarded: complete, colors: ['#123456'], business: {
        what: 'Coffee for local shops', industry: 0, customers: 'Independent cafés', style: 0, goals: [0, 1],
        site: 'coffee.example.com', instagram: '@coffee', other: 'See the printed catalogue', notes: 'Keep the hand-drawn logo.',
      } }
      const invoices = [
        { id: 'paid-1', label: '=Test, "invoice"', amount: 60.25, status: 'paid', at: now.toISOString() },
        { id: 'unpaid-1', label: 'Unpaid work', amount: 100, status: 'unpaid', at: now.toISOString() },
        { id: 'past-1', label: 'Archived work', amount: 50, status: 'paid', at: '2018-08-01T01:00:00Z' },
      ]
      const recurring = [{ id: 'rr', title: 'Next newsletter', nextAt: next.toISOString(), every: 'week', active: true }]
      const files = ['Shop logo', 'Studio mockup', 'Request attachment'].map((name, i) => ({
        id: 'file-' + i, owner: user.id, name, at: now.toISOString(), kind: 'brand', version: 1, size: 4,
        mime: 'text/plain', byStudio: i === 1, requestId: i === 2 ? 'op-0' : null, url: 'data:text/plain,demo',
      }))
      localStorage.setItem('fs-demo-v1', JSON.stringify({ user, invoices, recurring, reqs, files, sub: null, events: [], seq: 4 }))
    }, es)
    const page = await ctx.newPage(), errors = []
    page.setDefaultTimeout(8000)
    page.on('pageerror', e => errors.push(e.name))
    const root = (es ? '/es' : '') + '/app/?demo#/admin/'
    await page.goto((es ? '/es' : '') + '/app/?demo#/brand')
    await page.locator('.bk input[placeholder="Archivo, Inter…"]').fill('New font')
    await page.locator('.bk header button').click()
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('fs-demo-v1')).user.brand.fonts === 'New font')
    await page.goto(root + 'finance')
    const finance = page.locator('.ops__finance')
    await finance.getByText('Unpaid work', { exact: true }).waitFor()
    const total = finance.locator('.ops__collected strong')
    assert.match(await total.innerText(), /60[.,]25/)
    assert.equal(await finance.getByText('Archived work').count(), 0)
    await finance.getByLabel(es ? 'Cliente' : 'Client', { exact: true }).selectOption('owner')
    const download = page.waitForEvent('download')
    await finance.getByRole('button', { name: es ? 'Exportar CSV' : 'Export CSV' }).click()
    const file = await download, stream = await file.createReadStream(), chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const csv = Buffer.concat(chunks).toString('utf8')
    assert.ok(csv.includes(`"'=Test, ""invoice"""`) && csv.includes('"60.25"') && !csv.includes('Archived work'))
    await finance.getByLabel(es ? 'Mes' : 'Month', { exact: true }).selectOption('2018-07')
    await finance.getByRole('link', { name: 'Archived work' }).click()
    await finance.getByText('past-1', { exact: true }).waitFor()
    if (es) await page.setViewportSize({ width: 320, height: 844 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'invoice fits narrow viewport')
    await finance.getByRole('link', { name: 'QA Studio' }).click()
    const profile = page.locator('.ops__contact')
    await profile.getByText('555-0142').waitFor()
    await profile.getByText('Art director').waitFor()
    await profile.getByText('America/Buenos_Aires').waitFor()
    assert.ok(await profile.locator('img').isVisible())
    assert.match(await profile.innerText(), es ? /Desactivado/ : /Off/)
    const brief = page.getByRole('region', { name: es ? 'Ficha del negocio' : 'Business brief' })
    for (const expected of [es ? 'Completada' : 'In progress', 'Coffee for local shops', 'Independent cafés',
      es ? 'Tienda o ecommerce' : 'Shop or ecommerce', es ? 'Limpio y minimalista' : 'Clean and minimal',
      es ? 'Más ventas · Más consultas o reservas' : 'More sales · More leads or bookings', '#123456', 'Keep the hand-drawn logo.']) {
      await brief.getByText(expected, { exact: true }).waitFor()
    }
    const site = brief.getByRole('link', { name: 'coffee.example.com' })
    assert.equal(await site.getAttribute('href'), 'https://coffee.example.com/')
    await site.focus()
    await page.keyboard.press('Tab')
    assert.equal(await page.locator(':focus').getAttribute('href'), 'https://www.instagram.com/coffee/')
    await brief.getByText('See the printed catalogue').waitFor()
    assert.equal(await brief.getByRole('link').count(), 2)
    await brief.locator('summary').focus()
    await page.keyboard.press('Enter')
    assert.deepEqual(await brief.locator('details a[download]').allTextContents(), ['Shop logo'])
    console.log('OK', es ? 'ES complete' : 'EN draft', 'saved brand kit preserves the welcome answers; brief links work by keyboard')
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'contact fits narrow viewport')
    if (es) await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('tab', { name: es ? 'Opiniones' : 'Feedback' }).click()
    await page.locator('.ops__score').getByText(es ? '3,5 / 5' : '3.5 / 5').waitFor()
    await page.getByRole('checkbox').check()
    await page.locator('.ops__low').getByText('Please check the margins.').waitFor()
    assert.equal(await page.getByRole('link', { name: 'Approved design' }).count(), 0)
    await page.getByRole('link', { name: 'Late delivery' }).click()
    const requestBrief = page.locator('.dr__business')
    await requestBrief.getByText(es ? 'Completada' : 'In progress', { exact: true }).waitFor()
    assert.match(await requestBrief.locator('.dr__goals').innerText(), es ? /Más ventas/ : /More sales/)
    await requestBrief.locator('summary').focus()
    await page.keyboard.press('Enter')
    await requestBrief.getByText('Keep the hand-drawn logo.').waitFor()
    await requestBrief.getByText(es ? 'Limpio y minimalista' : 'Clean and minimal').waitFor()
    assert.ok(await requestBrief.evaluate(el => el.scrollWidth <= el.clientWidth), 'expanded brief fits')
    await requestBrief.getByRole('link', { name: /QA Studio/ }).click()
    await profile.getByText('Art director').waitFor()
    await page.goto(root + 'workload')
    await page.locator('.ops__week').getByRole('link', { name: 'Current deadline' }).waitFor()
    assert.equal(await page.locator('.ops__week a').count(), 1)
    await page.getByRole('button', { name: es ? 'Semana siguiente' : 'Next week' }).click()
    await page.locator('.ops__week').getByRole('link', { name: 'Next deadline' }).waitFor()
    await page.getByRole('button', { name: es ? 'Esta semana' : 'This week' }).click()
    await page.locator('.ops__active summary').click()
    await page.locator('.ops__active').getByRole('link', { name: 'Current deadline' }).waitFor()
    await page.getByText('Next newsletter', { exact: true }).waitFor()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.getByRole('tab', { selected: true }).focus()
    await page.keyboard.press('ArrowLeft')
    await page.getByRole('tabpanel', { name: es ? 'Opiniones' : 'Feedback' }).locator('.ops__score').waitFor()
    assert.deepEqual(errors, [])
    console.log('OK', es ? 'ES mobile' : 'EN desktop', 'ledger, CSV, invoice, profile, feedback and weekly workload')
    await ctx.close()
  }
} finally { await browser.close() }
