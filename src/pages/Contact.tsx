import { useEffect, useRef, useState } from 'react'
import { site, socials } from '../content'
import { gsap } from '../lib/gsap'
import { fadeUp, revealChars } from '../lib/reveal'
import { MagneticButton } from '../components/MagneticButton'

function useLocalTime() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: site.timeZone, hour: '2-digit', minute: '2-digit', hour12: false })
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = window.setInterval(tick, 10000)
    return () => window.clearInterval(id)
  }, [])
  return time
}

export function Contact() {
  const root = useRef<HTMLElement>(null)
  const time = useLocalTime()
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  useEffect(() => {
    const el = root.current!
    const ctx = gsap.context(() => {
      const splits = Array.from(el.querySelectorAll<HTMLElement>('.page__title .line')).map((l, i) => revealChars(l, { immediate: true, delay: 0.3 + i * 0.1 }))
      fadeUp(el.querySelectorAll('.page__kicker, .contact__form > *, .contact__aside > *'), { immediate: true, delay: 0.6, stagger: 0.06 })
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
          <span className="index">04</span> <i className="dot" /> {site.availability}
        </p>
        <h1 className="page__title">
          <span className="line split-wait">Start a</span>
          <span className="line split-wait">project</span>
        </h1>
      </header>

      <div className="contact__grid">
        <form className="contact__form" onSubmit={submit}>
          <label>
            <span className="label">Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" required />
          </label>
          <label>
            <span className="label">Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" required />
          </label>
          <label>
            <span className="label">Project</span>
            <textarea rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="What are we building, by when, and what does success look like?" required />
          </label>
          <button type="submit" className="btn btn--lg" data-cursor="link">
            Send message →
          </button>
          <p className="contact__note label">Opens your email client with the message pre-filled.</p>
        </form>

        <aside className="contact__aside">
          <div>
            <span className="label">Email</span>
            <MagneticButton href={`mailto:${site.email}`} className="contact__email">
              {site.email}
            </MagneticButton>
            <button className="contact__copy label" onClick={copy} data-cursor="link">
              {copied ? 'Copied ✓' : 'Copy address'}
            </button>
          </div>
          <div>
            <span className="label">Socials</span>
            <ul className="contact__socials">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" data-cursor="link">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <span className="label">Location</span>
            <p>
              {site.city}
              <br />
              Local time {time}
            </p>
          </div>
          <div>
            <span className="label">Studio</span>
            <p>
              {site.agency}
              <br />
              Working worldwide, remote-first
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
}
