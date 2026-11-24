import { AnimatePresence, motion, Reorder } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { useStore } from '../store'
import { Icon } from '../Icon'
import { rel } from '../i18n'
import { PLANS, runningSlots, type Req, type Status } from '../types'
import { KindTag, sortQueue, forecast, shortDay } from '../ui/bits'
import { useMemo } from 'react'
import type { Kind } from '../types'
import { csvLine, downloadCsv } from '../csv'

/** the kanban. Clients reorder their queue; the studio view (admin) can move any card forward. */
export function Board({ admin = false, account, requests, children }: { admin?: boolean; account?: string; requests?: Req[]; children?: ReactNode }) {
  const { t, lang, reqs: allRequests, sub, user, go, be, reload, toast, setNewOpen } = useStore()
  const reqs = requests ?? allRequests
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<Kind | ''>('')
  const match = (r: Req) => (!kind || r.kind === kind) && (!q.trim() || `#${r.number} ${r.title} ${r.ownerName ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))
  const [queue, setQueue] = useState<Req[]>([])
  useEffect(() => setQueue(sortQueue(reqs).filter(match)), [reqs, q, kind])
  const slots = user?.role === 'admin' ? 0 : runningSlots(sub)
  const eta = useMemo(() => forecast(reqs, slots), [reqs, slots])
  const col = (s: Status) => reqs.filter((r) => r.status === s && match(r)).sort((a, b) => (b.reviewAt ?? b.startedAt ?? b.createdAt).localeCompare(a.reviewAt ?? a.startedAt ?? a.createdAt))
  const active = col('active')
  const columns = { review: col('review'), done: col('done') }
  const exportRows = [...sortQueue(reqs).filter(match), ...active, ...columns.review, ...columns.done]
  const exportRequests = () => {
    const studio = user?.role === 'admin'
    const header = [t.csv.number, t.form.title, ...(studio ? [t.admin.client] : []), t.csv.kind, t.adm.status,
      t.detail.priority, t.detail.brief, t.detail.created, t.cal.due, t.cal.done]
    const lines = exportRows.map(r => csvLine([String(r.number), r.title, ...(studio ? [r.ownerName || r.owner] : []),
      t.kinds[r.kind], t.status[r.status], t.pri[r.priority], r.brief, r.createdAt, r.dueDate ?? '', r.doneAt ?? '']))
    downloadCsv(t.csv.requestFile + '.csv', [csvLine(header), ...lines])
    toast(t.csv.downloaded(lines.length))
  }
  const running = reqs.filter((r) => r.status === 'active').length
  const base = admin ? 'admin' : 'board' // admin cards open at #/admin/<id>

  const [saving, setSaving] = useState(false)
  const canReorder = user?.role !== 'admin' || (admin && !!account)
  const commit = async (list: Req[], first = false) => {
    if (saving || !canReorder || !list.length) return
    const full = sortQueue(reqs).filter(r => r.owner === list[0].owner)
    const expected = full.map(r => r.id)
    const visible = new Set(list.map(r => r.id))
    let index = 0
    const order = expected.map(id => visible.has(id) ? list[index++].id : id)
    if (order.every((id, i) => id === expected[i])) return
    setSaving(true)
    try {
      await be.reorder(list[0].owner, expected, order)
      await reload()
      if (first) toast(t.x.mv.nextToast)
    } catch (error) {
      setQueue(full.filter(match))
      toast((error as { status?: number }).status === 409 ? t.flow.conflict : t.flow.saveError)
      await reload().catch(() => {})
    } finally { setSaving(false) }
  }
  const move = async (r: Req, to: 'top' | 'up' | 'down') => {
    const full = sortQueue(reqs).filter((x) => x.owner === r.owner)
    const i = full.findIndex((x) => x.id === r.id)
    const j = to === 'top' ? 0 : to === 'up' ? i - 1 : i + 1
    if (i < 0 || j < 0 || j >= full.length || i === j) return
    const order = [...full]; order.splice(i, 1); order.splice(j, 0, r)
    await commit(order, to === 'top')
  }
  const qIndex = (r: Req) => sortQueue(reqs).filter((x) => x.owner === r.owner).findIndex((x) => x.id === r.id)
  const qLen = (r: Req) => sortQueue(reqs).filter((x) => x.owner === r.owner).length
  const advance = async (r: Req) => {
    const nextStatus: Record<string, Status> = { queued: 'active', active: 'review', review: 'done' }
    const status = nextStatus[r.status]
    if (!status) return
    try {
      await be.update(r.id, status === 'review' ? { status, progress: 100 } : { status })
      if (status === 'review') {
        await reload()
        go(`${base}/${r.id}`)
      }
    } catch (e) { toast((e as Error).message) }
  }

  const Card = ({ r, drag = false }: { r: Req; drag?: boolean }) => (
    <div className={`kc kc--${r.status}`}>
      <button type="button" className="kc__open" onClick={() => go(`${base}/${r.id}`)} aria-label={r.title} />
      <div className="kc__top">
        <span className="mono kc__n">#{r.number}</span>
        <KindTag k={r.kind} label={t.kinds[r.kind]} />
        {r.priority === 1 && <span className="kc__pri mono">{t.pri[1]}</span>}
        {drag && <span className="kc__grip" title={t.dragHint}><Icon name="dotsSixVertical" size={15} /></span>}
      </div>
      <p className="kc__t">{r.title}</p>
      {admin && r.ownerName && <p className="mono kc__who">{r.ownerName}</p>}
      {r.status === 'active' && <div className="kc__bar"><motion.i initial={false} animate={{ width: `${r.progress}%` }} /></div>}
      <div className="kc__foot mono">
        <span>{(r.status === 'queued' || r.status === 'active') && eta.get(r.id) ? `${t.x.eta} ${shortDay(eta.get(r.id)!, lang)}` : rel(r.reviewAt ?? r.startedAt ?? r.createdAt, lang)}</span>
        {r.dueDate && r.status !== 'done' && <span className={`kc__due${eta.get(r.id) && eta.get(r.id)!.toISOString().slice(0, 10) > r.dueDate ? ' is-late' : ''}`}>{t.x.due} {shortDay(new Date(r.dueDate + 'T12:00'), lang)}</span>}
        {r.status === 'active' && <span>{r.progress}%</span>}
        {drag && (
          <span className="kc__mv">
            {qIndex(r) > 0 && <button type="button" className="kc__mvn" disabled={saving} onClick={(e) => { e.stopPropagation(); move(r, 'top') }} aria-label={t.x.mv.top} title={t.x.mv.top}><Icon name="arrowLineUp" size={13} /><span>{t.x.mv.next}</span></button>}
            <button type="button" onClick={(e) => { e.stopPropagation(); move(r, 'up') }} disabled={saving || qIndex(r) <= 0} aria-label={t.x.mv.up} title={t.x.mv.up}><Icon name="arrowUp" size={13} /></button>
            <button type="button" onClick={(e) => { e.stopPropagation(); move(r, 'down') }} disabled={saving || qIndex(r) >= qLen(r) - 1} aria-label={t.x.mv.down} title={t.x.mv.down}><Icon name="arrowDown" size={13} /></button>
          </span>
        )}
        {admin && r.status !== 'done' && <button type="button" className="kc__adv" onClick={(e) => { e.stopPropagation(); advance(r) }}>{r.status === 'active' ? t.admin.deliver : t.admin.advance} <Icon name="arrowRight" size={12} /></button>}
      </div>
    </div>
  )

  return (
    <div className="bd">
      <header className="ap-head">
        <div>
          <p className="mono ap-kicker">{admin ? t.studio : `${sub ? PLANS[sub.plan].name : ''}`}</p>
          <h1 className="d">{admin ? t.admin.title : t.board}</h1>
          <p className="ap-lead">{admin ? t.admin.sub : t.boardSub}</p>
        </div>
        <button className="ap-btn ap-btn--red" type="button" onClick={() => setNewOpen(true)}><Icon name="plus" size={16} />{t.newReq}</button>
      </header>
      {children}
      <div className="tb">
        <label className="tb__q"><Icon name="magnifyingGlass" size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.palette} /></label>
        <div className="tb__chips">
          <button type="button" className={!kind ? 'is-on' : ''} onClick={() => setKind('')}>{t.x.files.all}</button>
          {(Object.keys(t.kinds) as Kind[]).filter((k) => k === kind || reqs.some((r) => r.kind === k)).map((k) => <button key={k} type="button" className={kind === k ? 'is-on' : ''} onClick={() => setKind(kind === k ? '' : k)}>{t.kinds[k]}<i>{reqs.filter((r) => r.kind === k && r.status !== 'done').length}</i></button>)}
        </div>
        <button type="button" className="ap-btn ap-btn--ghost ap-btn--sm" disabled={!exportRows.length} onClick={exportRequests}>{t.csv.requests}</button>
      </div>
      <div className="kb">
        <section className="kb__col kb__col--queued">
          <h2><span>{t.status.queued}</span><i className="mono">{queue.length}</i></h2>
          {!canReorder && queue.length > 0 && <p className="muted">{t.flow.pickAccount}</p>}
          <Reorder.Group axis="y" values={queue} onReorder={setQueue} className="kb__list">
            {queue.map((r) => (
              <Reorder.Item key={r.id} value={r} dragListener={canReorder && !saving} onDragEnd={() => commit(queue)} whileDrag={{ scale: 1.03, rotate: -1, boxShadow: '0 18px 40px -16px rgb(0 0 0 / 0.45)' }}>
                <Card r={r} drag={canReorder} />
              </Reorder.Item>
            ))}
          </Reorder.Group>
          <button type="button" className="kb__add" onClick={() => setNewOpen(true)}><Icon name="plus" size={15} />{t.newReq}</button>
        </section>
        <section className="kb__col kb__col--active">
          <h2><span>{t.status.active}</span><i className="mono">{slots > 0 ? `${running}/${slots}` : active.length}</i></h2>
          {slots > 0 && <div className="kb__slots">{Array.from({ length: slots }, (_, i) => <i key={i} className={i < running ? 'is-on' : ''} />)}</div>}
          <div className="kb__list"><AnimatePresence>{active.map((r) => <motion.div key={r.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}><Card r={r} /></motion.div>)}</AnimatePresence></div>
          {slots > 0 && running >= slots && <p className="mono kb__full">{t.slotsFull(slots)}</p>}
        </section>
        {(['review', 'done'] as const).map((s) => (
          <section key={s} className={`kb__col kb__col--${s}`}>
            <h2><span>{t.status[s]}</span><i className="mono">{columns[s].length}</i></h2>
            <div className="kb__list"><AnimatePresence>{columns[s].slice(0, s === 'done' ? 8 : 99).map((r) => <motion.div key={r.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}><Card r={r} /></motion.div>)}</AnimatePresence></div>
          </section>
        ))}
      </div>
    </div>
  )
}
