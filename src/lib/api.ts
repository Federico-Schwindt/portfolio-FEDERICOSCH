/**
 * Browser client for the portfolio API (a Neon Function, see functions/api).
 * VITE_API_URL is the function's invocation URL; without it the forms fall back to mailto:.
 */
export const API_URL: string | undefined = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/?$/, '/')
export const apiConfigured = Boolean(API_URL)

export type LeadInput = {
  source: 'contact' | 'audit' | 'pricing'
  name: string
  email: string
  message?: string
  company?: string
  website?: string
  package?: 'launch' | 'grow' | 'scale' | 'unsure' | ''
  budget?: string
  page?: string
  /** honeypot, must stay empty */
  company_url?: string
}

export type LeadResult = { ok: true; id: string | null } | { ok: false; error: string }

async function call(path: string, init: RequestInit): Promise<Response> {
  if (!API_URL) throw new Error('API not configured')
  const ctrl = new AbortController()
  const t = window.setTimeout(() => ctrl.abort(), 15000)
  try {
    return await fetch(new URL(path, API_URL), { ...init, signal: ctrl.signal })
  } finally {
    window.clearTimeout(t)
  }
}

export async function submitLead(input: LeadInput): Promise<LeadResult> {
  try {
    const r = await call('leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, page: input.page ?? window.location.pathname }),
    })
    const data = (await r.json().catch(() => ({}))) as { id?: string | null; error?: string }
    if (!r.ok) return { ok: false, error: data.error ?? `Request failed (${r.status})` }
    return { ok: true, id: data.id ?? null }
  } catch (e) {
    return { ok: false, error: e instanceof Error && e.name === 'AbortError' ? 'The request timed out' : 'Could not reach the server' }
  }
}

export async function uploadBrief(leadId: string, file: File): Promise<LeadResult> {
  try {
    const fd = new FormData()
    fd.append('file', file, file.name)
    const r = await call(`leads/${leadId}/brief`, { method: 'POST', body: fd })
    const data = (await r.json().catch(() => ({}))) as { error?: string }
    if (!r.ok) return { ok: false, error: data.error ?? `Upload failed (${r.status})` }
    return { ok: true, id: leadId }
  } catch {
    return { ok: false, error: 'Could not upload the file' }
  }
}

/** mailto: fallback used when the API is not configured or unreachable. */
export function mailtoFor(email: string, input: LeadInput) {
  const subject = encodeURIComponent(input.source === 'audit' ? `Free audit request: ${input.website ?? ''}` : `Project enquiry from ${input.name || 'your website'}`)
  const lines = [input.message ?? '', '', `— ${input.name}`, input.email, input.company ?? '', input.website ?? '', input.package ? `Package: ${input.package}` : '', input.budget ? `Budget: ${input.budget}` : '']
  return `mailto:${email}?subject=${subject}&body=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`
}
