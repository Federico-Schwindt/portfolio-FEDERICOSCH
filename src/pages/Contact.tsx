import { useEffect, useRef, useState } from 'react'
import { contact, site, socials } from '../content'
import { gsap } from '../lib/gsap'
import { fadeUp, revealChars } from '../lib/reveal'
import { Footer } from '../components/Footer'

export function Contact() {
  const root = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  useEffect(() => {
    const el = root.current!
    const ctx = gsap.context(() => {
      const splits = Array.from(el.querySelectorAll<HTMLElement>('.page__title .line')).map((l, i) => revealChars(l, { immediate: true, delay: 0.3 + i * 0.1 }))
      fadeUp(el.querySelectorAll('.page__kicker, .contact__form > *, .contact__aside > *'), { immediate: true, delay: 0.55, stagger: 0.06 })
      return () => splits.forEach((s) => s.revert())
    }, el)
    return () => ctx.revert()
  }, [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const subject = encodeURIComponent(`Project enquiry from ${form.name || 'your website'}`)
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name}\n${form.email}`)
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`
  }

  return (
    <section className="page page--contact" ref={root}>
      <header className="page__head">
        <p className="mono page__kicker">
          <i className="dot" /> {site.availability}
        </p>
        <h1 className="page__title">
          <span className="line split-wait">{contact.title}</span>
          <span className="line split-wait">
            <em>Let’s talk.</em>
          </span>
        </h1>
      </header>
      <div className="contact__page">
        <form className="contact__form" onSubmit={submit}>
          <label>
            <span className="mono">Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" required />
          </label>
          <label>
            <span className="mono">Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" required />
          </label>
          <label>
            <span className="mono">Project</span>
            <textarea rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="What are we building, by when, and what does success look like?" required />
          </label>
          <button type="submit" className="pill" data-cursor="link">
            <em>Send message →</em>
          </button>
          <p className="mono">Opens your email client with the message pre-filled.</p>
        </form>
        <aside className="contact__aside">
          <div>
            <span className="mono">Email</span>
            <a href={`mailto:${site.email}`} data-cursor="link">
              <em>{site.email}</em>
            </a>
            <button className="contact__copy mono" onClick={copy} data-cursor="link">
              {copied ? 'Copied ✓' : 'Copy address'}
            </button>
          </div>
          <div>
            <span className="mono">Socials</span>
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" data-cursor="link">
                {s.label} ↗
              </a>
            ))}
          </div>
          <div>
            <span className="mono">Location</span>
            <span>{site.city}</span>
            <span>{site.agency} · working worldwide</span>
          </div>
          <div>
            <span className="mono">How it works</span>
            <span>{contact.text}</span>
          </div>
        </aside>
      </div>
      <Footer />
    </section>
  )
}
