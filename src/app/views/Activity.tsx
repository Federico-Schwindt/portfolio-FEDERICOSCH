import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { useHistoryPages } from '../ui/useHistoryPages'
import { MailHistory } from '../ui/MailSettings'
import { ActivityExport } from '../ui/ActivityExport'
import { activityViewer } from '../types'
import type { ActivityEvent, ActivityWho, Ev } from '../types'
import { maxQueryLength } from '../workspace-search'

/** the whole story of the account: every step on every request, grouped by day */
export function Activity() {
  const { t, lang, be, events, reqs, go, user, route, setNewOpen } = useStore()
  const A = t.act
  const [who, setWho] = useState<ActivityWho>('')
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const searchInput = useRef<HTMLInputElement>(null)
  const opener = useRef<HTMLButtonElement | null>(null)
  const filtered = Boolean(who || query)
  const reset = () => {
    setInput(''); setQuery(''); setWho('')
    searchInput.current?.focus()
  }
  useEffect(() => {
    if (route === 'activity' && opener.current) {
      opener.current.focus()
      opener.current = null
    }
  }, [route])
  const studio = user?.role === 'admin'
  const viewer = user && activityViewer(user.id, user.account ?? user.id, user.role)
  const page = useCallback((cursor?: string) => be.activity(who, cursor, query), [be, who, query, user?.id, user?.account, user?.role])
  const { items: list, next, loading, failed, load, older, retry } = useHistoryPages(page)
  const moreButton = useRef<HTMLButtonElement>(null)
  const continueAfter = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (loading || !continueAfter.current) return
    const previousIndex = list.findIndex(e => e.id === continueAfter.current)
    continueAfter.current = undefined
    const firstNew = list[previousIndex + 1]
    if (!failed && previousIndex >= 0 && firstNew &&
      (document.activeElement === moreButton.current || document.activeElement === document.body)) {
      document.getElementById(`activity-event-${firstNew.id}`)?.focus()
    }
  }, [list, loading, failed])
  const newest = events.at(-1)?.id
  const previous = useRef(newest)
  useEffect(() => {
    if (newest !== previous.current && !older.current) void load(undefined, true)
    previous.current = newest
  }, [newest, load, older])
  const [receipts, setReceipts] = useState(false)
  const groups = useMemo(() => {
    const m = new Map<string, ActivityEvent[]>()
    for (const e of list) {
      const k = new Date(e.at).toDateString()
      const day = m.get(k)
      if (day) day.push(e)
      else m.set(k,[e])
    }
    return [...m.entries()]
  }, [list])
  const requests = useMemo(() => new Map(reqs.map(r => [r.id,r])), [reqs])
  const dayName = (k: string) => {
    const d = new Date(k), today = new Date().toDateString(), y = new Date(Date.now() - 864e5).toDateString()
    return k === today ? A.today : k === y ? A.yesterday : d.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' })
  }
  const tabs: [ActivityWho, string][] = [['', A.all], ['studio', A.studio], ['client', studio ? t.admin.client : A.you], ['ai', A.ai]]
  const name = (e: Ev) => (e.who === 'client' ? e.by || (studio ? t.admin.client : t.who.client) : t.who[e.who])

  return (
    <div className="ac">
      <header className="ap-head"><div><h1 className="d">{t.sec.activity}</h1><p className="ap-lead">{A.sub}</p></div></header>
      {!studio && <details className="ac__receipts card" onToggle={e => setReceipts(e.currentTarget.open)}>
        <summary>{t.flow.receipts}</summary>{receipts && <MailHistory embedded />}
      </details>}
      <div className="ac__tools">
        <form role="search" aria-label={A.search} className="ac__search" onSubmit={e => { e.preventDefault(); setQuery(input.trim()) }}>
          <label className="tb__q"><Icon name="magnifyingGlass" size={16} /><input ref={searchInput} type="search" aria-label={A.search}
            placeholder={A.hint} value={input} maxLength={maxQueryLength} onChange={e => { setInput(e.target.value); if (!e.target.value.trim()) setQuery('') }} /></label>
          <button type="submit" className="ap-btn ap-btn--ink ap-btn--sm">{A.submit}</button>
        </form>
        <div className="dl__filters ac__tabs" role="group" aria-label={A.author}>{tabs.map(([k, l]) => <button key={k} type="button" className={who === k ? 'is-on' : ''} aria-pressed={who === k} onClick={() => setWho(k)}>{l}</button>)}</div>
      </div>
      <div className="ac__summary">
        <p role="status">{loading ? t.flow.loading : failed && !list.length ? '' : A.shown(list.length)}{query && ` · “${query}”`}</p>
        {filtered && <button type="button" className="bl-link" onClick={reset}>{A.reset}</button>}
        <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" disabled={loading} onClick={() => load()}>{t.flow.refresh}</button>
        {viewer && <ActivityExport key={JSON.stringify([viewer, who, query])} viewer={viewer} who={who} query={query} disabled={!list.length || loading} />}
      </div>
      {!groups.length ? !loading && !failed && <section className="card dl__empty"><span><Icon name={filtered ? 'magnifyingGlass' : 'pulse'} size={26} /></span>
        <p>{filtered ? A.noMatch : A.none}</p>
        {!filtered && !studio && <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setNewOpen(true)}>{t.newReq}</button>}
      </section> : (
        <div className="ac__days">
          {groups.map(([k, evs]) => (
            <section key={k} className="ac__day">
              <h2>{dayName(k)}<span className="n">{evs.length}</span></h2>
              <ol className="card ac__list">
                {evs.map((e) => {
                  const r = requests.get(e.requestId)
                  return (
                    <li key={e.id} id={`activity-event-${e.id}`} tabIndex={-1} className={`ac__i ac__i--${e.who}`}>
                      <span className="ac__dot">{e.kind === 'file' ? <Icon name="paperclip" size={13} /> : e.who === 'ai' ? <Icon name="sparkle" size={13} /> : e.kind === 'status' ? <Icon name={e.body === 'done' ? 'check' : 'clock'} size={13} /> : <Icon name="chatCircle" size={13} />}</span>
                      <span className="ac__b"><b>{name(e)}</b> {e.kind === 'status' ? t.evStatus[e.body as keyof typeof t.evStatus] ?? e.body : e.body}
                        {r ? <button type="button" onClick={event => { opener.current = event.currentTarget; go(`activity/${r.id}`) }}>#{r.number} · {r.title}</button>
                          : <small>#{e.requestNumber} · {e.requestTitle}</small>}</span>
                      <time className="n" dateTime={e.at}>{new Date(e.at).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' })}</time>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
      {failed && <p className="history-error" role="alert">{older.current ? A.olderError : t.flow.loadError}</p>}
      {(next || failed) && <button ref={moreButton} type="button" className="ap-btn ap-btn--ghost ac__more" disabled={loading} onClick={e => {
        if (e.detail === 0 && (!failed || older.current)) continueAfter.current = list.at(-1)?.id
        if (failed) void retry()
        else void load(next ?? undefined)
      }}>{failed ? t.priorities.retry : t.flow.older}</button>}
    </div>
  )
}
