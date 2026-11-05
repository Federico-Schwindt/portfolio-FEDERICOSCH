import { useEffect, useRef, useState } from 'react'
import type { LighthouseRun, Project } from '../content'

type Perf = NonNullable<Project['performance']>

const sec = (ms: number) => `${(ms / 1000).toFixed(1)} s`
const size = (b: number) => (b >= 1e6 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`)
/** lower-case only the first letter, so names like WordPress keep their casing */
const lead = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
const ms = (v: number) => `${Math.round(v).toLocaleString('en-US')} ms`

const metrics: { key: keyof LighthouseRun; label: string; hint: string; fmt: (v: number) => string }[] = [
  { key: 'fcp', label: 'First Contentful Paint', hint: 'First text or image on screen', fmt: sec },
  { key: 'lcp', label: 'Largest Contentful Paint', hint: 'Main content visible', fmt: sec },
  { key: 'tbt', label: 'Total Blocking Time', hint: 'Time the page can’t respond to taps', fmt: ms },
  { key: 'cls', label: 'Cumulative Layout Shift', hint: 'How much the layout jumps', fmt: (v) => v.toFixed(3) },
  { key: 'si', label: 'Speed Index', hint: 'How fast the page fills in', fmt: sec },
  { key: 'bytes', label: 'Page weight', hint: 'Everything downloaded', fmt: size },
  { key: 'reqs', label: 'Requests', hint: 'Files fetched', fmt: (v) => String(v) },
  { key: 'js', label: 'JavaScript', hint: 'Script shipped to the browser', fmt: size },
]

const scores: { key: 'perf' | 'a11y' | 'bp'; label: string }[] = [
  { key: 'perf', label: 'Performance' },
  { key: 'a11y', label: 'Accessibility' },
  { key: 'bp', label: 'Best practices' },
]

/** Lighthouse bands: 90–100 good, 50–89 needs improvement, 0–49 poor */
const band = (v: number) => (v >= 90 ? 'good' : v >= 50 ? 'ok' : 'poor')
const bandLabel = { good: 'Good', ok: 'Needs work', poor: 'Poor' } as const

const change = (before: number, after: number) => {
  if (before === after) return '—'
  if (after === 0) return '−100%'
  const pct = Math.round(((after - before) / before) * 100)
  return pct < 0 ? `−${Math.abs(pct)}%` : `+${pct}%`
}

function Ring({ value, was, label, on }: { value: number; was?: number; label: string; on: boolean }) {
  const r = 46
  const c = 2 * Math.PI * r
  const b = band(value)
  return (
    <div className={`cperf__ring cperf__ring--${b}`}>
      <div className="cperf__dial">
        <svg viewBox="0 0 110 110" aria-hidden="true">
          <circle cx="55" cy="55" r={r} className="cperf__track" />
          <circle cx="55" cy="55" r={r} className="cperf__arc" strokeDasharray={c} strokeDashoffset={on ? c * (1 - value / 100) : c} />
        </svg>
        <span className="cperf__val">{value}</span>
      </div>
      <span className="mono cperf__label">{label}</span>
      <span className="mono cperf__band">
        {bandLabel[b]}
        {was !== undefined && <> · was {was}</>}
      </span>
    </div>
  )
}

export function CasePerf({ perf }: { perf: Perf }) {
  const [i, setI] = useState(0)
  const [on, setOn] = useState(false)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold: 0.25 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const run = perf.runs[i]
  const host = (u?: string) => u?.replace(/^https?:\/\//, '')

  return (
    <section className="case__section cperf" ref={ref} aria-labelledby="cperf-title">
      <h2 className="case__h mono" id="cperf-title">
        Performance
      </h2>
      <div>
        <div className="cperf__top">
          <p className="cperf__intro">
            Measured with Lighthouse, the engine behind Google PageSpeed Insights: the {perf.before ? `${lead(perf.before.label)} against the ${lead(perf.after.label)}` : lead(perf.after.label)}.
          </p>
          {perf.runs.length > 1 && (
            <div className="cperf__tabs" role="tablist" aria-label="Device">
              {perf.runs.map((r, k) => (
                <button key={r.device} type="button" role="tab" aria-selected={k === i} className={k === i ? 'is-on' : ''} onClick={() => setI(k)} data-cursor="link">
                  {r.device}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="cperf__rings">
          {scores.map((s) => (
            <Ring key={s.key + run.device} value={run.after[s.key]} was={run.before?.[s.key]} label={s.label} on={on} />
          ))}
        </div>

        <div className="cperf__tablewrap">
          <table className="cperf__table">
            <caption className="sr-only">
              {run.device} lab metrics: {perf.before?.label ?? 'before'} versus {perf.after.label}
            </caption>
            <thead>
              <tr>
                <th scope="col" className="mono">Metric</th>
                {run.before && <th scope="col" className="mono">{perf.before?.label ?? 'Before'}</th>}
                <th scope="col" className="mono">{perf.after.label}</th>
                {run.before && <th scope="col" className="mono">Change</th>}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.key}>
                  <th scope="row">
                    {m.label}
                    <span className="mono">{m.hint}</span>
                  </th>
                  {run.before && <td className="cperf__old">{m.fmt(run.before[m.key])}</td>}
                  <td className="cperf__new">{m.fmt(run.after[m.key])}</td>
                  {run.before && <td className="cperf__delta">{change(run.before[m.key], run.after[m.key])}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mono cperf__note">
          {perf.tool} · measured {perf.measured}
          {perf.before?.url && <> · before: {host(perf.before.url)}</>}
          {perf.after.url && <> · after: {host(perf.after.url)}</>}
          {perf.note && <> · {perf.note}</>}
        </p>
      </div>
    </section>
  )
}
