import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import type { Kind } from '../types'
import { KIND_ICON, days, isImage } from '../ui/bits'

/** everything approved: a gallery of finished work with its latest file, how long it took and how it was rated */
export function Deliveries() {
  const { t, lang, reqs, files, be, go, user } = useStore()
  const D = t.del
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<Kind | ''>('')
  const done = useMemo(() => reqs.filter((r) => r.status === 'done').sort((a, b) => (b.doneAt ?? '').localeCompare(a.doneAt ?? '')), [reqs])
  const kinds = [...new Set(done.map((r) => r.kind))]
  const list = done.filter((r) => (!kind || r.kind === kind) && (!q.trim() || r.title.toLowerCase().includes(q.trim().toLowerCase())))
  const studio = user?.role === 'admin'

  return (
    <div className="dl">
      <header className="ap-head"><div><h1 className="d">{t.sec.deliveries}</h1><p className="ap-lead">{D.sub}</p></div><p className="dl__total n">{D.total(done.length)}</p></header>
      {done.length > 0 && (
        <div className="dl__bar">
          <label className="dl__search"><Icon name="magnifyingGlass" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={D.search} aria-label={D.search} /></label>
          <div className="dl__filters" role="group">
            <button type="button" className={!kind ? 'is-on' : ''} aria-pressed={!kind} onClick={() => setKind('')}>{D.all}</button>
            {kinds.map((k) => <button key={k} type="button" className={kind === k ? 'is-on' : ''} aria-pressed={kind === k} onClick={() => setKind(kind === k ? '' : k)}><Icon name={KIND_ICON[k]} size={13} />{t.kinds[k]}</button>)}
          </div>
        </div>
      )}
      {!done.length ? (
        <section className="card dl__empty"><span><Icon name="package" size={26} /></span><p>{D.none}</p></section>
      ) : !list.length ? <p className="muted">{D.noneFor}</p> : (
        <div className="dl__grid">
          {list.map((r, i) => {
            const vs = files.filter((f) => f.requestId === r.id && f.kind === 'deliverable').sort((a, b) => b.version - a.version)
            const v = vs[0], img = v && isImage(v.mime) && be.fileUrl(v) !== '#'
            const took = r.startedAt && (r.reviewAt ?? r.doneAt) ? days(r.startedAt, (r.reviewAt ?? r.doneAt)!) : 0
            return (
              <motion.article key={r.id} className="dl__card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                <button type="button" className="dl__thumb" onClick={() => go(`deliveries/${r.id}`)} aria-label={`${D.open}: ${r.title}`}>
                  {img ? <img src={be.fileUrl(v)} alt="" loading="lazy" /> : <span className="dl__ph"><Icon name={KIND_ICON[r.kind]} size={28} /></span>}
                  {vs.length > 0 && <i>{D.versions(vs.length)}</i>}
                </button>
                <div className="dl__b">
                  <p className="dl__meta"><span><Icon name={KIND_ICON[r.kind]} size={12} />{t.kinds[r.kind]}</span><span>{r.doneAt ? new Date(r.doneAt).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span></p>
                  <h3><button type="button" onClick={() => go(`deliveries/${r.id}`)}>{r.title}</button></h3>
                  <p className="dl__foot">
                    {took > 0 && <span className="muted">{D.in} {D.days(took.toFixed(1))}</span>}
                    {r.rating ? <span className="dl__stars" aria-label={`${r.rating}/5`}>{'★'.repeat(r.rating)}<em>{'★'.repeat(5 - r.rating)}</em></span> : !studio && <button type="button" className="bl-link" onClick={() => go(`deliveries/${r.id}`)}>{D.unrated}</button>}
                    {v && be.fileUrl(v) !== '#' ? <a className="dl__dl" href={be.fileUrl(v, true)} aria-label={`${D.download} ${v.name}`}><Icon name="download" size={14} /></a> : r.deliverable && <a className="dl__dl" href={r.deliverable} target="_blank" rel="noopener" aria-label={D.open}><Icon name="arrowUpRight" size={14} /></a>}
                  </p>
                </div>
              </motion.article>
            )
          })}
        </div>
      )}
    </div>
  )
}
