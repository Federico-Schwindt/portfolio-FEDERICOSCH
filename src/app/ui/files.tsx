import { useEffect, useRef, useState, type ReactNode } from 'react'
import type React from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import type { FileItem, FileKind } from '../types'
import { fmtSize, isImage } from './bits'

/** a drop area that also opens the file picker; uploads one by one and reports errors as toasts */
export function Dropzone({ requestId = null, kind, compact = false, children }: { requestId?: string | null; kind: FileKind; compact?: boolean; children?: ReactNode }) {
  const { t, be, toast, reload } = useStore()
  const [over, setOver] = useState(false)
  const [busy, setBusy] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const send = async (list: FileList | File[]) => {
    const arr = Array.from(list)
    setBusy(arr.length)
    for (const f of arr) {
      try { await be.upload(f, { requestId, kind }) } catch (e) { toast(`${f.name}: ${(e as Error).message}`) }
      setBusy((n) => n - 1)
    }
    await reload()
  }
  return (
    <div className={`dz${over ? ' is-over' : ''}${compact ? ' dz--sm' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) send(e.dataTransfer.files) }}
      onClick={() => input.current?.click()} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') input.current?.click() }}>
      <input ref={input} type="file" multiple hidden onChange={(e) => { if (e.target.files?.length) send(e.target.files); e.target.value = '' }} />
      <Icon name="paperclip" size={compact ? 15 : 20} />
      <span>{busy ? `${t.x.files.up} (${busy})` : children ?? t.x.files.drop}</span>
      {!compact && <small className="mono">{t.x.files.limit}</small>}
    </div>
  )
}

/** one file: a real preview for images, an extension badge for the rest */
export function FileTile({ f, onOpen }: { f: FileItem; onOpen?: (f: FileItem) => void }) {
  const { t, be, user, reload, lang, pins } = useStore()
  const pinCount = pins.filter((p) => p.fileId === f.id && !p.resolved).length
  const ext = (f.name.split('.').pop() ?? '').slice(0, 4).toUpperCase()
  const mine = user?.role === 'admin' || !f.byStudio
  const url = be.fileUrl(f)
  return (
    <div className={`ft ft--${f.kind}`}>
      <button type="button" className="ft__prev" onClick={() => (onOpen ? onOpen(f) : window.open(url, '_blank'))} aria-label={`${t.x.files.open} ${f.name}`}>
        {isImage(f.mime) && url !== '#' ? <img src={url} alt="" loading="lazy" /> : <span className="ft__ext mono">{ext || 'FILE'}</span>}
        {f.kind === 'deliverable' && <span className="ft__v mono">v{f.version}</span>}
        {pinCount > 0 && <span className="ft__pins mono">{pinCount}</span>}
      </button>
      <div className="ft__meta">
        <b title={f.name}>{f.name}</b>
        <small className="mono">{fmtSize(f.size)} · {new Date(f.at).toLocaleDateString(lang, { day: 'numeric', month: 'short' })}</small>
      </div>
      <div className="ft__act">
        <a href={be.fileUrl(f, true)} download={f.name} aria-label={t.x.files.download} title={t.x.files.download}><Icon name="arrowUpRight" size={14} /></a>
        {mine && <button type="button" aria-label={t.x.files.remove} title={t.x.files.remove} onClick={async () => { await be.removeFile(f.id); reload() }}><Icon name="x" size={14} /></button>}
      </div>
    </div>
  )
}

/** a full-screen look at an image or a PDF. On images, a click drops a pin with a note, tied to this version */
export function Preview({ f, onClose }: { f: FileItem | null; onClose: () => void }) {
  // Unmount the editor on close or version change. A point only makes sense on its original image.
  return f && <FilePreview key={f.id} f={f} onClose={onClose} />
}

function FilePreview({ f, onClose }: { f: FileItem; onClose: () => void }) {
  const { be, t, pins, reload, user } = useStore()
  const dialog = useRef<HTMLDialogElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const el = dialog.current!
    el.showModal()
    return () => el.close()
  }, [])
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null)
  const [text, setText] = useState('')
  const [hot, setHot] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const url = be.fileUrl(f)
  const mine = pins.filter((p) => p.fileId === f.id)
  const img = isImage(f.mime) && url !== '#'
  const place = (e: React.MouseEvent<HTMLDivElement>) => {
    if (saving) return
    const r = e.currentTarget.getBoundingClientRect()
    setDraft({ x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) })
    setFailed(false)
  }
  const discard = () => { setDraft(null); setText(''); setFailed(false); closeButton.current?.focus() }
  const save = async () => {
    if (saving || !draft || !text.trim()) return
    setSaving(true)
    try {
      await be.addPin(f.id, draft.x, draft.y, text.trim())
    } catch {
      setFailed(true)
      return
    } finally { setSaving(false) }
    discard()
    await reload()
  }
  const dismiss = () => {
    if (saving) return
    if (draft) discard()
    else onClose()
  }
  return (
    <dialog ref={dialog} className="pv" aria-label={f.name}
      onCancel={(e) => { e.preventDefault(); dismiss() }}
      onKeyDown={(e) => {
        e.stopPropagation() // App shortcuts belong to the screen behind the modal.
        if (e.key === 'Escape') { e.preventDefault(); dismiss() }
      }}>
      <div className="pv__bar" onClick={(e) => e.stopPropagation()}>
        <b>{f.name}{f.kind === 'deliverable' ? ` · v${f.version}` : ''}</b>
        {img && <span className="mono pv__hint">{t.x.pins.hint}</span>}
        <a className="ap-btn ap-btn--sm" href={be.fileUrl(f, true)} download={f.name}>{t.x.files.download}</a>
        <button ref={closeButton} type="button" className="dr__x" disabled={saving} onClick={onClose} aria-label={t.x.pins.close}><Icon name="x" size={18} /></button>
      </div>
      <div className={`pv__body${img ? ' pv__body--pins' : ''}`} onClick={(e) => e.stopPropagation()}>
        {img ? (
          <>
            <div className="pv__stage">
              <div className="pv__img" onClick={place}>
                <img src={url} alt={f.name} draggable={false} />
                {mine.map((p, i) => (
                  <button key={p.id} type="button" className={`pin${p.resolved ? ' is-done' : ''}${hot === p.id ? ' is-hot' : ''}${p.byStudio ? ' pin--studio' : ''}`} style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }} onClick={(e) => { e.stopPropagation(); setHot(p.id) }} aria-label={`${i + 1}: ${p.body}`} data-n={i + 1} />
                ))}
                {draft && (
                  <span className="pin pin--draft" style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%` }} data-n={mine.length + 1} />
                )}
              </div>
            </div>
            <aside className="pv__side">
              <p className="mono">{t.x.pins.title} · {mine.filter((p) => !p.resolved).length}/{mine.length}</p>
              {draft && <form className="pin-new__box" onSubmit={(e) => { e.preventDefault(); save() }}>
                <label>{t.x.pins.ph}<textarea autoFocus rows={2} value={text} maxLength={2000} disabled={saving} onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }} /></label>
                {failed && <p role="alert">{t.x.pins.saveError}</p>}
                <div className="dr__fa">
                  <button type="button" className="ap-btn ap-btn--sm ap-btn--ghost" disabled={saving} onClick={discard}>{t.x.rv.back}</button>
                  <button type="submit" className="ap-btn ap-btn--sm ap-btn--red" disabled={saving || !text.trim()}>{t.x.pins.save}</button>
                </div>
              </form>}
              {!mine.length && !draft && <p className="muted">{t.x.pins.none}</p>}
              <ol>
                {mine.map((p, i) => (
                  <li key={p.id} className={`${p.resolved ? 'is-done' : ''}${hot === p.id ? ' is-hot' : ''}`} onMouseEnter={() => setHot(p.id)} onMouseLeave={() => setHot(null)}>
                    <span className={`pin pin--sm${p.byStudio ? ' pin--studio' : ''}`} data-n={i + 1} />
                    <p>{p.body}</p>
                    <span className="pv__pa">
                      {user?.role === 'admin' && <label className="mono"><input type="checkbox" checked={p.resolved} onChange={async () => { await be.setPin(p.id, !p.resolved); reload() }} />{t.x.pins.done}</label>}
                      {(p.mine || user?.role === 'admin') && <button type="button" aria-label={t.x.files.remove} onClick={async () => { await be.removePin(p.id); reload() }}><Icon name="x" size={12} /></button>}
                    </span>
                  </li>
                ))}
              </ol>
            </aside>
          </>
        ) : f.mime === 'application/pdf' ? <iframe src={url} title={f.name} /> : <a className="ap-btn ap-btn--red" href={be.fileUrl(f, true)} download={f.name}>{t.x.files.download}</a>}
      </div>
    </dialog>
  )
}
