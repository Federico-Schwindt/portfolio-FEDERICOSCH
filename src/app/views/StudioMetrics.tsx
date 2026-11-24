import { useCallback, useState } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../store'
import { COMMUNITY, PLANS, type Backend, type Client, type PlanId } from '../types'
import { studioText } from '../i18n-studio'
import { loadMetrics, useStudioRead } from '../studio-data'
import { ReadStatus } from '../ui-studio/ReadStatus'
import { ratingScore, type Metrics } from '../studio-metrics'

type Account = Pick<Client, 'id' | 'name' | 'email' | 'plan' | 'status'> & { base: number; addon: number; used: number; slots: number }
type Detail = 'revenue' | 'capacity'

async function loadBusiness(be: Backend) {
  const metrics: Metrics & { breakdown?: Account[] } = await loadMetrics(be)
  if (be.mode === 'live') {
    if (!metrics.breakdown) throw new Error('Missing account breakdown')
    return { ...metrics, breakdown: metrics.breakdown }
  }
  const [clients, requests] = await Promise.all([be.clients(), be.requests(true)])
  const breakdown = clients.map(c => ({
    ...c, name: c.company || c.name || c.email,
    base: c.status === 'active' && c.plan ? PLANS[c.plan].monthly : 0,
    addon: c.status === 'active' && c.community ? COMMUNITY : 0,
    slots: (c.status === 'active' || c.status === 'building') && c.plan ? PLANS[c.plan].slots : 0,
    used: requests.filter(r => r.owner === c.id && r.status === 'active').length,
  }))
  return { ...metrics, breakdown }
}

export function StudioMetrics({ onOpenDeadlines }: { onOpenDeadlines: () => void }) {
  const { t, be, lang } = useStore()
  const s = studioText[lang]
  const { data, failed, refresh } = useStudioRead(useCallback(() => loadBusiness(be), [be]))
  const [detail, setDetail] = useState<Detail | null>(null)
  const money = new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 })
  const revenue = detail === 'revenue'
  const accounts = data?.breakdown.filter(c => revenue ? c.base || c.addon : c.used || c.slots) ?? []
  const toggle = (key: Detail) => <button type="button" aria-expanded={detail === key} aria-controls="ops-breakdown" className="ap-btn ap-btn--ghost ap-btn--sm"
    onClick={() => setDetail(d => d === key ? null : key)}>{s.breakdown}</button>
  const peak = Math.max(1, ...(data?.weeks.map(w => w.delivered) ?? []))
  const shortDate = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  return <section className="ops">
    <header className="ap-head"><div><p className="mono ap-kicker">{t.studio}</p><h1 className="d">{s.business}</h1></div>
      <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={refresh}>{s.refresh}</button></header>
    {failed || !data ? <ReadStatus subject={s.business} failed={failed} retry={refresh} /> : <>
      {!data.breakdown.length && !data.ratings.approved && <p className="card">{t.studioRead.business} <a href="#/admin/clients">{t.adm.clients}</a></p>}
      <div className="ops__kpis">
        <div className="card stat"><h2>{s.mrr}</h2><strong className="d n">{money.format(data.mrr)}</strong><small>{s.mrrHint}</small>{toggle('revenue')}</div>
        <div className="card stat"><h2>{s.capacity}</h2><strong className="d n">{data.used} / {data.capacity}</strong><small>{s.capacityHint}</small>{toggle('capacity')}</div>
        <div className="card stat"><h2>{s.turnaround}</h2><strong className="d n">{data.avgDays === null ? '—' : data.avgDays.toLocaleString(lang, { maximumFractionDigits: 1 }) + ' ' + t.stats.days}</strong><small>{s.durationHint}</small></div>
        <div className="card stat"><h2>{s.overdue}</h2><strong className="d n">{data.overdue}</strong><small>{s.overdueHint} <a href="#/admin" onClick={onOpenDeadlines}>{s.deadlines}</a></small></div>
      </div>
      <section id="ops-breakdown" hidden={!detail} className="card ops__breakdown">
        <header className="card__h"><h2 id="ops-breakdown-title">{revenue ? s.revenueRows : s.capacityRows}</h2></header>
        {accounts.length ? <table aria-labelledby="ops-breakdown-title"><thead><tr><th>{t.admin.client}</th>
          {(revenue ? [s.baseFee, s.addonFee, s.total] : [s.used, s.slots]).map(label => <th scope="col" key={label}>{label}</th>)}
        </tr></thead><tbody>{accounts.map(c => <tr key={c.id}><th scope="row">
          <a href={'#/admin/clients/' + c.id}>{c.name}</a>
          {c.name !== c.email && <small>{c.email}</small>}
          <small>{c.plan && PLANS[c.plan].name}{c.status && ' · ' + t.billing.status[c.status]}</small></th>
          {revenue ? <><td>{money.format(c.base)}</td><td>{money.format(c.addon)}</td><td>{money.format(c.base + c.addon)}</td></>
            : <><td>{c.used}</td><td>{c.slots}</td></>}
        </tr>)}</tbody><tfoot><tr><th scope="row">{s.total}</th>
          {revenue ? <><td>{money.format(accounts.reduce((n,c) => n+c.base, 0))}</td><td>{money.format(accounts.reduce((n,c) => n+c.addon, 0))}</td><td>{money.format(data.mrr)}</td></>
            : <><td>{data.used}</td><td>{data.capacity}</td></>}</tr></tfoot></table> : <p className="muted">{s.noAccounts}</p>}
      </section>
      <section className="card ops__weekly"><div className="card__h"><h2>{s.weekly}</h2></div><p className="muted">{s.weekHint}</p>
        <ol>{data.weeks.map(w => <li key={w.start}>
          <div className="ops__bar"><b>{w.delivered}</b><motion.i aria-hidden="true" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} style={{ height: (w.delivered / peak * 72) + 'px' }} /></div>
          <time dateTime={w.start}>{shortDate.format(new Date(w.start + 'T00:00Z'))}</time>
        </li>)}</ol>
      </section>
      <div className="ops__grid">
        <section className="card"><div className="card__h"><h2>{s.accounts}</h2><a href="#/admin/clients">{t.adm.clients}</a></div>
          <dl>{(['active', 'pending', 'paused'] as const).map(k => <div key={k}><dt>{s[k]}</dt><dd>{data.clients[k]}</dd></div>)}</dl></section>
        <section className="card"><div className="card__h"><h2>{s.mix}</h2></div>
          <dl>{(Object.keys(PLANS) as PlanId[]).map(p => <div key={p}><dt>{PLANS[p].name}</dt><dd>{data.mix[p]}</dd></div>)}</dl></section>
      </div>
      <section className="card ops__breakdown" aria-labelledby="ops-ratings">
        <div className="card__h"><h2 id="ops-ratings">{s.ratings}</h2>
          {data.ratings.rated > 0 && <strong className="d n">{ratingScore(data.ratings, lang)}</strong>}</div>
        {!data.ratings.rated && <p>{s.noRatings}</p>}
        <p className="muted">{s.ratingCoverage(data.ratings.rated, data.ratings.approved)}</p>
        {data.ratingAccounts.length > 0 && <details><summary>{s.ratingAccounts}</summary>
          <table aria-label={s.ratingAccounts}><thead><tr>
            {[t.admin.client, s.approved, s.rated, s.ratingAverage].map(label => <th key={label} scope="col">{label}</th>)}
          </tr></thead><tbody>{data.ratingAccounts.map(a => <tr key={a.id}>
            <th scope="row"><a href={'#/admin/clients/' + a.id}>{a.name}</a></th>
            <td>{a.approved}</td><td>{a.rated}</td><td>{ratingScore(a, lang)}</td>
          </tr>)}</tbody></table>
        </details>}
      </section>
    </>}
  </section>
}
