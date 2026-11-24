import { useCallback, useState } from 'react'
import { useStore } from '../store'
import { requestRatings, ratingScore } from '../studio-metrics'
import { studioText } from '../i18n-studio'
import { operationsText } from '../i18n-studio-operations'
import { byOwner, loadFeedback, ownerName } from '../ui-studio/operations'
import { useStudioRead } from '../studio-data'
import { ReadStatus } from '../ui-studio/ReadStatus'

export function StudioFeedback() {
  const { be, lang, t, user } = useStore()
  const s = operationsText[lang], labels = studioText[lang]
  const [lowOnly, setLowOnly] = useState(false)
  const { data: approved, failed, refresh } = useStudioRead(useCallback(() => loadFeedback(be), [be]))
  const totals = requestRatings(approved ?? [])
  const accounts = byOwner(approved ?? []).sort((a, b) => ownerName(a[0], user).localeCompare(ownerName(b[0], user), lang))
  const recent = (approved ?? []).filter(r => r.rating != null && (!lowOnly || r.rating <= 3))
    .sort((a, b) => (b.doneAt ?? b.createdAt).localeCompare(a.doneAt ?? a.createdAt) || b.number - a.number)
  return <section className="ops">
    <header className="ap-head"><div><p className="mono ap-kicker">{t.studio}</p><h1 className="d">{s.feedback}</h1></div>
      <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={refresh}>{labels.refresh}</button></header>
    {failed || !approved ? <ReadStatus subject={s.feedback} failed={failed} retry={refresh} /> : !approved.length ? <p className="card">{t.studioRead.feedback}</p> : <>
    <div className="ops__grid">
      <section className="card"><h2>{labels.ratingAverage}</h2><strong className="ops__score">{ratingScore(totals, lang)}</strong>
        <p className="muted">{labels.ratingCoverage(totals.rated, totals.approved)}</p></section>
      <section className="card"><h2>{labels.ratingAccounts}</h2>{accounts.length ? <ul className="ops__list">{accounts.map(group => {
        const first = group[0], count = requestRatings(group)
        return <li className="ops__entry" key={first.owner}><a href={'#/admin/clients/' + first.owner}>{ownerName(first, user)}</a>
          <b>{ratingScore(count, lang)} <small>{labels.rated} · {count.rated}</small></b></li>
      })}</ul> : <p>{labels.noRatings}</p>}</section>
    </div>
    <section className="card ops__change-group"><header className="card__h"><h2>{s.recent}</h2></header>
      <label><input type="checkbox" checked={lowOnly} onChange={e => setLowOnly(e.target.checked)} /> {s.lowOnly}</label>
      {recent.length ? <ul className="ops__list">{recent.map(r => <li key={r.id} className={r.rating! <= 3 ? 'ops__low' : ''}>
        <div><a href={'#/admin/' + r.id}>{r.title}</a><small>{ownerName(r, user)} · {new Date(r.doneAt ?? r.createdAt).toLocaleDateString(lang)}</small>
          {r.ratingNote && <p>{r.ratingNote}</p>}</div>
        <div><b>{r.rating} / 5</b>{r.rating! <= 3 && <small>{s.attention}</small>}</div>
      </li>)}</ul> : <p>{totals.rated ? s.noFeedback : t.studioRead.feedback} {lowOnly && totals.rated > 0 && <button type="button" className="ap-btn ap-btn--sm" onClick={() => setLowOnly(false)}>{t.studioRead.clear}</button>}</p>}
    </section></>}
  </section>
}
