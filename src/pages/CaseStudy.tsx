import { useEffect, useRef } from 'react'
import { useParams } from 'react-router'
import { projects } from '../content'
import { TLink } from '../components/TLink'
import { Footer } from '../components/Footer'
import { NotFound } from './NotFound'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { fadeUp, revealChars, revealLines } from '../lib/reveal'

const base = import.meta.env.BASE_URL

export function CaseStudy() {
  const { slug } = useParams()
  const project = projects.find((p) => p.slug === slug)
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!project) return
    const el = root.current!
    const ctx = gsap.context(() => {
      const splits = [
        revealChars(el.querySelector<HTMLElement>('.case__title')!, { immediate: true, delay: 0.35 }),
        ...Array.from(el.querySelectorAll<HTMLElement>('.case__p')).map((p) => revealLines(p, { start: 'top 90%' })),
      ]
      fadeUp(el.querySelectorAll('.case__kicker, .case__meta > *'), { immediate: true, delay: 0.6, stagger: 0.06 })
      gsap.fromTo(el.querySelector('.case__cover img'), { scale: 1.15, yPercent: -6 }, { scale: 1, yPercent: 6, ease: 'none', scrollTrigger: { trigger: el.querySelector('.case__cover'), start: 'top bottom', end: 'bottom top', scrub: true } })
      el.querySelectorAll<HTMLElement>('.case__stat').forEach((s) => fadeUp(s, { trigger: s, y: 40 }))
      el.querySelectorAll<HTMLElement>('.case__img').forEach((img) => {
        fadeUp(img, { trigger: img, y: 60, start: 'top 92%' })
        gsap.fromTo(img.querySelector('img'), { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
      fadeUp(el.querySelectorAll('.case__h'), { trigger: el.querySelector('.case__body')!, start: 'top 85%', stagger: 0.1 })
      ScrollTrigger.refresh()
      return () => splits.forEach((s) => s.revert())
    }, el)
    return () => ctx.revert()
  }, [project])

  if (!project) return <NotFound />
  const idx = projects.indexOf(project)
  const next = projects[(idx + 1) % projects.length]

  return (
    <article className="page case" ref={root}>
      <header className="case__head">
        <p className="mono case__kicker">
          <span className="index">{project.index}</span> {project.category} — {project.year}
        </p>
        <h1 className="case__title split-wait">{project.title}</h1>
        <div className="case__meta">
          <div>
            <span className="label">Client</span>
            <strong>{project.client}</strong>
          </div>
          <div>
            <span className="label">Role</span>
            <strong>{project.role.join(' · ')}</strong>
          </div>
          <div>
            <span className="label">Stack</span>
            <strong>{project.stack.join(' · ')}</strong>
          </div>
          {project.url && (
            <div>
              <span className="label">Live</span>
              <a href={project.url} target="_blank" rel="noreferrer" data-cursor="link">
                {project.url.replace(/^https?:\/\//, '')} ↗
              </a>
            </div>
          )}
        </div>
      </header>

      <div className="case__cover" style={{ ['--c' as string]: project.color }}>
        <img src={base + project.cover} alt={project.title} />
      </div>

      <div className="case__body">
        <section className="case__section">
          <h2 className="case__h label">Overview</h2>
          <p className="case__p case__lead split-wait">{project.summary}</p>
        </section>

        {project.stats && (
          <div className="case__stats">
            {project.stats.map((s) => (
              <div className="case__stat" key={s.label}>
                <div className="case__statv">{s.value}</div>
                <div className="label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {project.challenge && (
          <section className="case__section">
            <h2 className="case__h label">Challenge</h2>
            <p className="case__p split-wait">{project.challenge}</p>
          </section>
        )}
        {project.solution && (
          <section className="case__section">
            <h2 className="case__h label">Solution</h2>
            <p className="case__p split-wait">{project.solution}</p>
          </section>
        )}
        {project.result && (
          <section className="case__section">
            <h2 className="case__h label">Result</h2>
            <p className="case__p split-wait">{project.result}</p>
          </section>
        )}

        {project.images.length > 0 && (
          <div className="case__gallery">
            {project.images.map((src) => (
              <div className="case__img" key={src}>
                <img src={base + src} alt="" loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        )}
      </div>

      <TLink to={`/work/${next.slug}`} className="case__next" cursor="view">
        <span className="label">Next project</span>
        <span className="case__nexttitle">{next.title} →</span>
      </TLink>
      <Footer />
    </article>
  )
}
