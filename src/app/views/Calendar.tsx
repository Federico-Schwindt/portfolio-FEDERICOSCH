import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { PLANS, runningSlots } from '../types'
import { forecast } from '../ui/bits'

type Item = { key: string; day: string; kind: 'due' | 'eta' | 'done' | 'repeat' | 'renew' | 'change'; title: string; requestId?: string }
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** one month at a glance: deadlines, expected deliveries, what was delivered, what repeats and when the plan moves */
export function Calendar() {
  const { t, lang, reqs, sub, recurring, changes, go, user } = useStore()
  const C = t.cal
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [sel, setSel] = useState(iso(new Date()))
  const studio = user?.role === 'admin'

  const items = useMemo(() => {
    const out: Item[] = []
    const eta = forecast(reqs, studio ? 0 : runningSlots(sub))
    for (const r of reqs) {
      if (r.dueDate && r.status !== 'done') out.push({ key: 'due' + r.id, day: r.dueDate, kind: 'due', title: r.title, requestId: r.id })
      if (r.status === 'done' && r.doneAt) out.push({ key: 'done' + r.id, day: iso(new Date(r.doneAt)), kind: 'done', title: r.title, requestId: r.id })
      const e = eta.get(r.id)
      if (e && (r.status === 'active' || r.status === 'queued')) out.push({ key: 'eta' + r.id, day: iso(e), kind: 'eta', title: r.title, requestId: r.id })
    }
    // repeating requests: this date and the following ones inside a year
    for (const x of recurring) {
      const d = new Date(x.nextAt)
      for (let i = 0; i < (x.every === 'week' ? 26 : 12); i++) { out.push({ key: `rep${x.id}${i}`, day: iso(d), kind: 'repeat', title: x.title }); if (x.every === 'week') d.setDate(d.getDate() + 7); else d.setMonth(d.getMonth() + 1) }
    }
    return out
  }, [reqs, sub, recurring, changes, studio, C.renew, t.pl])

  const byDay = useMemo(() => { const m = new Map<string, Item[]>(); for (const i of items) m.set(i.day, [...(m.get(i.day) ?? []), i]); return m }, [items])
  const cells = useMemo(() => {
    const first = new Date(month), start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7)) // weeks start on Monday
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  }, [month])
  const today = iso(new Date())
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(lang, { weekday: 'short' }))
  const move = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1))
  const soon = items.filter((i) => i.day >= today && i.day <= iso(new Date(Date.now() + 14 * 864e5)) && i.kind !== 'done').sort((a, b) => a.day.localeCompare(b.day)).slice(0, 12)
  const label = { due: C.due, eta: C.eta, done: C.done, repeat: C.repeat, renew: C.renew, change: C.change }
  const dayLabel = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' })
  const row = (i: Item) => (
    <li key={i.key}><button type="button" disabled={!i.requestId} onClick={() => i.requestId && go(`calendar/${i.requestId}`)}><i className={`cal__dot cal__dot--${i.kind}`} /><span><b>{i.title}</b><small>{label[i.kind]}{sel !== i.day ? ` · ${new Date(i.day + 'T12:00:00').toLocaleDateString(lang, { day: 'numeric', month: 'short' })}` : ''}</small></span></button></li>
  )

  return (
    <div className="cal">
      <header className="ap-head">
        <div><h1 className="d">{t.sec.calendar}</h1><p className="ap-lead">{C.sub}</p></div>
        <div className="cal__nav">
          <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setSel(today) }}>{C.today}</button>
          <button type="button" className="cal__arrow" onClick={() => move(-1)} aria-label="‹"><Icon name="arrowLeft" size={15} /></button>
          <b className="cal__month">{month.toLocaleDateString(lang, { month: 'long', year: 'numeric' })}</b>
          <button type="button" className="cal__arrow" onClick={() => move(1)} aria-label="›"><Icon name="arrowRight" size={15} /></button>
        </div>
      </header>
      <div className="cal__cols">
        <section className="card cal__grid" aria-label={month.toLocaleDateString(lang, { month: 'long', year: 'numeric' })}>
          {weekdays.map((w) => <span key={w} className="cal__wd">{w}</span>)}
          {cells.map((d) => {
            const k = iso(d), list = byDay.get(k) ?? [], out = d.getMonth() !== month.getMonth()
            return (
              <button type="button" key={k} className={`cal__day${out ? ' is-out' : ''}${k === today ? ' is-today' : ''}${k === sel ? ' is-sel' : ''}`} onClick={() => setSel(k)} aria-pressed={k === sel} aria-label={`${dayLabel(k)}${list.length ? `, ${list.length}` : ''}`}>
                <span className="cal__n">{d.getDate()}</span>
                {list.slice(0, 2).map((i) => <span key={i.key} className={`cal__chip cal__chip--${i.kind}`}>{i.title}</span>)}
                {list.length > 2 && <span className="cal__more">{C.more(list.length - 2)}</span>}
              </button>
            )
          })}
        </section>
        <aside className="cal__side">
          <section className="card">
            <div className="card__h"><h2>{dayLabel(sel)}</h2></div>
            {(byDay.get(sel) ?? []).length ? <ul className="cal__list">{(byDay.get(sel) ?? []).map(row)}</ul> : <p className="muted cal__empty">{C.none}</p>}
          </section>
          <section className="card">
            <div className="card__h"><h2>{C.upcoming}</h2></div>
            {soon.length ? <ul className="cal__list">{soon.map(row)}</ul> : <p className="muted cal__empty">{C.empty}</p>}
          </section>
          <ul className="cal__legend" aria-label={C.legend}>{(['due', 'eta', 'done', 'repeat', 'renew'] as const).map((k) => <li key={k}><i className={`cal__dot cal__dot--${k}`} />{label[k]}</li>)}</ul>
        </aside>
      </div>
    </div>
  )
}
