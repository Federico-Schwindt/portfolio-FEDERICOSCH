// Mobile navigation against the preview. Each viewport gets a fresh browser-only demo.
import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

const browser = await chromium.launch({ channel: 'chrome' })
try {
  for (const [width, height, lang, theme] of [[320, 568, 'es', 'light'], [390, 844, 'es', 'dark'], [844, 390, 'en', 'light']]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: true })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.addInitScript((mode) => localStorage.setItem('theme', mode), theme)
    await page.goto('http://localhost:' + Number(process.env.STUDIO_TEST_PORT || 4330) + '/' + (lang === 'es' ? 'es/' : '') + 'app/?demo')
    await page.locator('.af input[type=email]').fill('mobile@example.com')
    await page.locator('.af input[type=password]').fill('demo')
    await page.locator('.af button[type=submit]').click()

    const dock = page.locator('.ap-dock')
    const buttons = dock.getByRole('button')
    const more = buttons.last()
    const sheet = page.locator('.ap-sheet')
    await dock.waitFor()
    assert.equal(await buttons.count(), 5)
    assert((await page.locator('.ap-side').boundingBox()).height <= 60)
    for (const button of await buttons.all()) {
      const box = await button.boundingBox()
      assert(box.width >= 44 && box.height >= 44)
    }
    await page.locator('.up__btn').tap()
    const updates = await page.locator('.up__panel').boundingBox()
    assert(updates.x >= 0 && updates.x + updates.width <= width)
    for (const [index, route] of [[1, 'board'], [3, 'files'], [0, 'overview']]) {
      await buttons.nth(index).tap()
      await page.waitForFunction((route) => location.hash === '#/' + route, route)
      await buttons.nth(index).and(dock.locator('[aria-current="page"]')).waitFor()
    }
    await page.locator('.up__panel').waitFor({ state: 'hidden' })
    await buttons.nth(2).tap()
    await page.locator('.nr').waitFor()
    assert(await dock.evaluate((el) => {
      const box = el.getBoundingClientRect()
      return !el.contains(document.elementFromPoint(box.width / 2, box.y + 10))
    }), 'The dock must sit below the request form')
    await page.keyboard.press('Escape')
    await page.locator('.nr').waitFor({ state: 'hidden' })

    await more.tap()
    assert.equal(await sheet.locator('.ap-nav button').count(), 7) // calendar, deliveries, activity, reports, plan, brand kit, team
    await page.keyboard.press('Escape')
    assert(await more.evaluate((el) => el === document.activeElement))
    await more.tap()
    await page.keyboard.press('Control+k')
    await page.locator('.pl input:focus').waitFor()
    await page.keyboard.press('Escape')
    for (const [index, route] of ['calendar', 'deliveries', 'activity', 'reports', 'billing', 'brand'].entries()) {
      await more.tap()
      await sheet.locator('.ap-nav button').nth(index).tap()
      await page.waitForFunction((route) => location.hash === '#/' + route, route)
      assert(!(await sheet.isVisible()))
    }
    await page.locator('.bk__grid').waitFor()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const brandKit = await page.locator('.bk__grid').boundingBox()
    assert(brandKit.y + brandKit.height <= (await dock.boundingBox()).y + 1, 'The end of the brand kit must clear the dock')
    await buttons.nth(1).tap()
    await page.waitForFunction(() => location.hash === '#/board' && scrollY === 0)

    await more.tap()
    await sheet.locator('.ap-side__foot button').first().tap()
    // switching role reloads the shell and may close the sheet: open it again if so
    await page.waitForTimeout(600)
    if (!(await sheet.isVisible())) await more.tap()
    await sheet.locator('.ap-nav button').last().tap() // the studio view is the last destination
    await page.locator('.adm').waitFor()
    await more.tap()
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('.ap-top .ap-top__new').waitFor()
    assert.equal(await sheet.count(), 0)
    await page.setViewportSize({ width, height })
    await more.tap()
    await sheet.locator('.ap-side__foot button').last().tap()
    await page.locator('.lg__card').waitFor()
    assert.deepEqual(errors, [])
    console.log('Navigation OK', width, height, lang, theme)
    await page.close()
  }
} finally {
  await browser.close()
}
