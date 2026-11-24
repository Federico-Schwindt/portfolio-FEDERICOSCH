// Run after astro build. --suite runs the portal regression suite on the same isolated preview.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { Pool, neon } from '@neondatabase/serverless'
import { chromium } from 'playwright-core'

const port = Number(process.env.STUDIO_TEST_PORT || 4331), origin = 'http://localhost:' + port
const outDir = process.env.STUDIO_TEST_BUILD || 'dist'
const schema = 'studio_test_' + randomUUID().replaceAll('-','')
const preload = new URL('./workflow-preview.mjs', import.meta.url).href
if (!process.env.DATABASE_URL) process.loadEnvFile()
const pool = new Pool({connectionString:process.env.DATABASE_URL})
let connection = await pool.connect()
let created = false, preview, browser
const passed = name => console.log('OK', name)
const child = (args, mode = 'inherit') => spawn(process.execPath, ['--import',preload,...args], {
  stdio:mode, windowsHide:true, env:{...process.env, STUDIO_TEST_SCHEMA:schema, STUDIO_TEST_PORT:String(port), STUDIO_MAIL_PAUSED:'0'}
})
const agent = () => {
  let cookie = ''
  return async (path, method='GET', input, expected=200, headers={}) => {
    const res = await fetch(origin+'/api/'+path, {method, headers:{cookie, origin, 'x-studio':'1','content-type':'application/json', ...headers},
      body:input === undefined ? undefined : JSON.stringify(input)})
    if (res.headers.has('set-cookie')) cookie = res.headers.get('set-cookie').split(';')[0]
    if (expected !== null) assert.equal(res.status,expected,method+' '+path)
    return {data:res.status === 204 ? null : await res.json(), status:res.status, headers:res.headers}
  }
}
try {
  if (await fetch(origin+'/api/health/').then(()=>true,()=>false)) throw new Error('Test port already in use')
  await connection.query('begin')
  await connection.query('create schema '+schema)
  const migrations = ['studio.sql', ...(await readdir('db')).filter(n=>/^\d+.*\.sql$/.test(n)).sort()]
  for (const file of [...migrations, '04-queue-outbox.sql']) {
    const ddl = (await readFile('db/'+file,'utf8')).replace(/\bstudio(?=[.;,])/g,schema).replace('set search_path =','set local search_path =')
    await connection.query(ddl)
  }
  await connection.query('commit')
  created = true
  // The browser suite can outlive Neon's idle WebSocket. Reconnect only when cleanup needs SQL again.
  connection.release(true)
  connection = null
  process.env.STUDIO_TEST_SCHEMA = schema
  await import(preload)
  const db = neon(process.env.DATABASE_URL)
  const [probe] = await db`select n.nspname as relation from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.oid='studio.plans'::regclass`
  assert.equal(probe.relation,schema)
  preview = child(['node_modules/astro/bin/astro.mjs','preview','--port',String(port),'--outDir',outDir,'--ignore-lock'],'ignore')
  for (let i=0; i<90; i++) {
    if (await fetch(origin+'/api/health/').then(r=>r.ok,()=>false)) break
    if (i===89 || preview.exitCode !== null) throw new Error('Preview failed to start')
    await delay(250)
  }
  const owner = agent(), member = agent(), studio = agent(), other = agent()
  const password = randomUUID()
  const createdIds = []
  const signup = async (call, name, invite) => {
    const email = name+'@example.com'
    await call('auth/signup/','POST',{email,name,password,invite,lang:name==='owner'?'es':'en'})
    const [user] = await db`select id from studio.users where email=${email}`
    assert.ok(user, 'Preview writes to the isolated schema')
    createdIds.push(user.id)
    return user.id
  }
  const ownerId = await signup(owner,'owner')
  const otherId = await signup(other,'other')
  const adminId = await signup(studio,'studio')
  await db`update studio.users set role='admin' where id=${adminId}`
  const invite = (await owner('team/invites/','POST',{email:'member@example.com'})).data.link
  await signup(member,'member',new URL(invite).searchParams.get('invite'))
  const ids = []
  for (const title of ['First request','Second request','Third request']) ids.push((await owner('requests/','POST',{title})).data.id)
  const snapshot = async (call, version='', status=200) => call('state/', 'GET', undefined, status, {'x-studio-version':version})
  const firstState = await snapshot(owner)
  const version = firstState.headers.get('x-studio-version')
  assert.ok(version)
  const idle = await snapshot(owner, version, 204)
  assert.equal(idle.headers.get('server-timing'), 'state-revision')
  const studioVersion = (await snapshot(studio)).headers.get('x-studio-version')
  await db`update studio.users set phone='0101' where id=${otherId}`
  assert.equal((await snapshot(owner, version, 204)).headers.get('server-timing'), 'state-revision')
  const studioIdle = await snapshot(studio, studioVersion, 204)
  const newStudioVersion = studioIdle.headers.get('x-studio-version')
  assert.ok(newStudioVersion && newStudioVersion !== studioVersion)
  assert.equal((await snapshot(studio, newStudioVersion, 204)).headers.get('server-timing'), 'state-revision')
  // A future schedule becomes due without any intervening write to its account.
  const [schedule] = await db`insert into studio.recurring(user_id,title,every,next_at)
    values(${otherId},'Clock fixture','week',now()+interval '10 seconds') returning id`
  const beforeDue = await snapshot(other)
  assert.ok(!beforeDue.data.reqs.length)
  // The preview host and Postgres need not agree on the current time.
  const [clock] = await db`select greatest(0,extract(epoch from (next_at-clock_timestamp()))*1000)::int as remaining
    from studio.recurring where id=${schedule.id}`
  await delay(clock.remaining + 100)
  const afterDue = await snapshot(other, beforeDue.headers.get('x-studio-version'), null)
  if (afterDue.status !== 200) {
    const [r] = await db`select next_at <= now() as due, made from studio.recurring where id=${schedule.id}`
    throw new Error('Schedule check: HTTP ' + afterDue.status + ', due=' + r.due + ', made=' + r.made)
  }
  assert.ok(afterDue.data.reqs.some(r => r.recurringId === schedule.id))
  await db`delete from studio.requests where user_id=${otherId} and recurring_id=${schedule.id}`
  await db`delete from studio.recurring where id=${schedule.id}`
  passed('Indexed idle poll, account isolation, refreshed studio marker on 204 and a deadline crossed without writes')
  await owner('seen/', 'POST', {})
  const changed = await snapshot(owner, version)
  assert.deepEqual(Object.keys(changed.data), ['lastSeen'])
  for (const [call, visible] of [[member,true], [studio,true], [other,false]]) {
    const result = await snapshot(call, version)
    assert.ok(!result.headers.has('x-studio-delta'))
    assert.equal(result.data.reqs.some(r => r.id === ids[0]), visible)
  }
  passed('Owner, teammate, studio and outsider receive only their own authorized snapshot')
  const [event] = await db`insert into studio.request_events(request_id,user_id,author,kind,body)
    values(${ids[0]},${ownerId},${adminId},'ai','Author fixture') returning id`
  const withAuthor = (await snapshot(owner)).headers.get('x-studio-version')
  const unrelated = (await snapshot(other)).headers.get('x-studio-version')
  await db`update studio.users set full_name='New studio name' where id=${adminId}`
  const renamed = await snapshot(owner, withAuthor)
  assert.deepEqual(Object.keys(renamed.data), ['events'])
  assert.ok(renamed.data.events.some(e => e.id === event.id && e.by === 'New studio name'))
  assert.equal((await snapshot(other, unrelated, 204)).headers.get('server-timing'), 'state-revision')
  await db`delete from studio.request_events where id=${event.id}`
  const removed = await snapshot(owner, renamed.headers.get('x-studio-version'))
  assert.ok(!removed.data.events.some(e => e.id === event.id))
  passed('Author renames invalidate the accounts with their events, and direct deletes reach the next poll')
  const order = async call => (await call('state/')).data.reqs.filter(r=>r.owner===ownerId && r.status==='queued')
    .sort((a,b)=>a.position-b.position || a.id.localeCompare(b.id)).map(r=>r.id)
  const initial = await order(owner)
  const options = [[initial[1],initial[0],initial[2]],[initial[2],initial[1],initial[0]]]
  const move = (call, proposed, expected=initial) => call('requests/reorder/','POST',{owner:ownerId, expected,order:proposed},null)
  const race = await Promise.all([move(owner,options[0]),move(member,options[1])])
  assert.deepEqual(race.map(r=>r.status).sort(),[200,409])
  const winner = options[race.findIndex(r=>r.status===200)]
  assert.deepEqual(await order(owner),winner); assert.deepEqual(await order(member),winner)
  assert.equal((await move(other,initial,winner)).status,403)
  const foreign = (await other('requests/','POST',{title:'Another queue'})).data.id
  assert.equal((await move(studio,[winner[0],foreign,winner[2]],winner)).status,409)
  assert.deepEqual(await order(owner),winner)
  passed('Atomic reorder, stale editor, account boundary and reload from both sessions')

  await member('profile/','PATCH',{notify:{review:false,comments:true,billing:true}})
  await studio('requests/'+ids[0]+'/','PATCH',{status:'review'})
  await studio('requests/'+ids[0]+'/comments/','POST',{body:'retry-fixture'})
  await owner('requests/'+ids[0]+'/comments/','POST',{body:'Client reply'})
  await studio('admin/clients/'+ownerId+'/','PATCH',{plan:'launch',status:'active'})
  const plan = (await owner('plan/changes/','POST',{kind:'upgrade',to:'grow'})).data.change
  await studio('admin/changes/'+plan.id+'/apply/','POST',{})
  const queue = (await studio('notices/')).data.items
  assert.equal(queue.length,4); assert.ok(queue.every(r=>r.status==='queued'))
  assert.equal(queue.filter(r=>r.email==='member@example.com').length,1)
  assert.ok(queue.some(r=>r.subject.startsWith('Cambio de plan aplicado')))
  assert.deepEqual((await owner('notices/')).data.items,[])
  await owner('admin/mail/','GET',undefined,403)
  await owner('admin/mail/','PUT',{},403)
  await member('profile/','PATCH',{notify:{comments:false}})
  const settings = {provider:'resend', apiKey:randomUUID(),sender:'studio@example.com',appUrl:'https://portal.example.com'}
  const masked = (await studio('admin/mail/','PUT',settings)).data
  assert.equal(masked.apiKey,'••••••••')
  assert.deepEqual((await studio('admin/mail/','PUT',masked)).data,masked)
  assert.deepEqual((await studio('admin/mail/')).data,masked)
  const [stored] = await db`select value->>'apiKey'=${settings.apiKey} as retained from studio.settings where key='email_provider'`
  assert.equal(stored.retained,true)
  passed('Transactional review, comment and plan messages, preferences, queue-only mode and masked admin settings')

  // Wait for the simulated acknowledgement loss, then make only this fixture due for retry.
  for (let i=0; i<65; i++) {
    const [attempt] = await db`select attempts,status from studio.outbox where topic='comments' and recipient_id=${ownerId}`
    if (attempt.attempts===1 && attempt.status==='queued') {
      await db`update studio.outbox set available_at=now() where topic='comments' and recipient_id=${ownerId} and attempts=1 and envelope is not null and available_at < now()+interval '45 seconds'`
    }
    if ((await owner('notices/')).data.items.length===3) break
    await delay(1000)
  }
  const sent = (await owner('notices/')).data.items
  assert.equal(sent.length,3)
  assert.ok(sent.every(r=>r.status==='sent' && r.sentAt && r.text.includes('/es/app/')))
  assert.deepEqual((await member('notices/')).data.items,[])
  assert.deepEqual((await other('notices/')).data.items,[])
  const [retry] = await db`select attempts from studio.outbox where topic='comments' and recipient_id=${ownerId}`
  assert.equal(retry.attempts,2)
  assert.ok((await studio('notices/')).data.items.some(r=>r.status==='skipped'))
  passed('Provider acceptance, idempotent retry, opt-out before dispatch and private receipts')
  await studio('admin/mail/','PUT',{...masked,provider:'none'})
  await db`insert into studio.request_events(request_id,user_id,kind,body,created_at)
    select ${ids[0]},${ownerId},'ai','History '||n,timestamptz '2024-01-01 00:00:00.123456+00'
    from generate_series(1,421) n`
  let cursor, history=[]
  do {
    const page = (await member('activity/?who=ai'+(cursor?'&cursor='+encodeURIComponent(cursor):''))).data
    history.push(...page.items); cursor=page.next
  } while (cursor)
  assert.equal(history.length,421); assert.equal(new Set(history.map(r=>r.id)).size,421)
  const viewer = [ownerId, ownerId, 'client'].join('/')
  const exportPath = 'activity/?' + new URLSearchParams({ who: 'ai', exportFor: viewer })
  const batch = (await owner(exportPath, 'POST', { query: 'History' })).data
  assert.equal(batch.items.length,250)
  const remaining = (await owner(exportPath+'&cursor='+encodeURIComponent(batch.next), 'POST', { query: 'History' })).data
  assert.equal(remaining.next,null)
  assert.deepEqual([...batch.items,...remaining.items].map(e=>e.id), history.map(e=>e.id))
  await other(exportPath,'GET',undefined,409)
  passed('Export batches retain microsecond cursors and reject a changed session')
  assert.deepEqual((await other('activity/?who=ai')).data.items,[])
  await owner('activity/?cursor=bad','GET',undefined,400)
  passed('421 same-timestamp events, filtered cursor pages and account isolation')
  const needle = 'Revisión 50%_'
  await db`insert into studio.request_events(request_id,user_id,author,kind,body,created_at)
    values (${ids[1]},${ownerId},${ownerId},'comment',${needle},timestamptz '2020-01-01')`
  const search = (call, query, who = '', cursor = '') => call('activity/?'+new URLSearchParams({who,...(cursor && {cursor})}), 'POST', {query})
  const matches = (await search(member,'revision 50%_','client')).data.items
  assert.equal(matches.length,1)
  assert.equal(matches[0].requestId,ids[1])
  assert.equal(matches[0].requestTitle,'Second request')
  for (const [call,term,who] of [[other,'revision',''],[member,'revision','ai'],[member,'50__','']]) {
    assert.deepEqual((await search(call,term,who)).data.items,[])
  }
  const byNumber = (await search(studio,'#'+matches[0].requestNumber)).data.items
  assert.ok(byNumber.length && byNumber.every(e=>e.requestId===ids[1]))
  const first = (await search(owner,'First request','ai')).data
  const older = (await search(owner,'First request','ai',first.next)).data
  assert.equal(new Set([...first.items,...older.items].map(e=>e.id)).size,80)
  await owner('activity/','POST',{query:'x'.repeat(101)},400)
  await owner('activity/','POST',{query:[]},400)
  passed('Search beyond 400 events, accents, literal punctuation, exact request numbers, pagination and visibility')

  browser = await chromium.launch({channel:'chrome'})
  for (const [lang,width] of [['en',1440],['es',390]]) {
    const context = await browser.newContext({viewport:{width,height:850},colorScheme:lang==='es'?'dark':'light'})
    const page = await context.newPage()
    const login = await context.request.post(origin+'/api/auth/login/',{data:{email:'owner@example.com',password},headers:{'x-studio':'1',origin}})
    assert.ok(login.ok())
    await page.goto(origin+(lang==='en'?'':'/es')+'/app/#/activity')
    await page.locator('.ac__tabs button').last().click()
    await page.locator('.ac__i').first().waitFor()
    await page.route(/\/api\/activity\/\?.*cursor=/, route => route.fulfill({status:503,contentType:'application/json',body:'{}'}), {times:1})
    await page.getByRole('button',{name:lang==='en'?'Show older':'Ver anteriores'}).click()
    await page.locator('.ac [role=alert]').waitFor()
    assert.equal(await page.locator('.ac__i').count(),40)
    await page.getByRole('button',{name:lang==='en'?'Try again':'Reintentar'}).click()
    await page.waitForFunction(()=>document.querySelectorAll('.ac__i').length===80)
    const exportButton = page.getByRole('button', { name: lang==='en'?'Export activity (CSV)':'Exportar actividad (CSV)' })
    await page.route(/\/api\/activity\/\?.*cursor=.*exportFor=/, route => route.fulfill({status:503,contentType:'application/json',body:'{}'}), {times:1})
    const downloads = []
    page.on('download', file => downloads.push(file))
    await exportButton.click()
    await page.getByText(lang==='en'?'The CSV download failed. Try exporting again.':'Falló la descarga del CSV. Vuelve a exportarlo.').waitFor()
    assert.equal(downloads.length,0)
    const file = page.waitForEvent('download')
    await exportButton.click()
    const csv = await readFile(await (await file).path(),'utf8')
    assert.equal(csv.trimEnd().split('\r\n').length,422)
    assert.equal(new Set(csv.match(/"History \d+"/g)).size,421)
    assert.equal(await page.locator('.ac__i').count(),80)
    const waiting = page.waitForRequest(req => req.url().includes('exportFor=') && req.url().includes('cursor='))
    let release
    const held = new Promise(resolve => { release = resolve })
    await page.route(/\/api\/activity\/\?.*cursor=.*exportFor=/, async route => {
      await held
      await route.abort()
    }, {times:1})
    await exportButton.click()
    await waiting
    await page.getByRole('button', { name: lang==='en'?'Cancel export':'Cancelar exportación' }).click()
    release()
    await exportButton.waitFor()
    assert.equal(downloads.length,1)
    const input = page.getByRole('searchbox')
    await page.locator('.ac__tabs button').first().click()
    await input.fill('revision 50%_'); await input.press('Enter')
    const match = page.locator('.ac__i').filter({hasText:needle})
    await match.waitFor()
    assert.equal(await page.locator('.ac__i').count(),1)
    await match.getByRole('button').press('Enter')
    await page.getByRole('dialog',{name:'Second request'}).waitFor()
    await page.keyboard.press('Escape')
    await page.getByRole('dialog',{name:'Second request'}).waitFor({state:'hidden'})
    assert.ok(await match.getByRole('button').evaluate(el=>el===document.activeElement))
    assert.equal(await input.inputValue(),'revision 50%_')
    await page.locator('.ac > details > summary').click()
    await page.getByText(lang==='en'?'Notice sent':'Aviso enviado',{exact:true}).first().waitFor()
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))
    await context.close()
    passed('Activity page and email receipts in '+lang+' at '+width+'px')
  }
  await studio('requests/'+ids[0]+'/comments/','POST',{body:'Copy this queued notice'})
  await other('requests/','POST',{title:'Next client priority'})
  const adminContext = await browser.newContext({viewport:{width:390,height:844},permissions:['clipboard-read','clipboard-write']})
  const page = await adminContext.newPage()
  const login = await adminContext.request.post(origin+'/api/auth/login/',{data:{email:'studio@example.com',password},headers:{'x-studio':'1',origin}})
  assert.ok(login.ok())
  await page.goto(origin+'/es/app/#/admin/payments')
  const mail = page.locator('section').filter({has:page.getByRole('heading',{name:'Avisos por correo',exact:true})}).last()
  const form = mail.locator('form')
  assert.equal(await form.locator('input[type=password]').inputValue(),'••••••••')
  await form.locator('button').click()
  assert.ok((await mail.locator('details summary').first().innerText()).includes('En cola'))
  await mail.locator('details summary').first().click()
  await mail.getByRole('button',{name:'Copiar mensaje'}).first().click()
  assert.ok((await page.evaluate(()=>navigator.clipboard.readText())).includes('/app/#/'))
  await page.goto(origin+'/es/app/#/admin')
  const all = page.locator('.adm__filter select')
  await all.waitFor()
  assert.equal(await page.locator('.kc__grip').count(),0)
  await all.selectOption(otherId)
  const exportFile = page.waitForEvent('download')
  await page.getByRole('button',{name:'Exportar pedidos (CSV)'}).press('Enter')
  const selectedRequests = await readFile(await (await exportFile).path(),'utf8')
  assert.ok(selectedRequests.includes('Next client priority') && selectedRequests.includes('Another queue'))
  assert.ok(!selectedRequests.includes('First request'))
  const cards = page.locator('.kb__col--queued .kc')
  await cards.filter({hasText:'Next client priority'}).locator('.kc__mvn').click()
  await page.waitForFunction(()=>document.querySelector('.kb__col--queued .kc__t')?.textContent==='Next client priority')
  const persisted = (await other('state/')).data.reqs.sort((a,b)=>a.position-b.position)
  assert.equal(persisted[0].title,'Next client priority')
  await adminContext.close()
  passed('Masked provider form, copy from the outbox and studio account selector')
  const demo = await browser.newContext()
  const dp = await demo.newPage()
  await dp.goto(origin+'/es/app/?demo')
  await dp.evaluate(() => {
    const user = {id:'demouser',name:'Demo',role:'admin',email:'demo@example.com',company:'',brand:{},lang:'es'}
    const request = {id:'demo2026',number:1,owner:user.id,title:'Entrega de prueba',kind:'design',status:'active',
      brief:'',checklist:[],files:[],priority:2,position:1,progress:25,createdAt:new Date().toISOString()}
    localStorage.setItem('fs-demo-v1',JSON.stringify({user,reqs:[request],seq:1,events:[],files:[],invoices:[],sub:null}))
    location.hash='/admin'
  })
  await dp.reload()
  await dp.locator('.kb__col--active .kc__adv').click()
  await dp.locator('.dr__notice').waitFor()
  await dp.goto(origin+'/es/app/?demo#/admin/payments')
  const demoForm = dp.locator('form.bk__fields')
  await demoForm.locator('select').selectOption('resend')
  await demoForm.locator('input[type=email]').fill('studio@example.com')
  await demoForm.locator('input[type=password]').fill('demo-placeholder')
  await demoForm.locator('button').click()
  await dp.waitForFunction(()=>JSON.parse(localStorage.getItem('fs-demo-v1')).outbox[0].status==='sent')
  assert.equal(await dp.evaluate(()=>localStorage.getItem('fs-demo-v1').includes('demo-placeholder')),false)
  await dp.reload()
  await dp.getByText('Aviso enviado',{exact:true}).waitFor()
  await demo.close()
  passed('Demo queues a delivery, simulates sending, and persists its receipt without storing the key')
  await browser.close(); browser=null
  await db`delete from studio.users where id=any(${createdIds}::uuid[])`
  const [left] = await db`select count(*)::int as n from studio.users`
  assert.equal(left.n,0)
  if (process.argv.includes('--suite')) {
    for (const [script,...args] of [
      ['welcome-check',port],['studio-check',port],['api-check',port],['workspace-search-check',port],['plan-admin-check',port],
      ['studio-operations-check',port],['studio-ratings-check',port],['plan-quote-check',port],
      ['request-page-check',port],['studio-read-check',port],['app-nav'],['mobile-fit'],['sections',port],['activity-check',port],['app-live',port],['app'],['app','es','dark'],
    ]) {
      console.log('Running', script, ...args)
      const test = child(['scripts/'+script+'.mjs',...args.map(String)])
      assert.equal((await once(test,'exit'))[0],0,script)
    }
  }
} catch (err) {
  // Provider and connection details must stay out of diagnostics.
  console.error('Workflow check failed:', err.name, err.code ?? '')
  if (/^Schedule check: HTTP \d+, due=(true|false), made=\d+$/.test(err.message)) console.error(err.message)
  const frames = [...String(err.stack).matchAll(/workflow-check\.mjs:(\d+:\d+)/g)].map(match => match[1])
  console.error('Workflow check locations:', frames.join(' → '))
  if (Number.isInteger(err.actual) && Number.isInteger(err.expected)) console.error('Expected', err.expected, 'received', err.actual)
  process.exitCode=1
} finally {
  if (browser) await browser.close()
  if (preview && preview.exitCode===null && !preview.signalCode) {
    const stopped = once(preview,'exit'); preview.kill(); await stopped
  }
  if (created) {
    await pool.query('drop schema '+schema+' cascade')
    console.log('Removed isolated schema and test accounts')
  } else if (connection) await connection.query('rollback')
  connection?.release()
  await pool.end()
}
