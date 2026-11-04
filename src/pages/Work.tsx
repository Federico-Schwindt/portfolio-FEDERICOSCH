import { useEffect, useRef } from 'react'
import { projects, workIntro } from '../content'
import { TLink } from '../components/TLink'
import { Footer } from '../components/Footer'
import { gsap } from '../lib/gsap'
import { fadeUp, revealChars } from '../lib/reveal'

const base = import.meta.env.BASE_URL

export function Work() {
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = root.current!
    const ctx = gsap.context(() => {
      const splits = Array.from(el.querySelectorAll<HTMLElement>('.page__title .line')).map((l, i) => revealChars(l, { immediate: true, delay: 0.3 + i * 0.1 }))
      fadeUp(el.querySelectorAll('.page__intro, .page__kicker'), { immediate: true, delay: 0.7 })
      el.querySelectorAll<HTMLElement>('.wcard').forEach((c) => fadeUp(c, { trigger: c, y: 50, start: 'top 90%' }))
      return () => splits.forEach((s) => s.revert())
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="page page--work" ref={root}>
      <header className="page__head">
        <p className="mono page__kicker">({projects.length}) Selected work</p>
        <h1 className="page__title">
          <span className="line split-wait">Selected</span>
          <span className="line split-wait">
            <em>Work</em>
          </span>
        </h1>
        <p className="page__intro">{workIntro}</p>
      </header>
      <div className="wgrid">
        {projects.map((p, i) => (
          <TLink to={`/work/${p.slug}`} className={`wcard ${p.featured ? 'wcard--featured' : ''}`} key={p.slug} cursor="view">
            <div className="wcard__media">
              <img src={base + p.cover} alt={`${p.title}: ${p.category}`} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
              <span className="wcard__index mono">{p.index}</span>
            </div>
            <div className="wcard__meta">
              <h2 className="wcard__title">{p.title}</h2>
              <span className="mono">{p.tags}</span>
              <span className="mono">{p.year}</span>
            </div>
            {p.stats && (
              <p className="wcard__stat">
                {p.stats[0].value} <span>{p.stats[0].label}</span>
              </p>
            )}
          </TLink>
        ))}
      </div>
      <Footer />
    </section>
  )
}
