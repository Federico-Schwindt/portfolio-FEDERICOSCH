import { useCallback, useEffect, useMemo, useState } from 'react'
import { createAuthClient } from '@neon/auth'
import { createRealtimeClient, type SealedLiveQuery } from '@neon/realtime/client'
import { RealtimeProvider, useLiveQuery } from '@neon/realtime-react'
import { API_URL } from '../../lib/api'

/**
 * /admin — the lead inbox. Not linked anywhere and marked noindex.
 *
 * Sign-in: Neon Auth (managed Better Auth). The API function verifies the JWT and checks the
 * email against ADMIN_EMAILS before returning any lead.
 * Live list: the API seals a Realtime query; the browser subscribes and the list updates as
 * leads arrive. Without Realtime configured it falls back to polling every 20 s.
 */

type Lead = {
  id: string
  created_at: string
  source: string
  status: string
  name: string
  email: string
  company: string | null
  website: string | null
  package: string | null
  budget: string | null
  message: string | null
  page: string | null
  brief_key: string | null
  brief_name: string | null
  notes: string | null
}

const AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL as string | undefined
const REALTIME_URL = import.meta.env.VITE_NEON_REALTIME_URL as string | undefined
const auth = AUTH_URL ? createAuthClient(AUTH_URL) : null
const realtime = REALTIME_URL ? createRealtimeClient({ url: REALTIME_URL }) : null
const STATUSES = ['new', 'contacted', 'won', 'lost']

/** JWT for the API: Better Auth's JWT plugin exposes it as `token()` on Neon Auth. */
async function getJwt(): Promise<string | null> {
  if (!auth) return null
  const client = auth as unknown as { token?: () => Promise<{ data?: { token?: string } | null }> }
  if (client.token) {
    const r = await client.token()
    if (r.data?.token) return r.data.token
  }
  return null
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const jwt = await getJwt()
  const r = await fetch(new URL(path, API_URL), { ...init, headers: { 'Content-Type': 'application/json', ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}), ...init.headers } })
  const data = (await r.json().catch(() => ({}))) as T & { error?: string }
  if (!r.ok) throw new Error(data.error ?? `Request failed (${r.status})`)
  return data
}

function SignIn({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!auth) return
    setBusy(true)
    setError('')
    const r = mode === 'in' ? await auth.signIn.email({ email: form.email, password: form.password }) : await auth.signUp.email({ email: form.email, password: form.password, name: form.name || form.email })
    setBusy(false)
    if (r.error) setError(r.error.message ?? 'Could not sign in')
    else onDone()
  }
  return (
    <form className="lead contact__form admin__signin" onSubmit={submit}>
      {mode === 'up' && (
        <label>
          <span className="mono">Name</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" />
        </label>
      )}
      <label>
        <span className="mono">Email</span>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required />
      </label>
      <label>
        <span className="mono">Password</span>
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} minLength={8} required />
      </label>
      <button className="pill" type="submit" disabled={busy}>
        <em>{busy ? '…' : mode === 'in' ? 'Sign in →' : 'Create admin account →'}</em>
      </button>
      {error && <p className="lead__error mono">{error}</p>}
      <button type="button" className="mono admin__switch" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
        {mode === 'in' ? 'First time? Create the admin account' : 'Have an account? Sign in'}
      </button>
    </form>
  )
}

function LeadRow({ lead, onStatus }: { lead: Lead; onStatus: (id: string, status: string) => void }) {
  const [open, setOpen] = useState(false)
  const download = async () => {
    const { url } = await api<{ url: string }>(`leads/${lead.id}/brief`)
    window.open(url, '_blank', 'noopener')
  }
  return (
    <li className={`admin__lead is-${lead.status}`}>
      <button className="admin__leadhead" onClick={() => setOpen(!open)}>
        <span className="mono">{new Date(lead.created_at).toLocaleString()}</span>
        <strong>{lead.name}</strong>
        <span>{lead.email}</span>
        <span className="mono">{lead.source}{lead.package ? ` · ${lead.package}` : ''}</span>
        <span className={`mono admin__status admin__status--${lead.status}`}>{lead.status}</span>
      </button>
      {open && (
        <div className="admin__leadbody">
          {lead.company && <p><span className="mono">Company</span> {lead.company}</p>}
          {lead.website && <p><span className="mono">Website</span> <a href={lead.website} target="_blank" rel="noreferrer">{lead.website}</a></p>}
          {lead.budget && <p><span className="mono">Budget</span> {lead.budget}</p>}
          {lead.message && <p className="admin__msg">{lead.message}</p>}
          {lead.brief_key && (
            <button className="mono admin__switch" onClick={download}>Download {lead.brief_name ?? 'attachment'} ↓</button>
          )}
          <div className="admin__actions">
            <a className="pill" href={`mailto:${lead.email}?subject=${encodeURIComponent('Re: your website enquiry')}`}><em>Reply by email</em></a>
            {STATUSES.map((s) => (
              <button key={s} className={`mono admin__chip ${lead.status === s ? 'is-on' : ''}`} onClick={() => onStatus(lead.id, s)}>{s}</button>
            ))}
          </div>
        </div>
      )}
    </li>
  )
}

function LeadList({ leads, onStatus, live }: { leads: Lead[]; onStatus: (id: string, status: string) => void; live: string }) {
  const counts = useMemo(() => STATUSES.map((s) => [s, leads.filter((l) => l.status === s).length] as const), [leads])
  return (
    <>
      <div className="admin__bar mono">
        <span>{leads.length} leads</span>
        {counts.map(([s, n]) => <span key={s}>{s}: {n}</span>)}
        <span className={`admin__live admin__live--${live}`}>● {live}</span>
      </div>
      <ul className="admin__list">
        {leads.map((l) => <LeadRow key={l.id} lead={l} onStatus={onStatus} />)}
        {leads.length === 0 && <li className="mono">No leads yet. They will appear here the moment someone submits a form.</li>}
      </ul>
    </>
  )
}

function LiveLeads({ initial, onStatus }: { initial: SealedLiveQuery<Lead>; onStatus: (id: string, status: string) => void }) {
  const refreshQuery = useCallback(() => api<SealedLiveQuery<Lead>>('leads/live', { method: 'POST' }), [])
  const { data, status } = useLiveQuery(initial, { refreshQuery })
  return <LeadList leads={[...(data ?? [])]} onStatus={onStatus} live={status} />
}

function Inbox() {
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [sealed, setSealed] = useState<SealedLiveQuery<Lead> | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const r = await api<{ leads: Lead[] }>('leads')
      setLeads(r.leads)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load leads')
    }
  }, [])

  useEffect(() => {
    void load()
    if (realtime) api<SealedLiveQuery<Lead>>('leads/live', { method: 'POST' }).then(setSealed).catch(() => setSealed(null))
  }, [load])

  // polling fallback when Realtime is not available
  useEffect(() => {
    if (sealed) return
    const t = window.setInterval(load, 20000)
    return () => window.clearInterval(t)
  }, [sealed, load])

  const onStatus = async (id: string, status: string) => {
    setLeads((ls) => ls?.map((l) => (l.id === id ? { ...l, status } : l)) ?? ls)
    try {
      await api(`leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
      void load()
    }
  }

  if (error) return <p className="lead__error mono">{error}. Only emails listed in ADMIN_EMAILS can read leads.</p>
  if (sealed && realtime)
    return (
      <RealtimeProvider client={realtime}>
        <LiveLeads initial={sealed} onStatus={onStatus} />
      </RealtimeProvider>
    )
  if (!leads) return <p className="mono">Loading…</p>
  return <LeadList leads={leads} onStatus={onStatus} live="polling" />
}

export default function Admin() {
  const [session, setSession] = useState<{ email: string } | null | undefined>(undefined)

  const refresh = useCallback(async () => {
    if (!auth) return setSession(null)
    const r = await auth.getSession()
    setSession(r.data?.user ? { email: r.data.user.email } : null)
  }, [])
  useEffect(() => {
    void refresh()
  }, [refresh])

  const missing = [!API_URL && 'VITE_API_URL', !AUTH_URL && 'VITE_NEON_AUTH_URL'].filter(Boolean)

  return (
    <section className="page page--admin">
      <header className="page__head">
        <p className="mono page__kicker">Private · noindex</p>
        <h1 className="page__title">
          <span className="line">Lead</span>{' '}
          <span className="line"><em>inbox</em></span>
        </h1>
        {session && (
          <p className="mono">
            Signed in as {session.email} ·{' '}
            <button className="admin__switch mono" onClick={() => auth?.signOut().then(() => window.location.reload())}>Sign out</button>
          </p>
        )}
      </header>
      <div className="admin">
        {missing.length > 0 ? (
          <p className="lead__error mono">Not configured: set {missing.join(' and ')} at build time (see README, “Neon”).</p>
        ) : session === undefined ? (
          <p className="mono">Checking session…</p>
        ) : session === null ? (
          <SignIn onDone={refresh} />
        ) : (
          <Inbox />
        )}
      </div>
    </section>
  )
}
