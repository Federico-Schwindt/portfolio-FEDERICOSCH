import { useEffect, useRef, useState } from 'react'
import { contact, site, socials } from '../content'
import { gsap } from '../lib/gsap'
import { fadeUp, revealChars } from '../lib/reveal'
import { Footer } from '../components/Footer'
import { LeadForm } from '../components/LeadForm'
import { breadcrumbLd, personLd, useSeo } from '../lib/seo'

export function Contact() {
  const root = useRef<HTMLElement>(null)
  const [copied, setCopied] = useState(false)
  useSeo({
    title: 'Contact · Hire a web designer & developer | Federico Schwindt',
    description: `Tell me about your project: websites, online stores, SEO and ads. Packages from $300 + $50/month. Based in ${site.city}, working worldwide in English and Spanish.`,
    path: '/contact',
    jsonLd: [
      { ...personLd, '@type': 'Person' },
      breadcrumbLd([
        { name: 'Home', path: '/' },
        { name: 'Contact', path: '/contact' },
      ]),
    ],
  })

  useEffect(() => {
    const el = root.current!
    const ctx = gsap.context(() => {
      const splits = Array.from(el.querySelectorAll<HTMLElement>('.page__title .line')).map((l, i) => revealChars(l, { immediate: true, delay: 0.3 + i * 0.1 }))
      fadeUp(el.querySelectorAll('.page__kicker, .lead > *, .contact__aside > *'), { immediate: true, delay: 0.55, stagger: 0.06 })
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

  return (
    <section className="page page--contact" ref={root}>
      <header className="page__head">
        <p className="mono page__kicker">
          <i className="dot" /> {site.availability}
        </p>
        <h1 className="page__title">
          <span className="line split-wait">{contact.title}</span>{' '}
          <span className="line split-wait">
            <em>Let’s talk.</em>
          </span>
        </h1>
      </header>
      <div className="contact__page">
        <LeadForm variant="contact" />
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
