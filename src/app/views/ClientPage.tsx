import { useCallback, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { studioText } from '../i18n-studio'
import { useStore } from '../store'
import { fileDownload, loadHistory, saveNote, useStudioRead } from '../studio-data'
import { BusinessBrief } from '../ui-studio/BusinessBrief'
import { operationsText } from '../i18n-studio-operations'
import { PlanChangeCount } from './PlanChanges'
import { ratingScore, requestRatings } from '../studio-metrics'

function HistorySection({ title, count, empty, children }: { title: string; count: number; empty: string; children: ReactNode }) {
  return <section className="card"><header className="card__h"><h2>{title}</h2><span className="mono">{count}</span></header>
    {count ? <ul className="ops__list">{children}</ul> : <p className="muted">{empty}</p>}</section>
}

export function ClientPage({ id }: { id: string }) {
  const { be, t, lang, toast } = useStore()
  const s = studioText[lang]
  const o = operationsText[lang]
  const { data, setData, failed, refresh } = useStudioRead(useCallback(() => loadHistory(be, id), [be, id]))
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const pending = useRef<{ id: string; body: string } | null>(null)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const body = draft.trim()
    if (!body || saving) return
    setSaving(true)
    setSaveFailed(false)
    try {
      if (pending.current?.body !== body) pending.current = { id: crypto.randomUUID(), body }
      const note = await saveNote(be, id, pending.current.id, body)
      setData(d => d && ({ ...d, notes: [note, ...d.notes.filter(n => n.id !== note.id)] }))
      setDraft('')
      pending.current = null
      toast(s.saved)
    } catch { setSaveFailed(true) }
    finally { setSaving(false) }
  }
  const date = (at: string) => new Date(at).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })
  if (failed) return <p role="alert">{s.loadError} <button type="button" className="ap-btn ap-btn--sm" onClick={refresh}>{t.priorities.retry}</button></p>
  if (!data) return <p role="status">{s.loading}</p>
  const ratings = requestRatings(data.requests)
  const contact = data.profile
  const preferences = Object.entries(contact?.notify ?? {}).filter(([, v]) => typeof v === 'boolean')
  return <div className="ops ops__grid ops__profile">
    {contact && <section className="card ops__contact"><header className="card__h"><h2>{o.profile}</h2>
      {contact.avatar && /^data:image\/(?:png|jpeg|webp);base64,/i.test(contact.avatar) && <img src={contact.avatar} width="48" height="48" alt="" />}</header>
      <strong>{contact.name || contact.email}</strong>{contact.jobTitle && <p>{contact.jobTitle}</p>}
      <dl><div><dt>{o.email}</dt><dd><a href={'mailto:' + contact.email}>{contact.email}</a></dd></div>
        {contact.phone && <div><dt>{o.phone}</dt><dd>{contact.phone}</dd></div>}
        {contact.timezone && <div><dt>{o.timezone}</dt><dd>{contact.timezone}</dd></div>}
        {contact.lang && <div><dt>{o.language}</dt><dd>{contact.lang === 'es' ? 'Español' : 'English'}</dd></div>}
        <div><dt>{o.notify}</dt><dd>{preferences.length ? preferences.map(([key, value]) =>
          <small key={key}>{t.prof.n[key]?.[0] ?? key} · {value ? o.on : o.off}</small>) : o.defaultPrefs}</dd></div></dl>
    </section>}
    {contact && <BusinessBrief company={contact.company} brand={contact.brand} files={data.files} />}
    <PlanChangeCount client={id} />
    <section className="card ops__notes"><div className="card__h"><h2>{s.notes}</h2></div>
      <p className="muted">{s.visibility}</p>
      <form onSubmit={submit}><label htmlFor="ops-note">{s.draft}</label>
        <textarea id="ops-note" rows={3} maxLength={2000} value={draft} disabled={saving} onChange={e => { setDraft(e.target.value); setSaveFailed(false) }} />
        {saveFailed && <p role="alert">{s.saveError}</p>}
        <button type="submit" className="ap-btn ap-btn--sm" disabled={saving || !draft.trim()}>{saving ? s.saving : s.add}</button></form>
      {data.notes.length ? <ul className="ops__list">{data.notes.map(n => <li key={n.id}>
        <p>{n.body}</p><small>{n.author || t.studio} · <time dateTime={n.at}>{date(n.at)}</time></small>
      </li>)}</ul> : <p className="muted">{s.emptyNotes}</p>}
    </section>
    <section className="card" aria-labelledby="ops-client-ratings">
      <div className="card__h"><h2 id="ops-client-ratings">{s.ratings}</h2>
        {ratings.rated > 0 && <strong className="d n">{ratingScore(ratings, lang)}</strong>}</div>
      <p className="muted">{s.ratingCoverage(ratings.rated, ratings.approved)}</p>
      {!ratings.rated && <p>{s.noRatings}</p>}
    </section>
    <HistorySection title={s.history} count={data.requests.length} empty={s.noRequests}>
      {data.requests.map(r => <li key={r.id}>
        {r.status === 'cancelled' ? <b>{r.title}</b> : <a href={'#/admin/' + r.id}>{r.title}</a>}
        <small>#{r.number} · {t.status[r.status]} · {date(r.at)}</small>
        {r.status === 'done' && r.rating != null && <>
          <small>{s.rating} · {r.rating} / 5</small>
          {r.ratingNote && <p>{r.ratingNote}</p>}
        </>}</li>)}
    </HistorySection>
    <HistorySection title={s.files} count={data.files.length} empty={s.noFiles}>
      {data.files.map(f => { const url = fileDownload(be, f)
        return <li key={f.id}>{url ? <a href={url} download={f.name}>{f.name}</a> : <b>{f.name}</b>}
          <small>{f.kind === 'deliverable' && 'v' + f.version + ' · '}{Math.ceil(f.size / 1024)} KB · {date(f.at)}</small></li> })}
    </HistorySection>
    <HistorySection title={t.billing.invoices} count={data.invoices.length} empty={t.billing.none}>
      {data.invoices.map(i => <li key={i.id}><b>{i.label}</b>
        <small>{i.amount.toLocaleString(lang, { style: 'currency', currency: i.currency })} · {({ paid: s.paid, unpaid: s.unpaid, refunded: s.refunded } as Record<string, string>)[i.status] ?? i.status} · {date(i.at)}</small>
        {i.url && /^https?:\/\//i.test(i.url) && <a href={i.url} target="_blank" rel="noreferrer">{s.receipt}</a>}
      </li>)}
    </HistorySection>
    <HistorySection title={s.members} count={data.members.length} empty={s.noMembers}>
      {data.members.map(m => <li key={m.id}><b>{m.name || m.email}</b>{m.name && <small>{m.email}</small>}</li>)}
    </HistorySection>
  </div>
}
