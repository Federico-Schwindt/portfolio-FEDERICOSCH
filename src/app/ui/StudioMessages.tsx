import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { rel } from '../i18n'
import { Icon } from '../Icon'
import type { Ev, Req } from '../types'

type Message = Pick<Ev, 'id' | 'body' | 'at' | 'requestId'> & Pick<Req, 'number' | 'title'>

function demoMessages(events: Ev[], requests: Req[], account: string): Message[] {
  const latest = new Map<string, Ev>()
  for (const e of events) {
    if (e.kind === 'comment' || e.kind === 'changes') latest.set(e.requestId, e)
  }
  return requests.flatMap(r => {
    const e = latest.get(r.id)
    return r.owner === account && ['queued', 'active', 'review'].includes(r.status) && e?.who === 'studio'
      ? [{ ...e, number: r.number, title: r.title }] : []
  }).sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id))
}

export function StudioMessages() {
  const { be, lang, base, user, t, events, reqs, reload, toast } = useStore()
  const T = t.clientHome
  const account = user!.account ?? user!.id
  const viewer = user!.id + '/' + account
  const url = base + 'api/studio/messages/?viewer=' + encodeURIComponent(viewer)
  const [rows, setRows] = useState<Message[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [limit, setLimit] = useState(3)
  const [editing, setEditing] = useState<Message | null>(null)
  const [text, setText] = useState('')
  const [error, setError] = useState<'sendError' | 'stale' | null>(null)
  const [sending, setSending] = useState(false)
  const lock = useRef(false)
  useEffect(() => {
    const controller = new AbortController()
    setFailed(false)
    if (be.mode === 'demo') setRows(demoMessages(events, reqs, account))
    else (async () => {
      try {
        const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
        if (!res.ok) throw new Error()
        const next: Message[] = await res.json()
        if (!controller.signal.aborted) setRows(next)
      } catch { if (!controller.signal.aborted) setFailed(true) }
    })()
    return () => controller.abort()
  }, [url, be.mode, account, events, reqs, attempt])

  const cancel = () => { setEditing(null); setText(''); setError(null) }
  const send = async () => {
    if (!editing || !text.trim() || lock.current) return
    lock.current = true
    setSending(true); setError(null)
    try {
      if (be.mode === 'live') {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-studio': '1' },
          body: JSON.stringify({ eventId: editing.id, requestId: editing.requestId, text: text.trim() }) })
        if (res.status === 409) { setError('stale'); setAttempt(n => n + 1); return }
        if (!res.ok) throw new Error()
      } else {
        const latest = demoMessages(await be.events(), await be.requests(), account)
        if (!latest.some(e => e.id === editing.id)) { setError('stale'); return }
        await be.comment(editing.requestId, text.trim())
      }
      setRows(list => list?.filter(m => m.id !== editing.id) ?? [])
      cancel(); toast(T.sent)
      setAttempt(n => n + 1)
      await reload()
    } catch { setError('sendError') }
    finally { lock.current = false; setSending(false) }
  }

  if (rows?.length === 0 && !failed && !editing) return null
  const visible = rows?.slice(0, limit) ?? []
  // Retain both the original message and the draft when a teammate replies during editing.
  if (editing && !visible.some(m => m.id === editing.id)) visible.push(editing)
  const editor = editing && <form onSubmit={e => { e.preventDefault(); void send() }}>
    <label>{T.replyTo(editing.title)}<textarea autoFocus rows={3} maxLength={4000} value={text} readOnly={sending} onChange={e => setText(e.target.value)} /></label>
    {error && <p role="alert">{T[error]} {error === 'stale' && <a className="bl-link" href={'#/request/' + editing.requestId} target="_blank" rel="noopener">{t.requestPage.open}</a>}</p>}
    <div className="studio-messages__actions"><button className="ap-btn ap-btn--sm ap-btn--red" disabled={sending || error === 'stale' || !text.trim()}>{t.detail.send}</button>
      <button className="ap-btn ap-btn--sm ap-btn--ghost" type="button" disabled={sending} onClick={cancel}>{t.x.rv.back}</button></div>
  </form>
  return <section className="card studio-messages" aria-label={T.messages}>
    <div className="card__h"><h2><Icon name="chatCircle" size={17} />{T.messages}</h2></div>
    {rows === null && !failed && <p role="status">{T.loading}</p>}
    {failed && <p role="alert">{T.failed} <button type="button" className="bl-link" onClick={() => setAttempt(n => n + 1)}>{t.priorities.retry}</button></p>}
    {visible.length > 0 && <><p className="muted">{T.hint}</p>
      <ul>{visible.map(m => <li key={m.id}>
        <div className="studio-messages__meta"><a href={'#/request/' + m.requestId}>#{m.number} · {m.title}</a><small>{rel(m.at, lang)}</small></div>
        <p className="studio-messages__body">{m.body}</p>
        {editing?.id === m.id && editor}
        {!editing && <button type="button" className="ap-btn ap-btn--sm ap-btn--ghost" aria-label={T.replyTo(m.title)} onClick={() => setEditing(m)}>{T.reply}</button>}
      </li>)}</ul>
      {rows && rows.length > limit && <button className="bl-link" type="button" onClick={() => setLimit(n => n + 5)}>{T.more(Math.min(rows.length - limit, 5))}</button>}
    </>}
  </section>
}
