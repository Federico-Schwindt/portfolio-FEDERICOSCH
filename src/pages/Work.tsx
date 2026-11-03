import { useEffect, useRef } from 'react'
import { projects } from '../content'
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
      const splits = Array.from(el.querySelectorAll<HTMLElement>('.page__title .line')).map((l, i) =>
        revealChars(l, { immediate: true, delay: 0.3 + i * 0.1 }),
      )
      fadeUp(el.querySelectorAll('.page__intro, .page__kicker'), { immediate: true, delay: 0.7 })
      el.querySelectorAll<HTMLElement>('.wcard').forEach((c) => fadeUp(c, { trigger: c, y: 50, start: 'top 90%' }))
      // 3D tilt
      el.querySelectorAll<HTMLElement>('.wcard').forEach((c) => {
        const media = c.querySelector<HTMLElement>('.wcard__media')!
        const rx = gsap.quickTo(media, 'rotationX', { duration: 0.6, ease: 'power3' })
        const ry = gsap.quickTo(media, 'rotationY', { duration: 0.6, ease: 'power3' })
        c.addEventListener('pointermove', (e) => {
          const r = c.getBoundingClientRect()
          rx(-((e.clientY - r.top) / r.height - 0.5) * 10)
          ry(((e.clientX - r.left) / r.width - 0.5) * 12)
        })
        c.addEventListener('pointerleave', () => {
          rx(0)
          ry(0)
        })
      })
      return () => splits.forEach((s) => s.revert())
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="page page--work" ref={root}>
      <header className="page__head">
        <p className="label page__kicker">
          <span className="index">({projects.length})</span> Selected work
        </p>
        <h1 className="page__title">
          <span className="line split-wait">Work that</span>
          <span className="line split-wait">performs</span>
        </h1>
        <p className="page__intro">
          E-commerce, brand sites and campaigns for clients in the United States, Israel and Argentina. Every project below was designed, built
          and measured by me.
        </p>
      </header>
      <div className="wgrid">
        {projects.map((p, i) => (
          <TLink to={`/work/${p.slug}`} className={`wcard ${p.featured ? 'wcard--featured' : ''}`} key={p.slug} cursor="view">
            <div className="wcard__media" style={{ ['--c' as string]: p.color }}>
              <img src={base + p.cover} alt={`${p.title} — ${p.category}`} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
              <span className="wcard__index label">{p.index}</span>
            </div>
            <div className="wcard__meta">
              <h2 className="wcard__title">{p.title}</h2>
              <span className="label">{p.category}</span>
              <span className="label">{p.year}</span>
            </div>
            {p.stats && <p className="wcard__stat">{p.stats[0].value} <span>{p.stats[0].label}</span></p>}
          </TLink>
        ))}
      </div>
      <Footer />
    </section>
  )
}
