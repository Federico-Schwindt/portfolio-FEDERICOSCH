// Exercise a member's and a studio operator's history using only browser-local fixtures.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const origin = 'http://localhost:' + Number(process.argv[2] || process.env.STUDIO_TEST_PORT || 4330)
async function exportCsv(page, label, filename) {
  const file = page.waitForEvent('download')
  await page.getByRole('button', { name: label, exact: true }).press('Enter')
  const download = await file
  assert.equal(download.suggestedFilename(), filename)
  return readFile(await download.path(), 'utf8')
}
const browser = await chromium.launch({ channel: 'chrome' })
try {
  for (const [lang, width, role] of [['en', 1440, 'admin'], ['es', 390, 'client']]) {
    const context = await browser.newContext({ viewport: { width, height: 850 }, colorScheme: lang === 'es' ? 'dark' : 'light' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(e.name))
    await page.addInitScript(({ role, lang }) => {
      if (localStorage.getItem('fs-demo-v1')) return
      const user = { id: 'operator', account: 'owner', email: 'reader@example.com', name: 'Reader', company: '', role, lang, brand: {} }
      const at = '2025-01-01T00:00:00.000Z'
      const request = { id: 'firstreq', number: 12, owner: 'owner', title: 'Catálogo', kind: 'design', status: 'queued', brief: '', checklist: [], priority: 2, position: 1, progress: 0, files: [], createdAt: at }
      const reqs = [request, { ...request, id: 'otherreq', number: 120, owner: 'other', title: 'Other account' }]
      for (let i = 0; i < 10; i++) reqs.push({ ...request, id: 'done' + i, number: 200 + i,
        title: '=Álbum, "Norte" ' + i, brief: 'Línea 1\nLínea 2', status: 'done', doneAt: at })
      reqs.push({ ...request, id: 'different', number: 300, title: 'Álbum web', kind: 'page' })
      const entries = Array.from({ length: 425 }, (_, i) => ({ id: String(i).padStart(4,'0'), requestId: request.id, who: 'ai', kind: 'ai', body: 'Resize', at }))
      entries.push({ ...entries[0], id: 'old', kind: 'changes', who: 'client', body: 'v2: Revisión 50%_', at: '2024-01-01T00:00:00.000Z' })
      entries.push({ ...entries[0], id: 'foreign', requestId: 'otherreq', body: 'Other account only' })
      localStorage.setItem('fs-demo-v1', JSON.stringify({ user, reqs, sub: null, seq: 120, events: entries, files: [], invoices: [] }))
    }, { role, lang })
    await page.goto(origin + (lang === 'es' ? '/es' : '') + '/app/?demo#/activity')
    const input = page.getByRole('searchbox')
    const rows = page.locator('.ac__i')
    const count = n => page.waitForFunction(expected => document.querySelectorAll('.ac__i').length === expected, n)
    const find = async text => { await input.fill(text); await input.press('Enter') }
    await count(40)
    await find('revision 50%_')
    await count(1)
    const opener = rows.getByRole('button', { name: '#12 · Catálogo', exact: true })
    assert.match(await rows.innerText(), /v2: Revisión 50%_/)
    await opener.press('Enter'); await page.getByRole('dialog', { name: 'Catálogo' }).waitFor()
    await page.keyboard.press('Escape')
    await page.getByRole('dialog', { name: 'Catálogo' }).waitFor({ state: 'hidden' })
    assert.equal(await input.inputValue(), 'revision 50%_')
    assert.ok(await opener.evaluate(el => document.activeElement === el))
    await page.locator('.ac__tabs button').last().click()
    await page.locator('.ac .dl__empty').waitFor()
    await page.getByRole('button', { name: lang === 'es' ? 'Quitar filtros' : 'Clear filters' }).press('Enter')
    assert.ok(await input.evaluate(el => document.activeElement === el))
    await find('#12'); await count(40)
    const activityName = lang === 'es' ? 'actividad' : 'activity'
    const exportActivity = lang === 'es' ? 'Exportar actividad (CSV)' : 'Export activity (CSV)'
    const csv = await exportCsv(page, exportActivity, activityName + '.csv')
    assert.equal(csv.charCodeAt(0), 0xfeff)
    assert.equal(csv.trimEnd().split('\r\n').length, 427)
    assert.equal((csv.match(/"Resize"/g) ?? []).length, 425)
    assert.ok(csv.includes('Revisión 50%_') && !csv.includes('Other account'))
    await count(40)
    await page.locator('.ac__tabs button').last().click()
    const filtered = await exportCsv(page, exportActivity, activityName + '.csv')
    assert.equal(filtered.trimEnd().split('\r\n').length, 426)
    assert.ok(!filtered.includes('Revisión 50%_'))
    await page.locator('.ac__tabs button').first().click()
    await page.getByRole('button', { name: lang === 'es' ? 'Ver anteriores' : 'Show older' }).press('Enter')
    await count(80)
    await page.waitForFunction(() => document.activeElement === document.querySelectorAll('.ac__i')[40])
    assert.ok((await rows.getByRole('button').allTextContents()).every(t => t === '#12 · Catálogo'))
    await find('catalogo')
    await count(40)
    await find('#120')
    if (role === 'admin') {
      await count(1)
      await rows.getByRole('button', { name: '#120 · Other account' }).waitFor()
    } else {
      await page.locator('.ac .dl__empty').waitFor()
      assert.ok(await page.getByRole('button', { name: exportActivity }).isDisabled())
      await page.locator('.ac__receipts summary').press('Enter')
      await page.getByText('Todavía no hay avisos por correo.').waitFor()
      await page.setViewportSize({ width: 320, height: 640 })
      await page.evaluate(() => {
        const state = JSON.parse(localStorage.getItem('fs-demo-v1'))
        const at = '2024-02-20T15:30:00Z'
        state.outbox = [{ id: 'receipt', subject: 'x'.repeat(139), text: 'y'.repeat(600), email: state.user.email,
          at, sentAt: at, status: 'sent', recipient: state.user.id }]
        localStorage.setItem('fs-demo-v1', JSON.stringify(state))
      })
      await page.reload()
      const receipts = page.locator('.ac__receipts > summary')
      await receipts.press('Enter')
      await page.locator('.mail-history__item summary').press('Enter')
      await page.locator('.mail-history__body').waitFor()
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      await receipts.press('Enter')
      await page.locator('.mail-history').waitFor({ state: 'detached' })
    }
    await page.evaluate(() => { location.hash = '/board' })
    const exportBoard = lang === 'es' ? 'Exportar pedidos (CSV)' : 'Export requests (CSV)'
    const requestFile = lang === 'es' ? 'pedidos.csv' : 'requests.csv'
    const allRequests = await exportCsv(page, exportBoard, requestFile)
    assert.equal(allRequests.includes('Other account'), role === 'admin')
    assert.equal(await page.locator('.kb__col--done .kc').count(), 8)
    await page.locator('.tb__q input').fill('álbum')
    await page.locator('.tb__chips button').filter({ hasText: lang === 'es' ? 'Diseño' : 'Design' }).click()
    const requests = await exportCsv(page, exportBoard, requestFile)
    assert.equal((requests.match(/"'=Álbum, ""Norte""/g) ?? []).length, 10)
    assert.ok(requests.includes('"Línea 1\nLínea 2"') && !requests.includes('Álbum web') && !requests.includes('"Catálogo"'))
    await page.locator('.tb__q input').fill('no matches here')
    assert.ok(await page.getByRole('button', { name: exportBoard }).isDisabled())
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
    assert.deepEqual(errors, [])
    console.log('OK', lang, width, role, 'search, scope, pagination, drawer, keyboard and filtered CSV downloads')
    await context.close()
  }
} finally {
  await browser.close()
}
