import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { rel } from '../i18n'
import type { TeamView } from '../types'

/** the client's team: the owner invites teammates by link; everyone on the account sees the same requests and files */
export function Team() {
  const { t, be, user, lang, toast } = useStore()
  const T = t.x.team
  const owner = !user?.member
  const [data, setData] = useState<TeamView | null>(null)
  const [email, setEmail] = useState('')
  const [link, setLink] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => { try { setData(await be.team()) } catch (e) { setErr((e as Error).message) } }, [be])
  useEffect(() => { load() }, [load])

  const invite = async () => {
    setErr(''); setBusy(true)
    try { const r = await be.invite(email.trim()); setLink(r.link); setEmail(''); await load() } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); toast(T.copied) } catch { /* the field stays selectable */ } }
  const mail = (to: string, l: string) => `mailto:${to}?subject=${encodeURIComponent(T.mailSubject(user?.accountName || ''))}&body=${encodeURIComponent(T.mailBody(l))}`

  return (
    <div className="tm">
      <header className="ap-head"><div><p className="mono ap-kicker">{user?.accountName || t.studio}</p><h1 className="d">{T.title}</h1><p className="muted">{T.sub}</p></div></header>
      <div className="tm__grid">
        {owner && (
          <section className="card tm__invite">
            <p className="mono">{T.inviteTitle}</p>
            <form className="tm__form" onSubmit={(e) => { e.preventDefault(); invite() }}>
              <input type="email" required placeholder={T.emailPh} value={email} onChange={(e) => setEmail(e.target.value)} aria-label={T.emailPh} />
              <button className="ap-btn ap-btn--red" type="submit" disabled={busy}><Icon name="userPlus" size={15} />{T.send}</button>
            </form>
            {err && <p className="lg__err" role="alert">{err}</p>}
            <AnimatePresence>
              {link && (
                <motion.div className="tm__link" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <p>{T.linkReady}</p>
                  <div className="tm__row"><input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label={T.linkLabel} />
                    <button type="button" className="ap-btn ap-btn--sm" onClick={() => copy(link)}><Icon name="copy" size={14} />{T.copy}</button></div>
                </motion.div>
              )}
            </AnimatePresence>
            <ul className="tm__rules muted">{T.rules.map((r) => <li key={r}><Icon name="check" size={13} />{r}</li>)}</ul>
          </section>
        )}
        <section className="card tm__people">
          <p className="mono">{T.people} · {data?.members.length ?? '…'}</p>
          <ul className="tm__list">
            {data?.members.map((m) => (
              <li key={m.id}>
                <span className="ap-av">{(m.name || m.email)[0].toUpperCase()}</span>
                <span className="tm__who"><b>{m.name || m.email}{m.id === user?.id && <em className="mono"> · {T.you}</em>}</b><small>{m.email}</small></span>
                <span className="mono tm__role">{m.owner ? T.owner : T.member}</span>
                {!m.owner && (owner || m.id === user?.id) && (
                  <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={async () => {
                    if (!confirm(m.id === user?.id ? T.leaveAsk : T.removeAsk(m.name || m.email))) return
                    await be.removeMember(m.id)
                    if (m.id === user?.id) location.reload(); else { toast(T.removed); load() }
                  }}><Icon name="userMinus" size={14} />{m.id === user?.id ? T.leave : T.remove}</button>
                )}
              </li>
            ))}
          </ul>
          {owner && !!data?.invites.length && (
            <>
              <p className="mono tm__sub">{T.pending}</p>
              <ul className="tm__list">
                {data.invites.map((i) => (
                  <li key={i.id}>
                    <span className="ap-av ap-av--ghost"><Icon name="envelopeSimple" size={14} /></span>
                    <span className="tm__who"><b>{i.email}</b><small>{T.sent} {rel(i.at, lang)}</small></span>
                    {link && <a className="ap-btn ap-btn--ghost ap-btn--sm" href={mail(i.email, link)}>{T.email}</a>}
                    <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={async () => { await be.revokeInvite(i.id); toast(T.revoked); load() }}>{T.revoke}</button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {!owner && <p className="muted tm__note">{T.memberNote(user?.accountName || '')}</p>}
        </section>
      </div>
    </div>
  )
}
