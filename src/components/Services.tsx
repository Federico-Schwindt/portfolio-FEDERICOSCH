import { useEffect, useRef, type CSSProperties } from 'react'
import { services, site } from '../content'
import { gsap } from '../lib/gsap'
import { fadeUp } from '../lib/reveal'

export function Services() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current!
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.card', el)
      cards.forEach((card, i) => {
        fadeUp(card.querySelectorAll('.card__num, .card__title, .card__kicker, .card__text, .tags, .card__link'), {
          trigger: card,
          start: 'top 72%',
          stagger: 0.08,
        })
        const next = cards[i + 1]
        if (!next) return
        gsap.to(card, {
          scale: 0.94,
          filter: 'brightness(0.5)',
          ease: 'none',
          scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 15%', scrub: true },
        })
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="services" id="services" data-scene="services" ref={root}>
      <div className="section-head">
        <span className="index">02</span>
        <span className="label">Services</span>
      </div>
      <div className="cards">
        {services.map((s, i) => (
          <article className="card" key={s.index} style={{ '--i': i } as CSSProperties}>
            <div className="card__top">
              <span className="card__num index">({s.index})</span>
              <p className="card__kicker">
                <em>{i === 0 ? 'Built to last' : i === 1 ? 'Made to be remembered' : 'Measured to grow'}</em>
              </p>
            </div>
            <h3 className="card__title">{s.title}</h3>
            <div className="card__bottom">
              <p className="card__text">{s.text}</p>
              <div className="card__aside">
                <ul className="tags">
                  {s.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <a className="card__link" href={`mailto:${site.email}`} data-cursor="link">
                  Start a project <i>→</i>
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
