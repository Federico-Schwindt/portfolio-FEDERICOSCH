import { apiConfigured, mailtoFor, submitLead, uploadBrief, type LeadInput } from '../lib/api'

/** Lead forms: API first, pre-filled email as the fallback. */
document.querySelectorAll<HTMLFormElement>('form[data-lead]').forEach((form) => {
  const variant = form.dataset.lead as 'contact' | 'audit'
  const btn = form.querySelector<HTMLButtonElement>('button[type=submit]')!
  const label = btn.querySelector('span')!
  const err = form.querySelector<HTMLElement>('[data-error]')!

  // ?package=grow preselects the package (links from the pricing cards)
  const pkg = new URLSearchParams(location.search).get('package')
  const sel = form.querySelector<HTMLSelectElement>('select[name=package]')
  if (pkg && sel && [...sel.options].some((o) => o.value === pkg)) sel.value = pkg

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    err.hidden = true
    const bad = [...form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[required]')].filter((i) => !i.checkValidity())
    form.querySelectorAll('.input').forEach((i) => i.removeAttribute('aria-invalid'))
    if (bad.length) {
      bad.forEach((i) => i.setAttribute('aria-invalid', 'true'))
      bad[0].focus()
      err.textContent = 'Please fill in the highlighted fields.'
      err.hidden = false
      return
    }
    const v = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | null)?.value.trim() ?? ''
    const input: LeadInput = {
      source: variant === 'audit' ? 'audit' : v('package') ? 'pricing' : 'contact',
      name: v('name'),
      email: v('email'),
      company: v('company'),
      website: v('website'),
      package: (v('package') || (variant === 'audit' ? '' : 'unsure')) as LeadInput['package'],
      budget: v('budget'),
      message: v('message') || (variant === 'audit' ? `Please audit ${v('website')}` : ''),
      company_url: v('company_url'),
    }
    const mailto = mailtoFor(form.dataset.email!, input)
    const done = (msg: string) => {
      const first = input.name.split(' ')[0] || 'friend'
      form.outerHTML = `<div class="form__done" role="status"><strong>Thank you, ${first.replace(/[<>&"]/g, '')}.</strong><p>${msg}</p></div>`
    }
    if (!apiConfigured) {
      location.href = mailto
      done('Your email app should have opened with the message ready to send.')
      return
    }
    btn.disabled = true
    label.textContent = 'Sending…'
    const r = await submitLead(input)
    if (!r.ok) {
      btn.disabled = false
      label.textContent = btn.dataset.label!
      err.innerHTML = `${r.error}. <a href="${mailto}">Send it by email instead →</a>`
      err.hidden = false
      return
    }
    const file = (form.elements.namedItem('brief') as HTMLInputElement | null)?.files?.[0]
    if (file && r.id) await uploadBrief(r.id, file)
    done(variant === 'audit' ? 'Your audit is in the queue. I will review your site and reply within 48 hours.' : 'Message received. I usually reply within one business day; check the spam folder, just in case.')
  })
})
