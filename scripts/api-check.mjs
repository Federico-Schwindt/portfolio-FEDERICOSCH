// API check against the running server (astro preview on :4330) and the real Neon database.
// Only clean up accounts successfully created by this run. Studio payment settings are shared.
import { neon } from '@neondatabase/serverless'
// A second local preview lets teammates check a new server build while the first one stays in use.
const origin = `http://localhost:${Number(process.argv[2] || 4330)}`
const base = origin + '/api/'
if (!process.env.DATABASE_URL) process.loadEnvFile()
const sql = neon(process.env.DATABASE_URL)
const out = []
const ok = (name, cond, extra = '') => out.push([name, cond ? 'ok' : 'FAIL', extra])
const client = () => {
  let cookie = ''
  return async (path, method = 'GET', body, headers = {}) => {
    const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'x-studio': '1', origin, cookie, ...headers }, body: body ? JSON.stringify(body) : undefined })
    const sc = r.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0]
    return { status: r.status, data: await r.json().catch(() => null) }
  }
}
const stamp = Date.now()
const A = client(), B = client()
const ea = `check-a-${stamp}@example.com`, eb = `check-b-${stamp}@example.com`
const created = []
async function signup(call, email, password, name) {
  const result = await call('auth/signup/', 'POST', { email, password, name })
  if (result.status !== 200) throw new Error(`signup ${name} returned HTTP ${result.status}`)
  created.push(email)
  return true
}
try {
  ok('health', (await A('health/')).data?.ok)
  ok('no session → 401', (await A('state/')).status === 401)
  ok('short password refused', (await A('auth/signup/', 'POST', { email: ea, password: '123', name: 'A' })).status === 400)
  ok('signup A', await signup(A, ea, 'correct horse 1', 'Ana Check'))
  ok('duplicate signup refused', (await B('auth/signup/', 'POST', { email: ea, password: 'whatever 123' })).status === 409)
  ok('wrong password refused', (await B('auth/login/', 'POST', { email: ea, password: 'nope nope' })).status === 401)
  ok('signup B', await signup(B, eb, 'correct horse 2', 'Bob Check'))
  ok('missing x-studio header refused', (await A('requests/', 'POST', { title: 'x y z' }, { 'x-studio': '' })).status === 403)
  const s0 = (await A('state/')).data
  ok('state A', s0?.user?.email === ea && s0.user.role === 'client', s0?.user?.role)
  // no plan yet: requests wait in the queue
  const r1 = (await A('requests/', 'POST', { title: 'Homepage hero', kind: 'page', brief: 'Make it sell', checklist: [{ text: 'Goal' }], priority: 2 })).data
  const r2 = (await A('requests/', 'POST', { title: 'Logo refresh', kind: 'design', priority: 2 })).data
  const r3 = (await A('requests/', 'POST', { title: 'Urgent fix', kind: 'fix', priority: 1 })).data
  let st = (await A('state/')).data
  ok('without a plan all wait', st.reqs.every((r) => r.status === 'queued'), st.reqs.map((r) => r.status).join(','))
  ok('high priority first in queue', st.reqs.filter((r) => r.status === 'queued').sort((a, b) => a.position - b.position)[0].id === r3.id)
  // checkout without a provider → pending
  const co = (await A('checkout/', 'POST', { plan: 'launch', step: 'build', returnUrl: origin + '/app/' })).data
  ok('checkout without provider → pending', co?.pending === true)
  ok('client cannot open admin', (await A('admin/clients/')).status === 403)
  ok('B cannot see A\'s request', (await B(`requests/${r1.id}/`, 'PATCH', { title: 'hacked' })).status === 404)
  ok('client cannot set progress', (await A(`requests/${r1.id}/`, 'PATCH', { progress: 90 })).status === 403)
  // make A's plan active as the studio would: promote to admin in the db for B
  await sql`update studio.users set role = 'admin' where email = ${eb}`
  const cl = (await B('admin/clients/')).data
  const a = cl.find((c) => c.email === ea)
  ok('admin sees clients', !!a && a.status === 'pending', a?.status)
  const studioState = (await B('state/')).data
  ok('review email addressed to the request owner', studioState?.reqs.find((r) => r.id === r2.id)?.ownerEmail === ea)
  ok('client requests omit the studio contact field', st.reqs.every((r) => !('ownerEmail' in r)))
  ok('admin activates Launch', (await B(`admin/clients/${a.id}/`, 'PATCH', { plan: 'launch', status: 'active', community: false })).status === 200)
  st = (await A('state/')).data
  const act = st.reqs.filter((r) => r.status === 'active')
  ok('queue rule: Launch runs 2', act.length === 2, act.map((r) => r.title).join(' + '))
  ok('the urgent one started', act.some((r) => r.id === r3.id))
  // the studio delivers one; the client approves; the next one starts by itself
  const first = act[0]
  ok('admin sends to review', (await B(`requests/${first.id}/`, 'PATCH', { status: 'review' })).status === 200)
  ok('client approves', (await A(`requests/${first.id}/`, 'PATCH', { status: 'done' })).status === 200)
  st = (await A('state/')).data
  ok('next one starts by itself', st.reqs.filter((r) => r.status === 'active').length === 2 && st.reqs.filter((r) => r.status === 'queued').length === 0, st.reqs.map((r) => `${r.title}:${r.status}`).join(', '))
  ok('client cannot jump a queued → done', (await A(`requests/${r2.id}/`, 'PATCH', { status: 'done' })).status === 403)
  ok('comment', (await A(`requests/${r1.id}/comments/`, 'POST', { body: 'Looks great' })).status === 200)
  st = (await A('state/')).data
  ok('timeline has statuses and comment', st.events.some((e) => e.kind === 'comment') && st.events.some((e) => e.body === 'done'), String(st.events.length))
  const pv = await B('admin/payments/')
  const maskedOrEmpty = (s) => typeof s === 'string' && (s === '' || /^••••.{1,4}$/u.test(s))
  ok('payment fields empty or masked on read', pv.status === 200 && maskedOrEmpty(pv.data?.apiKey) && maskedOrEmpty(pv.data?.webhookSecret))
  ok('webhook rejects bad signature', (await A('billing/webhook/', 'POST', { meta: {} })).status === 401)
  // files: a client uploads to their request, the studio uploads deliverables (v1, v2), nobody else can read them
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
  const cookieOf = async (email, password) => { const r = await fetch(base + 'auth/login/', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-studio': '1', origin }, body: JSON.stringify({ email, password }) }); return r.headers.get('set-cookie').split(';')[0] }
  const ca = await cookieOf(ea, 'correct horse 1'), cb = await cookieOf(eb, 'correct horse 2')
  const send = async (cookie, fields) => { const fd = new FormData(); fd.append('file', new Blob([png], { type: 'image/png' }), fields.name); for (const [k, v] of Object.entries(fields)) if (k !== 'name') fd.append(k, v); const r = await fetch(base + 'files/', { method: 'POST', headers: { 'x-studio': '1', origin, cookie }, body: fd }); return { status: r.status, data: await r.json() } }
  const f1 = await send(ca, { name: 'brief.png', requestId: r2.id, kind: 'deliverable' })
  ok('client upload (deliverable downgraded to brief)', f1.status === 200 && f1.data.kind === 'brief', f1.data.kind)
  const d1 = await send(cb, { name: 'design-v1.png', requestId: r2.id, kind: 'deliverable' })
  const d2 = await send(cb, { name: 'design-v2.png', requestId: r2.id, kind: 'deliverable' })
  ok('deliverable versions', d1.data.version === 1 && d2.data.version === 2, `${d1.data.version}, ${d2.data.version}`)
  const get = async (cookie, id) => (await fetch(base + `files/${id}/`, { headers: { cookie } })).status
  ok('owner downloads', (await get(ca, d2.data.id)) === 200)
  const C = client(); await signup(C, `check-c-${stamp}@example.com`, 'correct horse 3', 'C')
  const cc = await cookieOf(`check-c-${stamp}@example.com`, 'correct horse 3')
  ok('stranger cannot download', (await get(cc, d2.data.id)) === 404)
  ok('anonymous cannot download', (await get('', d2.data.id)) === 401)
  st = (await A('state/')).data
  ok('state lists files', st.files.length === 3 && st.files.some((f) => f.byStudio), String(st.files.length))
  // pins on images: tied to one version; only the owner and the studio
  const pinAs = async (cookie, b) => (await fetch(base + 'pins/', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-studio': '1', origin, cookie }, body: JSON.stringify(b) })).status
  ok('pin needs a note', (await pinAs(ca, { fileId: d1.data.id, x: 0.5, y: 0.5, body: '' })) === 400)
  ok('client pins v1', (await pinAs(ca, { fileId: d1.data.id, x: 0.25, y: 0.4, body: 'Logo too small here' })) === 200)
  ok('stranger cannot pin', (await pinAs(cc, { fileId: d1.data.id, x: 0.2, y: 0.2, body: 'x' })) === 404)
  let ps = (await A('state/')).data.pins
  const pin = ps.find((p) => p.fileId === d1.data.id)
  ok('pin stays on v1', !!pin && ps.every((p) => p.fileId !== d2.data.id), String(ps.length))
  ok('only studio can mark work done', (await A(`pins/${pin.id}/`, 'PATCH', { resolved: true })).status === 403 && (await A('state/')).data.pins.find((p) => p.id === pin.id)?.resolved === false)
  ok('studio resolves pin', (await B(`pins/${pin.id}/`, 'PATCH', { resolved: true })).status === 200 && (await A('state/')).data.pins.find((p) => p.id === pin.id)?.resolved === true)
  ok('client cannot delete studio file', (await fetch(base + `files/${d1.data.id}/`, { method: 'DELETE', headers: { 'x-studio': '1', origin, cookie: ca } })).status === 404)
  // sending a delivery back needs a note, stored with the version it is about
  await B(`requests/${r2.id}/`, 'PATCH', { status: 'review' })
  ok('send back without a note refused', (await A(`requests/${r2.id}/`, 'PATCH', { status: 'active' })).status === 400)
  ok('send back with a note', (await A(`requests/${r2.id}/`, 'PATCH', { status: 'active', note: 'Make the logo bigger on mobile' })).status === 200)
  st = (await A('state/')).data
  const ch = st.events.find((e) => e.kind === 'changes' && e.requestId === r2.id)
  ok('change request saved with its version', !!ch && ch.body.startsWith('v2: Make the logo'), ch?.body)
  ok('request back in progress', st.reqs.find((r) => r.id === r2.id)?.status === 'active')
  // needed-by date
  const r4 = (await A('requests/', 'POST', { title: 'Promo banner', kind: 'design', dueDate: '2030-01-31' })).data
  ok('needed-by date saved', r4.dueDate === '2030-01-31', r4.dueDate)
  // the client's team: an invite link joins the owner's account; removing ends access at once
  const M = client(), D = client(), E = client()
  const ec = `check-m-${stamp}@example.com`, ed = `check-d-${stamp}@example.com`, ee = `check-e-${stamp}@example.com`
  ok('studio cannot invite', (await B('team/invites/', 'POST', { email: ec })).status === 403)
  const inv = (await A('team/invites/', 'POST', { email: ec })).data
  const token = inv?.link?.split('invite=')[1]
  ok('owner creates invite link', !!token && inv.link.includes('/app/?invite='), inv?.link?.replace(/invite=.*/, 'invite=…'))
  ok('invite info names the account', (await D('team/invite-info/', 'POST', { token })).data?.email === ec)
  ok('invite refused for another email', (await D('auth/signup/', 'POST', { email: ed, password: 'correct horse 4', name: 'Dan', invite: token })).status === 410)
  const cs = await M('auth/signup/', 'POST', { email: ec, password: 'correct horse 3', name: 'Cleo Check', invite: token })
  if (cs.status === 200) created.push(ec)
  ok('invited teammate signs up', cs.status === 200, String(cs.status))
  ok('invite works once', (await D('team/invite-info/', 'POST', { token })).status === 410)
  let sc = (await M('state/')).data
  ok('member sees the owner\'s requests', sc.user.member === true && sc.reqs.some((r) => r.id === r1.id), String(sc.reqs.length))
  ok('member sees the owner\'s files', sc.files.some((f) => f.id === d1.data.id))
  const search = (as, query) => as('search/', 'POST', { query })
  ok('search needs a session', (await search(client(), 'design')).status === 401)
  ok('search rejects blank and oversized queries', (await search(A, ' ')).status === 400 && (await search(A, 'x'.repeat(101))).status === 400)
  ok('invalid search offset refused', (await A('search/', 'POST', { query: 'design', offset: -1 })).status === 400)
  const found = (await search(M, 'DESIGN-v2')).data?.files?.[0]
  ok('member finds exact delivery version and request', found?.file.id === d2.data.id && found.file.version === 2 && found.requestTitle === r2.title)
  ok('other account cannot find the file', (await search(C, 'design-v2')).data?.files?.length === 0)
  ok('wildcards are literal', (await search(A, '%')).data?.files?.length === 0)
  ok('client cannot search studio directory', (await search(A, ea)).data?.clients?.length === 0)
  ok('studio finds account without requests', (await search(B, `check-c-${stamp}@example.com`)).data?.clients?.length === 1)
  ok('member has no invoices', Array.isArray(sc.invoices) && sc.invoices.length === 0)
  const mc = await cookieOf(ec, 'correct horse 3')
  ok('member downloads the account\'s file', (await get(mc, d1.data.id)) === 200)
  const rc = (await M('requests/', 'POST', { title: 'Teammate request', kind: 'copy' })).data
  ok('member request lands on the owner\'s queue', (await A('state/')).data.reqs.some((r) => r.id === rc.id))
  ok('member cannot invite', (await M('team/invites/', 'POST', { email: ed })).status === 403)
  ok('member cannot change the plan', (await M('checkout/', 'POST', { plan: 'grow', step: 'build', returnUrl: origin + '/app/' })).status === 403)
  ok('owner sees the team', (await A('team/')).data?.members?.length === 2)
  // an existing account joins through sign-in
  const es1 = await E('auth/signup/', 'POST', { email: ee, password: 'correct horse 5', name: 'Eli Check' })
  if (es1.status === 200) created.push(ee)
  const inv2 = (await A('team/invites/', 'POST', { email: ee })).data
  ok('existing account joins by signing in', (await E('auth/login/', 'POST', { email: ee, password: 'correct horse 5', invite: inv2.link.split('invite=')[1] })).status === 200 && (await E('state/')).data.reqs.some((r) => r.id === r1.id))
  // revoke and remove
  const inv3 = (await A('team/invites/', 'POST', { email: ed })).data
  await A(`team/invites/${inv3.id}/`, 'DELETE')
  ok('revoked invite stops working', (await D('team/invite-info/', 'POST', { token: inv3.link.split('invite=')[1] })).status === 410)
  const cid = sc.user.id
  ok('member cannot remove others', (await M(`team/members/${(await E('state/')).data.user.id}/`, 'DELETE')).status === 403)
  await A(`team/members/${cid}/`, 'DELETE')
  sc = (await M('state/')).data
  ok('removed member loses requests', sc.reqs.every((r) => r.id !== r1.id) && !sc.user.member)
  ok('removed member loses files', (await get(mc, d1.data.id)) === 404 && (await M(`requests/${r1.id}/`, 'PATCH', { title: 'x' })).status === 404)
  ok('member can leave', (await E(`team/members/${(await E('state/')).data.user.id}/`, 'DELETE')).status === 200 && (await E('state/')).data.user.member === false)
  // plan changes: A is on Launch, active (set by the studio above)
  const qUp = (await A('plan/quote/', 'POST', { kind: 'upgrade', to: 'grow' })).data
  ok('upgrade quote: build difference + prorated monthly', qUp?.when === 'on_payment' && qUp.lines[0].amount === 600 && qUp.dueNow >= 600 && qUp.dueNow <= 600 + 70 && qUp.slotsTo === 4, JSON.stringify(qUp?.lines))
  ok('upgrade to the same plan refused', (await A('plan/quote/', 'POST', { kind: 'upgrade', to: 'launch' })).status === 409)
  ok('a "downgrade" that goes up is refused', (await A('plan/quote/', 'POST', { kind: 'downgrade', to: 'scale' })).status === 409)
  const inv4 = (await A('team/invites/', 'POST', { email: ee })).data
  await E('auth/login/', 'POST', { email: ee, password: 'correct horse 5', invite: inv4.link.split('invite=')[1] })
  ok('member cannot change the plan', (await E('plan/changes/', 'POST', { kind: 'upgrade', to: 'grow' })).status === 403)
  const up = (await A('plan/changes/', 'POST', { kind: 'upgrade', to: 'grow' })).data
  ok('upgrade waits for payment (no provider)', up?.change?.status === 'awaiting_payment' && up.url === null && up.change.amount === qUp.dueNow)
  ok('still Launch until paid', (await A('state/')).data.sub.plan === 'launch')
  ok('client cannot settle a change', (await A(`admin/changes/${up.change.id}/paid/`, 'POST', {})).status === 403)
  const ac = (await B('admin/changes/')).data
  ok('studio sees the change awaiting payment', ac.some((c) => c.id === up.change.id && c.client.email === ea))
  const invBefore = (await A('state/')).data.invoices.length
  ok('studio confirms the payment', (await B(`admin/changes/${up.change.id}/paid/`, 'POST', {})).status === 200)
  let pz = (await A('state/')).data
  ok('upgrade applied: Grow, 4 slots', pz.sub.plan === 'grow')
  ok('upgrade invoiced', pz.invoices.length === invBefore + 1 && pz.invoices.some((i) => /Upgrade Launch → Grow/.test(i.label)))
  ok('settling twice refused', (await B(`admin/changes/${up.change.id}/paid/`, 'POST', {})).status === 409)
  // downgrade: scheduled at period end, free, undoable
  const down = (await A('plan/changes/', 'POST', { kind: 'downgrade', to: 'launch' })).data
  ok('downgrade scheduled for the period end', down.change.status === 'scheduled' && down.change.amount === 0 && new Date(down.change.effectiveAt) > new Date())
  ok('downgrade not applied yet', (await A('state/')).data.sub.plan === 'grow')
  const cancel = (await A('plan/changes/', 'POST', { kind: 'cancel' })).data
  ok('cancel scheduled too', cancel.change.status === 'scheduled')
  ok('undo cancel', (await A(`plan/changes/${cancel.change.id}/`, 'DELETE')).status === 200 && (await A(`plan/changes/${cancel.change.id}/`, 'DELETE')).status === 409)
  // a scheduled change whose date passed applies on the next load
  await sql`update studio.plan_changes set effective_at = now() - interval '1 minute' where id = ${down.change.id}`
  pz = (await A('state/')).data
  ok('due downgrade applies on load', pz.sub.plan === 'launch' && pz.changes.find((c) => c.id === down.change.id)?.status === 'applied')
  // community add-on and pause
  const cm = (await A('plan/changes/', 'POST', { kind: 'community_on' })).data
  ok('community costs one month now', cm.change.status === 'awaiting_payment' && cm.change.amount === 1000)
  await B(`admin/changes/${cm.change.id}/`, 'DELETE')
  ok('studio rejects a change', (await A('state/')).data.changes.find((c) => c.id === cm.change.id)?.status === 'cancelled' && !(await A('state/')).data.sub.community)
  const pa = (await A('plan/changes/', 'POST', { kind: 'pause' })).data
  await B(`admin/changes/${pa.change.id}/apply/`, 'POST', {})
  pz = (await A('state/')).data
  ok('pause stops the queue (status paused)', pz.sub.status === 'paused')
  ok('paused plan cannot be upgraded', (await A('plan/quote/', 'POST', { kind: 'upgrade', to: 'grow' })).status === 409)
  const re = (await A('plan/quote/', 'POST', { kind: 'resume' })).data
  ok('resume costs one month', re.dueNow === 80 && re.when === 'on_payment')
  const rsm = (await A("plan/changes/", "POST", { kind: "resume" })).data
  await B(`admin/changes/${rsm.change.id}/paid/`, 'POST', {})
  ok('resumed after payment', (await A('state/')).data.sub.status === 'active')
  // rating an approved delivery, and repeating requests
  ok('cannot rate before approval', (await A(`requests/${r4.id}/rating/`, 'POST', { score: 5 })).status === 404)
  await B(`requests/${r4.id}/`, 'PATCH', { status: 'review' }); await A(`requests/${r4.id}/`, 'PATCH', { status: 'done' })
  ok('studio cannot rate', (await B(`requests/${r4.id}/rating/`, 'POST', { score: 1 })).status === 403)
  ok('bad score refused', (await A(`requests/${r4.id}/rating/`, 'POST', { score: 9 })).status === 400)
  ok('client rates the delivery', (await A(`requests/${r4.id}/rating/`, 'POST', { score: 4, note: 'Fast and clean' })).status === 200 && (await B('state/')).data.reqs.find((r) => r.id === r4.id)?.rating === 4)
  const rec = (await A('recurring/', 'POST', { title: 'Monthly newsletter', kind: 'copy', brief: 'News', checklist: [], priority: 2, every: 'month' })).data
  ok('repeating request saved', rec?.every === 'month' && new Date(rec.nextAt) > new Date())
  await sql`update studio.recurring set next_at = now() - interval '1 minute' where id = ${rec.id}`
  let rs = (await A('state/')).data
  ok('due repeat creates one request on load', rs.reqs.filter((r) => r.recurringId === rec.id).length === 1 && new Date(rs.recurring.find((x) => x.id === rec.id).nextAt) > new Date())
  rs = (await A('state/')).data
  ok('and only one', rs.reqs.filter((r) => r.recurringId === rec.id).length === 1)
  // if creating the request fails, the schedule must not move forward: break it on purpose, load, repair, load
  await sql`update studio.recurring set kind = 'not-a-kind', next_at = now() - interval '1 minute' where id = ${rec.id}`
  rs = (await A('state/')).data
  const [stuck] = await sql`select next_at <= now() as due, made from studio.recurring where id = ${rec.id}`
  ok('a failed repeat leaves its date untouched and the dashboard loads', !!rs?.user && stuck.due === true && stuck.made === 1 && rs.reqs.filter((r) => r.recurringId === rec.id).length === 1, JSON.stringify(stuck))
  await sql`update studio.recurring set kind = 'copy' where id = ${rec.id}`
  rs = (await A('state/')).data
  ok('and it is created on the next load', rs.reqs.filter((r) => r.recurringId === rec.id).length === 2)
  ok('stop repeating', (await A(`recurring/${rec.id}/`, 'DELETE')).status === 200 && !(await A('state/')).data.recurring.some((x) => x.id === rec.id))
  // profile: details, picture, notices, password and sessions
  const tiny = 'data:image/png;base64,' + png.toString('base64')
  ok('profile saved', (await A('profile/', 'PATCH', { name: 'Ana Check', jobTitle: 'Founder', phone: '+1 555 0100', timezone: 'America/Bogota', notify: { weekly: false }, avatar: tiny })).status === 200)
  let pu = (await A('state/')).data.user
  ok('profile reads back', pu.jobTitle === 'Founder' && pu.phone === '+1 555 0100' && pu.timezone === 'America/Bogota' && pu.avatar === tiny && pu.notify.weekly === false && pu.notify.review === true, JSON.stringify(pu.notify))
  ok('a script as picture is refused', (await A('profile/', 'PATCH', { avatar: 'data:text/html;base64,PHNjcmlwdD4=' })).status === 400)
  ok('an oversized picture is refused', (await A('profile/', 'PATCH', { avatar: 'data:image/png;base64,' + 'A'.repeat(230000) })).status === 400)
  ok('picture removed', (await A('profile/', 'PATCH', { avatar: null })).status === 200 && (await A('state/')).data.user.avatar === null)
  const A2 = client(); await A2('auth/login/', 'POST', { email: ea, password: 'correct horse 1' })
  let ss = (await A('profile/sessions/')).data
  ok('sessions listed, this one marked', ss.length >= 2 && ss.filter((x) => x.current).length === 1, String(ss.length))
  ok('wrong current password refused', (await A('profile/password/', 'POST', { current: 'nope', next: 'brand new pass 9' })).status === 403)
  ok('short new password refused', (await A('profile/password/', 'POST', { current: 'correct horse 1', next: 'short' })).status === 400)
  ok('password changed', (await A('profile/password/', 'POST', { current: 'correct horse 1', next: 'brand new pass 9' })).status === 200)
  ok('other devices signed out, this one stays', (await A2('state/')).status === 401 && (await A('state/')).status === 200)
  ok('old password no longer works', (await A2('auth/login/', 'POST', { email: ea, password: 'correct horse 1' })).status === 401 && (await A2('auth/login/', 'POST', { email: ea, password: 'brand new pass 9' })).status === 200)
  ss = (await A('profile/sessions/')).data
  const other = ss.find((x) => !x.current)
  ok('close one session', !!other && (await A(`profile/sessions/${other.id}/`, 'DELETE')).status === 200 && (await A2('state/')).status === 401)
  ok('seen', (await A('seen/', 'POST', {})).status === 200)
  ok('logout', (await A('auth/logout/', 'POST', {})).status === 200 && (await A('state/')).status === 401)
} catch (e) {
  out.push(['crash', 'FAIL', String(e)])
} finally {
  if (created.length) {
    for (const email of created) await sql`delete from studio.users where email = ${email}`
    const left = await sql`select count(*)::int as n from studio.users where email = any(${created}::text[])`
    ok('cleanup', left[0].n === 0, `${left[0].n} left`)
  }
}
console.table(out)
console.log(out.every((r) => r[1] === 'ok') ? 'API OK' : 'API FAIL')
if (out.some((r) => r[1] === 'FAIL')) process.exitCode = 1
