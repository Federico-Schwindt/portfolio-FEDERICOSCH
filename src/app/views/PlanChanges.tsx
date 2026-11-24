import { useCallback, useEffect, useRef, useState } from 'react'
import { studioText } from '../i18n-studio'
import { useStudioRead } from '../studio-data'
import { useStore } from '../store'
import { PLANS, type Backend, type PlanChange } from '../types'
import { PlanChangeQuote } from '../ui-studio/PlanChangeQuote'
import { ReadStatus } from '../ui-studio/ReadStatus'
import { operationsText } from '../i18n-studio-operations'

type Decision = PlanChange & { resolution?: 'paid' | 'waived' | 'rejected'; invoiceId?: string }
type Counts = { waiting: number; scheduled: number }
type Action = 'paid' | 'apply' | 'reject'
const open = (c: PlanChange) => c.status === 'awaiting_payment' || c.status === 'scheduled'
const changeLink = (id?: string) => '#/admin/changes' + (id ? '/' + encodeURIComponent(id) : '')
const changeName = (c?: PlanChange) => c?.client?.company || c?.client?.name || c?.client?.email

async function readChanges(be: Backend, client: string | undefined, count: true): Promise<Counts>
async function readChanges(be: Backend, client: string | undefined, count: false): Promise<Decision[]>
async function readChanges(be: Backend, client: string | undefined, count: boolean) {
  if (be.mode === 'live') {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '')
    const path = base + '/api/studio/changes/' + (count ? 'count/' : '')
    const r = await fetch(path + (client ? '?client=' + encodeURIComponent(client) : ''), { cache: 'no-store' })
    if (!r.ok) throw new Error('Studio HTTP ' + r.status)
    return r.json()
  }
  await be.changes() // Advance scheduled changes in the local demo before reading the admin view.
  const cutoff = Date.now() - 30 * 864e5
  const rows = (await be.adminChanges()).filter(c => (!client || c.client?.id === client) &&
    (open(c) || (c.closedAt && Date.parse(c.closedAt) >= cutoff)))
  return count ? {
    waiting: rows.filter(c => c.status === 'awaiting_payment').length,
    scheduled: rows.filter(c => c.status === 'scheduled').length,
  } : rows
}

export function PlanChangeCount({ client }: { client?: string }) {
  const { be, lang, t, studioRevision } = useStore()
  const s = studioText[lang]
  const [data, setData] = useState<Counts | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let current = true, reading = false
    async function update() {
      if (reading) return
      reading = true
      try {
        const counts = await readChanges(be, client, true)
        if (current) { setData(counts); setFailed(false) }
      } catch { if (current) { setData(null); setFailed(true) } }
      finally { reading = false }
    }
    update()
    const stop = !studioRevision ? be.listen(update) : undefined
    return () => { current = false; stop?.() }
  }, [be, client, attempt, studioRevision])
  return <section className="card ops ops__change-count">
    <header className="card__h"><h2>{s.openChanges}</h2><span className="mono">{data && data.waiting + data.scheduled}</span></header>
    {failed || !data ? <ReadStatus subject={s.openChanges} failed={failed} retry={() => { setFailed(false); setAttempt(n => n + 1) }} />
      : <p className="muted">{data.waiting || data.scheduled ? `${s.awaiting} (${data.waiting}) · ${s.scheduled} (${data.scheduled})` : t.studioRead.count}</p>}
    <a href={changeLink(client)}>{s.viewChanges}</a>
  </section>
}

export function PlanChanges({ client }: { client?: string }) {
  const { be, lang, t, toast, reload } = useStore()
  const s = studioText[lang]
  const { data, failed, refresh } = useStudioRead(useCallback(() => readChanges(be, client, false), [be, client]))
  const locked = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const money = (n: number) => n.toLocaleString(lang, { style: 'currency', currency: 'USD', currencyDisplay: 'code' })
  const date = (at: string) => <time dateTime={at}>{new Date(at).toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' })}</time>
  const title = (c: PlanChange) => s.kind[c.kind] + ' · ' + PLANS[c.from].name + (c.to !== c.from ? ' → ' + PLANS[c.to].name : '')
  async function resolve(c: PlanChange, action: Action) {
    if (locked.current || !open(c)) return
    const account = [changeName(c), c.client?.email].filter((v, i, a) => v && a.indexOf(v) === i).join(' · ')
    if (!window.confirm([account, title(c), s.confirm[action](money(c.amount))].join('\n'))) return
    locked.current = true
    setBusy(true)
    setError(false)
    try {
      if (action === 'reject') await be.rejectChange(c.id)
      else await be.settleChange(c.id, action)
      toast(s.updated)
      await reload()
    } catch { setError(true) }
    finally {
      // A webhook or another tab may have closed the request, even if the response was lost.
      refresh()
      locked.current = false
      setBusy(false)
    }
  }
  const rows = data ?? []
  const groups = [
    { key: 'waiting', label: s.awaiting, rows: rows.filter(c => c.status === 'awaiting_payment').sort((a, b) => Date.parse(a.at) - Date.parse(b.at)) },
    { key: 'scheduled', label: s.scheduled, rows: rows.filter(c => c.status === 'scheduled').sort((a, b) => Date.parse(a.effectiveAt ?? a.at) - Date.parse(b.effectiveAt ?? b.at)) },
    { key: 'history', label: s.recent, rows: rows.filter(c => !open(c)).sort((a, b) => Date.parse(b.closedAt ?? b.at) - Date.parse(a.closedAt ?? a.at)) },
  ]
  return <section className="ops ops__changes">
    <header className="ap-head"><div><p className="mono ap-kicker">{t.studio}</p><h1 className="d">{s.changes}</h1>
      {client && <p><a href={'#/admin/clients/' + client}>{changeName(rows[0]) || t.admin.client}</a> · <a href={changeLink()}>{s.allChanges}</a></p>}</div>
      <button className="ap-btn ap-btn--ghost ap-btn--sm" disabled={busy} onClick={refresh}>{s.refresh}</button></header>
    {error && <p role="alert">{s.actionError}</p>}
    {failed || !data ? <ReadStatus subject={s.changes} failed={failed} retry={refresh} /> : !rows.length ? <p className="card">{t.studioRead.changes}</p> : groups.map(g =>
      <section className="card ops__change-group" key={g.key} data-group={g.key}>
        <header className="card__h"><h2>{g.label}</h2><span className="mono">{g.rows.length}</span></header>
        {g.rows.length ? <ul className="ops__list">{g.rows.map(c => <li key={c.id} data-change={c.id}>
          <div><b>{title(c)}</b>{c.client && <small><a href={'#/admin/clients/' + c.client.id}>{changeName(c)}</a>{changeName(c) !== c.client.email && ' · ' + c.client.email}</small>}
            <small>{s.requested} · {date(c.at)}</small>
            {c.status === 'scheduled' && c.effectiveAt && <small>{s.effective} · {date(c.effectiveAt)}</small>}
            {!open(c) && <small>{c.status === 'applied' ? s.applied : s.cancelled}{c.closedAt && <> · {date(c.closedAt)}</>}</small>}
            {c.resolution && <small><b>{operationsText[lang].resolution[c.resolution]}</b></small>}
            {c.invoiceId && <small><a href={'#/admin/finance/' + c.invoiceId}>{s.receipt}</a></small>}
          </div>
          <div className="ops__decision"><span><small>{s.quoted}</small><strong>{money(c.amount)}</strong></span>
            <PlanChangeQuote change={c} />
            {open(c) && <div>{(c.status === 'scheduled' ? ['reject'] as const : ['paid', 'apply', 'reject'] as const).map(action =>
              <button type="button" key={action} disabled={busy} className={'ap-btn ap-btn--sm' + (action === 'paid' ? '' : ' ap-btn--ghost')} onClick={() => resolve(c, action)}>{s.action[action]}</button>)}</div>}
          </div>
        </li>)}</ul> : <p className="muted">{s.noChanges}</p>}
      </section>)}
  </section>
}
