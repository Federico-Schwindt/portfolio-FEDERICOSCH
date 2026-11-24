import { studioQuoteText } from '../i18n-studio-quote'
import { useStore } from '../store'
import { PLANS, type PlanChange, type PlanId } from '../types'
import '../../styles/studio-quote.css'

/** Read the quote accepted by the client. Recalculating proration on the day of the transfer would change it. */
export function PlanChangeQuote({ change }: { change: PlanChange }) {
  const { lang, t } = useStore()
  const labels = studioQuoteText[lang]
  if (change.amount <= 0) return null

  const money = new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', currencyDisplay: 'code' })
  const plan = (id: string) => Object.hasOwn(PLANS, id) ? PLANS[id as PlanId].name : undefined
  function lineLabel(key: string) {
    const [kind, a, b] = key.split(':')
    const from = plan(a), to = plan(b)
    if (kind === 'build' && from && to) return t.pl.lineBuild(from, to)
    if (kind === 'prorate' && /^\d+$/.test(a)) return t.pl.lineProrate(Number(a))
    if (kind === 'monthly' && from) return t.pl.lineMonthly(from)
    if (kind === 'community') return t.pl.lineCommunity
    return labels.other
  }

  const lines = change.quote?.lines
  const hasItems = Array.isArray(lines) && lines.length > 0 &&
    lines.every(line => line && typeof line.label === 'string' && Number.isFinite(line.amount))
  const matches = hasItems && lines.reduce((sum, line) => sum + Math.round(line.amount * 100), 0) === Math.round(change.amount * 100)

  return <details className="studio-quote">
    <summary>{labels.details}</summary>
    {hasItems ? <dl>
      {lines.map((line, i) => <div key={i}><dt>{lineLabel(line.label)}</dt><dd>{money.format(line.amount)}</dd></div>)}
      <div className="studio-quote__total"><dt>{labels.total}</dt><dd>{money.format(change.amount)}</dd></div>
    </dl> : <p>{labels.unavailable}</p>}
    {hasItems && !matches && <p>{labels.mismatch}</p>}
  </details>
}
