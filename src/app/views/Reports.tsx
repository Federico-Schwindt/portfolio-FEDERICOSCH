import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { PLANS, type Kind } from '../types'
import { KIND_ICON, days } from '../ui/bits'

/** the month in numbers: what was delivered, how fast, by type; printable as a PDF */
export function Reports() {
  const { t, lang, reqs, sub, user } = useStore()
  const [offset, setOffset] = useState(0)
  const month = useMemo(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); d.setMonth(d.getMonth() - offset); return d }, [offset])
  const end = new Date(month); end.setMonth(end.getMonth() + 1)
  const inMonth = reqs.filter((r) => r.doneAt && new Date(r.doneAt) >= month && new Date(r.doneAt) < end)
  const turn = inMonth.filter((r) => r.startedAt).map((r) => days(r.startedAt!, r.reviewAt ?? r.doneAt!))
  const avg = turn.length ? turn.reduce((a, b) => a + b, 0) / turn.length : 0
  // for a past month: what was still open when that month ended, and the eight weeks that end with it
  const ref = offset ? end.getTime() : Date.now()
  const open = offset
    ? reqs.filter((r) => new Date(r.createdAt).getTime() < ref && (!r.doneAt || new Date(r.doneAt).getTime() >= ref)).length
    : reqs.filter((r) => ['queued', 'active', 'review'].includes(r.status)).length
  const byKind = Object.entries(inMonth.reduce((m, r) => ({ ...m, [r.kind]: (m[r.kind] ?? 0) + 1 }), {} as Record<string, number>)).sort((a, b) => b[1] - a[1]) as [Kind, number][]
  const max = Math.max(1, ...byKind.map((k) => k[1]))
  const label = month.toLocaleDateString(lang, { month: 'long', year: 'numeric' })
  const weeks = Array.from({ length: 8 }, (_, i) => { const e = ref - (7 - i) * 7 * 864e5, s = e - 7 * 864e5; return reqs.filter((r) => r.doneAt && new Date(r.doneAt).getTime() > s && new Date(r.doneAt).getTime() <= e).length })
  const wmax = Math.max(2, ...weeks)
  return (
    <div className="rp">
      <header className="ap-head">
        <div><p className="mono ap-kicker">{user?.company || user?.name} · {sub ? PLANS[sub.plan].name : ''}</p><h1 className="d">{t.x.rep.title}</h1><p className="ap-lead">{t.x.rep.sub}</p></div>
        <div className="rp__ctl">
          <button type="button" className="dr__x" onClick={() => setOffset(offset + 1)} aria-label="Previous month"><Icon name="arrowLeft" size={15} /></button>
          <b className="rp__m">{label}</b>
          <button type="button" className="dr__x" onClick={() => setOffset(Math.max(0, offset - 1))} disabled={!offset} aria-label="Next month"><Icon name="arrowRight" size={15} /></button>
          <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => print()}>{t.x.rep.print}</button>
        </div>
      </header>
      <div className="ov__stats rp__stats">
        {[[t.x.rep.delivered, String(inMonth.length), ''], [t.x.rep.turnaround, avg ? avg.toFixed(1) : '—', avg ? t.stats.days : ''], [offset ? t.x.rep.openThen : t.x.rep.open, String(open), '']].map(([k, v, u]) => (
          <div key={k} className="card stat"><p className="mono">{k}</p><p className="stat__v"><b className="d n">{v}</b>{u && <span>{u}</span>}</p></div>
        ))}
      </div>
      <section className="card chart rp__chart">
        <div className="card__h"><h2>{t.chart}</h2><p className="mono">{offset ? t.x.rep.weeksTo(new Date(ref - 864e5).toLocaleDateString(lang, { day: 'numeric', month: 'long' })) : t.chartSub}</p></div>
        <svg viewBox="0 0 400 150" className="chart__svg" role="img" aria-label={`${t.chart}: ${weeks.join(', ')}`}>
          {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" x2="400" y1={130 - 120 * g} y2={130 - 120 * g} className="chart__grid" />)}
          {weeks.map((v, i) => { const h = (v / wmax) * 120, x = 12 + i * 49; return (
            <g key={i}>
              <motion.rect x={x} width="30" rx="3" initial={{ height: 0, y: 130 }} animate={{ height: h, y: 130 - h }} transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className={i === 7 ? 'chart__bar chart__bar--now' : 'chart__bar'} />
              <text x={x + 15} y={145} textAnchor="middle" className="chart__lbl">{offset ? new Date(ref - (7 - i) * 7 * 864e5 - 864e5).toLocaleDateString(lang, { day: 'numeric', month: 'numeric' }) : i === 7 ? (lang === 'es' ? 'hoy' : 'now') : `-${7 - i}w`}</text>
              {v > 0 && <text x={x + 15} y={124 - h} textAnchor="middle" className="chart__v">{v}</text>}
            </g>) })}
        </svg>
      </section>
      <div className="rp__grid">
        <section className="card">
          <div className="card__h"><h2>{t.x.rep.byKind}</h2></div>
          {byKind.length ? (
            <ul className="rp__bars">
              {byKind.map(([k, n], i) => (
                <li key={k}><span className="kind"><Icon name={KIND_ICON[k]} size={13} />{t.kinds[k]}</span>
                  <span className="rp__track"><motion.i initial={{ width: 0 }} animate={{ width: `${(n / max) * 100}%` }} transition={{ delay: i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }} /></span><b className="n">{n}</b></li>
              ))}
            </ul>
          ) : <p className="muted">{t.x.rep.none}</p>}
        </section>
        <section className="card">
          <div className="card__h"><h2>{t.x.rep.list}</h2><p className="mono">{inMonth.length}</p></div>
          <ol className="rp__list">
            {inMonth.map((r) => (
              <li key={r.id}><span className="mono">#{r.number}</span><b>{r.title}</b><small className="mono">{new Date(r.doneAt!).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}{r.startedAt ? ` · ${days(r.startedAt, r.reviewAt ?? r.doneAt!).toFixed(1)} ${t.stats.days}` : ''}</small></li>
            ))}
            {!inMonth.length && <li className="muted">{t.x.rep.none}</li>}
          </ol>
        </section>
      </div>
    </div>
  )
}
