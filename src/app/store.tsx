import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getBackend } from './backend'
import { dict, type T } from './i18n'
import type { Backend, Ev, FileItem, Invoice, Pin, PlanChange, Recurring, Req, Subscription, User } from './types'

type Toast = { id: number; text: string }
type Store = {
  be: Backend; t: T; lang: 'en' | 'es'; base: string
  user: User | null; sub: Subscription | null; reqs: Req[]; events: Ev[]; invoices: Invoice[]; files: FileItem[]; pins: Pin[]; recurring: Recurring[]; lastSeen: string | null; ready: boolean
  help: boolean; setHelp: (v: boolean) => void
  reload: () => Promise<void>
  loadFailed: boolean
  studioRevision: string | null
  changes: PlanChange[]
  toast: (text: string) => void; toasts: Toast[]
  route: string; go: (r: string) => void
  newOpen: boolean; setNewOpen: (v: boolean) => void
  palette: boolean; setPalette: (v: boolean) => void
}
const Ctx = createContext<Store>(null as unknown as Store)
export const useStore = () => useContext(Ctx)

const readRoute = () => location.hash.replace(/^#\/?/, '') || 'overview'

export function StoreProvider({ lang, base, children }: { lang: 'en' | 'es'; base: string; children: ReactNode }) {
  const [be, setBe] = useState<Backend | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [recurring, setRecurring] = useState<Recurring[]>([])
  const [changes, setChanges] = useState<PlanChange[]>([])
  const [sub, setSub] = useState<Subscription | null>(null)
  const [reqs, setReqs] = useState<Req[]>([])
  const [events, setEvents] = useState<Ev[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [pins, setPins] = useState<Pin[]>([])
  const [lastSeen, setLastSeen] = useState<string | null>(null)
  const [help, setHelp] = useState(false)
  const [ready, setReady] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [studioRevision, setStudioRevision] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [route, setRoute] = useState(readRoute)
  const [newOpen, setNewOpen] = useState(false)
  const [palette, setPalette] = useState(false)
  const refreshing = useRef<Promise<void> | null>(null)
  const pendingRefresh = useRef(false)
  const goNext = useRef(false)

  useEffect(() => { getBackend().then(setBe) }, [])
  const reload = useCallback(async () => {
    if (!be) return
    if (refreshing.current) {
      pendingRefresh.current = true
      return refreshing.current
    }
    // A poll may already have read the old snapshot when a save requests its refresh.
    refreshing.current = (async () => {
      try {
        do {
          pendingRefresh.current = false
          try {
            const u = await be.session()
            if (u) {
              const [s, r, e, i, f, pp, repeats, plans] = await Promise.all([be.subscription(), be.requests(u.role === 'admin'), be.events(), be.invoices(), be.files(), be.pins(), be.recurring(), be.changes()])
              setChanges(plans)
              setRecurring(repeats)
              setSub(s); setReqs(r); setEvents(e); setInvoices(i); setFiles(f); setPins(pp); setLastSeen(be.lastSeen())
            }
            setUser(u)
            setStudioRevision(be.studioRevision?.() ?? null)
            setLoadFailed(false)
          } catch { setLoadFailed(true) }
        } while (pendingRefresh.current)
      } finally { refreshing.current = null; setReady(true) }
    })()
    return refreshing.current
  }, [be])
  useEffect(() => {
    if (!be) return
    reload()
    return be.listen(() => { if (be.mode === 'demo' || !refreshing.current) reload() })
  }, [be, reload])
  useEffect(() => { const f = () => setRoute(readRoute()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  // Ctrl/Cmd K opens the command palette, N opens a new request
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((v) => !v) }
      else if (!(e.target as HTMLElement).closest('input, textarea, select, [contenteditable]') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (goNext.current) { goNext.current = false; const to = ({ o: 'overview', b: 'board', f: 'files', r: 'reports', p: 'billing', k: 'brand' } as Record<string, string>)[e.key]; if (to) location.hash = '/' + to }
        else if (e.key === 'n') setNewOpen(true)
        else if (e.key === '?') setHelp(true)
        else if (e.key === 'g') goNext.current = true
      }
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [])

  const toast = useCallback((text: string) => {
    const id = Date.now()
    setToasts((t) => [...t, { id, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])
  const go = useCallback((r: string) => { location.hash = '/' + r }, [])
  const value = useMemo(() => be && ({ be, t: dict[lang], lang, base, user, sub, reqs, events, invoices, files, pins, recurring, changes, lastSeen, ready, loadFailed, studioRevision, reload, toast, toasts, route, go, newOpen, setNewOpen, palette, setPalette, help, setHelp }), [be, lang, base, user, sub, reqs, events, invoices, files, pins, recurring, changes, lastSeen, ready, loadFailed, studioRevision, reload, toast, toasts, route, go, newOpen, palette, help])
  if (!value) return <div className="ap-boot" aria-busy="true" />
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
