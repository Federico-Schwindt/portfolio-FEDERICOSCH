/**
 * The client app: one React island. Entry 'app' is the signed-in studio (overview, board, billing, brand kit,
 * studio view for Federico); entry 'checkout' is what opens when a plan is clicked on the site.
 * Routes inside the app are hash-based (#/board/7) so it runs on any static host.
 */
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { StoreProvider, useStore } from './store'
import { Icon, type IconName } from './Icon'
import { Mark } from './Mark'
import { Login } from './views/Login'
import { Overview } from './views/Overview'
import { Board } from './views/Board'
import { Billing } from './views/Billing'
import { BrandKit } from './views/BrandKit'
import { Checkout } from './views/Checkout'
import { Admin } from './views/Admin'
import { Files } from './views/Files'
import { Reports } from './views/Reports'
import { Team } from './views/Team'
import { Profile } from './views/Profile'
import { Calendar } from './views/Calendar'
import { Deliveries } from './views/Deliveries'
import { Activity } from './views/Activity'
import { Updates, Help } from './ui/Updates'
import { Drawer } from './ui/Drawer'
import { NewRequest } from './ui/NewRequest'
import { Palette } from './ui/Palette'
import { Welcome } from './ui/Welcome'
import { PLANS, runningSlots } from './types'
import { demoToggleAdmin } from './backend/demo'

export default function App({ lang, base, entry }: { lang: 'en' | 'es'; base: string; entry: 'app' | 'checkout' }) {
  return (
    <StoreProvider lang={lang} base={base}>
      {entry === 'checkout' ? <Checkout /> : <Studio />}
      <Toasts />
    </StoreProvider>
  )
}

function Studio() {
  const s = useStore()
  if (!s.ready) return <div className="ap-boot" aria-busy="true"><span className="ap-boot__dot" /></div>
  const refreshError = <div className="card sync-error" role="alert"><span>{s.user ? s.t.requestPage.syncError : s.t.requestPage.loadError}</span> <button type="button" className="ap-btn ap-btn--sm" onClick={s.reload}>{s.t.priorities.retry}</button></div>
  if (!s.user) return s.loadFailed ? refreshError : <Login />
  const [view, id] = s.route.split('/')
  return (
    <div className="ap" key={[s.user.id, s.user.account, s.user.role].join('/')}>
      <Side />
      <main className="ap-main">
        <Topbar />
        {s.loadFailed && refreshError}
        {s.be.mode === 'demo' && <p className="ap-demo mono"><Icon name="lightning" size={13} /> {s.t.demo}</p>}
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}>
            {view === 'request' ? <Drawer key={id} id={id} page /> : view === 'board' ? <Board /> : view === 'admin' ? <Admin /> : view === 'files' ? <Files /> : view === 'reports' ? <Reports /> : view === 'brand' ? <BrandKit /> : view === 'team' ? <Team /> : view === 'profile' ? <Profile /> : view === 'calendar' ? <Calendar /> : view === 'deliveries' ? <Deliveries /> : view === 'activity' ? <Activity /> : <Overview />}
          </motion.div>
        </AnimatePresence>
      </main>
      <Drawer key={id} id={['board', 'admin', 'overview', 'calendar', 'deliveries', 'activity'].includes(view) ? id : null} />
      <NewRequest />
      <Palette />
      <Help />
      {view !== 'request' && <Welcome />}
    </div>
  )
}

function Side() {
  const { t, route, go, user, sub, reqs, be, setNewOpen, setPalette, base, lang, reload, setHelp } = useStore()
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 900px)').matches)
  const sheet = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const media = matchMedia('(max-width: 900px)')
    const sync = () => setCompact(media.matches)
    media.addEventListener('change', sync)
    sync()
    return () => media.removeEventListener('change', sync)
  }, [])
  useEffect(() => { sheet.current?.close() }, [route])
  const view = route.split('/')[0]
  useEffect(() => { if (compact) window.scrollTo(0, 0) }, [compact, view])
  type Destination = [string, IconName, string]
  const home: Destination = ['overview', 'house', t.nav.overview]
  const board: Destination = ['board', 'kanban', t.nav.board]
  const files: Destination = ['files', 'file', t.x.nav.files]
  const more: Destination[] = [['reports', 'chartBar', t.x.nav.reports], ['brand', 'palette', t.nav.brand]]
  if (user?.role !== 'admin') more.push(['team', 'users', t.x.team.nav])
  if (user?.role === 'admin') more.push(['admin', 'userGear', t.nav.admin])
  const extra: Destination[] = [['calendar', 'calendar', t.sec.calendar], ['deliveries', 'package', t.sec.deliveries], ['activity', 'pulse', t.sec.activity]]
  const reviews = reqs.filter((r) => r.status === 'review').length
  const destination = ([key, icon, label]: Destination) => (
    <button key={key} type="button" className={view === key ? 'is-on' : ''} aria-current={view === key ? 'page' : undefined} onClick={() => { sheet.current?.close(); go(key) }}>
      <Icon name={icon} size={compact ? 20 : 17} /><span>{label}</span>
      {key === 'board' && reviews > 0 && <i className="ap-badge">{reviews}</i>}
    </button>
  )
  const plan = sub ? PLANS[sub.plan] : null
  const slots = runningSlots(sub)
  const active = reqs.filter((r) => r.owner === (user?.account ?? user?.id) && r.status === 'active').length
  const logo = <a className="ap-logo" href={base + (lang === 'es' ? 'es/' : '')}><Mark size={26} label={t.brand} /><span className="mono">{t.studio}</span></a>
  const search = <button className="ap-search" type="button" onClick={() => { sheet.current?.close(); setPalette(true) }}><Icon name="magnifyingGlass" size={15} /><span>{t.palette}</span><kbd className="mono">{t.kbd}</kbd></button>
  const account = (
    <>
      {plan && slots > 0 && (
        <div className="ap-plan">
          <p className="mono">{t.cap(slots)}</p>
          {slots > 0 && <><div className="ap-plan__slots">{Array.from({ length: slots }, (_, i) => <i key={i} className={i < active ? 'is-on' : ''} />)}</div>
          <p>{t.slots(active, slots)}</p></>}
        </div>
      )}
      <button type="button" className={`ap-me${view === 'profile' ? ' is-on' : ''}`} onClick={() => { sheet.current?.close(); go('profile') }} aria-label={t.sec.profile}>
        <span className="ap-av">{user!.avatar ? <img src={user!.avatar} alt="" /> : (user!.name || user!.email)[0].toUpperCase()}</span>
        <span className="ap-me__t"><b>{user!.name || user!.email}</b><small>{user!.member ? user!.accountName : user!.email}</small></span>
      </button>
      <div className="ap-side__foot">
        {be.mode === 'demo' && <button type="button" className="mono" onClick={() => { demoToggleAdmin(); reload() }}>{user!.role === 'admin' ? t.nav.client : t.nav.admin} (demo)</button>}
        <button type="button" className="mono" onClick={() => { sheet.current?.close(); setHelp(true) }}>? {t.x.keys.title}</button>
        <a className="mono" href={base + (lang === 'es' ? 'es/' : '')}><Icon name="arrowLeft" size={13} /> {t.nav.site}</a>
        <button type="button" className="mono" onClick={async () => { await be.signOut(); location.reload() }}><Icon name="signOut" size={13} /> {t.nav.out}</button>
      </div>
    </>
  )
  if (compact) return (
    <aside className="ap-side">
      {logo}
      <Updates key={route} />
      <nav className="ap-dock" aria-label={t.nav.menu}>
        {destination(home)}
        {destination(board)}
        <button type="button" className="ap-dock__new" aria-label={t.newReq} onClick={() => setNewOpen(true)}><Icon name="plus" size={20} /><span>{t.nav.create}</span></button>
        {destination(files)}
        <button type="button" className={[...extra, ...more].some(([key]) => view === key) || view === 'profile' ? 'is-on' : ''} aria-haspopup="dialog" onClick={() => sheet.current?.showModal()}><Icon name="circlesFour" size={20} /><span>{t.nav.more}</span></button>
      </nav>
      <dialog className="ap-sheet" ref={sheet} aria-labelledby="ap-sheet-title"
        onClick={(e) => { if (e.target === e.currentTarget) sheet.current?.close() }}
        onKeyDown={(e) => {
          // Release the modal focus trap before the global shortcut opens another dialog.
          const modified = e.ctrlKey || e.metaKey
          if ((modified && e.key.toLowerCase() === 'k') || (!modified && !e.altKey && (e.key === 'n' || e.key === '?'))) sheet.current?.close()
        }}>
        <div className="ap-sheet__body">
          <div className="ap-sheet__head"><h2 id="ap-sheet-title">{t.nav.more}</h2><button type="button" autoFocus aria-label={t.nav.close} onClick={() => sheet.current?.close()}><Icon name="x" /></button></div>
          {search}
          <nav className="ap-nav" aria-label={t.nav.more}>{[...extra, ...more].map(destination)}</nav>
          {account}
        </div>
      </dialog>
    </aside>
  )
  const work: Destination[] = [home, board, extra[0], extra[1], files, extra[2]]
  const account_ = more.filter(([k]) => k !== 'admin')
  return (
    <aside className="ap-side">
      {logo}
      <nav className="ap-nav" aria-label={t.nav.menu}>
        <p className="ap-nav__h">{t.nav.workspace}</p>
        {work.map(destination)}
        <p className="ap-nav__h">{t.nav.account}</p>
        {account_.map(destination)}
        {user?.role === 'admin' && <><p className="ap-nav__h">{t.nav.studioH}</p>{destination(['admin', 'userGear', t.nav.admin])}</>}
      </nav>
      {account}
    </aside>
  )
}

/** desktop: where you are, search, updates and the main action, always in reach */
function Topbar() {
  const { t, route, setPalette, setNewOpen, user } = useStore()
  // phones have their own top row and dock; rendering this too would duplicate Updates
  const [compact, setCompact] = useState(() => matchMedia('(max-width: 900px)').matches)
  useEffect(() => { const m = matchMedia('(max-width: 900px)'); const f = () => setCompact(m.matches); m.addEventListener('change', f); return () => m.removeEventListener('change', f) }, [])
  const view = route.split('/')[0] || 'overview'
  const names: Record<string, string> = { overview: t.nav.overview, board: t.nav.board, files: t.x.nav.files, reports: t.x.nav.reports, billing: t.nav.billing, brand: t.nav.brand, team: t.x.team.nav, admin: t.nav.admin, profile: t.sec.profile, calendar: t.sec.calendar, deliveries: t.sec.deliveries, activity: t.sec.activity }
  if (compact) return null
  return (
    <div className="ap-top">
      <p className="ap-top__crumb"><span>{user?.accountName || user?.company || t.studio}</span><Icon name="caretRight" size={11} /><b>{view === 'request' ? t.requestPage.title : names[view] ?? t.nav.overview}</b></p>
      <button className="ap-top__search" type="button" onClick={() => setPalette(true)}><Icon name="magnifyingGlass" size={15} /><span>{t.palette}</span><kbd className="mono">{t.kbd}</kbd></button>
      <Updates />
      <button className="ap-btn ap-btn--red ap-btn--sm ap-top__new" type="button" onClick={() => setNewOpen(true)}><Icon name="plus" size={15} />{t.newReq}</button>
    </div>
  )
}

function Toasts() {
  const { toasts } = useStore()
  useEffect(() => {}, [toasts])
  return (
    <div className="ap-toasts" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((x) => (
          <motion.p key={x.id} className="ap-toast" initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }}><Icon name="check" size={15} />{x.text}</motion.p>
        ))}
      </AnimatePresence>
    </div>
  )
}
