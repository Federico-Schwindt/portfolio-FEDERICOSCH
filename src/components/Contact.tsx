import { useEffect, useRef } from 'react'
import { site, socials } from '../content'
import { useStore } from '../lib/store'
import { gsap } from '../lib/gsap'
import { fadeUp, revealChars } from '../lib/reveal'
import { MagneticButton } from './MagneticButton'

export function Contact() {
  const root = useRef<HTMLElement>(null)
  const lenis = useStore((s) => s.lenis)

  useEffect(() => {
    const el = root.current!
    const ctx = gsap.context(() => {
      const lines = Array.from(el.querySelectorAll<HTMLElement>('.contact__title .line'))
      const splits = lines.map((l, i) => revealChars(l, { start: 'top 85%', delay: i * 0.1, stagger: 0.03 }))
      fadeUp(el.querySelectorAll('.contact__kicker, .contact__cta > *'), { trigger: el.querySelector('.contact__cta')!, start: 'top 85%', stagger: 0.1 })
      fadeUp(el.querySelectorAll('.contact__bottom > *'), { trigger: el.querySelector('.contact__bottom')!, start: 'top 95%', stagger: 0.08, y: 20 })
      return () => splits.forEach((s) => s.revert())
    }, el)
    return () => ctx.revert()
  }, [])

  const toTop = (e: React.MouseEvent) => {
    e.preventDefault()
    lenis?.scrollTo(0, { duration: 2 })
  }

  return (
    <footer className="contact" id="contact" data-scene="contact" ref={root}>
      <div className="contact__main">
        <p className="contact__kicker label">
          <i />
          {site.availability} — Have a project in mind?
        </p>
        <h2 className="contact__title">
          <span className="line split-wait">Let's work</span>
          <span className="line split-wait">together</span>
        </h2>
        <div className="contact__cta">
          <MagneticButton href={`mailto:${site.email}`} className="btn btn--lg">
            {site.email}
          </MagneticButton>
          <p className="contact__note">
            Tell me about your project, your timeline and your ambition. <em>I'll reply within 24 hours.</em>
          </p>
        </div>
      </div>

      <div className="contact__bottom label">
        <div className="contact__col">
          <span className="contact__head">Socials</span>
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" data-cursor="link">
              {s.label}
            </a>
          ))}
        </div>
        <div className="contact__col">
          <span className="contact__head">Location</span>
          <span>{site.location}</span>
          <span>Working worldwide</span>
        </div>
        <div className="contact__col">
          <span className="contact__head">Services</span>
          <span>Development</span>
          <span>Design</span>
          <span>Marketing</span>
        </div>
        <div className="contact__col contact__col--end">
          <a href="#top" onClick={toTop} data-cursor="link">
            Begin again ↑
          </a>
          <span>
            © {site.year} {site.name}
          </span>
        </div>
      </div>
    </footer>
  )
}
