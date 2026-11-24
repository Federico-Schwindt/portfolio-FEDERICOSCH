// Exercise legacy unrated deliveries and a new client rating through the compiled demo.
import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const baseURL = 'http://localhost:' + Number(process.argv[2] ?? 4330)
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  for (const es of [false, true]) {
    const ctx = await browser.newContext({ baseURL, viewport: { width: es ? 390 : 1440, height: 844 } })
    await ctx.addInitScript(() => {
      if (localStorage.getItem('fs-demo-v1')) return
      const user = { id: 'demo-ratings', role: 'admin', name: 'Studio QA', email: 'ratings@example.com', company: '', brand: {} }
      const at = '2020-03-01T12:00:00Z'
      const reqs = ['done', 'done', 'done', 'cancelled'].map((status, i) => ({
        id: 'delivery-' + i, owner: user.id, number: i + 1, title: 'Delivery ' + i, status, position: i, priority: 2,
        kind: 'design', brief: '', files: [], checklist: [], progress: 100, createdAt: at, startedAt: at, reviewAt: at, doneAt: at,
      }))
      localStorage.setItem('fs-demo-v1', JSON.stringify({ user, reqs, invoices: [], events: [], seq: 4, sub: null }))
    })
    const page = await ctx.newPage()
    const runtimeErrors = []
    page.on('pageerror', () => runtimeErrors.push('page error'))
    const home = (es ? '/es' : '') + '/app/?demo'
    const switchRole = async () => {
      const more = page.locator('.ap-dock button[aria-haspopup="dialog"]')
      if (await more.isVisible()) await more.click()
      await page.locator('.ap-side__foot button').first().click()
      if (await page.locator('.ap-sheet[open]').isVisible()) await page.keyboard.press('Escape')
    }
    await page.goto(home + '#/admin/business')
    const section = page.getByRole('region', { name: es ? 'Calificaciones de entregas' : 'Delivery ratings', exact: true })
    await section.getByText(es ? 'Todavía no hay entregas calificadas.' : 'No rated deliveries yet.').waitFor()
    await section.locator('summary').focus()
    await page.keyboard.press('Enter')
    assert.deepEqual(await section.locator('tbody td').allTextContents(), ['3', '0', '—'])
    await switchRole()
    for (const [i, score] of [[0, 4], [1, 5]]) {
      await page.goto(home + '#/board/delivery-' + i)
      await page.locator('.rate').getByRole('radio').nth(score - 1).click()
      if (i === 0) await page.locator('.rate__more input').fill('The new layout works.')
      await page.locator('.rate__more button').click()
      await page.locator('.rate--done').waitFor()
      await page.locator('.dr .dr__x').click()
      await page.locator('.dr').waitFor({ state: 'detached' })
    }
    await switchRole()
    await page.goto(home + '#/admin/business')
    const average = es ? '4,5 / 5' : '4.5 / 5'
    await section.getByText(average, { exact: true }).first().waitFor()
    await section.locator('summary').click()
    assert.deepEqual(await section.locator('tbody td').allTextContents(), ['3', '2', average])
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await section.getByRole('link', { name: 'Studio QA' }).click()
    await page.reload()
    await section.getByText(average, { exact: true }).waitFor()
    await page.getByText('The new layout works.', { exact: true }).waitFor()
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    assert.deepEqual(runtimeErrors, [])
    await ctx.close()
    console.log(es ? 'OK · español móvil' : 'OK · English desktop')
  }
} finally {
  await browser.close()
}
