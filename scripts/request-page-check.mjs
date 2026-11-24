// Exercise the shipped React app and the server's conditional response with local fixtures.
import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'
import { stateResponse } from '../src/server/state-response.ts'

const origin = 'http://localhost:' + Number(process.argv[2] || process.env.STUDIO_TEST_PORT || 4330)
const at = '2026-10-01T12:00:00Z'
const reqs = Array.from({length: 40}, (_, i) => ({
  id: 'request-' + i, number: i + 1, owner: 'owner', title: 'Design request ' + i,
  brief: 'Update the homepage layout. '.repeat(10), kind: 'design', priority: 2,
  position: i, status: 'queued', progress: 0, files: [], checklist: [], createdAt: at,
}))
const state = {
  user: { id: 'owner', account: 'owner', role: 'client', name: 'Owner', email: 'owner@example.com', brand: {} },
  sub: null, reqs, events: [], files: [], invoices: [], pins: [], recurring: [], changes: [], lastSeen: null,
}
const version = stateResponse(state, 'owner', '').headers.get('x-studio-version')
const unchanged = stateResponse(state, 'owner', version)
assert.equal(unchanged.status, 204)
assert.equal((await unchanged.text()).length, 0)
const comment = { id: 'comment', requestId: reqs[0].id, who: 'client', kind: 'comment', body: 'A new comment', at }
const delta = await stateResponse({...state, events:[comment]}, 'owner', version).text()
assert.deepEqual(JSON.parse(delta), {events:[comment]})
const fullSize = Buffer.byteLength(JSON.stringify(state))
console.log('Fixture, 40 requests (response body bytes): full %d, idle 0, one comment %d', fullSize, Buffer.byteLength(delta))

const browser = await chromium.launch({ channel:'chrome', headless:true })
try {
  for (const es of [false, true]) {
    const context = await browser.newContext({viewport: {width: es ? 390 : 1440, height: 900}, permissions:['clipboard-read','clipboard-write']})
    const page = await context.newPage()
    page.setDefaultTimeout(6500)
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    const path = (es ? '/es/app/' : '/app/') + '#/request/' + reqs[0].id
    let viewer = null, unavailable = true, paymentFailure = true, paymentSaveFailure = true, paymentHold
    let thread = [], changes = [], clientsHold, clientsFailed = true
    const payments = {provider:'none', apiKey:'', storeId:'', webhookSecret:'', variants:{}}
    await page.route('**/api/**', async route => {
      const req = route.request(), endpoint = new URL(req.url()).pathname.slice(5)
      const answer = (json, status=200) => route.fulfill({json,status})
      if (endpoint === 'health/') return answer({ok:true})
      if (endpoint === 'auth/login/') { viewer = 'owner'; return answer({ok:true}) }
      if (endpoint === 'state/') {
        if (unavailable) return answer({},503)
        if (!viewer) return answer({},401)
        const studio = viewer === 'studio', outsider = viewer === 'outside'
        const current = {...state, user:{...state.user, id:viewer, account:outsider ? viewer : 'owner', role:studio ? 'admin' : 'client'},
          reqs:outsider ? [] : reqs, events:outsider ? [] : thread, changes}
        const response = stateResponse(current, viewer, req.headers()['x-studio-version'] ?? null)
        return route.fulfill({status:response.status, headers:Object.fromEntries(response.headers), body:await response.text()})
      }
      if (endpoint === 'requests/request-0/comments/') {
        thread = [{...comment, body:req.postDataJSON().body}]
        return answer({ok:true})
      }
      if (endpoint.includes('/brief/')) return answer({owner:'owner', company:'Test studio', brand:{}})
      if (endpoint === 'admin/clients/') {
        await clientsHold
        return clientsFailed ? answer({},503) : answer([])
      }
      if (endpoint === 'admin/payments/') {
        if (paymentHold) await paymentHold
        if (req.method() === 'PUT') {
          if (paymentSaveFailure) return answer({},503)
          return answer(req.postDataJSON())
        }
        return paymentFailure ? answer({},503) : answer(payments)
      }
      if (endpoint === 'admin/mail/') return answer({provider:'none',appUrl:'',apiKey:'',sender:''})
      if (endpoint === 'notices/') return answer({items:[],next:null})
      throw new Error('Unexpected fixture endpoint ' + endpoint)
    })
    // The same tab may previously have visited a demo, including from a different account.
    await page.addInitScript(() => sessionStorage.setItem('fs-demo','1'))
    await page.goto(origin + path)
    await page.getByRole('alert').getByRole('button').click({trial:true})
    unavailable = false
    await page.getByRole('alert').getByRole('button').click()
    await page.locator('.af input[type=email]').fill('owner@example.com')
    await page.locator('.af input[type=password]').fill('fixture-password')
    await page.locator('.af button[type=submit]').click()
    const title = page.getByRole('heading', {name:reqs[0].title,level:1})
    await title.waitFor()
    await page.evaluate(() => { location.hash = '/board/request-0' })
    const drawer = page.getByRole('dialog', {name:reqs[0].title})
    await drawer.locator('.dr__share a').press('Enter')
    await title.waitFor()
    await page.locator('.dr-page .dr__share button').click()
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), origin + path)
    await page.locator('.dr__f textarea').fill(comment.body)
    await page.locator('.dr__f textarea').press('Control+Enter')
    await page.getByText(comment.body, {exact:true}).waitFor()
    await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {value:undefined, configurable:true}))
    await page.locator('.dr__share button').click()
    assert.equal(await page.locator('.dr__share input').inputValue(), origin + path)
    const layout = await page.evaluate(() => ({
      width: innerWidth, actual: document.documentElement.scrollWidth, scrollX,
      wide: [...document.querySelectorAll('body *')].filter(el => el.scrollWidth > el.clientWidth + 2 || el.getBoundingClientRect().right + scrollX > innerWidth + 1)
        .map(el => [el.tagName, String(el.className), el.scrollWidth, el.clientWidth, Math.round(el.getBoundingClientRect().right)]).slice(0,35),
    }))
    assert.ok(layout.actual <= layout.width + 1, JSON.stringify(layout))
    await page.reload()
    await title.waitFor()
    const poll = () => page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
    await page.evaluate(() => { location.hash = '/billing' })
    await page.locator('.bl-quiet').first().waitFor()
    changes = [{id:'plan', kind:'upgrade', from:'launch', to:'grow', status:'scheduled', effectiveAt:new Date().toISOString()}]
    await poll()
    await page.locator('.bl-open__i--scheduled').waitFor()
    await page.evaluate(() => { location.hash = '/calendar' })
    await page.locator('.cal__dot--change').first().waitFor()
    changes = []
    await poll()
    await page.locator('.cal__dot--change').first().waitFor({state:'hidden'})
    await page.goto(origin + path)
    await title.waitFor()
    viewer = 'outside'
    await poll()
    await page.locator('.request-missing').waitFor()
    assert.equal(await page.getByText(reqs[0].title, {exact:true}).count(),0)
    viewer = 'member'
    await poll()
    await title.waitFor()
    assert.equal(await page.locator('.dr__business').count(),0)
    viewer = 'studio'
    await poll()
    await page.locator('.dr__business a').waitFor()
    let release
    paymentHold = new Promise(resolve => { release = resolve })
    await page.evaluate(() => { location.hash = '/admin/payments' })
    await page.locator('#studio-panel [role=status]').first().waitFor()
    release()
    await page.locator('#studio-panel [role=alert] button').waitFor()
    paymentFailure = false
    await page.locator('#studio-panel [role=alert] button').click()
    const field = page.locator('.adm__payment-fields input').nth(1)
    await field.fill('test-store')
    const save = page.locator('#studio-panel .ap-head button')
    await save.click()
    await page.locator('#studio-panel [role=alert]').waitFor()
    assert.equal(await field.inputValue(),'test-store')
    paymentSaveFailure = false
    await save.click()
    await page.locator('#studio-panel [role=alert]').waitFor({state:'hidden'})
    clientsHold = new Promise(resolve => { release = resolve })
    await page.evaluate(() => { location.hash = '/admin/clients' })
    await page.locator('.adm__table [role=status]').waitFor()
    release()
    const retry = page.locator('.adm__table [role=alert] button')
    await retry.waitFor()
    clientsFailed = false
    await retry.click()
    await page.locator('.adm__table > p.muted').waitFor()
    assert.equal(await page.locator('.adm__table table').count(),0)
    assert.deepEqual(errors,[])
    await context.close()
    console.log('OK private request page, role changes and payment retries:', es ? 'es, 390px' : 'en, 1440px')
  }
} finally { await browser.close() }
