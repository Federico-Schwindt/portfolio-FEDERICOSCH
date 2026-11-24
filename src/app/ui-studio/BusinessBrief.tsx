import { useCallback, type ReactNode } from 'react'
import { welcome } from '../i18n-welcome'
import { useStore } from '../store'
import { fileDownload, loadRequestBrief, useStudioRead, type History } from '../studio-data'
import type { Brand } from '../types'

const answer = (v: unknown) => typeof v === 'string' ? v.trim() : ''
function choice<T>(options: T[], index: unknown) {
  return typeof index === 'number' && Number.isInteger(index) ? options[index] : undefined
}

function online(raw: unknown, instagram = false) {
  const value = answer(raw)
  if (!value) return null
  let url: URL
  try {
    if (instagram && /^@[a-z0-9_.]{1,30}$/i.test(value)) url = new URL('https://www.instagram.com/' + value.slice(1) + '/')
    else if (/^https?:\/\//i.test(value)) url = new URL(value)
    else if (/^[\w-]+(?:\.[\w-]+)+(?:[/?#][^\s]*)?$/u.test(value)) url = new URL('https://' + value)
    else return value
  } catch { return value }
  if (url.username || url.password) return value
  return <a href={url.href} target="_blank" rel="noreferrer">{value}</a>
}

function useBriefFields(brand?: Brand) {
  const { t, lang } = useStore()
  const s = t.businessBrief, q = welcome[lang].q
  const b = brand?.business
  const started = !!b && typeof b === 'object' && !Array.isArray(b)
  const complete = brand?.onboarded === true
  const goals = Array.isArray(b?.goals) ? [...new Set(b.goals)].map(g => choice(q.goal.o, g)).filter(Boolean) : []
  const colors = Array.isArray(brand?.colors) ? brand.colors.filter(c => typeof c === 'string' && /^#[a-f0-9]{6}$/i.test(c)) : []
  const rows: [string, ReactNode][] = [
    [s.what, answer(b?.what)], [s.industry, choice(q.industry.o, b?.industry)],
    [s.customers, answer(b?.customers)], [s.goals, goals.join(' · ')],
    [q.links.site, online(b?.site)], [q.links.ig, online(b?.instagram, true)], [s.other, online(b?.other)],
    [s.style, choice(q.style.o, b?.style)?.[0]],
    [s.colors, colors.length > 0 && <ul className="ops__palette">{colors.map((color, i) =>
      <li key={i}><i aria-hidden="true" style={{ backgroundColor: color }} />{color}</li>)}</ul>],
    [s.notes, answer(b?.notes)],
  ]
  return { started, complete, rows: rows.filter(([, value]) => value), goals }
}

export function RequestBrief({ id }: { id: string }) {
  const { t, be } = useStore()
  const { data, failed, refresh } = useStudioRead(useCallback(() => loadRequestBrief(be, id), [be, id]))
  const s = t.businessBrief
  const { started, complete, rows, goals } = useBriefFields(data?.brand)
  return <section className="ops__brief dr__business" aria-label={s.title}>
    <h3>{s.title}</h3>
    {failed ? <div role="alert">{s.loadError} <button type="button" className="ap-btn ap-btn--sm ap-btn--ghost" onClick={refresh}>{t.priorities.retry}</button></div>
      : !data ? <p role="status">{t.flow.loading}</p> : <>
        <a className="dr__company" href={'#/admin/clients/' + data.owner} aria-label={s.account + ' · ' + data.company}>{data.company}</a>
        {started || complete ? <>
          <small>{complete ? s.complete : s.partial}</small>
          {goals.length > 0 && <p className="dr__goals"><strong>{s.goals}</strong>{goals.join(' · ')}</p>}
          {rows.some(([label]) => label !== s.goals) && <details><summary>{s.answers}</summary>
            <dl>{rows.filter(([label]) => label !== s.goals).map(([label, value]) =>
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></details>}
        </> : <p>{s.empty}</p>}
      </>}
  </section>
}

export function BusinessBrief({ company, brand, files }: { company: string; brand?: Brand; files: History['files'] }) {
  const { t, be } = useStore(), s = t.businessBrief
  const { started, complete, rows } = useBriefFields(brand)
  const materials = files.filter(f => f.material)
  return <section className="card ops__brief" aria-labelledby="ops-brief-title">
    <header className="card__h"><h2 id="ops-brief-title">{s.title}</h2>
      {(started || complete) && <span className="mono">{complete ? s.complete : s.partial}</span>}</header>
    {started || complete ? <dl>{answer(company) && <div><dt>{s.company}</dt><dd>{company}</dd></div>}{rows.map(([label, value]) =>
      <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p className="muted">{s.empty}</p>}
    {materials.length > 0 && <details className="ops__materials">
      <summary>{s.materials} ({materials.length})</summary>
      <ul className="ops__list">{materials.map(f => {
        const url = fileDownload(be, f)
        return <li key={f.id}>{url ? <a href={url} download={f.name}>{f.name}</a> : f.name}</li>
      })}</ul>
    </details>}
  </section>
}
