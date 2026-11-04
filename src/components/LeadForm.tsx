import { useEffect, useId, useState } from 'react'
import { useSearchParams } from 'react-router'
import { site } from '../content'
import { apiConfigured, mailtoFor, submitLead, uploadBrief, type LeadInput } from '../lib/api'

type Variant = 'contact' | 'audit'
type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'done'; mailto?: string } | { kind: 'error'; message: string; mailto: string }

const PACKAGES = [
  { value: '', label: 'Not sure yet' },
  { value: 'launch', label: 'Launch · $300 + $50/mo' },
  { value: 'grow', label: 'Grow · $500 + $80/mo' },
  { value: 'scale', label: 'Scale · $750 + $100/mo' },
]
const BUDGETS = ['', 'Under $500', '$500 – $1,500', '$1,500 – $5,000', '$5,000+']

/**
 * Lead capture form. Posts to the Neon Function (src/lib/api.ts) and stores the lead in Postgres;
 * when the API is not configured or unreachable it falls back to a pre-filled email.
 */
export function LeadForm({ variant = 'contact', compact = false }: { variant?: Variant; compact?: boolean }) {
  const id = useId()
  const [params] = useSearchParams()
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({ name: '', email: '', company: '', website: '', package: '', budget: '', message: '', company_url: '' })

  useEffect(() => {
    const pkg = params.get('package')
    if (pkg && PACKAGES.some((p) => p.value === pkg)) setForm((f) => ({ ...f, package: pkg }))
  }, [params])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const input: LeadInput = {
      source: variant === 'audit' ? 'audit' : form.package ? 'pricing' : 'contact',
      name: form.name,
      email: form.email,
      company: form.company,
      website: form.website,
      package: (form.package || (variant === 'audit' ? '' : 'unsure')) as LeadInput['package'],
      budget: form.budget,
      message: form.message || (variant === 'audit' ? `Please audit ${form.website}` : ''),
      company_url: form.company_url,
    }
    const mailto = mailtoFor(site.email, input)
    if (!apiConfigured) {
      window.location.href = mailto
      setStatus({ kind: 'done', mailto })
      return
    }
    setStatus({ kind: 'sending' })
    const r = await submitLead(input)
    if (!r.ok) {
      setStatus({ kind: 'error', message: r.error, mailto })
      return
    }
    if (file && r.id) await uploadBrief(r.id, file)
    setStatus({ kind: 'done' })
  }

  if (status.kind === 'done')
    return (
      <div className="lead lead--done" role="status">
        <p className="lead__thanks">
          Thank you, {form.name.split(' ')[0] || 'friend'}. <em>{variant === 'audit' ? 'Your audit is in the queue.' : 'Message received.'}</em>
        </p>
        <p>
          {status.mailto
            ? 'Your email app should have opened with the message ready to send.'
            : variant === 'audit'
              ? 'I will review your site and reply to your inbox within 48 hours.'
              : 'I usually reply within one business day. Check your inbox (and the spam folder, just in case).'}
        </p>
      </div>
    )

  return (
    <form className={`lead contact__form ${compact ? 'lead--compact' : ''}`} onSubmit={submit} noValidate={false}>
      <div className="lead__row">
        <label>
          <span className="mono">Name</span>
          <input value={form.name} onChange={set('name')} placeholder="Your name" autoComplete="name" required />
        </label>
        <label>
          <span className="mono">Email</span>
          <input type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" autoComplete="email" required />
        </label>
      </div>
      {variant === 'audit' ? (
        <label>
          <span className="mono">Your website</span>
          <input type="url" value={form.website} onChange={set('website')} placeholder="https://yourbusiness.com" inputMode="url" required />
        </label>
      ) : (
        <>
          <div className="lead__row">
            <label>
              <span className="mono">Company (optional)</span>
              <input value={form.company} onChange={set('company')} placeholder="Business name" autoComplete="organization" />
            </label>
            <label>
              <span className="mono">Current website (optional)</span>
              <input type="url" value={form.website} onChange={set('website')} placeholder="https://" inputMode="url" />
            </label>
          </div>
          <div className="lead__row">
            <label>
              <span className="mono">Package</span>
              <select value={form.package} onChange={set('package')}>
                {PACKAGES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mono">Budget</span>
              <select value={form.budget} onChange={set('budget')}>
                {BUDGETS.map((b) => (
                  <option key={b} value={b}>
                    {b || 'Prefer not to say'}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}
      <label>
        <span className="mono">{variant === 'audit' ? 'Anything I should know? (optional)' : 'Project'}</span>
        <textarea
          rows={variant === 'audit' ? 3 : 6}
          value={form.message}
          onChange={set('message')}
          placeholder={variant === 'audit' ? 'Goals, competitors, what is not working…' : 'What are we building, by when, and what does success look like?'}
          required={variant !== 'audit'}
        />
      </label>
      {variant === 'contact' && apiConfigured && (
        <label className="lead__file">
          <span className="mono">Brief or logo (optional, max 10 MB)</span>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.svg,.zip,.txt" />
        </label>
      )}
      {/* honeypot: hidden from people, irresistible to bots */}
      <label className="lead__hp" aria-hidden="true" htmlFor={`${id}-hp`}>
        Company URL
        <input id={`${id}-hp`} tabIndex={-1} autoComplete="off" value={form.company_url} onChange={set('company_url')} />
      </label>
      <button type="submit" className="pill" data-cursor="link" disabled={status.kind === 'sending'}>
        <em>{status.kind === 'sending' ? 'Sending…' : variant === 'audit' ? 'Get my free audit →' : 'Send message →'}</em>
      </button>
      {status.kind === 'error' && (
        <p className="lead__error mono" role="alert">
          {status.message}. <a href={status.mailto}>Send it by email instead →</a>
        </p>
      )}
      <p className="mono lead__fine">{apiConfigured ? 'Goes straight to my inbox. No newsletter, no spam.' : 'Opens your email app with the message pre-filled.'}</p>
    </form>
  )
}
