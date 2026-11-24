import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { PLANS, type Client, type PayView, type PlanId, type Subscription } from '../types'
import { MailSettings } from '../ui/MailSettings'
import { Board } from './Board'
import { shortDay } from '../ui/bits'
import { ClientPage } from './ClientPage'
import { StudioMetrics } from './StudioMetrics'
import { StudioFinance } from './StudioFinance'
import { StudioFeedback } from './StudioFeedback'
import { StudioWorkload } from './StudioWorkload'
import { ReadStatus } from '../ui-studio/ReadStatus'
import { operationsText } from '../i18n-studio-operations'
import { PlanChanges, PlanChangeCount } from './PlanChanges'
import { studioText } from '../i18n-studio'
import { useStudioRead } from '../studio-data'
import { StudioUsers } from './StudioUsers'
import { usersText } from '../i18n-users'
import '../../styles/app-studio.css'

const STATUSES: Subscription['status'][] = ['pending', 'building', 'active', 'past_due', 'paused', 'cancelled']
const VARIANTS = ['launch_build', 'launch_monthly', 'grow_build', 'grow_monthly', 'scale_build', 'scale_monthly', 'community']

/** the studio side: every request, every client (with manual activation), and the payment provider's keys */
export function Admin() {
  const { t, lang, route, go, user } = useStore()
  const [clientId, setClientId] = useState('')
  if (user?.role !== 'admin') return <Board />
  const section = route.split('/')[1]
  const id = route.split('/')[2]
  const s = operationsText[lang]
  const tabs = [
    ['admin', t.adm.tabs[0]], ['admin/business', studioText[lang].business],
    ['admin/clients', t.adm.tabs[1]], ['admin/people', usersText[lang].tab], ['admin/finance', s.finance],
    ['admin/feedback', s.feedback], ['admin/workload', s.workload], ['admin/payments', t.adm.tabs[2]],
  ]
  const active = tabs.find(([path]) => path === 'admin/' + section)?.[0] ?? 'admin'
  return (
    <div className="adm">
      <nav className="adm__tabs" role="tablist" aria-label={t.studio}>
        {tabs.map(([path, label], index) => <button key={path} id={'studio-tab-' + index} role="tab" aria-controls="studio-panel" aria-selected={active === path} tabIndex={active === path ? 0 : -1}
          className={active === path ? 'is-on' : ''} type="button" onClick={() => go(path)} onKeyDown={e => {
            const positions: Record<string, number> = { Home: 0, End: tabs.length - 1, ArrowLeft: (index + tabs.length - 1) % tabs.length, ArrowRight: (index + 1) % tabs.length }
            const next = positions[e.key]
            if (next === undefined) return
            e.preventDefault()
            e.currentTarget.parentElement?.querySelectorAll('button')[next]?.focus()
            go(tabs[next][0])
          }}>{label}</button>)}
      </nav>
      <div id="studio-panel" role="tabpanel" aria-labelledby={'studio-tab-' + tabs.findIndex(([path]) => path === active)}>
      {section === 'business' ? <StudioMetrics onOpenDeadlines={() => setClientId('')} />
        : section === 'finance' ? <StudioFinance invoiceId={id} />
        : section === 'feedback' ? <StudioFeedback />
        : section === 'workload' ? <StudioWorkload />
        : section === 'clients' ? <Clients id={id} />
        : section === 'people' ? <StudioUsers />
        : section === 'payments' ? <MailSettings />
        : <StudioBoard clientId={clientId} onClient={setClientId} />}
      </div>
    </div>
  )
}

const clientName = (c: Client) => c.company || c.name || c.email

function useClients(live: boolean) {
  const { be, studioRevision } = useStore()
  const revision = live ? studioRevision : null
  const [rows, setRows] = useState<Client[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let current = true
    let busy = false
    const read = async () => {
      if (busy) return
      busy = true
      try {
        const clients = await be.clients()
        const demoTeam = be.mode === 'demo' ? await be.team() : null
        if (current) {
          setRows(demoTeam ? clients.map(c => ({ ...c, team: demoTeam.members.filter(m => !m.owner).length })) : clients)
          setFailed(false)
        }
      } catch { if (current) setFailed(true) }
      finally { busy = false }
    }
    read()
    // Keep the board current. On the editable Clients tab a poll could overwrite an unsaved change.
    const stop = live && !revision ? be.listen(read) : undefined
    return () => { current = false; stop?.() }
  }, [be, live, attempt, revision])
  function refresh() {
    if (failed) {
      setRows(null)
      setFailed(false)
    }
    setAttempt(n => n + 1)
  }
  return { rows, setRows, failed, refresh }
}

function ClientLoadError({ retry }: { retry: () => void }) {
  const { t } = useStore()
  return <p role="alert">{t.priorities.loadError} <button type="button" className="ap-btn ap-btn--sm" onClick={retry}>{t.priorities.retry}</button></p>
}

function StudioBoard({ clientId, onClient }: { clientId: string; onClient: (id: string) => void }) {
  const { t, lang, reqs } = useStore()
  const { rows: clients, failed, refresh } = useClients(true)

  const names = new Map(reqs.map((r) => [r.owner, r.ownerName || r.owner]))
  for (const c of clients ?? []) names.set(c.id, clientName(c))
  const emails = new Map(clients?.map((c) => [c.id, c.email]))
  const options = [...names].sort((a, b) => a[1].localeCompare(b[1], lang))
  const scoped = useMemo(() => clientId ? reqs.filter((r) => r.owner === clientId) : reqs, [reqs, clientId])
  // The requested date is a calendar day in the studio's browser. UTC can already be tomorrow.
  const now = new Date()
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-')
  const deadlines = scoped.filter((r) => (r.status === 'active' || r.status === 'queued') && r.dueDate && r.dueDate <= today)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!) || a.number - b.number)
  const pending = clients?.filter((c) => c.status === 'pending' && c.plan && (!clientId || c.id === clientId))
  return (
    <Board admin account={clientId} requests={scoped}>
      <label className="adm__filter">{t.admin.client}
        <select value={clientId} onChange={(e) => onClient(e.target.value)}>
          <option value="">{t.priorities.all}</option>
          {options.map(([id, label]) => <option key={id} value={id}>{label}{emails.has(id) && emails.get(id) !== label && ' · ' + emails.get(id)}</option>)}
        </select>
      </label>
      <div className="adm__priorities">
        <section className="card">
          <header className="card__h"><h2>{t.priorities.deadlines}</h2><span className="mono">{deadlines.length}</span></header>
          {deadlines.length ? <ul>{deadlines.map((r) => (
            <li key={r.id}><a href={'#/admin/' + r.id}>
              <span><b>{r.title}</b><small>#{r.number} · {t.status[r.status]}</small></span>
              <time dateTime={r.dueDate!} className={r.dueDate! < today ? 'is-late' : ''}>{r.dueDate === today ? t.priorities.today : t.priorities.overdue + ' · ' + shortDay(new Date(r.dueDate + 'T12:00'), lang)}</time>
            </a><a className="ops__account-link" href={'#/admin/clients/' + r.owner}>{names.get(r.owner)} <Icon name="arrowRight" size={12} /></a></li>
          ))}</ul> : <p className="muted">{t.priorities.clear}</p>}
        </section>
        <section className="card">
          <header className="card__h"><h2>{t.priorities.pending}</h2><span className="mono">{!failed && pending?.length}</span></header>
          {failed || !pending ? <ReadStatus subject={t.priorities.pending} failed={failed} retry={refresh} /> : pending.length ? <ul>{pending.map((c) => (
              <li key={c.id}><a href={'#/admin/clients/' + c.id}>
                <span><b>{clientName(c)}</b><small>{t.cap(PLANS[c.plan!].slots)}{clientName(c) !== c.email && ' · ' + c.email}</small></span><Icon name="arrowRight" size={16} />
              </a></li>
            ))}</ul> : <p className="muted">{t.priorities.none}</p>}
        </section>
        <PlanChangeCount key={clientId} client={clientId || undefined} />
      </div>
    </Board>
  )
}

function Clients({ id }: { id?: string }) {
  const { t, be, lang, toast, reload } = useStore()
  const { rows, setRows, failed, refresh } = useClients(false)
  const set = (id: string, p: Partial<Client>) => setRows((r) => r!.map((c) => (c.id === id ? { ...c, ...p } : c)))
  const visible = id ? rows?.filter((c) => c.id === id) : rows
  return (
    <section>
      <header className="ap-head"><div><p className="mono ap-kicker">{t.studio}</p><h1 className="d">{id && visible?.length ? clientName(visible[0]) : t.adm.clients}</h1></div>{id && <a className="ap-btn ap-btn--ghost" href="#/admin/clients">{t.priorities.all}</a>}</header>
      <div className={'card adm__table' + (id ? ' ops__plan' : '')}>
        {failed ? <ClientLoadError retry={refresh} /> : !visible ? <p role="status">{studioText[lang].loading}</p> : !visible.length ? <p className="muted">{id ? t.priorities.missing : t.adm.none}</p> : (
          <table>
            <thead><tr><th>{t.login.name}</th><th>{t.adm.plan}</th><th>{t.adm.status}</th><th>{t.adm.community}</th><th>{t.adm.since}</th><th /></tr></thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id}>
                  <td><b>{id ? clientName(c) : <a className="ops__profile-link" href={'#/admin/clients/' + c.id}>{clientName(c)}</a>}</b><small>{c.email}{c.role === 'admin' ? ' · admin' : ''} · {c.open} {t.adm.open}{c.team !== undefined && ' · ' + studioText[lang].teamSize(c.team)}</small></td>
                  <td data-label={t.adm.plan}><select aria-label={t.adm.plan} value={c.plan ?? ''} onChange={(e) => set(c.id, { plan: e.target.value as PlanId, status: c.status ?? 'pending' })}><option disabled value="">—</option>{(Object.keys(PLANS) as PlanId[]).map((p) => <option key={p} value={p}>{t.cap(PLANS[p].slots)}</option>)}</select></td>
                  <td data-label={t.adm.status}><select aria-label={t.adm.status} value={c.status ?? ''} onChange={(e) => set(c.id, { status: e.target.value as Subscription['status'] })}><option disabled value="">—</option>{STATUSES.map((s) => <option key={s} value={s}>{t.billing.status[s]}</option>)}</select></td>
                  <td data-label={t.adm.community}><input type="checkbox" checked={!!c.community} onChange={(e) => set(c.id, { community: e.target.checked })} aria-label={t.adm.community} /></td>
                  <td data-label={t.adm.since} className="mono">{new Date(c.since).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}</td>
                  <td><button className="ap-btn ap-btn--sm" type="button" disabled={!c.plan || !c.status} onClick={async () => {
                    if (!c.plan || !c.status) return
                    try {
                      await be.updateClient(c.id, { plan: c.plan, status: c.status, community: !!c.community })
                      toast(t.adm.saved); refresh(); reload()
                    } catch { toast(studioText[lang].planError) }
                  }}><Icon name="check" size={13} />{t.adm.save}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {id && visible?.length === 1 && <ClientPage key={id} id={id} />}
    </section>
  )
}

function Payments() {
  const { t, be, lang, toast } = useStore()
  const { data: p, setData: setP, failed, refresh } = useStudioRead(useCallback(() => be.payments(), [be]))
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  if (failed) return <p role="alert">{t.requestPage.paymentsError} <button type="button" className="ap-btn ap-btn--sm" onClick={refresh}>{t.priorities.retry}</button></p>
  if (!p) return <p role="status">{studioText[lang].loading}</p>
  const save = async () => {
    setSaving(true)
    setSaveFailed(false)
    try { setP(await be.savePayments(p)); toast(t.adm.saved) }
    catch { setSaveFailed(true) }
    finally { setSaving(false) }
  }
  return (
    <section>
      <header className="ap-head"><div><p className="mono ap-kicker">{t.studio}</p><h1 className="d">{t.adm.pay}</h1><p className="ap-lead">{t.adm.payNone}</p></div><button className="ap-btn ap-btn--red" type="button" disabled={saving} onClick={save}><Icon name="check" size={15} />{t.adm.save}</button></header>
      {saveFailed && <p role="alert">{t.requestPage.saveError}</p>}
      <fieldset className="bk__grid adm__payment-fields" disabled={saving}>
        <div className="card bk__fields">
          <label><span className="mono">{t.adm.provider}</span>
            <select value={p.provider} onChange={(e) => setP({ ...p, provider: e.target.value as PayView['provider'] })}><option value="none">—</option><option value="lemonsqueezy">Lemon Squeezy</option></select>
          </label>
          <label><span className="mono">{t.adm.apiKey}</span><input type="password" value={p.apiKey} onChange={(e) => setP({ ...p, apiKey: e.target.value })} autoComplete="off" /></label>
          <label><span className="mono">{t.adm.storeId}</span><input value={p.storeId} onChange={(e) => setP({ ...p, storeId: e.target.value })} /></label>
          <label><span className="mono">{t.adm.secret}</span><input type="password" value={p.webhookSecret} onChange={(e) => setP({ ...p, webhookSecret: e.target.value })} autoComplete="off" /></label>
          {p.webhook && <label><span className="mono">{t.adm.webhook}</span><input readOnly value={p.webhook} onFocus={(e) => e.target.select()} /></label>}
        </div>
        <div className="card bk__fields">
          <p className="mono">{t.adm.variants}</p>
          {VARIANTS.map((k) => <label key={k}><span className="mono">{k.replace('_', ' · ')}</span><input value={p.variants[k] ?? ''} onChange={(e) => setP({ ...p, variants: { ...p.variants, [k]: e.target.value } })} inputMode="numeric" /></label>)}
        </div>
      </fieldset>
    </section>
  )
}
