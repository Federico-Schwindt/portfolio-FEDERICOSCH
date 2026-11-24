import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { runningSlots, type CheckItem, type Kind } from '../types'
import { FIELDS, compose, missing } from './briefFields'
import { KIND_ICON, positionFor } from './bits'
import { TEMPLATES } from './templates'

const KINDS: Kind[] = ['page', 'design', 'copy', 'campaign', 'fix', 'social', 'automation', 'other']

/**
 * Turns a loose brief into steps. Runs in the browser: lines and sentences become checklist items, the template
 * labels become checks of their own, and every kind gets the closing steps it always needs. In the live product
 * this is where a model can be called from an edge function; the shape of the result stays the same.
 */
function structure(kind: Kind, brief: string, lang: 'en' | 'es'): CheckItem[] {
  const parts = brief.split(/\n|(?<=[.!?])\s+/).map((s) => s.replace(/^[-*•\d.)\s]+/, '').trim()).filter((s) => s.length > 3)
  // only the first "label: " splits, so URLs (https://…) and times stay whole; empty template labels are dropped
  const items = parts.filter((s) => !/:\s*$/.test(s))
  const tail: Record<Kind, [string, string][]> = {
    page: [['Mobile and desktop layouts', 'Diseño para celular y escritorio'], ['Speed and SEO check', 'Revisión de velocidad y SEO']],
    design: [['Export in every size', 'Exportar en todos los tamaños']], copy: [['Proofread in context', 'Revisión en contexto']],
    campaign: [['Tracking and conversions set up', 'Seguimiento y conversiones configurados']], fix: [['Test on the device where it failed', 'Probar en el dispositivo donde fallaba']],
    social: [['Captions and hashtags', 'Textos y hashtags']], automation: [['Test with real data', 'Probar con datos reales']], other: [],
  }
  return [...items.slice(0, 8), ...tail[kind].map(([e, s]) => (lang === 'es' ? s : e))].map((text) => ({ text, done: false }))
}

export function NewRequest() {
  const { t, lang, newOpen, setNewOpen, be, toast, reqs, sub, user, go, reload } = useStore()
  const [kind, setKind] = useState<Kind>('page')
  const [title, setTitle] = useState('')
  const [brief, setBrief] = useState('') // free notes; the answers below are composed in front of them
  const [vals, setVals] = useState<Record<string, string>>({})
  const [tried, setTried] = useState(false)
  const [check, setCheck] = useState<CheckItem[]>([])
  const [priority, setPriority] = useState<1 | 2 | 3>(2)
  const [due, setDue] = useState('')
  const [every, setEvery] = useState<'' | 'week' | 'month'>('')
  const [tpl, setTpl] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [thinking, setThinking] = useState(false)
  const [sending, setSending] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (newOpen) { setTimeout(() => titleRef.current?.focus(), 120) } else { setTitle(''); setBrief(''); setVals({}); setTried(false); setCheck([]); setFiles([]); setPriority(2); setKind('page'); setDue(''); setEvery(''); setTpl('') } }, [newOpen])
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setNewOpen(false) }; if (newOpen) addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [newOpen, setNewOpen])

  const slots = runningSlots(sub)
  const mine = reqs.filter((r) => r.owner === (user?.account ?? user?.id))
  const running = mine.filter((r) => r.status === 'active').length
  const position = positionFor(priority)
  const ahead = mine.filter((r) => r.status === 'queued' && r.position <= position).length
  const startsNow = running + ahead < slots

  const ai = () => {
    setThinking(true)
    setTimeout(() => { setCheck(structure(kind, compose(kind, vals, brief, lang) || title, lang)); setThinking(false) }, 400)
  }
  const submit = async () => {
    setTried(true)
    if (title.trim().length < 3) { titleRef.current?.focus(); return }
    if (missing(kind, vals).length) { (document.querySelector('.nr [data-missing]') as HTMLElement | null)?.focus(); return }
    setSending(true)
    try {
      const full = compose(kind, vals, brief, lang)
      const r = await be.create({ title: title.trim(), kind, brief: full, checklist: check, priority, files, dueDate: due || null })
      if (every) await be.addRecurring({ title: title.trim(), kind, brief: full, checklist: check, priority, every })
      toast(every ? t.tpl.repeatToast(every === 'week' ? t.tpl.weekly : t.tpl.monthly) : t.toastNew)
      await reload()
      setNewOpen(false)
      go(`board/${r.id}`)
    } finally { setSending(false) }
  }

  return (
    <AnimatePresence>
      {newOpen && (
        <motion.div className="nr__veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e) => { if (e.target === e.currentTarget) setNewOpen(false) }}>
          <motion.form className="nr" role="dialog" aria-modal="true" aria-label={t.newReq} initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.98 }} transition={{ type: 'spring', damping: 30, stiffness: 340 }} onSubmit={(e) => { e.preventDefault(); submit() }}>
            <header className="nr__h"><h2 className="d">{t.newReq}</h2><button type="button" className="dr__x" onClick={() => setNewOpen(false)} aria-label="Close"><Icon name="x" size={18} /></button></header>
            <div className="nr__body">
              <div className="nr__tpl">
                <span className="nr__tpl-h">{t.tpl.start}</span>
                <div className="nr__tpl-list">
                  {TEMPLATES.map((x) => { const [ti, br] = lang === 'es' ? x.es : x.en; return (
                    <button key={x.id} type="button" className={tpl === x.id ? 'is-on' : ''} aria-pressed={tpl === x.id} onClick={() => { setTpl(x.id); setKind(x.kind); setTitle(ti); setBrief(br); setVals({}); setTried(false); setCheck([]); if (x.every) setEvery(x.every) }}>
                      <Icon name={KIND_ICON[x.kind]} size={14} />{ti}{x.every && <i>{x.every === 'week' ? t.tpl.weekly : t.tpl.monthly}</i>}
                    </button>) })}
                </div>
              </div>
              <fieldset className="nr__kinds">
                <legend className="mono">{t.form.kind}</legend>
                {KINDS.map((k) => (
                  <button key={k} type="button" className={kind === k ? 'is-on' : ''} onClick={() => { setKind(k); setTried(false) }} aria-pressed={kind === k}>
                    <Icon name={KIND_ICON[k]} size={18} /><b>{t.kinds[k]}</b><small>{t.kindHelp[k]}</small>
                  </button>
                ))}
              </fieldset>
              <label className="nr__f"><span className="mono">{t.form.title}</span><input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.form.titlePh} maxLength={140} required /></label>
              {FIELDS[kind].length > 0 && (
                <div className="nr__qs">
                  {FIELDS[kind].map((f) => {
                    const label = lang === 'es' ? f.es : f.en, v = vals[f.key] ?? '', set = (x: string) => setVals({ ...vals, [f.key]: x })
                    const bad = tried && f.req && !v.trim()
                    return (
                      <div key={kind + f.key} className={`nr__q${bad ? ' is-bad' : ''}${f.type === 'area' ? ' nr__q--wide' : ''}`}>
                        <span className="mono">{label}{f.req && <i aria-hidden="true"> *</i>}</span>
                        {f.type === 'chips' ? (
                          <div className="nr__chips" role="radiogroup" aria-label={label} data-missing={bad || undefined} tabIndex={bad ? -1 : undefined}>
                            {f.options!.map(([en, es]) => { const o = lang === 'es' ? es : en; return <button key={en} type="button" role="radio" aria-checked={v === o} className={v === o ? 'is-on' : ''} onClick={() => set(v === o ? '' : o)}>{o}</button> })}
                          </div>
                        ) : f.type === 'area' ? (
                          <textarea rows={2} value={v} onChange={(e) => set(e.target.value)} placeholder={f.ph?.[lang === 'es' ? 1 : 0]} aria-label={label} aria-required={f.req} data-missing={bad || undefined} />
                        ) : (
                          <input type={f.type === 'url' ? 'url' : 'text'} inputMode={f.type === 'url' ? 'url' : undefined} value={v} onChange={(e) => set(e.target.value)} placeholder={f.ph?.[lang === 'es' ? 1 : 0]} aria-label={label} aria-required={f.req} data-missing={bad || undefined} />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              <label className="nr__f"><span className="mono">{FIELDS[kind].length ? t.x.brief2.notes : t.form.brief}</span><textarea value={brief} onChange={(e) => setBrief(e.target.value)} placeholder={FIELDS[kind].length ? t.x.brief2.notesPh : t.form.briefPh} rows={FIELDS[kind].length ? 2 : 5} /></label>
              <div className="nr__ai">
                <button type="button" className="ap-btn ap-btn--sm ap-btn--ghost" onClick={ai} disabled={thinking || !(brief.trim() || title.trim() || Object.values(vals).some((x) => x.trim()))}><Icon name="sparkle" size={14} />{thinking ? '…' : check.length ? t.form.aiDone : t.form.ai}</button>
                <AnimatePresence>
                  {check.length > 0 && (
                    <motion.ul className="nr__check" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      {check.map((c, i) => (
                        <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                          <Icon name="check" size={13} /><input value={c.text} onChange={(e) => setCheck(check.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)))} aria-label={`${t.detail.checklist} ${i + 1}`} />
                          <button type="button" onClick={() => setCheck(check.filter((_, k) => k !== i))} aria-label="Remove"><Icon name="x" size={12} /></button>
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
              <label className="nr__drop">
                <input type="file" multiple onChange={(e) => setFiles([...files, ...Array.from(e.target.files ?? [])])} />
                <Icon name="paperclip" size={16} /><span>{files.length ? files.map((f) => f.name).join(', ') : t.form.files}</span>
              </label>
              <div className="nr__pri">
                <span className="mono">{t.form.priority}</span>
                {([1, 2, 3] as const).map((p) => <button key={p} type="button" className={priority === p ? 'is-on' : ''} onClick={() => setPriority(p)} aria-pressed={priority === p}>{t.pri[p]}</button>)}
                <label className="nr__due"><span className="mono">{t.tpl.repeat}</span><select value={every} onChange={(e) => setEvery(e.target.value as '' | 'week' | 'month')}><option value="">{t.tpl.once}</option><option value="week">{t.tpl.weekly}</option><option value="month">{t.tpl.monthly}</option></select></label>
                <label className="nr__due"><span className="mono">{t.x.due}</span><input type="date" value={due} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDue(e.target.value)} /></label>
              </div>
            </div>
            <footer className="nr__f2">
              {tried && missing(kind, vals).length > 0 && <p className="nr__miss" role="alert">{t.x.brief2.missing(missing(kind, vals).map((f) => (lang === 'es' ? f.es : f.en)).join(', '))}</p>}
              <p className={`mono nr__when ${startsNow ? 'is-now' : ''}`}>{startsNow && <span className="live" />}{slots === 0 ? t.queueHold.wait : startsNow ? t.form.starts : t.form.waits(ahead)}</p>
              <button className="ap-btn ap-btn--red" type="submit" disabled={sending}><Icon name="plus" size={15} />{t.form.submit}</button>
            </footer>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
