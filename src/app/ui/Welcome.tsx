/**
 * The welcome conversation: on the first open of the dashboard the client tells the studio about the business, one
 * question per screen (Enter to go on, letter keys for choices, files by drag and drop). Every answer is saved as it is
 * given (in the account's brand kit, under `business`), so it can be left at any point and picked up later.
 * Open it from anywhere with openWelcome().
 */
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { welcome } from '../i18n-welcome'
import type { Business, FileItem } from '../types'
import { fmtSize, isImage } from './bits'

const EVENT = 'fs-welcome'
export const openWelcome = () => window.dispatchEvent(new Event(EVENT))
const STEPS = ['name', 'what', 'industry', 'customers', 'goal', 'links', 'style', 'files', 'notes'] as const
type Step = (typeof STEPS)[number]
const MAX = 8 * 1024 * 1024
const LATER = 'fs-welcome-later'

/** which questions already have an answer (files and notes are optional, so they count once seen) */
export function welcomeLeft(b: Business | undefined, company: string) {
  const x = b ?? {}
  const seen = (step: Step) => x.seen?.includes(step) === true
  const done: Record<Step, boolean> = {
    name: company.trim().length >= 2, what: !!x.what?.trim(), industry: x.industry != null,
    // Skipping the audience question saves an empty string, including in older drafts.
    customers: typeof x.customers === 'string', goal: !!x.goals?.length, links: seen('links'),
    style: x.style != null, files: seen('files'), notes: seen('notes'),
  }
  return STEPS.filter((s) => !done[s])
}

export function Welcome() {
  const { t: _t, lang, user, be, reload, files, setNewOpen, go } = useStore()
  const T = welcome[lang]
  const owner = !!user && user.role === 'client' && !user.member
  const [open, setOpen] = useState(false)
  const [at, setAt] = useState(-1) // -1 welcome, 0..8 questions, 9 done
  const [dir, setDir] = useState(1)
  const [name, setName] = useState('')
  const [b, setB] = useState<Business>({})
  const [colors, setColors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [upErr, setUpErr] = useState('')
  const [uploading, setUploading] = useState(0)
  const started = useRef(false)
  const saving = useRef(false)
  // the newest answers, readable from the key handler even when keys arrive faster than a render
  const live = useRef(b); live.current = b

  // load what is saved, and open by itself the first time (never under automation, where it would sit over every test)
  useEffect(() => {
    if (!owner || started.current) return
    started.current = true
    setName(user!.company ?? ''); setB(user!.brand?.business ?? {}); setColors(user!.brand?.colors ?? [])
    let later = false
    try { later = sessionStorage.getItem(LATER) === '1' } catch { /* private mode */ }
    const forced = new URLSearchParams(location.search).has('welcome')
    if (forced || (!user!.brand?.onboarded && !later && !navigator.webdriver)) setOpen(true)
  }, [owner, user])
  useEffect(() => {
    const f = () => { if (!owner) return; setName(user!.company ?? ''); setB(user!.brand?.business ?? {}); setColors(user!.brand?.colors ?? []); const left = welcomeLeft(user!.brand?.business, user!.company ?? ''); setDir(1); setAt(left.length ? STEPS.indexOf(left[0]) : 0); setOpen(true) }
    addEventListener(EVENT, f); return () => removeEventListener(EVENT, f)
  }, [owner, user])
  useEffect(() => { if (!open) return; const o = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; return () => { document.documentElement.style.overflow = o } }, [open])

  const step = at >= 0 && at < STEPS.length ? STEPS[at] : null
  const left = useMemo(() => welcomeLeft(b, name), [b, name])
  const mine = files.filter((f) => !f.requestId && !f.byStudio && (f.kind === 'brand' || f.kind === 'asset'))

  const save = useCallback(async (patch: Business, extra: { company?: string; colors?: string[]; onboarded?: boolean } = {}) => {
    if (saving.current) return false
    saving.current = true
    const business = { ...live.current, ...patch }
    setB(business); setBusy(true); setErr('')
    try {
      await be.updateProfile({ ...(extra.company !== undefined ? { company: extra.company } : {}), brand: { business, ...(extra.colors ? { colors: extra.colors } : {}), ...(extra.onboarded ? { onboarded: true } : {}) } })
      await reload()
      return true
    } catch { setErr(T.saveError); return false } finally { saving.current = false; setBusy(false) }
  }, [be, reload, T.saveError])

  const move = (n: number) => { setDir(n > at ? 1 : -1); setAt(n); setErr('') }
  const seen = (s: string) => [...new Set([...(b.seen ?? []), s])]
  const next = async () => {
    if (saving.current || (step === 'files' && uploading > 0)) return
    if (at === -1) { const l = welcomeLeft(b, name); move(l.length && l.length < STEPS.length ? STEPS.indexOf(l[0]) : 0); return }
    let ok = true
    if (step === 'name') { if (name.trim().length < 2) return; ok = await save({}, { company: name.trim() }) }
    else if (step === 'what') { if (!b.what?.trim()) return; ok = await save({ what: b.what.trim() }) }
    else if (step === 'customers') ok = await save({ customers: (b.customers ?? '').trim() })
    else if (step === 'links') ok = await save({ site: b.site?.trim(), instagram: b.instagram?.trim(), other: b.other?.trim(), seen: seen('links') })
    else if (step === 'industry') { if (b.industry === undefined) return; ok = await save({ industry: b.industry }) }
    else if (step === 'goal') { const g = live.current.goals; if (!g?.length) return; ok = await save({ goals: g }) }
    else if (step === 'style') { const st = live.current.style; if (st === undefined) return; ok = await save({ style: st }, { colors }) }
    else if (step === 'files') ok = await save({ seen: seen('files') })
    else if (step === 'notes') ok = await save({ notes: (b.notes ?? '').trim(), seen: seen('notes') }, { onboarded: true })
    if (ok) move(at + 1)
  }
  const choose = async (patch: Business) => { if (await save(patch)) move(at + 1) }
  const close = () => { try { sessionStorage.setItem(LATER, '1') } catch { /* private mode */ } setOpen(false); if (new URLSearchParams(location.search).has('welcome')) { const u = new URL(location.href); u.searchParams.delete('welcome'); history.replaceState(null, '', u) } }

  // keys: Enter goes on (Shift+Enter is a new line in long answers), letters pick a choice, Escape leaves it for later
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); if (!saving.current) close(); return }
      const el = e.target as HTMLElement, typing = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'
      if (e.key === 'Enter' && !(el.tagName === 'TEXTAREA' && e.shiftKey) && el.tagName !== 'BUTTON' && !(el instanceof HTMLInputElement && (el.type === 'file' || el.type === 'color'))) { e.preventDefault(); next(); return }
      if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey && /^[a-h]$/i.test(e.key)) {
        const btn = document.querySelector<HTMLButtonElement>(`.wl [data-key="${e.key.toLowerCase()}"]`)
        if (btn) { e.preventDefault(); e.stopPropagation(); btn.click() }
      }
    }
    addEventListener('keydown', k, true); return () => removeEventListener('keydown', k, true)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (list: FileList | File[] | null, kind: 'brand' | 'asset') => {
    if (!list) return
    setUpErr('')
    for (const f of Array.from(list)) {
      if (f.size > MAX) { setUpErr(T.q.files.tooBig(f.name)); continue }
      setUploading((n) => n + 1)
      try { await be.upload(f, { kind }) } catch { setUpErr(T.q.files.failed(f.name)) } finally { setUploading((n) => n - 1) }
    }
    await reload()
  }

  if (!owner || !open) return null
  const first = (user!.name || '').split(' ')[0]
  const letter = (i: number) => String.fromCharCode(97 + i)
  const Choice = ({ i, on, onPick, children }: { i: number; on: boolean; onPick: () => void; children: ReactNode }) => (
    <button type="button" className={`wl__opt${on ? ' is-on' : ''}`} data-key={letter(i)} aria-pressed={on} onClick={onPick}><kbd>{letter(i).toUpperCase()}</kbd><span>{children}</span>{on && <Icon name="check" size={15} />}</button>
  )
  const Tile = ({ f }: { f: FileItem }) => (
    <li className="wl__file">
      <span className="wl__thumb">{isImage(f.mime) && be.fileUrl(f) !== '#' ? <img src={be.fileUrl(f)} alt="" /> : <Icon name="file" size={16} />}</span>
      <span className="wl__fn"><b>{f.name}</b><small>{fmtSize(f.size)}</small></span>
      <button type="button" aria-label={`${T.q.files.remove} ${f.name}`} onClick={async () => { await be.removeFile(f.id); reload() }}><Icon name="x" size={13} /></button>
    </li>
  )
  const Drop = ({ kind, label, multiple }: { kind: 'brand' | 'asset'; label: string; multiple?: boolean }) => {
    const [over, setOver] = useState(false)
    return (
      <label className={`wl__drop${over ? ' is-over' : ''}`} onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); send(e.dataTransfer.files, kind) }}>
        <input type="file" multiple={multiple} accept={kind === 'brand' ? 'image/*,.svg,.pdf,.ai,.eps' : undefined} onChange={(e) => { send(e.target.files, kind); e.target.value = '' }} />
        <Icon name="paperclip" size={18} /><span>{label}</span>
      </label>
    )
  }

  const hint = (long?: boolean) => <p className="wl__go"><button type="button" className="ap-btn ap-btn--red" disabled={busy} onClick={next}>{busy ? T.saving : T.next}<Icon name="check" size={15} /></button><span>{long ? T.shiftEnter : T.enter} ↵</span></p>
  const body: Record<Step, ReactNode> = {
    name: <><input className="wl__in" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={T.q.name.ph} maxLength={120} aria-label={T.q.name.t} />{hint()}</>,
    what: <><textarea className="wl__in" autoFocus rows={2} value={b.what ?? ''} onChange={(e) => setB({ ...b, what: e.target.value })} placeholder={T.q.what.ph} maxLength={600} aria-label={T.q.what.t(name)} />{hint(true)}</>,
    industry: <div className="wl__opts wl__opts--2">{T.q.industry.o.map((o, i) => <Choice key={o} i={i} on={b.industry === i} onPick={() => choose({ industry: i })}>{o}</Choice>)}</div>,
    customers: <><textarea className="wl__in" autoFocus rows={2} value={b.customers ?? ''} onChange={(e) => setB({ ...b, customers: e.target.value })} placeholder={T.q.customers.ph} maxLength={600} aria-label={T.q.customers.t} />{hint(true)}</>,
    goal: <><div className="wl__opts">{T.q.goal.o.map((o, i) => { const on = !!b.goals?.includes(i); return <Choice key={o} i={i} on={on} onPick={() => setB((p) => ({ ...p, goals: p.goals?.includes(i) ? p.goals.filter((x) => x !== i) : [...(p.goals ?? []), i].slice(-2) }))}>{o}</Choice> })}</div>
      <p className="wl__go"><button type="button" className="ap-btn ap-btn--red" disabled={busy || !b.goals?.length} onClick={async () => { if (await save({ goals: b.goals })) move(at + 1) }}>{T.next}<Icon name="check" size={15} /></button><span>{T.pickMany}</span></p></>,
    links: <><div className="wl__fields">
      <label><span>{T.q.links.site}</span><input className="wl__in wl__in--sm" autoFocus inputMode="url" value={b.site ?? ''} onChange={(e) => setB({ ...b, site: e.target.value })} placeholder="cafelavirginia.com" /></label>
      <label><span>{T.q.links.ig}</span><input className="wl__in wl__in--sm" value={b.instagram ?? ''} onChange={(e) => setB({ ...b, instagram: e.target.value })} placeholder="@cafelavirginia" /></label>
      <label><span>{T.q.links.other}</span><input className="wl__in wl__in--sm" value={b.other ?? ''} onChange={(e) => setB({ ...b, other: e.target.value })} /></label></div>{hint()}</>,
    style: <><div className="wl__styles">{T.q.style.o.map(([o, d], i) => <button key={o} type="button" className={`wl__style wl__style--${i}${b.style === i ? ' is-on' : ''}`} data-key={letter(i)} aria-pressed={b.style === i} onClick={() => setB((p) => ({ ...p, style: i }))}><i aria-hidden="true"><b /><b /><b /></i><span><strong>{o}</strong><small>{d}</small></span><kbd>{letter(i).toUpperCase()}</kbd></button>)}</div>
      <div className="wl__colors"><span>{T.q.style.colors}</span>
        {colors.map((c, i) => <label key={i} className="wl__sw" style={{ background: c }}><input type="color" value={c} onChange={(e) => setColors(colors.map((x, k) => (k === i ? e.target.value : x)))} aria-label={`${T.q.style.colors} ${i + 1}`} /><button type="button" aria-label={T.q.files.remove} onClick={(e) => { e.preventDefault(); setColors(colors.filter((_, k) => k !== i)) }}><Icon name="x" size={10} /></button></label>)}
        {colors.length < 5 && <button type="button" className="wl__add" onClick={() => setColors([...colors, '#F01111'])} aria-label={T.q.style.addColor}><Icon name="plus" size={14} /></button>}</div>
      <p className="wl__go"><button type="button" className="ap-btn ap-btn--red" disabled={busy || b.style === undefined} onClick={async () => { if (await save({ style: b.style }, { colors })) move(at + 1) }}>{T.next}<Icon name="check" size={15} /></button><span>{T.pick}</span></p></>,
    files: <><div className="wl__up">
      <div><p className="wl__lab">{T.q.files.logo}</p><Drop kind="brand" label={T.q.files.dropLogo} />
        <ul className="wl__files">{mine.filter((f) => f.kind === 'brand').map((f) => <Tile key={f.id} f={f} />)}</ul></div>
      <div><p className="wl__lab">{T.q.files.rest}</p><Drop kind="asset" label={T.q.files.drop} multiple />
        <ul className="wl__files">{mine.filter((f) => f.kind === 'asset').map((f) => <Tile key={f.id} f={f} />)}</ul></div></div>
      {uploading > 0 && <p className="wl__note" role="status"><span className="live" />{T.q.files.uploading}</p>}
      {upErr && <p className="lg__err" role="alert">{upErr}</p>}
      {!mine.length && !uploading && <p className="wl__note">{T.q.files.none}</p>}
      <p className="wl__go"><button type="button" className="ap-btn ap-btn--red" disabled={busy || uploading > 0} onClick={next}>{T.next}<Icon name="check" size={15} /></button></p></>,
    notes: <><textarea className="wl__in" autoFocus rows={3} value={b.notes ?? ''} onChange={(e) => setB({ ...b, notes: e.target.value })} placeholder={T.q.notes.ph} maxLength={1500} aria-label={T.q.notes.t} />{hint(true)}</>,
  }
  const title = (s: Step) => (s === 'what' ? T.q.what.t(name.trim()) : T.q[s].t as string)
  const sub = (s: Step) => ('h' in T.q[s] ? (T.q[s] as { h: string }).h : s === 'industry' ? T.pick : '')
  const optional = step === 'customers' || step === 'links' || step === 'files' || step === 'notes'
  const summary: [string, string][] = [[T.q.name.t, name], [T.q.industry.t, b.industry !== undefined ? T.q.industry.o[b.industry] : ''], [T.q.goal.t, (b.goals ?? []).map((g) => T.q.goal.o[g]).join(', ')], [T.q.style.t, b.style !== undefined ? T.q.style.o[b.style][0] : ''], [T.q.files.rest, mine.length ? String(mine.length) : '']].filter((x) => x[1]) as [string, string][]

  return (
    <div className="wl" role="dialog" aria-modal="true" aria-label={T.card.title}>
      <div className="wl__bar" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS.length} aria-valuenow={Math.max(0, Math.min(STEPS.length, at))}><i style={{ transform: `scaleX(${Math.max(0, Math.min(STEPS.length, at)) / STEPS.length})` }} /></div>
      <header className="wl__top">
        <span className="wl__me"><i>F</i>{step && <b className="n">{T.of(at + 1, STEPS.length)}</b>}</span>
        <button type="button" className="wl__x" disabled={busy} onClick={close}>{at === STEPS.length ? T.done.dash : T.close}<Icon name="x" size={14} /></button>
      </header>
      <main className="wl__stage">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.section key={at} className="wl__q" custom={dir} initial={{ opacity: 0, y: dir * 46 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: dir * -36 }} transition={{ type: 'spring', stiffness: 240, damping: 28 }}>
            {at === -1 && <>
              <span className="wl__av">F</span>
              <h1 className="wl__h">{T.hi(first)}</h1>
              <p className="wl__p">{T.intro}</p>
              <p className="wl__go"><button type="button" className="ap-btn ap-btn--red" autoFocus onClick={next}>{left.length && left.length < STEPS.length ? T.resume : T.start}<Icon name="arrowRight" size={15} /></button><button type="button" className="bl-link" onClick={close}>{T.later}</button></p>
            </>}
            {step && <>
              <p className="wl__n"><span className="n">{at + 1}</span><Icon name="arrowRight" size={13} /></p>
              <h1 className="wl__h">{title(step)}</h1>
              {sub(step) && <p className="wl__p">{sub(step)}</p>}
              {body[step]}
              {err && <p className="lg__err" role="alert">{err}</p>}
            </>}
            {at === STEPS.length && <>
              <span className="wl__av wl__av--ok"><Icon name="check" size={24} /></span>
              <h1 className="wl__h">{T.done.t(first)}</h1>
              <p className="wl__p">{T.done.sub}</p>
              {summary.length > 0 && <dl className="wl__sum">{summary.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
              <p className="wl__go"><button type="button" className="ap-btn ap-btn--red" autoFocus onClick={() => { setOpen(false); setNewOpen(true) }}><Icon name="plus" size={15} />{T.done.first}</button><button type="button" className="bl-link" onClick={() => { setOpen(false); go('overview') }}>{T.done.dash}</button></p>
            </>}
          </motion.section>
        </AnimatePresence>
      </main>
      {step && (
        <footer className="wl__foot">
          <button type="button" disabled={busy} onClick={() => move(at - 1)} aria-label={T.back}><Icon name="arrowUp" size={15} /></button>
          <button type="button" disabled={busy || uploading > 0 || !optional} onClick={next} aria-label={T.skip}><Icon name="arrowDown" size={15} /></button>
          {optional && <button type="button" className="wl__skip" disabled={busy || uploading > 0} onClick={next}>{T.skip}</button>}
        </footer>
      )}
    </div>
  )
}
