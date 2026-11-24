import { motion } from 'motion/react'
import { useMemo } from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { rel } from '../i18n'
import { PLANS, runningSlots } from '../types'
import { openWelcome, welcomeLeft } from '../ui/Welcome'
import { StudioMessages } from '../ui/StudioMessages'
import { welcome } from '../i18n-welcome'
import { KindTag, Ring, days, sortQueue, forecast, shortDay, isImage } from '../ui/bits'

const up = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } }

export function Overview() {
  const { t, lang, user, sub, reqs, events, go, setNewOpen, be, toast, files, recurring, reload } = useStore()
  const studio = user?.role === 'admin'
  const slots = studio ? 0 : runningSlots(sub)
  const waiting = !studio && slots === 0
  const firstVisit = !studio && reqs.length === 0
  const lead = firstVisit ? t.clientHome.first : waiting ? t.clientHome.waiting : t.sub
  const active = reqs.filter((r) => r.status === 'active')
  const queue = sortQueue(reqs)
  const review = reqs.filter((r) => r.status === 'review')
  const done = reqs.filter((r) => r.status === 'done' && r.doneAt)

  const stats = useMemo(() => {
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0)
    const thisMonth = done.filter((r) => new Date(r.doneAt!) >= month).length
    const turn = done.filter((r) => r.startedAt).map((r) => days(r.startedAt!, r.reviewAt ?? r.doneAt!))
    const avg = turn.length ? turn.reduce((a, b) => a + b, 0) / turn.length : 0
    // delivered per week, last 8 weeks
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const end = Date.now() - (7 - i) * 7 * 864e5, start = end - 7 * 864e5
      return done.filter((r) => { const x = new Date(r.doneAt!).getTime(); return x > start && x <= end }).length
    })
    return { thisMonth, avg, weeks }
  }, [done])
  const max = Math.max(2, ...stats.weeks)
  const aiFeed = events.filter((e) => e.who === 'ai').slice(-3).reverse()
  const feed = events.slice(-9).reverse()
  const titleOf = (id: string) => reqs.find((r) => r.id === id)?.title ?? ''
  const name = (user?.name || '').split(' ')[0]
  const eta = useMemo(() => forecast(reqs, slots), [reqs, slots])
  const steps: [boolean, string, () => void][] = [
    [reqs.length > 0, t.x.onb.first, () => setNewOpen(true)],
  ]
  if (!user?.member) steps.push(
    [!!user?.brand?.colors?.length, t.x.onb.brand, () => go('brand')],
    [files.some(f => f.kind === 'brand'), t.x.onb.logo, () => go('brand')],
  )
  const setupLeft = steps.filter((s) => !s[0]).length
  // the welcome conversation: what is still unanswered about the business
  const W = welcome[lang].card
  const bizLeft = user?.role === 'client' && !user.member ? welcomeLeft(user.brand?.business, user.company ?? '').length : -1

  return (
    <div className="ov">
      <header className="ap-head">
        <div>
          <p className="mono ap-kicker">{new Date().toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="d">{t.hello(name)}</h1>
          <p className="ap-lead">{lead}</p>
        </div>
        <button className="ap-btn ap-btn--red ov__new" type="button" onClick={() => setNewOpen(true)}><Icon name="plus" size={16} />{t.newReq}</button>
      </header>
      <div className="ov__cols">
      <div className="ov__main">

      {/* deliveries waiting for the client go first, each with its latest version; approving happens after opening it */}
      {review.length > 0 && (
        <motion.section className="card wait" {...up}>
          <div className="card__h"><div><h2><span className="live" />{t.x.rv.title}</h2><p className="muted wait__sub">{t.x.rv.sub}</p></div><p className="mono">{review.length}</p></div>
          <ul className="wait__list">
            {review.map((r) => {
              const v = files.filter((f) => f.requestId === r.id && f.kind === 'deliverable').sort((a, b) => b.version - a.version)[0]
              return (
                <li key={r.id}>
                  <button type="button" className="wait__item" onClick={() => go(`overview/${r.id}`)}>
                    <span className="wait__thumb">{v && isImage(v.mime) && be.fileUrl(v) !== '#' ? <img src={be.fileUrl(v)} alt="" /> : <Icon name="file" size={20} />}{v && <i className="mono">v{v.version}</i>}</span>
                    <span className="wait__t"><small className="mono">#{r.number} · {t.kinds[r.kind]}</small><b>{r.title}</b></span>
                    <span className="ap-btn ap-btn--sm ap-btn--red">{t.x.rv.open}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </motion.section>
      )}

      {user?.role === 'client' && reqs.length > 0 && <StudioMessages key={user.id + '/' + (user.account ?? user.id)} />}

      {bizLeft > 0 && !user?.brand?.onboarded && (
        <motion.section className="card wlc" {...up}>
          <span className="wlc__ic">F</span>
          <span className="wlc__t"><b>{W.title}</b><span>{bizLeft < 9 ? W.left(bizLeft) : W.sub}</span></span>
          <button type="button" className="ap-btn ap-btn--red" onClick={openWelcome}>{bizLeft < 9 ? W.cont : W.go}<Icon name="arrowRight" size={15} /></button>
          <span className="wlc__bar"><i style={{ width: `${((9 - bizLeft) / 9) * 100}%` }} /></span>
        </motion.section>
      )}
      {setupLeft > 0 && user?.role !== 'admin' && (
        <motion.section className="card onb" {...up}>
          <div className="onb__h"><h2>{t.x.onb.title}</h2><span className="onb__n mono">{steps.length - setupLeft}/{steps.length}</span></div>
          <div className="onb__bar"><i style={{ width: `${((steps.length - setupLeft) / steps.length) * 100}%` }} /></div>
          <ol className="onb__list">{steps.map(([ok, label, run]) => <li key={label} className={ok ? 'is-ok' : ''}><span className="onb__c">{ok ? <Icon name="check" size={13} /> : null}</span><span>{label}</span>{!ok && <button type="button" className="ap-btn ap-btn--sm ap-btn--ghost" aria-label={label} onClick={run}>{t.x.onb.go}</button>}</li>)}</ol>
        </motion.section>
      )}

      {/* Before the first request, the setup guide already offers the next action. */}
      {!firstVisit && <>
      <motion.section className="card eng" {...up} transition={{ delay: 0.05 }}>
        <div className="card__h">
          <h2><Icon name="lightning" size={16} />{waiting && !active.length ? t.queueHold.queued : t.engine}</h2>
          <p className="mono">{slots ? t.slots(active.length, slots) : waiting && !active.length ? queue.length : `${t.status.active} · ${active.length}`}</p>
        </div>
        <div className="eng__slots" style={{ ['--cols' as string]: slots && slots <= 4 ? slots : 3 }}>
          {Array.from({ length: Math.max(slots, active.length) }, (_, i) => {
            const r = active[i]
            return r ? (
              <motion.button layout key={r.id} type="button" className="slot" onClick={() => go(`overview/${r.id}`)}>
                <Ring value={r.progress} size={70} />
                <span className="slot__t"><small className="mono">#{r.number}{eta.get(r.id) ? ` · ${t.x.eta} ${shortDay(eta.get(r.id)!, lang)}` : ''}</small><b>{r.title}</b><KindTag k={r.kind} label={t.kinds[r.kind]} /></span>
                <span className="slot__scan" aria-hidden="true" />
              </motion.button>
            ) : (
              <button key={'free' + i} type="button" className="slot slot--free" onClick={() => setNewOpen(true)}>
                <span className="slot__plus"><Icon name="plus" size={20} /></span>
                <span className="slot__t"><b>{t.free}</b><small>{t.freeHint}</small></span>
              </button>
            )
          })}
        </div>
        <div className="eng__foot">
          <div className="eng__next">
            <p className="mono">{t.next}</p>
            <ol>{queue.slice(0, 4).map((r, i) => <li key={r.id}><button type="button" onClick={() => go(`overview/${r.id}`)}><i>{i + 1}</i>{r.title}{eta.get(r.id) && <small>{shortDay(eta.get(r.id)!, lang)}</small>}</button></li>)}{!queue.length && <li className="muted">—</li>}</ol>
          </div>
        </div>
      </motion.section>

        <motion.section className="card feed" {...up} transition={{ delay: 0.28 }}>
          <div className="card__h"><h2>{t.activity}</h2></div>
          <ul>
            {feed.map((e) => (
              <motion.li key={e.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`feed__i feed__i--${e.who}`}>
                <span className="feed__dot">{e.who === 'ai' ? <Icon name="sparkle" size={12} /> : e.who === 'studio' ? 'F' : e.who === 'client' ? (user?.name || 'Y')[0] : <Icon name="clock" size={12} />}</span>
                <span className="feed__b"><b>{t.who[e.who]}</b> {e.kind === 'status' ? t.evStatus[e.body as keyof typeof t.evStatus] ?? e.body : e.body}<button type="button" onClick={() => go(`overview/${e.requestId}`)}>{titleOf(e.requestId)}</button></span>
                <small className="mono">{rel(e.at, lang)}</small>
              </motion.li>
            ))}
          </ul>
        </motion.section>
      </>}
      </div>
      {!firstVisit && <aside className="ov__rail">
        <motion.section className="card rail" {...up} transition={{ delay: 0.08 }}>
          <div className="card__h"><h2>{t.rail.month}</h2><span className="rail__trend n">{stats.thisMonth}</span></div>
          <svg className="spark" viewBox="0 0 160 44" role="img" aria-label={t.rail.weeks}>
            {stats.weeks.map((w, i) => <rect key={i} x={i * 20 + 2} y={42 - (w / max) * 38} width="14" height={Math.max(2, (w / max) * 38)} rx="3" className={i === 7 ? 'spark__now' : ''} />)}
          </svg>
          <p className="rail__cap muted">{t.rail.weeks}</p>
          <dl className="rail__list">
            <div><dt>{t.stats.turnaround}</dt><dd className="n">{stats.avg ? `${stats.avg.toFixed(1)} ${t.stats.days}` : t.stats.none}</dd></div>
            <div className={review.length ? 'is-hot' : ''}><dt>{t.stats.review}</dt><dd className="n">{review.length}</dd></div>
            <div><dt>{t.stats.queue}</dt><dd className="n">{queue.length}</dd></div>
            <div><dt>{t.status.active}</dt><dd className="n">{active.length}{slots ? ` / ${slots}` : ''}</dd></div>
          </dl>
        </motion.section>
        {!studio && !user?.member && sub && (
          <motion.button type="button" className="card rail rail--plan" {...up} transition={{ delay: 0.12 }} onClick={() => go('billing')}>
            <span className="rail__k">{t.billing.current}</span>
            <span className="rail__plan"><b>{PLANS[sub.plan].name}</b><span className={`pill pill--${sub.status === 'active' ? 'done' : sub.status === 'building' ? 'active' : 'review'}`}><i />{t.billing.status[sub.status]}</span></span>
            <span className="rail__go">{t.rail.manage}<Icon name="arrowRight" size={13} /></span>
          </motion.button>
        )}
        {!studio && (
          <motion.section className="card rail" {...up} transition={{ delay: 0.14 }}>
            <div className="card__h"><h2>{t.tpl.recurring}</h2><span className="muted rail__n">{recurring.length}</span></div>
            {recurring.length ? (
              <ul className="rail__rec">{recurring.map((x) => (
                <li key={x.id}><span><b>{x.title}</b><small>{x.every === 'week' ? t.tpl.weekly : t.tpl.monthly} · {t.tpl.next} {shortDay(x.nextAt, lang)}</small></span>
                  <button type="button" className="bl-link" onClick={async () => { await be.stopRecurring(x.id); toast(t.tpl.stopped); reload() }}>{t.tpl.stop}</button></li>
              ))}</ul>
            ) : <p className="muted rail__empty">{t.tpl.recEmpty}</p>}
          </motion.section>
        )}
        {aiFeed.length > 0 && (
          <motion.section className="card rail" {...up} transition={{ delay: 0.16 }}>
            <div className="card__h"><h2><span className="live" />{t.agents}</h2></div>
            <ul className="rail__ai">{aiFeed.map((e) => <li key={e.id}><Icon name="sparkle" size={13} /><span>{e.body}<small>{titleOf(e.requestId)}</small></span></li>)}</ul>
          </motion.section>
        )}
      </aside>}
      </div>
    </div>
  )
}
