import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { money } from '../i18n'
import { demoPaidChange } from '../backend/demo'
import { COMMUNITY, PLANS, type ChangeKind, type PlanChange, type PlanId, type Quote } from '../types'

const ORDER: PlanId[] = ['launch', 'grow', 'scale']
type Pick = { kind: ChangeKind; to?: PlanId }

/**
 * Plan & billing: what you have, what is about to change, and three steps to change it (choose → review → confirm).
 * Every price shown comes from the same rules the server charges with (src/lib/plan-rules.ts).
 */
export function Billing() {
  const { t, lang, sub, invoices, changes, be, toast, reload, user, base } = useStore()
  const P = t.pl
  const plan = sub ? PLANS[sub.plan] : null
  const [busy, setBusy] = useState('')
  const [pick, setPick] = useState<Pick | null>(null)
  const [demoChange, setDemoChange] = useState(() => new URLSearchParams(location.search).get('demo_change'))
  const wizard = useRef<HTMLDivElement>(null)

  const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' }) : '')
  const open = changes.filter((c) => c.status === 'awaiting_payment' || c.status === 'scheduled')
  const history = changes.filter((c) => c.status === 'applied').slice(0, 6)
  const live = sub?.status === 'active' || sub?.status === 'building'
  const stopped = sub?.status === 'paused' || sub?.status === 'cancelled'
  const scheduledCancel = open.some((c) => c.kind === 'cancel' || c.kind === 'pause')

  const choose = (p: Pick) => { setPick(p); requestAnimationFrame(() => wizard.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })) }
  const payBuild = async (step: 'monthly') => {
    setBusy(step)
    try { const r = await be.checkout(sub!.plan, step, location.href.split('#')[0] + '#/billing'); if (r.url) location.href = r.url; else { toast(t.pending.title); await reload() } } finally { setBusy('') }
  }

  // members see the plan, the owner manages it
  if (user?.member) return (
    <div className="bl">
      <header className="ap-head"><div><h1 className="d">{t.billing.title}</h1><p className="ap-lead">{t.x.team.billingNote(user.accountName || '')}</p></div></header>
      {plan && <section className="card bl-now tm__billing"><p className="bl-label">{t.billing.current}</p><h2 className="bl-now__name">{plan.name}</h2><p className={`pill pill--${sub!.status === 'active' ? 'done' : 'review'}`}><i />{t.billing.status[sub!.status]}</p></section>}
    </div>
  )

  return (
    <div className="bl">
      <header className="ap-head"><div><h1 className="d">{t.billing.title}</h1><p className="ap-lead">{P.lead}</p></div></header>

      {demoChange && be.mode === 'demo' && (
        <section className="card bl-demo">
          <div><b>{P.demoTitle}</b><p className="muted">{P.demoSub}</p></div>
          <div className="bl-row"><button type="button" className="ap-btn ap-btn--red" onClick={async () => { demoPaidChange(demoChange); setDemoChange(null); const u = new URL(location.href); u.searchParams.delete('demo_change'); history_(u); await reload(); toast(P.applied) }}>{P.demoPay}</button>
            <button type="button" className="ap-btn ap-btn--ghost" onClick={() => { setDemoChange(null); const u = new URL(location.href); u.searchParams.delete('demo_change'); history_(u) }}>{P.later}</button></div>
        </section>
      )}

      <div className="bl-top">
        {/* what you have */}
        <section className="card bl-now">
          <p className="bl-label">{t.billing.current}</p>
          {plan ? (
            <>
              <div className="bl-now__h"><h2 className="bl-now__name">{plan.name}</h2><span className={`pill pill--${sub!.status === 'active' ? 'done' : sub!.status === 'building' ? 'active' : 'review'}`}><i />{t.billing.status[sub!.status]}</span></div>
              <p className="bl-now__price"><b className="n">{money(plan.monthly)}</b><span>{t.billing.perMonth}</span>{sub!.community && <span className="bl-now__plus">+ {money(COMMUNITY)} {P.cmShort}</span>}</p>
              <div className="bl-meter"><div>{Array.from({ length: plan.slots }, (_, i) => <i key={i} />)}</div><span>{plan.slots} {t.billing.slots}</span></div>
              <dl className="bl-facts">
                {sub!.periodEnd && <div><dt>{scheduledCancel ? P.endsOn : t.billing.renews}</dt><dd>{date(sub!.periodEnd)}</dd></div>}
                <div><dt>{t.billing.community}</dt><dd>{sub!.community ? t.billing.communityOn : P.off}</dd></div>
                <div><dt>{P.payWith}</dt><dd>{sub!.portalUrl ? P.card : P.transfer}</dd></div>
              </dl>
              {sub!.status === 'building' && <div className="bl-callout"><p>{t.billing.monthlyHint}</p><button className="ap-btn ap-btn--red" type="button" disabled={!!busy} onClick={() => payBuild('monthly')}>{t.billing.startMonthly} · {money(plan.monthly)}{t.billing.perMonth}</button></div>}
              {sub!.status === 'past_due' && <div className="bl-callout bl-callout--warn"><p>{P.pastDue}</p></div>}
              {sub!.portalUrl && <a className="ap-btn ap-btn--ghost ap-btn--sm" href={sub!.portalUrl} target="_blank" rel="noopener"><Icon name="creditCard" size={14} />{t.billing.portal}</a>}
            </>
          ) : (
            <div className="bl-empty"><p>{P.noPlan}</p><a className="ap-btn ap-btn--red" href={base + (lang === 'es' ? 'es/' : '') + 'checkout/'}>{P.choosePlan}<Icon name="arrowRight" size={15} /></a></div>
          )}
        </section>

        {/* what is about to change, and how billing works */}
        <section className="card bl-side">
          <p className="bl-label">{P.upcoming}</p>
          {open.length ? (
            <ul className="bl-open">
              {open.map((c) => (
                <li key={c.id} className={`bl-open__i bl-open__i--${c.status}`}>
                  <span className="bl-open__ic"><Icon name={c.status === 'scheduled' ? 'clock' : 'creditCard'} size={15} /></span>
                  <span className="bl-open__t"><b>{P.kindTitle(c.kind, PLANS[c.to].name)}</b>
                    <small>{c.status === 'scheduled' ? P.appliesOn(date(c.effectiveAt)) : be.mode === 'demo' || sub?.portalUrl ? P.awaitingCard(money(c.amount)) : P.awaitingTransfer(money(c.amount))}</small></span>
                  <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={async () => { await be.undoChange(c.id); toast(P.undone); await reload() }}>{c.status === 'scheduled' ? P.undo : P.cancelReq}</button>
                </li>
              ))}
            </ul>
          ) : <p className="muted bl-quiet">{P.nothing}</p>}
          <details className="bl-how">
            <summary>{P.howTitle}</summary>
            <ul>{P.how.map((h) => <li key={h}>{h}</li>)}</ul>
          </details>
        </section>
      </div>

      {/* step 1: choose */}
      {sub && (
        <section className="bl-plans" aria-label={t.billing.change}>
          <div className="bl-sec"><h2>{t.billing.change}</h2><p className="muted">{stopped ? P.resumeFirst : sub.status === 'pending' ? P.pendingSwitch : P.changeSub}</p></div>
          <div className="bl-cards">
            {ORDER.map((id) => {
              const p = PLANS[id], cur = sub.plan === id, up = ORDER.indexOf(id) > ORDER.indexOf(sub.plan)
              const kind: ChangeKind = up ? 'upgrade' : 'downgrade'
              const can = !cur && (live || sub.status === 'pending')
              const sel = pick?.to === id
              return (
                <article key={id} className={`bl-card${cur ? ' is-cur' : ''}${sel ? ' is-sel' : ''}`}>
                  <header><h3>{p.name}</h3>{cur ? <span className="bl-tag">{P.current}</span> : id === 'grow' && <span className="bl-tag bl-tag--soft">{P.popular}</span>}</header>
                  <p className="bl-card__price"><b className="n">{money(p.monthly)}</b><span>{t.billing.perMonth}</span></p>
                  <p className="bl-card__setup muted">{P.build(money(p.setup))}</p>
                  <ul>{P.features[id].map((f) => <li key={f}><Icon name="check" size={13} />{f}</li>)}</ul>
                  <button type="button" className={`ap-btn ${up ? 'ap-btn--red' : 'ap-btn--ghost'}`} disabled={!can} onClick={() => choose({ kind, to: id })}>
                    {cur ? P.current : sub.status === 'pending' ? `${t.billing.switch} ${p.name}` : up ? P.upgradeTo(p.name) : P.downgradeTo(p.name)}
                  </button>
                </article>
              )
            })}
          </div>

          <div className="bl-extras">
            <div className="bl-extra">
              <span className="bl-extra__ic"><Icon name="instagramLogo" size={18} /></span>
              <div><b>{t.billing.community}</b><p className="muted">{P.cmSub}</p></div>
              {sub.community
                ? <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" disabled={!live} onClick={() => choose({ kind: 'community_off' })}>{P.turnOff}</button>
                : <button type="button" className="ap-btn ap-btn--sm" disabled={!live} onClick={() => choose({ kind: 'community_on' })}>{P.addFor(money(COMMUNITY))}</button>}
            </div>
            <div className="bl-extra">
              <span className="bl-extra__ic"><Icon name="clock" size={18} /></span>
              <div><b>{stopped ? P.resumeTitle : P.pauseTitle}</b><p className="muted">{stopped ? P.resumeSub : P.pauseSub}</p></div>
              {stopped
                ? <button type="button" className="ap-btn ap-btn--red ap-btn--sm" onClick={() => choose({ kind: 'resume' })}>{P.resume}</button>
                : <div className="bl-row">
                    <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" disabled={sub.status !== 'active'} onClick={() => choose({ kind: 'pause' })}>{P.pause}</button>
                    <button type="button" className="bl-link" disabled={!live} onClick={() => choose({ kind: 'cancel' })}>{P.cancel}</button>
                  </div>}
            </div>
          </div>
        </section>
      )}

      {/* steps 2 and 3: review, confirm */}
      <div ref={wizard}>
        <AnimatePresence>{pick && <Wizard key={pick.kind + (pick.to ?? '')} pick={pick} onClose={() => setPick(null)} onDone={reload} />}</AnimatePresence>
      </div>

      <section className="card bl-inv">
        <div className="bl-sec bl-sec--in"><h2>{t.billing.invoices}</h2>{history.length > 0 && <p className="muted">{P.lastChange(P.kindTitle(history[0].kind, PLANS[history[0].to].name), date(history[0].closedAt))}</p>}</div>
        {invoices.length ? (
          <table>
            <thead><tr><th>{P.date}</th><th>{P.concept}</th><th className="n">{P.amount}</th><th>{P.status}</th><th /></tr></thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}><td>{new Date(i.at).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' })}</td><td>{i.label}</td><td className="n">{money(i.amount)}</td><td><span className="pill pill--done"><i />{P.paid}</span></td><td>{i.url && <a href={i.url} target="_blank" rel="noopener" aria-label={P.receipt}><Icon name="arrowUpRight" size={14} /></a>}</td></tr>
              ))}
            </tbody>
          </table>
        ) : <p className="muted">{t.billing.none}</p>}
      </section>
    </div>
  )
}
const history_ = (u: URL) => history.replaceState(null, '', u)

function Wizard({ pick, onClose, onDone }: { pick: Pick; onClose: () => void; onDone: () => Promise<void> }) {
  const { t, be, lang, sub, toast } = useStore()
  const P = t.pl
  const [q, setQ] = useState<Quote | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<PlanChange | null>(null)
  useEffect(() => { be.quote(pick.kind, pick.to).then(setQ, (e) => setErr((e as Error).message)) }, [be, pick])
  const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'long' }) : '')
  const confirm = async () => {
    setBusy(true); setErr('')
    try {
      const r = await be.requestChange(pick.kind, pick.to, location.href.split('#')[0] + '#/billing')
      if (r.url) { location.href = r.url; return }
      setResult(r.change); await onDone(); toast(r.change.status === 'applied' ? P.applied : P.requested)
    } catch (e) { setErr((e as Error).message) } finally { setBusy(false) }
  }
  const step = result ? 3 : 2
  const lineLabel = (l: string) => {
    const [k, a, b] = l.split(':')
    return k === 'build' ? P.lineBuild(PLANS[a as PlanId].name, PLANS[b as PlanId].name) : k === 'prorate' ? P.lineProrate(Number(a)) : k === 'monthly' ? P.lineMonthly(PLANS[a as PlanId].name) : P.lineCommunity
  }
  const danger = pick.kind === 'cancel' || pick.kind === 'pause'
  return (
    <motion.section className={`card bl-wiz${danger ? ' bl-wiz--danger' : ''}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}>
      <header className="bl-wiz__h">
        <ol className="bl-steps">{[P.s1, P.s2, P.s3].map((s, i) => <li key={s} className={i + 1 < step ? 'is-done' : i + 1 === step ? 'is-on' : ''}><i>{i + 1 < step ? <Icon name="check" size={11} /> : i + 1}</i>{s}</li>)}</ol>
        <button type="button" className="dr__x" aria-label={t.nav.close} onClick={onClose}><Icon name="x" size={16} /></button>
      </header>

      <h2 className="bl-wiz__title">{P.kindTitle(pick.kind, pick.to ? PLANS[pick.to].name : sub ? PLANS[sub.plan].name : '')}</h2>
      {!q && !err && <div className="bl-skel" aria-busy="true"><i /><i /><i /></div>}
      {err && <p className="lg__err" role="alert">{err}</p>}

      {q && !result && (
        <div className="bl-wiz__grid">
          <div>
            <p className="bl-label">{P.whatChanges}</p>
            <ul className="bl-diff">
              {q.slotsFrom !== q.slotsTo && <li><span>{P.slotsLine}</span><b className="n">{q.slotsFrom} → {q.slotsTo}</b></li>}
              {q.from !== q.to && <li><span>{P.monthlyLine}</span><b className="n">{money(PLANS[q.from].monthly)} → {money(PLANS[q.to].monthly)}</b></li>}
              <li><span>{P.whenLine}</span><b>{q.when === 'now' ? P.whenNow : q.when === 'on_payment' ? P.whenPaid : P.whenEnd(date(q.effectiveAt))}</b></li>
            </ul>
            <ul className="bl-notes">{P.notes[pick.kind].map((n) => <li key={n}><Icon name="arrowRight" size={12} />{n}</li>)}</ul>
          </div>
          <div className="bl-total">
            <p className="bl-label">{P.dueNow}</p>
            {q.lines.length > 0 && <ul>{q.lines.map((l) => <li key={l.label}><span>{lineLabel(l.label)}</span><b className="n">{money(l.amount)}</b></li>)}</ul>}
            <p className="bl-total__v"><b className="n">{money(q.dueNow)}</b>{q.dueNow === 0 && <span>{P.free}</span>}</p>
            {q.dueNow > 0 && <p className="muted bl-total__how">{be.mode === 'demo' ? P.payDemo : sub?.portalUrl ? P.payCard : P.payTransfer}</p>}
            <button type="button" className={`ap-btn ${danger ? 'ap-btn--ink' : 'ap-btn--red'} bl-total__go`} disabled={busy} onClick={confirm}>
              {busy ? P.working : q.dueNow > 0 ? P.confirmPay(money(q.dueNow)) : P.confirm}
            </button>
            <button type="button" className="bl-link" onClick={onClose}>{P.back}</button>
          </div>
        </div>
      )}

      {result && (
        <div className="bl-done">
          <span className="bl-done__ic"><Icon name="check" size={20} /></span>
          <div>
            <b>{result.status === 'applied' ? P.doneApplied : result.status === 'scheduled' ? P.doneScheduled(date(result.effectiveAt)) : P.doneAwaiting}</b>
            <p className="muted">{result.status === 'awaiting_payment' ? P.doneAwaitingSub(money(result.amount)) : P.doneSub}</p>
          </div>
          <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" onClick={onClose}>{P.close}</button>
        </div>
      )}
    </motion.section>
  )
}
