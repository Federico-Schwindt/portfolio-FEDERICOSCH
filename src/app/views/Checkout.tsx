import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { money } from '../i18n'
import { COMMUNITY, PLANS, type PlanId } from '../types'
import { demoPaid } from '../backend/demo'
import { AuthForm } from '../ui/AuthForm'

/** what opens when a plan is clicked: configure, sign in, pay the build, land on the board */
export function Checkout() {
  const { t, lang, be, user, base, reload } = useStore()
  const q = new URLSearchParams(location.search)
  const [plan, setPlan] = useState<PlanId>((['launch', 'grow', 'scale'].includes(q.get('plan') ?? '') ? q.get('plan') : 'grow') as PlanId)
  const [addon, setAddon] = useState(q.get('addon') === '1')
  const [pending, setPending] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [demoPay, setDemoPay] = useState<string | null>(q.get('demo_pay'))
  const [done, setDone] = useState(false)
  const p = PLANS[plan]
  const home = base + (lang === 'es' ? 'es/' : '')
  const app = home + 'app/'
  const items: Record<PlanId, string[]> = lang === 'es'
    ? { launch: ['Sitio simple, hasta 5 páginas', 'Hosting y seguridad', 'Pedidos en 2 a 3 días hábiles'], grow: ['Identidad de marca completa', 'Sitio mediano a medida + CMS', 'SEO, analítica e integraciones'], scale: ['Sitio completo, diseño innovador', 'Sistema propio e IA conectada', 'Flujos automatizados'] }
    : { launch: ['Simple site, up to 5 pages', 'Hosting and security', 'Requests in 2 to 3 business days'], grow: ['Complete brand identity', 'Medium custom site + CMS', 'SEO, analytics and integrations'], scale: ['Complete site, innovative design', 'Your own system, AI connected', 'Automated workflows'] }

  useEffect(() => { const u = new URL(location.href); u.searchParams.set('plan', plan); u.searchParams.set('addon', addon ? '1' : '0'); u.searchParams.delete('demo_pay'); history.replaceState(null, '', u) }, [plan, addon])

  const pay = async () => {
    setBusy(true); setErr('')
    try {
      const back = be.mode === 'demo' ? location.href : app + '#/billing'
      const r = await be.checkout(plan, 'build', back, addon)
      if (r.url) location.href = r.url
      else { setPending(true); setBusy(false) }
    } catch { setErr(lang === 'es' ? 'El pago no está disponible ahora. Escríbeme y lo resolvemos.' : 'Checkout is not available right now. Write to me and we will sort it out.'); setBusy(false) }
  }

  return (
    <div className="co2">
      <header className="co2__top">
        <a href={home}><img src={base + 'brand/mark-main.svg'} alt="Federico Schwindt" width="66" height="22" /></a>
        <a className="mono co2__back" href={home + '#pricing'}><Icon name="arrowLeft" size={13} />{t.checkout.back}</a>
      </header>
      <div className="co2__grid">
        <section className="co2__cfg">
          <h1 className="d">{t.checkout.title}</h1>
          <p className="ap-lead">{t.checkout.sub}</p>
          <div className="co2__plans" role="radiogroup" aria-label={t.checkout.plan}>
            {(Object.keys(PLANS) as PlanId[]).map((id) => {
              const x = PLANS[id], on = id === plan
              return (
                <button key={id} type="button" role="radio" aria-checked={on} className={`co2__plan${on ? ' is-on' : ''}`} onClick={() => setPlan(id)}>
                  {on && <motion.span layoutId="co2-sel" className="co2__sel" transition={{ type: 'spring', damping: 30, stiffness: 400 }}><i /><i /><i /><i /></motion.span>}
                  <span className="co2__pn"><b className="d">{x.name}</b><span className="co2__slots">{Array.from({ length: x.slots }, (_, i) => <i key={i} />)}</span></span>
                  <span className="co2__pp"><b className="d n">{money(x.setup)}</b><small>{t.checkout.build}</small></span>
                  <span className="co2__pm mono">+ {money(x.monthly)} {t.checkout.month}</span>
                  <span className="co2__ps mono">{t.checkout.slots(x.slots)}</span>
                  <ul>{items[id].map((s) => <li key={s}><Icon name="check" size={13} />{s}</li>)}</ul>
                </button>
              )
            })}
          </div>
          <label className={`co2__addon${addon ? ' is-on' : ''}`}>
            <input type="checkbox" checked={addon} onChange={(e) => setAddon(e.target.checked)} />
            <span className="co2__tog" aria-hidden="true"><i /></span>
            <span><b>{t.checkout.addon}</b><small>{t.checkout.addonSub}</small></span>
            <b className="n">+{money(COMMUNITY)}<small>/{lang === 'es' ? 'mes' : 'mo'}</small></b>
          </label>
          <ol className="co2__steps">{t.checkout.steps.map((s, i) => <li key={s}><span className="mono">0{i + 1}</span>{s}</li>)}</ol>
        </section>

        <aside className="co2__sum">
          <div className="card">
            <p className="mono">{p.name}</p>
            <dl>
              <div><dt>{t.checkout.today}</dt><dd className="n">{money(p.setup)}</dd></div>
              <div><dt>{t.checkout.monthly}</dt><dd className="n">{money(p.monthly + (addon ? COMMUNITY : 0))}</dd></div>
            </dl>
            <motion.p key={plan} className="co2__total" initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }}><span>{t.checkout.total}</span><b className="d n">{money(p.setup)}</b></motion.p>
            <div className="co2__acct">
              <p className="mono">{t.checkout.account}</p>
              {user ? (
                <>
                  <p className="co2__me"><Icon name="check" size={14} />{t.checkout.signedAs(user.email)}</p>
                  <button className="ap-btn ap-btn--red co2__pay" type="button" disabled={busy} onClick={pay}>{t.checkout.pay(money(p.setup))} <Icon name="arrowRight" size={15} /></button>
                </>
              ) : <AuthForm start="signup" />}
              {err && <p className="lg__err" role="alert">{err}</p>}
            </div>
            <p className="co2__secure muted"><Icon name="lightning" size={13} />{t.checkout.secure}</p>
          </div>
        </aside>
      </div>

      {/* demo mode: the provider's checkout, simulated */}
      <AnimatePresence>
        {(demoPay || done || pending) && (
          <motion.div className="nr__veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="co2__pay-m card" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}>
              {pending ? (
                <>
                  <span className="co2__ok"><Icon name="clock" size={30} /></span>
                  <h2 className="d">{t.pending.title}</h2>
                  <p className="muted">{t.pending.sub}</p>
                  <a className="ap-btn ap-btn--red" href={app}>{t.pending.go} <Icon name="arrowRight" size={15} /></a>
                </>
              ) : done ? (
                <>
                  <span className="co2__ok"><Icon name="check" size={30} /></span>
                  <h2 className="d">{t.checkout.done}</h2>
                  <p className="muted">{t.checkout.doneSub}</p>
                  <a className="ap-btn ap-btn--red" href={app}>{t.checkout.go} <Icon name="arrowRight" size={15} /></a>
                </>
              ) : (
                <>
                  <p className="mono">{t.checkout.demoPay}</p>
                  <h2 className="d">{money(p.setup)}</h2>
                  <p className="muted">{t.checkout.demoPaySub}</p>
                  <button className="ap-btn ap-btn--red" type="button" onClick={() => { const [pp, st] = demoPay!.split(':') as [PlanId, 'build']; demoPaid(pp, st); if (addon) demoPaid(pp, 'community'); setDemoPay(null); setDone(true) }}>{t.checkout.demoOk}</button>
                  <button className="ap-btn ap-btn--ghost" type="button" onClick={() => setDemoPay(null)}>{t.checkout.demoCancel}</button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
