import { useCallback, useEffect, useState } from 'react'
import { useStore } from '../store'
import type { MailConfig } from '../types'
import { useHistoryPages } from './useHistoryPages'

export function MailHistory({ studio = false, requestId, embedded = false }: { studio?: boolean; requestId?: string; embedded?: boolean }) {
  const { be, t, lang, toast, user } = useStore()
  const fetchPage = useCallback((before?: string) => be.notices(before, requestId), [be, requestId, user?.id, user?.account, user?.role])
  const { items, next, loading, failed, load, older, retry } = useHistoryPages(fetchPage)
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!older.current && document.visibilityState === 'visible') void load(undefined, true)
    }, 15000)
    return () => clearInterval(timer)
  }, [load, older])
  const [manual, setManual] = useState('')
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast(t.flow.copied) }
    catch { setManual(text) }
  }
  if (requestId && !studio && !items.length && !failed) return null
  const title = studio ? t.flow.outbox : t.flow.receipts
  return <section className={`mail-history bk__fields${embedded ? '' : ' card'}`} aria-label={title}>
    {!embedded && <header className="card__h"><h2>{title}</h2>
      <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" disabled={loading} onClick={() => load()}>{t.flow.refresh}</button></header>}
    {items.map(item => {
      const stamp = item.sentAt || item.at
      return <details key={item.id} className="mail-history__item">
        <summary><span className={`mail-history__badge is-${item.status}`}>{t.flow[item.status]}</span>
          <strong>{item.subject}</strong>
          <time dateTime={stamp}>{new Date(stamp).toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' })}</time></summary>
        <div className="mail-history__body">
          <p><b>{t.reviewMail.to}</b> {item.email}</p><p>{item.text}</p>
          {studio && item.status !== 'skipped' && <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => copy(item.subject + '\n\n' + item.text)}>{t.reviewMail.copy}</button>}
        </div>
      </details>
    })}
    {manual && <textarea aria-label={t.reviewMail.message} readOnly value={manual} autoFocus onFocus={e => e.target.select()} />}
    {loading && <p className="history-note" role="status">{t.flow.loading}</p>}
    {failed && <p className="history-error" role="alert">{t.flow.loadError}</p>}
    {!items.length && !loading && !failed && <p className="history-note">{t.flow.empty}</p>}
    {(next || failed) && <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm ac__more" disabled={loading} onClick={() => failed ? retry() : load(next ?? undefined)}>{failed ? t.priorities.retry : t.flow.older}</button>}
  </section>
}

export function MailSettings() {
  const { be, t, base, toast } = useStore()
  const [config, setConfig] = useState<MailConfig | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setFailed(false)
    be.mailConfig().then(c => {
      if (active) setConfig({ ...c, appUrl: c.appUrl || new URL(base, location.origin).href.replace(/\/$/, '') })
    }, () => { if (active) setFailed(true) })
    return () => { active = false }
  }, [be, base, attempt])
  return <section>
    <h2>{t.flow.mail}</h2>
    {be.mode === 'demo' && <p>{t.flow.demo}</p>}
    <div className="bk__grid">
      {config ? <form className="card bk__fields" onSubmit={async e => {
        e.preventDefault(); setBusy(true)
        try { setConfig(await be.saveMailConfig(config)); toast(t.adm.saved) }
        catch { toast(t.flow.checkConfig) } finally { setBusy(false) }
      }}>
        <label>{t.adm.provider}<select value={config.provider} onChange={e => setConfig({...config, provider:e.target.value as MailConfig['provider']})}>
          <option value="none">{t.flow.off}</option><option value="resend">Resend</option></select></label>
        <label>{t.flow.sender}<input type="email" required={config.provider === 'resend'} value={config.sender} onChange={e => setConfig({...config, sender:e.target.value})} /></label>
        <label>{t.flow.appUrl}<input type="url" required={config.provider === 'resend'} value={config.appUrl} onChange={e => setConfig({...config, appUrl:e.target.value})} /></label>
        <label>{t.adm.apiKey}<input type="password" autoComplete="new-password" required={config.provider === 'resend'} value={config.apiKey} onChange={e => setConfig({...config, apiKey:e.target.value})} /></label>
        <button className="ap-btn" disabled={busy}>{t.adm.save}</button>
      </form> : <div className="card mail-config-state">{failed ? <><p className="history-error" role="alert">{t.flow.loadError}</p><button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setAttempt(v => v+1)}>{t.priorities.retry}</button></> : <p className="history-note" role="status">{t.flow.loading}</p>}</div>}
      <MailHistory studio />
    </div>
  </section>
}
