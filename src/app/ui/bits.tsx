import { Icon, type IconName } from '../Icon'
import type { Kind, Req, Status } from '../types'

export const KIND_ICON: Record<Kind, IconName> = { page: 'browser', design: 'paintBrush', copy: 'textAa', campaign: 'megaphone', fix: 'wrench', social: 'instagramLogo', automation: 'robot', other: 'circlesFour' }

/** a progress ring; the number in the middle is the real percentage */
export function Ring({ value, size = 64, stroke = 5, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r
  return (
    <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? `${value}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="ring__bg" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="ring__fg" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="round" />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="ring__t">{value}</text>
    </svg>
  )
}

export function StatusPill({ s, label }: { s: Status; label: string }) {
  return <span className={`pill pill--${s}`}><i />{label}</span>
}

export function KindTag({ k, label }: { k: Kind; label: string }) {
  return <span className="kind"><Icon name={KIND_ICON[k]} size={13} />{label}</span>
}

/** days between two dates, one decimal */
export const days = (a: string, b: string) => Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 864e5)

/** where a new request lands in the queue: high priority jumps to the front */
export const positionFor = (priority: number) => Date.now() / 1000 - (priority === 1 ? 1e6 : 0)

export function sortQueue(rs: Req[]) {
  return rs.filter((r) => r.status === 'queued').sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
}

/**
 * When each open request should land, from the real average turnaround and the plan's slots:
 * active ones finish at start + average; queued ones take the earliest slot that frees up, in queue order.
 */
export function forecast(reqs: Req[], slots: number): Map<string, Date> {
  if (!slots) return new Map()
  const done = reqs.filter((r) => r.status === 'done' && r.startedAt && (r.reviewAt || r.doneAt))
  const avgMs = (done.length ? done.reduce((a, r) => a + (new Date(r.reviewAt ?? r.doneAt!).getTime() - new Date(r.startedAt!).getTime()), 0) / done.length : 2.5 * 864e5) || 2.5 * 864e5
  const out = new Map<string, Date>()
  const now = Date.now()
  const free: number[] = []
  for (const r of reqs.filter((x) => x.status === 'active')) {
    const end = Math.max(now + 36e5, new Date(r.startedAt ?? now).getTime() + avgMs)
    out.set(r.id, new Date(end)); free.push(end)
  }
  while (free.length < Math.max(1, slots)) free.push(now)
  free.sort((a, b) => a - b)
  for (const r of sortQueue(reqs)) {
    const end = free.shift()! + avgMs
    out.set(r.id, new Date(end))
    free.push(end); free.sort((a, b) => a - b)
  }
  return out
}
export const shortDay = (d: Date, lang: 'en' | 'es') => d.toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' })
export const fmtSize = (n: number) => (n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB')
export const isImage = (mime: string) => /^image\/(png|jpe?g|gif|webp|avif|svg\+xml)$/.test(mime)
