import { useEffect, useRef } from 'react'
import { about, site, socials } from '../content'
import { Footer } from '../components/Footer'
import { Marquee } from '../components/Marquee'
import { tools } from '../content'
import { gsap } from '../lib/gsap'
import { fadeUp, revealChars, revealLines } from '../lib/reveal'

const base = import.meta.env.BASE_URL

export function About() {
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = root.current!
    const ctx = gsap.context(() => {
      const splits = [
        ...Array.from(el.querySelectorAll<HTMLElement>('.page__title .line')).map((l, i) => revealChars(l, { immediate: true, delay: 0.3 + i * 0.1 })),
        revealLines(el.querySelector<HTMLElement>('.about__intro')!, { immediate: true, delay: 0.7 }),
        ...Array.from(el.querySelectorAll<HTMLElement>('.about__bio p')).map((p) => revealLines(p, { start: 'top 90%' })),
      ]
      gsap.fromTo(el.querySelector('.about__photo'), { clipPath: 'inset(100% 0 0 0)', scale: 1.1 }, { clipPath: 'inset(0% 0 0 0)', scale: 1, duration: 1.6, ease: 'power4.out', delay: 0.5 })
      fadeUp(el.querySelectorAll('.fact'), { trigger: el.querySelector('.about__facts')!, stagger: 0.1 })
      fadeUp(el.querySelectorAll('.skill'), { trigger: el.querySelector('.about__skills')!, stagger: 0.1 })
      el.querySelectorAll<HTMLElement>('.tl').forEach((t) => fadeUp(t, { trigger: t, y: 40 }))
      return () => splits.forEach((s) => s.revert())
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="page page--about" ref={root}>
      <header className="page__head page__head--about">
        <p className="mono page__kicker">
          <span className="index">02</span> About
        </p>
        <h1 className="page__title">
          <span className="line split-wait">Design.</span>
          <span className="line split-wait">Code. Growth.</span>
        </h1>
        <p className="about__intro split-wait">{about.intro}</p>
      </header>

      <div className="about__grid">
        <div className="about__photo">
          <img src={base + 'char/portrait.jpg'} alt={site.name} />
          <span className="about__caption label">{site.name} — {site.city}</span>
        </div>
        <div className="about__bio">
          {about.bio.map((p) => (
            <p key={p.slice(0, 20)} className="split-wait">
              {p}
            </p>
          ))}
          <div className="about__links">
            {socials.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="btn btn--ghost" data-cursor="link">
                {s.label} ↗
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="about__facts">
        {about.facts.map((f) => (
          <div className="fact" key={f.label}>
            <div className="fact__value">{f.value}</div>
            <div className="label">{f.label}</div>
          </div>
        ))}
      </div>

      <div className="about__skills">
        {about.skills.map((s) => (
          <div className="skill" key={s.title}>
            <h3 className="label skill__title">{s.title}</h3>
            <ul>
              {s.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="about__timeline">
        <p className="mono page__kicker">
          <span className="index">—</span> Timeline
        </p>
        {about.timeline.map((t) => (
          <div className="tl" key={t.year}>
            <span className="tl__year">{t.year}</span>
            <h3 className="tl__title">{t.title}</h3>
            <p className="tl__text">{t.text}</p>
          </div>
        ))}
      </div>

      <Marquee items={tools} size="sm" speed={40} />
      <Footer />
    </section>
  )
}
