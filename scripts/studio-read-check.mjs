import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const origin = 'http://localhost:' + Number(process.argv[2] || process.env.STUDIO_TEST_PORT || 4331)
const state = {
  user: { id: 'studio', role: 'admin', account: 'studio', email: 'studio@example.com', brand: {} },
  reqs: [], events: [], files: [], invoices: [], changes: [], pins: [], recurring: [], sub: null, lastSeen: null,
}
const metrics = {
  breakdown: [], weeks: [], ratings: { approved: 0, rated: 0 }, ratingAccounts: [], clients: {}, mix: {},
  mrr: 0, capacity: 0, used: 0, overdue: 0, avgDays: null,
}
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  for (const es of [false, true]) {
    const page = await browser.newPage({ viewport: { width: es ? 390 : 1440, height: 900 } })
    const counts = new Map(), errors = [], fixtures = new Map()
    let endpoint, release, gate, fail, version = 'collections~first'
    page.on('pageerror', e => errors.push(e.message))
    page.setDefaultTimeout(7000)
    await page.route('**/api/**', async route => {
      const path = new URL(route.request().url()).pathname.slice(5)
      counts.set(path, (counts.get(path) ?? 0) + 1)
      if (path === 'state/') {
        const headers = { 'x-studio-version': version }
        return route.request().headers()['x-studio-version']
          ? route.fulfill({ status: 204, headers }) : route.fulfill({ json: state, headers })
      }
      if (path === endpoint) {
        await gate
        if (fail) return route.fulfill({ status: 503, json: {} })
      }
      const json = path === 'health/' ? { ok: true } : path === 'studio/metrics/' ? metrics :
        path === 'studio/changes/count/' ? { waiting: 0, scheduled: 0 } : []
      return route.fulfill({ json: fixtures.get(path) ?? json })
    })
    const cases = [
      ['business', 'studio/metrics/', es ? 'Aquí verás el primer plan' : 'Your first client plan'],
      ['finance', 'studio/finance/', es ? 'Aquí verás las facturas' : 'Invoices will appear'],
      ['feedback', 'studio/feedback/', es ? 'Tus clientes pueden calificar' : 'Clients can rate'],
      ['workload', 'studio/recurring/', es ? 'No hay pedidos recurrentes previstos.' : 'No upcoming recurring requests.'],
      ['changes', 'studio/changes/', es ? 'No hay cambios de plan abiertos' : 'No open plan changes or decisions'],
      ['', 'admin/clients/', es ? 'No hay planes pendientes' : 'No plans awaiting activation'],
    ]
    const panel = page.getByRole('tabpanel')
    for (const [tab, path, empty] of cases) {
      endpoint = path
      fail = true
      gate = new Promise(resolve => { release = resolve })
      await page.goto(origin + (es ? '/es' : '') + '/app/#/admin' + (tab ? '/' + tab : ''))
      await panel.getByRole('status').first().waitFor()
      release()
      const retry = panel.getByRole('alert').getByRole('button', { name: es ? 'Reintentar' : 'Try again' })
      await retry.waitFor()
      fail = false
      await retry.focus()
      await page.keyboard.press('Enter')
      await panel.getByText(empty, { exact: false }).first().waitFor()
      assert.equal(await panel.getByRole('alert').count(), 0)
    }
    const clients = counts.get('admin/clients/'), changes = counts.get('studio/changes/count/')
    const poll = async () => {
      const done = page.waitForResponse(r => new URL(r.url()).pathname === '/api/state/')
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
      await (await done).finished()
    }
    await poll()
    assert.equal(counts.get('admin/clients/'), clients)
    assert.equal(counts.get('studio/changes/count/'), changes)
    version = 'collections~second'
    await Promise.all([
      page.waitForResponse(r => new URL(r.url()).pathname === '/api/admin/clients/'),
      page.waitForResponse(r => new URL(r.url()).pathname === '/api/studio/changes/count/'),
      poll(),
    ])
    const clear = panel.getByRole('button', { name: es ? 'Quitar filtros' : 'Clear filters' })
    fixtures.set('studio/finance/', [{ id: 'archived', owner: 'owner', name: 'Client', email: 'owner@example.com',
      at: '2019-07-02T12:00:00Z', label: 'Archived invoice', currency: 'USD', cents: 1000, status: 'paid' }])
    await page.evaluate(() => { location.hash = '/admin/finance' })
    await clear.click()
    await panel.getByRole('link', { name: 'Archived invoice' }).waitFor()
    fixtures.set('studio/feedback/', [{ id: 'approved', owner: 'owner', ownerName: 'Client', title: 'Approved design',
      status: 'done', rating: 5, doneAt: '2026-07-02T12:00:00Z' }])
    await page.evaluate(() => { location.hash = '/admin/feedback' })
    await panel.getByRole('checkbox').check()
    await clear.click()
    await panel.getByRole('link', { name: 'Approved design' }).waitFor()
    assert.deepEqual(errors, [])
    await page.close()
    console.log('OK six studio views: loading, failure, keyboard retry, empty results and revision-based priority reads', es ? 'ES mobile' : 'EN desktop')
  }
} finally { await browser.close() }
