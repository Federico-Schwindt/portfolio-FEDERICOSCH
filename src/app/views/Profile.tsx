import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { rel } from '../i18n'
import type { Notify, SessionRow } from '../types'

const NOTIFY: (keyof Notify)[] = ['review', 'comments', 'weekly']
const ZONES = ['America/Argentina/Buenos_Aires', 'America/Mexico_City', 'America/Bogota', 'America/Santiago', 'America/Lima', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Sao_Paulo', 'Europe/Madrid', 'Europe/London', 'Europe/Berlin', 'UTC']

/** a picture becomes a small square JPEG in the browser, so it is light to store and quick to load */
async function square(file: File, size = 256): Promise<string> {
  const img = await createImageBitmap(file)
  const c = document.createElement('canvas'); c.width = c.height = size
  const s = Math.min(img.width, img.height)
  c.getContext('2d')!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
  return c.toDataURL('image/jpeg', 0.86)
}
/** "Chrome on Windows" from a user agent, good enough to recognise a device */
const device = (ua: string) => {
  const b = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  const o = /Windows/.test(ua) ? 'Windows' : /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''
  return o ? `${b} · ${o}` : b
}

export function Profile() {
  const { t, lang, user, be, toast, reload, base, reqs, events, files, invoices, sub } = useStore()
  const P = t.prof
  const u = user!
  const [f, setF] = useState({ name: u.name, jobTitle: u.jobTitle ?? '', company: u.company, phone: u.phone ?? '', timezone: u.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, lang: u.lang ?? lang })
  const [notify, setNotify] = useState<Notify>(u.notify ?? { review: true, comments: true, weekly: true, billing: true })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [pw, setPw] = useState({ cur: '', next: '' })
  const [pwErr, setPwErr] = useState('')
  const [sessions, setSessions] = useState<SessionRow[] | null>(null) // null: still loading
  const [sessErr, setSessErr] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const loadSessions = () => { setSessErr(false); return be.sessions().then(setSessions, () => { setSessions([]); setSessErr(true) }) }
  useEffect(() => { loadSessions() }, [be]) // eslint-disable-line react-hooks/exhaustive-deps
  const zones = ZONES.includes(f.timezone) ? ZONES : [f.timezone, ...ZONES]
  const dirty = f.name !== u.name || f.jobTitle !== (u.jobTitle ?? '') || f.company !== u.company || f.phone !== (u.phone ?? '') || f.timezone !== (u.timezone ?? '') || f.lang !== (u.lang ?? lang)

  const save = async () => {
    setBusy(true); setErr('')
    try {
      await be.updateProfile({ name: f.name.trim(), jobTitle: f.jobTitle.trim(), phone: f.phone.trim(), timezone: f.timezone, lang: f.lang, ...(u.member ? {} : { company: f.company.trim() }) })
      toast(P.saved)
      // the language is part of the address: move there after saving
      if (f.lang !== lang) { location.href = base + (f.lang === 'es' ? 'es/' : '') + 'app/#/profile'; return }
      await reload()
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  const photo = async (x: File | undefined) => {
    if (!x) return
    if (!/^image\/(png|jpeg|webp)$/.test(x.type)) { setErr(P.photoBad); return }
    setErr('')
    try { await be.updateProfile({ avatar: await square(x) }); await reload() } catch (e) { setErr((e as Error).message) }
  }
  const toggle = async (k: keyof Notify) => { const next = { ...notify, [k]: !notify[k] }; setNotify(next); try { await be.updateProfile({ notify: next }) } catch { setNotify(notify) } }
  const changePw = async () => {
    setPwErr('')
    try { await be.changePassword(pw.cur, pw.next); setPw({ cur: '', next: '' }); toast(P.changed); loadSessions() } catch (e) { setPwErr((e as Error).message) }
  }
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), profile: { ...u, avatar: undefined }, plan: sub, requests: reqs, activity: events, files: files.map(({ url: _u, ...x }) => x), invoices }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'studio-data.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  }
  const field = (k: keyof typeof f, label: string, o: { ph?: string; type?: string; disabled?: boolean; auto?: string } = {}) => (
    <label className="pf__f"><span>{label}</span><input type={o.type ?? 'text'} value={f[k]} placeholder={o.ph} disabled={o.disabled} autoComplete={o.auto} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></label>
  )

  return (
    <div className="pf">
      <header className="ap-head"><div><h1 className="d">{t.sec.profile}</h1><p className="ap-lead">{P.sub}</p></div></header>

      <section className="card pf__id">
        <div className="pf__av">
          {u.avatar ? <img src={u.avatar} alt="" /> : <span>{(u.name || u.email)[0].toUpperCase()}</span>}
          <button type="button" onClick={() => file.current?.click()} aria-label={P.photo}><Icon name="camera" size={15} /></button>
          <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { photo(e.target.files?.[0]); e.target.value = '' }} />
        </div>
        <div className="pf__who">
          <h2>{u.name || u.email}</h2>
          <p className="muted">{[u.jobTitle, u.member ? u.accountName : u.company].filter(Boolean).join(' · ') || u.email}</p>
          <p className="pf__chips"><span className="pill">{u.role === 'admin' ? P.studio : u.member ? P.member : P.owner}</span>{u.since && <span className="muted">{P.since(new Date(u.since).toLocaleDateString(lang, { month: 'long', year: 'numeric' }))}</span>}</p>
        </div>
        <div className="pf__ida">
          <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => file.current?.click()}>{P.photo}</button>
          {u.avatar && <button type="button" className="bl-link" onClick={async () => { await be.updateProfile({ avatar: null }); reload() }}>{P.removePhoto}</button>}
        </div>
      </section>

      <div className="pf__grid">
        <section className="card">
          <div className="card__h"><h2>{P.personal}</h2></div>
          <form className="pf__form" onSubmit={(e) => { e.preventDefault(); save() }}>
            {field('name', P.name, { auto: 'name' })}
            {field('jobTitle', P.job, { ph: P.jobPh, auto: 'organization-title' })}
            {field('company', P.company, { disabled: u.member, auto: 'organization' })}
            {field('phone', P.phone, { ph: P.phonePh, type: 'tel', auto: 'tel' })}
            <label className="pf__f pf__f--wide"><span>{P.email}</span><input value={u.email} disabled /><small className="muted">{P.emailHint}</small></label>
            <label className="pf__f"><span>{P.tz}</span><select value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })}>{zones.map((z) => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}</select></label>
            <label className="pf__f"><span>{P.lang}</span><select value={f.lang} onChange={(e) => setF({ ...f, lang: e.target.value as 'en' | 'es' })}><option value="en">English</option><option value="es">Español</option></select></label>
            {err && <p className="lg__err pf__f--wide" role="alert">{err}</p>}
            <div className="pf__f--wide"><button className="ap-btn ap-btn--red" type="submit" disabled={busy || !dirty || f.name.trim().length < 2}>{P.save}</button></div>
          </form>
        </section>

        <div className="pf__col">
          <section className="card">
            <div className="card__h"><h2><Icon name="bell" size={16} />{P.notif}</h2></div>
            <p className="muted pf__hint">{P.notifSub}</p>
            <ul className="pf__sw">
              {NOTIFY.map((k) => (
                <li key={k}><span><b>{P.n[k][0]}</b><small>{P.n[k][1]}</small></span>
                  <button type="button" role="switch" aria-checked={notify[k]} aria-label={P.n[k][0]} className={`sw${notify[k] ? ' is-on' : ''}`} onClick={() => toggle(k)}><i /></button></li>
              ))}
            </ul>
          </section>

          <section className="card">
            <div className="card__h"><h2><Icon name="lock" size={16} />{P.security}</h2></div>
            <form className="pf__form" onSubmit={(e) => { e.preventDefault(); changePw() }}>
              <label className="pf__f"><span>{P.cur}</span><input type="password" autoComplete="current-password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} /></label>
              <label className="pf__f"><span>{P.next}</span><input type="password" autoComplete="new-password" placeholder={P.nextHint} minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
              {pwErr && <p className="lg__err pf__f--wide" role="alert">{pwErr}</p>}
              <div className="pf__f--wide"><button className="ap-btn ap-btn--ghost" type="submit" disabled={!pw.cur || pw.next.length < 8}>{P.change}</button></div>
            </form>
          </section>
        </div>
      </div>

      <div className="pf__grid">
        <section className="card">
          <div className="card__h"><h2>{P.devices}</h2>{sessions && sessions.length > 1 && <button type="button" className="bl-link" onClick={async () => { await be.closeSession('others'); toast(P.closed); loadSessions() }}>{P.closeOthers}</button>}</div>
          <ul className="pf__dev">
            {(sessions ?? []).map((s) => (
              <li key={s.id}><span className="pf__devic"><Icon name="browser" size={16} /></span>
                <span><b>{device(s.agent)}{s.current && <em>{P.thisDevice}</em>}</b><small>{P.signedIn} {rel(s.at, lang)}</small></span>
                {!s.current && <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={async () => { await be.closeSession(s.id); toast(P.closed); loadSessions() }}>{P.close}</button>}</li>
            ))}
          </ul>
          {sessions === null ? <div className="bl-skel" aria-busy="true" aria-label={P.devLoading}><i /><i /></div>
            : sessErr ? <p className="lg__err" role="alert">{P.devError} <button type="button" className="bl-link" onClick={loadSessions}>{P.retry}</button></p>
            : sessions.length <= 1 && <p className="muted pf__hint">{P.onlyThis}</p>}
        </section>
        <section className="card pf__data">
          <div className="card__h"><h2>{P.data}</h2></div>
          <p className="muted pf__hint">{P.dataSub}</p>
          <button type="button" className="ap-btn ap-btn--ghost" onClick={exportData}><Icon name="download" size={15} />{P.export}</button>
        </section>
      </div>
    </div>
  )
}
