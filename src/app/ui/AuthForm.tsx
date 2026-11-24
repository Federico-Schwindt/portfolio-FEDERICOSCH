import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { usersText } from '../i18n-users'

/** create an account or sign in, email and password; shared by the login page and the checkout */
export function AuthForm({ start = 'login', onDone }: { start?: 'signup' | 'login'; onDone?: () => void }) {
  const { t, be, reload, lang } = useStore()
  const U = usersText[lang]
  // accounts are created by the studio: signing up is only possible through a teammate invitation
  const [mode, setMode] = useState<'signup' | 'login'>(start === 'signup' && new URLSearchParams(location.search).has('invite') ? 'signup' : 'login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  // an invitation link (?invite=…) joins the inviter's account after sign-up or sign-in
  const [invite] = useState(() => new URLSearchParams(location.search).get('invite') ?? '')
  const [from, setFrom] = useState('')
  useEffect(() => {
    if (!invite) return
    setMode('signup')
    be.inviteInfo(invite).then((i) => { if (i) { setFrom(i.account); setEmail(i.email) } })
  }, [invite, be])
  const submit = async () => {
    setErr(''); setBusy(true)
    try {
      await be.signIn(mode, email.trim(), pw, name.trim(), invite || undefined)
      if (invite) { const u = new URL(location.href); u.searchParams.delete('invite'); history.replaceState(null, '', u) }
      await reload(); onDone?.()
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <form className="af" onSubmit={(e) => { e.preventDefault(); submit() }}>
      {invite && <p className="af__invite"><b>{from ? t.x.team.joining(from) : t.x.team.joiningAny}</b> {t.x.team.joinHint}</p>}
      {mode === 'signup' && <label><span className="mono">{t.login.name}</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>}
      <label><span className="mono">{mode === 'signup' ? t.login.email : U.login}</span><input type={mode === 'signup' ? 'email' : 'text'} required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete={mode === 'signup' ? 'email' : 'username'} autoCapitalize="none" spellCheck={false} /></label>
      <label><span className="mono">{t.login.password}</span><input type="password" required minLength={be.mode === 'demo' ? 0 : 8} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? t.login.pwHint : ''} /></label>
      {err && <p className="lg__err" role="alert">{err}</p>}
      <button className="ap-btn ap-btn--red" type="submit" disabled={busy}>{be.mode === 'demo' ? t.login.demoGo : mode === 'signup' ? t.login.create : t.login.go} <Icon name="arrowRight" size={15} /></button>
      {invite && <button className="af__swap" type="button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setErr('') }}>{mode === 'signup' ? t.login.toLogin : t.login.toSignup}</button>}
    </form>
  )
}
