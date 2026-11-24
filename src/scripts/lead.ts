import { apiConfigured, mailtoFor, submitLead, uploadBrief, type LeadInput } from '../lib/api'

/** Lead forms: API first, pre-filled email as the fallback. */
const ES = document.documentElement.lang === 'es'
const M = ES
  ? { about: 'Sobre el caso', fill: 'Completa los campos marcados.', mail: 'Tu app de correo debería haberse abierto con el mensaje listo para enviar.', sending: 'Enviando...', byEmail: 'Envíalo por email', thanks: 'Gracias', audit: 'Tu auditoría está en la fila. Reviso tu sitio y te respondo en 48 horas.', sent: 'Mensaje recibido. Suelo responder en un día hábil; revisa la carpeta de spam, por las dudas.' }
  : { about: 'About the case', fill: 'Please fill in the highlighted fields.', mail: 'Your email app should have opened with the message ready to send.', sending: 'Sending...', byEmail: 'Send it by email instead', thanks: 'Thank you', audit: 'Your audit is in the queue. I will review your site and reply within 48 hours.', sent: 'Message received. I usually reply within one business day; check the spam folder, just in case.' }
document.querySelectorAll<HTMLFormElement>('form[data-lead]').forEach((form) => {
  const variant = form.dataset.lead as 'contact' | 'audit'
  const btn = form.querySelector<HTMLButtonElement>('button[type=submit]')!
  const label = btn.querySelector('span')!
  const err = form.querySelector<HTMLElement>('[data-error]')!

  const params = new URLSearchParams(location.search)
  // context from a case study or a service page: shown in the form and sent with the message
  const ctx = [['case', 'Case'], ['service', 'Service']].map(([k, l]) => (params.get(k) ? `${l}: ${params.get(k)!.replace(/[^a-z0-9-]/gi, '').replace(/-/g, ' ')}` : '')).filter(Boolean).join(' / ')
  const caseName = params.get('case')?.replace(/[^a-z0-9-]/gi, '').replace(/-/g, ' ')
  if (caseName && variant === 'contact') { const note = document.createElement('p'); note.className = 'form__ctx'; note.textContent = `${M.about}: ${caseName}`; form.prepend(note) } // the service shows in its own field
  // ?service=branding preselects the discipline (links from the service and case pages)
  const svc = params.get('service'), ssel = form.querySelector<HTMLSelectElement>('select[name=service]')
  if (svc && ssel && [...ssel.options].some((o) => o.value === svc)) ssel.value = svc

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    err.hidden = true
    const bad = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[required]')].filter((i) => !i.checkValidity())
    form.querySelectorAll('.input').forEach((i) => i.removeAttribute('aria-invalid'))
    if (bad.length) {
      bad.forEach((i) => i.setAttribute('aria-invalid', 'true'))
      bad[0].focus()
      err.textContent = M.fill
      err.hidden = false
      return
    }
    const v = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | null)?.value.trim() ?? ''
    const input: LeadInput = {
      source: variant === 'audit' ? 'audit' : 'contact',
      name: v('name') || v('email').split('@')[0],
      email: v('email'),
      company: v('company'),
      website: v('website'),
      package: (v('package') || (variant === 'audit' ? '' : 'unsure')) as LeadInput['package'],
      budget: v('budget'),
      message: (ctx ? `[${ctx}] ` : '') + (v('service') && v('service') !== svc ? `[Needs: ${v('service').replace(/-/g, ' ')}] ` : '') + (v('message') || (variant === 'audit' ? `Please audit ${v('website')}` : '')),
      company_url: v('company_url'),
    }
    const mailto = mailtoFor(form.dataset.email!, input)
    const done = (msg: string) => {
      const first = (v('name') || '').split(' ')[0]
      form.outerHTML = `<div class="form__done" role="status"><strong>${M.thanks}${first ? ', ' + first.replace(/[<>&"]/g, '') : ''}.</strong><p>${msg}</p></div>`
    }
    if (!apiConfigured) {
      location.href = mailto
      done(M.mail)
      return
    }
    btn.disabled = true
    label.textContent = M.sending
    const r = await submitLead(input)
    if (!r.ok) {
      btn.disabled = false
      label.textContent = btn.dataset.label!
      err.innerHTML = `${r.error}. <a href="${mailto}">${M.byEmail}</a>`
      err.hidden = false
      return
    }
    // a lead only counts as confirmed when the server returns its id
    document.dispatchEvent(new CustomEvent(r.id ? 'lead:confirmed' : 'lead:unconfirmed', { detail: { id: r.id, source: input.source } }))
    const file = (form.elements.namedItem('brief') as HTMLInputElement | null)?.files?.[0]
    if (file && r.id) await uploadBrief(r.id, file)
    done(variant === 'audit' ? M.audit : M.sent)
  })
})
