import { useCallback, useState } from 'react'
import { useStore } from '../store'
import { useStudioRead } from '../studio-data'
import { ReadStatus } from '../ui-studio/ReadStatus'
import { calendarWeeks } from '../studio-metrics'
import { studioText } from '../i18n-studio'
import { operationsText } from '../i18n-studio-operations'
import { byOwner, dateKey, loadSchedule, ownerName } from '../ui-studio/operations'

function shiftDay(key: string, offset: number) {
  const day = new Date(key + 'T12:00')
  day.setDate(day.getDate() + offset)
  return dateKey(day)
}
export function StudioWorkload() {
  const { be, lang, t, reqs, user } = useStore()
  const s = operationsText[lang], labels = studioText[lang]
  const today = dateKey(new Date())
  const monday = calendarWeeks(today).at(-1)!.start
  const [offset, setOffset] = useState(0)
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(monday, offset + i))
  const deadlines = reqs.filter(r => r.dueDate && days.includes(r.dueDate) && r.status !== 'done' && r.status !== 'cancelled')
  const active = byOwner(reqs.filter(r => r.status === 'active')).sort((a, b) => b.length - a.length || ownerName(a[0], user).localeCompare(ownerName(b[0], user), lang))
  const { data, failed, refresh } = useStudioRead(useCallback(() => loadSchedule(be), [be]))
  return <section className="ops">
    <header className="ap-head"><div><p className="mono ap-kicker">{t.studio}</p><h1 className="d">{s.workload}</h1></div></header>
    <section className="card"><header className="card__h"><h2>{s.weekly}</h2></header>
      <div className="ops__controls">
        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setOffset(n => n - 7)}>{s.previous}</button>
        <button className="ap-btn ap-btn--ghost ap-btn--sm" disabled={!offset} onClick={() => setOffset(0)}>{s.current}</button>
        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setOffset(n => n + 7)}>{s.next}</button></div>
      <p aria-live="polite">{s.selectedWeek} {new Date(days[0] + 'T12:00').toLocaleDateString(lang, { dateStyle: 'long' })}</p>
      {!deadlines.length ? <p>{t.studioRead.week}</p> : <ol className="ops__week">{days.map(day => {
        const due = deadlines.filter(r => r.dueDate === day)
        return <li key={day}><time dateTime={day} aria-current={day === today ? 'date' : undefined}>{new Date(day + 'T12:00').toLocaleDateString(lang, { weekday: 'short', day: 'numeric' })}</time>
          {due.length ? due.map(r => <div key={r.id}><a href={'#/admin/' + r.id}>{r.title}</a><small>{ownerName(r, user)} · {t.status[r.status]}</small></div>) : <small>{s.noDeadlines}</small>}</li>
      })}</ol>}</section>
    <div className="ops__grid ops__profile">
      <section className="card"><h2>{s.inProgress}</h2>{active.length ? active.map(group => <details key={group[0].owner} className="ops__active">
        <summary>{ownerName(group[0], user)} · {group.length}</summary>
        <ul className="ops__list">{group.map(r => <li key={r.id}><a href={'#/admin/' + r.id}>{r.title}</a></li>)}</ul>
      </details>) : <p>{s.noActive}</p>}</section>
      <section className="card"><header className="card__h"><h2>{s.upcoming}</h2><button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={refresh}>{labels.refresh}</button></header>
        {failed || !data ? <ReadStatus subject={s.upcoming} failed={failed} retry={refresh} /> : data.length ? <ul className="ops__list">
          {data.map(r => <li key={r.id}><b>{r.title}</b><small><a href={'#/admin/clients/' + r.owner}>{r.name}</a> · {r.every === 'week' ? s.week : s.monthly}</small>
            <time dateTime={r.nextAt}>{new Date(r.nextAt).toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' })}</time></li>)}</ul> : <p>{s.noRecurring}</p>}
      </section>
    </div>
  </section>
}
