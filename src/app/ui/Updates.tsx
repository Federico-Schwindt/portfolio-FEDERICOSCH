import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { rel } from '../i18n'

/** updates since the last look: everything the other side did (studio for a client, clients for the studio) */
export function Updates() {
  const { t, lang, events, reqs, lastSeen, user, be, reload, go } = useStore()
  const [open, setOpen] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const outside = (event: Event) => {
      if (event.target instanceof Node && !panel.current?.contains(event.target)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && panel.current?.contains(document.activeElement)) {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('focusin', outside)
      document.removeEventListener('keydown', escape)
    }
  }, [open])
  const other = user?.role === 'admin' ? 'client' : 'studio'
  const since = lastSeen ? new Date(lastSeen).getTime() : 0
  const list = events.filter((e) => (e.who === other || e.who === 'ai' || (e.who === 'system' && e.body === 'active')) && new Date(e.at).getTime() > since).reverse()
  const recent = events.filter((e) => e.who === other || e.who === 'ai').slice(-12).reverse()
  const title = (id: string) => reqs.find((r) => r.id === id)?.title ?? ''
  const show = list.length ? list : recent
  const toggle = async () => { const next = !open; setOpen(next); if (!next && list.length) { await be.markSeen(); reload() } }
  return (
    <div className="up" ref={panel}>
      <button type="button" className="up__btn" ref={trigger} onClick={toggle} aria-expanded={open}>
        <Icon name="chatCircle" size={16} /><span>{t.x.notif.title}</span>{list.length > 0 && <i className="ap-badge">{list.length > 9 ? '9+' : list.length}</i>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="up__panel" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4 }}>
            <div className="up__h"><b>{t.x.notif.title}</b>{list.length > 0 && <button type="button" className="mono" onClick={async () => { await be.markSeen(); reload(); setOpen(false) }}>{t.x.notif.all}</button>}</div>
            {show.length ? (
              <ul>
                {show.map((e) => (
                  <li key={e.id} className={list.includes(e) ? 'is-new' : ''}>
                    <button type="button" onClick={() => { setOpen(false); go(`board/${e.requestId}`) }}>
                      <span className="feed__dot">{e.kind === 'file' ? <Icon name="paperclip" size={12} /> : e.who === 'ai' ? <Icon name="sparkle" size={12} /> : e.who === 'studio' ? 'F' : e.who === 'client' ? 'C' : <Icon name="clock" size={12} />}</span>
                      <span><b>{e.kind === 'status' ? t.evStatus[e.body as keyof typeof t.evStatus] ?? e.body : e.body}</b><small>{title(e.requestId)}</small></span>
                      <small className="mono">{rel(e.at, lang)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="muted up__none">{t.x.notif.none}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** the ? key */
export function Help() {
  const { t, help, setHelp } = useStore()
  return (
    <AnimatePresence>
      {help && (
        <motion.div className="nr__veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setHelp(false)} onKeyDown={(e) => { if (e.key === 'Escape') setHelp(false) }}>
          <motion.div className="card hp" role="dialog" aria-modal="true" aria-label={t.x.keys.title} initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="card__h"><h2>{t.x.keys.title}</h2><button type="button" className="dr__x" onClick={() => setHelp(false)} aria-label="Close" autoFocus><Icon name="x" size={16} /></button></div>
            <dl className="hp__list">{t.x.keys.items.map(([k, v]) => <div key={k}><dt><kbd className="mono">{k}</kbd></dt><dd>{v}</dd></div>)}</dl>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
