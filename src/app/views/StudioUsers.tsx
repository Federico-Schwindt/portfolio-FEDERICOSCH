import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { rel } from '../i18n'
import { usersText } from '../i18n-users'
import { PLANS, type AdminUser, type PlanId } from '../types'
import '../../styles/app-users.css'

const PLAN_IDS = Object.keys(PLANS) as PlanId[]
/** a readable random password: four groups, no look-alike characters */
const makePassword = () => {
  const a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint32Array(16))
  return Array.from(r, (n) => a[n % a.length]).join('').replace(/(.{4})(?!$)/g, '$1-')
}
type Filter = 'all' | 'client' | 'admin' | 'off'

/** Studio → People: create accounts with a username and password, reset passwords, switch accounts off or delete them */
export function StudioUsers() {
  const { lang, be, toast } = useStore()
  const T = usersText[lang]
  const [list, setList] = useState<AdminUser[] | null>(null)
  const [err, setErr] = useState(false)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [open, setOpen] = useState(false)
  const load = useCallback(async () => { setErr(false); try { setList(await be.adminUsers()) } catch { setErr(true) } }, [be])
  useEffect(() => { load() }, [load])

  const shown = useMemo(() => (list ?? []).filter((u) => {
    if (filter === 'off' ? !u.disabled : filter !== 'all' && (u.role !== filter || u.disabled)) return false
    const s = q.trim().toLowerCase()
    return !s || [u.name, u.username, u.email, u.company, u.accountName].some((v) => v?.toLowerCase().includes(s))
  }), [list, q, filter])
  const count = (f: Filter) => (list ?? []).filter((u) => (f === 'all' ? true : f === 'off' ? u.disabled : u.role === f && !u.disabled)).length

  return (
    <section className="su">
      <header className="su__h">
        <div><h2>{T.title}</h2><p className="muted">{T.sub}</p></div>
        <button type="button" className="ap-btn ap-btn--red" onClick={() => setOpen(!open)} aria-expanded={open}><Icon name={open ? 'x' : 'userPlus'} size={15} />{T.add}</button>
      </header>
      {open && <AddPerson onDone={(u) => { setOpen(false); toast(T.created(u)); load() }} onCancel={() => setOpen(false)} />}
      <div className="su__bar">
        <label className="dl__search"><Icon name="magnifyingGlass" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T.search} aria-label={T.search} /></label>
        <div className="dl__filters" role="group">
          {(['all', 'client', 'admin', 'off'] as Filter[]).map((f) => <button key={f} type="button" className={filter === f ? 'is-on' : ''} aria-pressed={filter === f} onClick={() => setFilter(f)}>{f === 'all' ? T.all : f === 'client' ? T.clients : f === 'admin' ? T.studio : T.off}<i className="su__n">{count(f)}</i></button>)}
        </div>
      </div>
      {err ? <p className="lg__err" role="alert">{T.loadError} <button type="button" className="bl-link" onClick={load}>{T.retry}</button></p>
        : list === null ? <div className="bl-skel" aria-busy="true"><i /><i /><i /></div>
        : !shown.length ? <p className="muted su__empty">{T.empty}</p>
        : <ul className="su__list">{shown.map((u) => <Person key={u.id} u={u} onChange={load} />)}</ul>}
    </section>
  )
}

function AddPerson({ onDone, onCancel }: { onDone: (username: string) => void; onCancel: () => void }) {
  const { lang, be } = useStore()
  const T = usersText[lang]
  const [f, setF] = useState({ name: '', username: '', email: '', password: makePassword(), role: 'client' as 'client' | 'admin', company: '', plan: '' as '' | PlanId, lang: lang as 'en' | 'es' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  // suggest a username from the name until the field is edited by hand
  const [touched, setTouched] = useState(false)
  const suggest = (n: string) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '').slice(0, 32)
  const submit = async () => {
    setErr(''); setBusy(true)
    try { await be.createUser({ ...f, email: f.email.trim() || undefined, plan: f.role === 'client' && f.plan ? f.plan : undefined }); onDone(f.username) } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  const field = (k: 'name' | 'username' | 'email' | 'company', label: string, extra: { hint?: string; type?: string; auto?: string } = {}) => (
    <label className="pf__f"><span>{label}</span>
      <input type={extra.type ?? 'text'} value={f[k]} autoComplete={extra.auto ?? 'off'} onChange={(e) => {
        const v = e.target.value
        if (k === 'name' && !touched) setF({ ...f, name: v, username: suggest(v) })
        else { if (k === 'username') setTouched(true); setF({ ...f, [k]: v }) }
      }} />
      {extra.hint && <small className="muted">{extra.hint}</small>}</label>
  )
  return (
    <form className="card su__add" onSubmit={(e) => { e.preventDefault(); submit() }}>
      <div className="pf__form">
        {field('name', T.name, { auto: 'off' })}
        {field('username', T.username, { hint: T.usernameHint })}
        <label className="pf__f"><span>{T.password}</span>
          <span className="su__pw"><input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" spellCheck={false} />
            <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setF({ ...f, password: makePassword() })}>{T.generate}</button>
            <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={async () => { await navigator.clipboard?.writeText(`${f.username}\n${f.password}`).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500) }}><Icon name={copied ? 'check' : 'copy'} size={13} />{copied ? T.copied : T.copy}</button></span>
        </label>
        {field('email', T.email, { type: 'email', hint: T.emailHint })}
        <label className="pf__f"><span>{T.role}</span><select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as 'client' | 'admin' })}><option value="client">{T.client}</option><option value="admin">{T.admin}</option></select></label>
        {field('company', T.company)}
        {f.role === 'client' && <label className="pf__f"><span>{T.plan}</span><select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value as '' | PlanId })}><option value="">{T.noPlan}</option>{PLAN_IDS.map((p) => <option key={p} value={p}>{t.cap(PLANS[p].slots)}</option>)}</select></label>}
        <label className="pf__f"><span>{T.lang}</span><select value={f.lang} onChange={(e) => setF({ ...f, lang: e.target.value as 'en' | 'es' })}><option value="es">Español</option><option value="en">English</option></select></label>
        {err && <p className="lg__err pf__f--wide" role="alert">{err}</p>}
        <div className="pf__f--wide su__acts">
          <button type="submit" className="ap-btn ap-btn--red" disabled={busy || f.name.trim().length < 2 || f.username.length < 3 || f.password.length < 8}>{T.create}</button>
          <button type="button" className="bl-link" onClick={onCancel}>{T.cancel}</button>
        </div>
      </div>
    </form>
  )
}

function Person({ u, onChange }: { u: AdminUser; onChange: () => void }) {
  const { lang, be, toast } = useStore()
  const T = usersText[lang]
  const [pw, setPw] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const act = async (fn: () => Promise<void>, ok: string) => { setErr(''); try { await fn(); toast(ok); onChange() } catch (e) { setErr((e as Error).message) } }
  const who = u.name || u.username || u.email || '—'
  return (
    <li className={`su__p${u.disabled ? ' is-off' : ''}`}>
      <span className="su__av">{who[0]?.toUpperCase()}</span>
      <span className="su__who"><b>{who}{u.me && <em> · {T.you}</em>}</b><small>{[u.company, u.accountName ? T.member(u.accountName) : ''].filter(Boolean).join(' · ') || ' '}</small></span>
      <span className="su__login"><b>{u.username ? '@' + u.username : '—'}</b><small>{u.email ?? ''}</small></span>
      <span className="su__role"><span className={`pill${u.role === 'admin' ? ' pill--review' : ''}`}>{u.disabled ? T.off : u.role === 'admin' ? T.studio : T.client}</span></span>
      <span className="su__plan">{u.plan ? <>{PLANS[u.plan as PlanId] ? t.cap(PLANS[u.plan as PlanId].slots) : u.plan}<small>{t.billing.status[u.status ?? ''] ?? u.status}</small></> : <small className="muted">—</small>}</span>
      <span className="su__last"><small>{T.cols.last}</small>{u.lastSeen ? rel(u.lastSeen, lang) : T.never}</span>
      <span className="su__acts">
        <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setPw(pw === null ? makePassword() : null)}>{T.reset}</button>
        {!u.me && <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => act(() => be.updateUser(u.id, { disabled: !u.disabled }), u.disabled ? T.enabled : T.disabled)}>{u.disabled ? T.enable : T.disable}</button>}
        {!u.me && <button type="button" className="bl-link su__del" onClick={() => { if (confirm(T.removeAsk(who))) act(() => be.deleteUser(u.id), T.removed) }}>{T.remove}</button>}
      </span>
      {pw !== null && (
        <form className="su__reset" onSubmit={(e) => { e.preventDefault(); act(async () => { await be.updateUser(u.id, { password: pw }); setPw(null) }, T.saved) }}>
          <label className="pf__f"><span>{T.resetTitle(who)}</span><input value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" spellCheck={false} autoFocus /><small className="muted">{T.resetHint}</small></label>
          <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => setPw(makePassword())}>{T.generate}</button>
          <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => navigator.clipboard?.writeText(pw).catch(() => {})}><Icon name="copy" size={13} />{T.copy}</button>
          <button type="submit" className="ap-btn ap-btn--red ap-btn--sm" disabled={pw.length < 8}>{T.save}</button>
        </form>
      )}
      {err && <p className="lg__err su__err" role="alert">{err}</p>}
    </li>
  )
}
