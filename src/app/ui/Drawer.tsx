import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { rel } from '../i18n'
import { requestLink } from '../mail'
import { KindTag, Ring, StatusPill, forecast, shortDay } from './bits'
import { Dropzone, FileTile, Preview } from './files'
import { MailHistory } from './MailSettings'
import { ReviewNotice } from './ReviewNotice'
import { RequestBrief } from '../ui-studio/BusinessBrief'
import { runningSlots, type FileItem } from '../types'

/** one request: brief, checklist, deliverable, the whole thread, and the actions that fit its state */
export function Drawer({ id, page = false }: { id: string | null; page?: boolean }) {
  const { t, lang, base, reqs, events, be, go, route, toast, user, files, sub, reload, pins } = useStore()
  const [pv, setPv] = useState<FileItem | null>(null)
  const [asking, setAsking] = useState(false)
  const [note, setNote] = useState('')
  const r = id ? reqs.find((x) => x.id === id) : undefined
  const [text, setText] = useState('')
  const [manualLink, setManualLink] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (page) heading.current?.focus({ preventScroll: true })
  }, [page, id])
  const link = id ? requestLink(base, lang, id, be.mode === 'demo') : ''
  const listRef = useRef<HTMLOListElement>(null)
  const thread = r ? events.filter((e) => e.requestId === r.id) : []
  const board = user?.role === 'admin' ? 'admin' : 'board'
  const close = () => go(page ? board : route.split('/')[0])
  useEffect(() => { listRef.current?.scrollTo({ top: 1e6, behavior: 'smooth' }) }, [thread.length])
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && id && !page && !pv) close() }; addEventListener('keydown', k); return () => removeEventListener('keydown', k) })
  const send = async () => { if (!r || !text.trim()) return; await be.comment(r.id, text.trim()); setText(''); await reload() }
  const isAdmin = user?.role === 'admin'
  const lastChanges = [...thread].reverse().find((e) => e.kind === 'changes')
  const mine = r ? files.filter((f) => f.requestId === r.id) : []
  const deliv = mine.filter((f) => f.kind === 'deliverable').sort((a, b) => b.version - a.version)
  const other = mine.filter((f) => f.kind !== 'deliverable')
  const eta = r && !isAdmin && (r.status === 'queued' || r.status === 'active') ? forecast(reqs, runningSlots(sub)).get(r.id) : undefined
  const duplicate = async () => { if (!r) return; const n = await be.create({ title: r.title, kind: r.kind, brief: r.brief, checklist: r.checklist.map((c) => ({ ...c, done: false })), priority: r.priority, files: [] }); toast(t.toastNew); await reload(); go(`${route.split('/')[0]}/${n.id}`) }

  const Frame = page ? motion.article : motion.aside
  const Title = page ? 'h1' : 'h2'
  if (page && !r) return <section className="card request-missing"><h1>{t.requestPage.title}</h1><p>{t.requestPage.missing}</p><a href={'#/' + board}>{t.requestPage.back}</a></section>
  return (
    <AnimatePresence>
      {r && (
        <>
          {!page && <motion.div className="dr__veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />}
          <Frame className={page ? 'dr-page card' : 'dr'} role={page ? undefined : 'dialog'} aria-modal={page ? undefined : true} aria-label={r.title} initial={page ? false : { x: '100%' }} animate={{ x: 0 }} exit={page ? undefined : { x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 320 }}>
            <header className="dr__h">
              <div className="dr__meta"><span className="mono">#{r.number}</span><StatusPill s={r.status} label={t.status[r.status]} /><KindTag k={r.kind} label={t.kinds[r.kind]} /></div>
              {page ? <a className="ap-btn ap-btn--ghost ap-btn--sm" href={'#/' + board}><Icon name="arrowLeft" size={14} />{t.requestPage.back}</a> :
                <button type="button" className="dr__x" onClick={close} aria-label={t.requestPage.close}><Icon name="x" size={18} /></button>}
            </header>
            <div className="dr__body">
              <Title ref={heading} tabIndex={page ? -1 : undefined} className="d dr__t">{r.title}</Title>
              <div className="dr__share">
                {!page && <a className="ap-btn ap-btn--ghost ap-btn--sm" href={link}><Icon name="arrowUpRight" size={15} />{t.requestPage.open}</a>}
                <button className="ap-btn ap-btn--ghost ap-btn--sm" type="button" onClick={async () => {
                  const href = new URL(link, location.origin).href
                  try { await navigator.clipboard.writeText(href); toast(t.x.team.copied) }
                  catch { setManualLink(href) }
                }}>{t.requestPage.copy}</button>
                {manualLink && <input aria-label={t.requestPage.link} readOnly value={manualLink} autoFocus onFocus={e => e.target.select()} />}
              </div>
              <dl className="dr__facts">
                <div><dt className="mono">{t.detail.created}</dt><dd>{rel(r.createdAt, lang)}</dd></div>
                <div><dt className="mono">{t.detail.priority}</dt><dd>{t.pri[r.priority]}</dd></div>
                {eta && <div><dt className="mono">{t.x.eta}</dt><dd>{shortDay(eta, lang)}</dd></div>}
                <div><dt className="mono">{t.x.due}</dt><dd>{r.status === 'queued' && !isAdmin ? <input type="date" className="dr__date" value={r.dueDate ?? ''} onChange={(e) => be.update(r.id, { dueDate: e.target.value || null }).then(reload)} /> : r.dueDate ? shortDay(new Date(r.dueDate + 'T12:00'), lang) : t.x.dueNone}</dd></div>
                {(r.status === 'active' || r.status === 'review') && <div className="dr__ring"><Ring value={r.progress} size={54} stroke={4} /></div>}
              </dl>

              {isAdmin && <RequestBrief key={r.id} id={r.id} />}

              {r.status === 'review' && (
                <div className="dr__review dr__review--v2">
                  <p className="mono">{t.x.rv.latest}{deliv[0] ? ` · v${deliv[0].version}` : ''}</p>
                  {deliv[0] ? <div className="dr__latest"><FileTile f={deliv[0]} onOpen={setPv} /></div> : r.deliverable ? <a className="ap-btn ap-btn--ghost" href={r.deliverable} target="_blank" rel="noopener"><Icon name="arrowUpRight" size={15} />{t.detail.openFile}</a> : <p className="muted">{t.x.rv.noFile}</p>}
                  {isAdmin && (be.mode === 'demo' ? <ReviewNotice key={r.id} request={r} /> : <MailHistory studio key={r.id} requestId={r.id} />)}
                  {!isAdmin && (asking ? (
                    <div className="dr__ask">
                      <textarea autoFocus rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t.x.rv.ph} />
                      <div className="dr__fa">
                        <button className="ap-btn ap-btn--sm ap-btn--ghost" type="button" onClick={() => { setAsking(false); setNote('') }}>{t.x.rv.back}</button>
                        <button className="ap-btn ap-btn--sm ap-btn--red" type="button" disabled={note.trim().length < 3} onClick={async () => { await be.update(r.id, { status: 'active', note: note.trim() }); setNote(''); setAsking(false); toast(t.toastChanges); reload() }}>{t.x.rv.send}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="dr__fa dr__fa--l">
                      <button className="ap-btn ap-btn--red" type="button" onClick={async () => { await be.update(r.id, { status: 'done' }); toast(t.toastApproved); reload() }}><Icon name="check" size={15} />{t.approve}</button>
                      <button className="ap-btn ap-btn--ghost" type="button" onClick={() => { const open = deliv[0] ? pins.filter((p) => p.fileId === deliv[0].id && !p.resolved).length : 0; if (open && !note) setNote(t.x.pins.seeNote(open, deliv[0].version)); setAsking(true) }}>{t.changes}</button>
                    </div>
                  ))}
                </div>
              )}
              {r.status === 'review' && !isAdmin && <MailHistory key={r.id} requestId={r.id} />}
              {r.status === 'done' && !isAdmin && <Rate key={r.id} id={r.id} rating={r.rating ?? null} />}
              {r.status === 'done' && isAdmin && r.rating && <p className="dr__rated"><span>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>{r.ratingNote}</p>}
              {r.status === 'done' && r.deliverable && <a className="ap-btn ap-btn--ghost dr__deliv" href={r.deliverable} target="_blank" rel="noopener"><Icon name="arrowUpRight" size={15} />{t.detail.openFile}</a>}
              {r.status === 'active' && lastChanges && (
                <div className="dr__changes"><p className="mono">{t.x.rv.asked(lastChanges.body.match(/^v\d+/)?.[0] ?? '')}</p><p>{lastChanges.body.replace(/^v\d+:\s*/, '')}</p></div>
              )}
              {isAdmin && r.status === 'active' && (
                <div className="dr__admin">
                  <input type="range" min={0} max={100} value={r.progress} onChange={(e) => be.update(r.id, { progress: +e.target.value })} aria-label={t.detail.progress} />
                  <button className="ap-btn ap-btn--sm" type="button" onClick={async () => {
                    try { await be.update(r.id, { status: 'review', progress: 100 }); await reload() }
                    catch (e) { toast((e as Error).message) }
                  }}>{t.admin.deliver}</button>
                </div>
              )}

              {deliv.length > 0 && (
                <section className="dr__sec dr__deliv2">
                  <h3 className="mono">{t.detail.deliverable} · v{deliv[0].version}</h3>
                  <div className="dr__files2">{deliv.map((f) => <FileTile key={f.id} f={f} onOpen={setPv} />)}</div>
                </section>
              )}
              {r.brief && <section className="dr__sec"><h3 className="mono">{t.detail.brief}</h3><p className="dr__brief">{r.brief}</p></section>}
              {r.checklist.length > 0 && (
                <section className="dr__sec">
                  <h3 className="mono">{t.detail.checklist} · {r.checklist.filter((c) => c.done).length}/{r.checklist.length}</h3>
                  <ul className="dr__check">
                    {r.checklist.map((c, i) => (
                      <li key={i}><label><input type="checkbox" checked={c.done} disabled={!isAdmin && r.status !== 'queued'} onChange={() => be.update(r.id, { checklist: r.checklist.map((x, k) => (k === i ? { ...x, done: !x.done } : x)) })} /><span>{c.text}</span></label></li>
                    ))}
                  </ul>
                </section>
              )}
              <section className="dr__sec">
                <h3 className="mono">{t.detail.files} · {other.length}</h3>
                {other.length > 0 && <div className="dr__files2">{other.map((f) => <FileTile key={f.id} f={f} onOpen={setPv} />)}</div>}
                {r.files.length > 0 && <ul className="dr__files">{r.files.map((f) => <li key={f}><Icon name="paperclip" size={14} />{f}</li>)}</ul>}
                <Dropzone requestId={r.id} kind={isAdmin ? 'deliverable' : 'brief'} compact>{isAdmin ? t.x.files.asDeliv : t.x.files.drop}</Dropzone>
              </section>

              <section className="dr__sec">
                <h3 className="mono">{t.detail.timeline}</h3>
                <ol className="dr__tl" ref={listRef}>
                  {thread.map((e) => (
                    <motion.li key={e.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`tl tl--${e.who} tl--${e.kind}`}>
                      {e.kind === 'comment' || e.kind === 'changes' ? (
                        <div className={`tl__msg${e.kind === 'changes' ? ' tl__msg--changes' : ''}`}><b>{e.who === 'client' && e.by && !isAdmin ? e.by : isAdmin && e.who === 'client' ? (e.by && r.ownerName ? `${e.by} · ${r.ownerName}` : r.ownerName ?? t.who.client) : isAdmin && e.who === 'studio' ? t.who.client : t.who[e.who]}</b><p>{e.kind === 'changes' ? <><em className="mono">{t.x.rv.asked(e.body.match(/^v\d+/)?.[0] ?? '')}</em> {e.body.replace(/^v\d+:\s*/, '')}</> : e.body}</p><small className="mono">{rel(e.at, lang)}</small></div>
                      ) : (
                        <p className="tl__ev">{e.kind === 'ai' ? <Icon name="sparkle" size={12} /> : <i />}<span>{e.kind === 'status' ? t.evStatus[e.body as keyof typeof t.evStatus] ?? e.body : e.body}</span><small className="mono">{rel(e.at, lang)}</small></p>
                      )}
                    </motion.li>
                  ))}
                </ol>
              </section>
            </div>
            <footer className="dr__f">
              <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t.detail.comment} rows={2} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send() }} />
              <div className="dr__fa">
                {r.status === 'queued' && !isAdmin && <button type="button" className="ap-btn ap-btn--sm ap-btn--ghost" onClick={async () => { await be.update(r.id, { status: 'cancelled' }); close() }}>{t.detail.cancel}</button>}
                {!isAdmin && <button type="button" className="ap-btn ap-btn--sm ap-btn--ghost" onClick={duplicate}>{t.x.duplicate}</button>}
                <button type="button" className="ap-btn ap-btn--sm ap-btn--red" disabled={!text.trim()} onClick={send}><Icon name="chatCircle" size={14} />{t.detail.send}</button>
              </div>
            </footer>
          </Frame>
          <Preview f={pv} onClose={() => setPv(null)} />
        </>
      )}
    </AnimatePresence>
  )
}

/** how did this delivery go: five stars and an optional line, once */
function Rate({ id, rating }: { id: string; rating: number | null }) {
  const { t, be, toast, reload } = useStore()
  const [hover, setHover] = useState(0)
  const [score, setScore] = useState(rating ?? 0)
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(!!rating)
  if (sent) return <div className="rate rate--done"><span className="rate__stars" aria-label={t.tpl.rated(score)}>{[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= score ? 'is-on' : ''}>★</i>)}</span><span>{t.tpl.thanks}</span></div>
  return (
    <div className="rate">
      <p className="rate__q">{t.tpl.rateQ}</p>
      <div className="rate__stars" role="radiogroup" aria-label={t.tpl.rateQ} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={score === n} aria-label={t.tpl.rated(n)} className={n <= (hover || score) ? 'is-on' : ''} onMouseEnter={() => setHover(n)} onClick={() => setScore(n)}>★</button>)}
      </div>
      {score > 0 && <div className="rate__more"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder={score >= 4 ? t.tpl.notePos : t.tpl.noteNeg} maxLength={300} />
        <button type="button" className="ap-btn ap-btn--sm ap-btn--red" onClick={async () => { await be.rate(id, score, note.trim() || undefined); setSent(true); toast(t.tpl.thanks); reload() }}>{t.tpl.send}</button></div>}
    </div>
  )
}
