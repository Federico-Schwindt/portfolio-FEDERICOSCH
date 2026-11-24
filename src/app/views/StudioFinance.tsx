import { useCallback, useState } from 'react'
import { useStore } from '../store'
import { useStudioRead } from '../studio-data'
import { ReadStatus } from '../ui-studio/ReadStatus'
import { studioText } from '../i18n-studio'
import { operationsText } from '../i18n-studio-operations'
import { csvLine, downloadCsv } from '../csv'
import { dateKey, loadLedger, type LedgerRow } from '../ui-studio/operations'

export function StudioFinance({ invoiceId }: { invoiceId?: string }) {
  const { lang, t, be } = useStore()
  const s = operationsText[lang], labels = studioText[lang]
  const currentMonth = dateKey(new Date()).slice(0, 7)
  const [month, setMonth] = useState(currentMonth)
  const [owner, setOwner] = useState('')
  const { data, failed, refresh } = useStudioRead(useCallback(() => loadLedger(be), [be]))
  const localMonth = (row: LedgerRow) => dateKey(new Date(row.at)).slice(0, 7)
  const monthLabel = (key: string) => new Date(key + '-01T12:00').toLocaleDateString(lang, { month: 'long', year: 'numeric' })
  const money = (cents: number, currency: string) => (cents / 100).toLocaleString(lang, { style: 'currency', currency, currencyDisplay: 'code' })
  const statuses: Record<string, string> = { paid: labels.paid, refunded: labels.refunded, unpaid: labels.unpaid }
  const status = (key: string) => statuses[key] ?? key
  const rows = (data ?? []).filter(i => (!month || localMonth(i) === month) && (!owner || i.owner === owner))
  const invoice = data?.find(i => i.id === invoiceId)
  const months = Array.from(new Set([currentMonth, ...(data ?? []).map(localMonth)])).sort().reverse()
  const accounts = Array.from(new Map((data ?? []).map(i => [i.owner, i])).values()).sort((a, b) => a.name.localeCompare(b.name, lang))
  const totals = new Map<string, number>()
  for (const i of rows) totals.set(i.currency, (totals.get(i.currency) ?? 0) + (i.status === 'paid' ? i.cents : 0))

  function download() {
    const header = [s.invoice, s.date, s.account, s.email, s.amount, s.currency, s.status, 'ID']
    const lines = rows.map(i => [i.label, dateKey(new Date(i.at)), i.name, i.email, (i.cents / 100).toFixed(2), i.currency, status(i.status), i.id])
    downloadCsv('studio-' + (month || 'invoices') + '.csv', [header, ...lines].map(csvLine))
  }
  return <section className="ops ops__finance">
    <header className="ap-head"><div><p className="mono ap-kicker">{t.studio}</p><h1 className="d">{s.finance}</h1></div>
      <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={refresh}>{labels.refresh}</button></header>
    {failed || !data ? <ReadStatus subject={s.finance} failed={failed} retry={refresh} /> : invoiceId ? <article className="card">
      <p><a href="#/admin/finance">{s.allInvoices}</a></p>
      {invoice ? <><header className="card__h"><h2>{invoice.label}</h2><span className="pill">{status(invoice.status)}</span></header>
        <dl><div><dt>{s.amount}</dt><dd>{money(invoice.cents, invoice.currency)}</dd></div>
          <div><dt>{s.date}</dt><dd>{new Date(invoice.at).toLocaleDateString(lang)}</dd></div>
          <div><dt>{s.account}</dt><dd><a href={'#/admin/clients/' + invoice.owner}>{invoice.name}</a></dd></div>
          <div><dt>{s.invoice}</dt><dd>{invoice.id}</dd></div></dl>
        <p><a href={'#/admin/changes/' + invoice.owner}>{s.accountChanges}</a></p>
        {invoice.url && /^https?:\/\//i.test(invoice.url) && <a href={invoice.url} target="_blank" rel="noreferrer">{labels.receipt}</a>}
      </> : <p>{s.missingInvoice}</p>}
    </article> : !data.length ? <p className="card">{t.studioRead.invoices}</p> : <div className="card">
      <header className="card__h"><h2>{s.ledger}</h2><button className="ap-btn ap-btn--sm" disabled={!rows.length} onClick={download}>{s.exportCsv}</button></header>
      <div className="ops__controls"><label>{s.month}<select aria-label={s.month} value={month} onChange={e => setMonth(e.target.value)}>
        <option value="">{s.allMonths}</option>{months.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}</select></label>
        <label>{s.account}<select aria-label={s.account} value={owner} onChange={e => setOwner(e.target.value)}><option value="">{t.priorities.all}</option>
          {accounts.map(a => <option key={a.owner} value={a.owner}>{a.name}{a.name !== a.email && ' · ' + a.email}</option>)}</select></label></div>
      <div className="ops__collected"><span>{s.collected} · {month ? monthLabel(month) : s.allMonths}</span>
        <strong>{totals.size ? [...totals].map(([currency, cents]) => money(cents, currency)).join(' / ') : money(0, 'USD')}</strong></div>
      {rows.length ? <ul className="ops__list">{rows.map(i => <li key={i.id} className="ops__entry">
        <div><a href={'#/admin/finance/' + i.id}>{i.label}</a><small>{i.name} · {new Date(i.at).toLocaleDateString(lang)}</small></div>
        <div><b>{money(i.cents, i.currency)}</b><small>{status(i.status)}</small></div>
      </li>)}</ul> : <p>{s.noInvoices} <button type="button" className="ap-btn ap-btn--sm" onClick={() => { setMonth(''); setOwner('') }}>{t.studioRead.clear}</button></p>}
    </div>}
  </section>
}
