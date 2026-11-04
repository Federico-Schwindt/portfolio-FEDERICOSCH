import { useEffect, useRef } from 'react'
import { useParams } from 'react-router'
import { projects } from '../content'
import { TLink } from '../components/TLink'
import { Footer } from '../components/Footer'
import { NotFound } from './NotFound'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { fadeUp, revealChars, revealLines } from '../lib/reveal'
import { breadcrumbLd, canonicalFor, SITE_URL, useSeo } from '../lib/seo'

const base = import.meta.env.BASE_URL

export function CaseStudy() {
  const { slug } = useParams()
  const project = projects.find((p) => p.slug === slug)
  const root = useRef<HTMLElement>(null)
  useSeo(
    project
      ? {
          title: `${project.title} · ${project.category}${project.concept ? ' (concept)' : ''} | Federico Schwindt`,
          description: project.summary.length > 158 ? project.summary.slice(0, 155).replace(/\s+\S*$/, '') + '…' : project.summary,
          path: `/work/${project.slug}`,
          image: `${SITE_URL}/${project.cover}`,
          type: 'article',
          jsonLd: [
            breadcrumbLd([
              { name: 'Home', path: '/' },
              { name: 'Work', path: '/work' },
              { name: project.title, path: `/work/${project.slug}` },
            ]),
            {
              '@context': 'https://schema.org',
              '@type': 'CreativeWork',
              name: project.title,
              headline: `${project.title}: ${project.category}`,
              description: project.summary,
              url: canonicalFor(`/work/${project.slug}`),
              image: [project.cover, ...project.images].map((src) => `${SITE_URL}/${src}`),
              ...(project.video ? { video: { '@type': 'VideoObject', name: `${project.title} film`, description: project.summary, contentUrl: `${SITE_URL}/${project.video}`, thumbnailUrl: `${SITE_URL}/${project.cover}`, uploadDate: `${project.year}-01-01` } } : {}),
              creator: { '@id': `${SITE_URL}/#person` },
              dateCreated: project.year.slice(0, 4),
              keywords: [...project.stack, ...project.role].join(', '),
              ...(project.url ? { sameAs: project.url } : {}),
              ...(project.concept ? { genre: 'Concept' } : { sourceOrganization: project.client }),
            },
          ],
        }
      : { title: 'Project not found | Federico Schwindt', description: 'This project does not exist.', path: `/work/${slug ?? ''}`, noindex: true },
  )

  useEffect(() => {
    if (!project) return
    const el = root.current!
    const ctx = gsap.context(() => {
      const splits = [
        revealChars(el.querySelector<HTMLElement>('.case__title')!, { immediate: true, delay: 0.3 }),
        ...Array.from(el.querySelectorAll<HTMLElement>('.case__p')).map((p) => revealLines(p, { start: 'top 90%' })),
      ]
      fadeUp(el.querySelectorAll('.case__kicker, .case__meta > *'), { immediate: true, delay: 0.55, stagger: 0.06 })
      gsap.fromTo(el.querySelector('.case__cover img, .case__cover video'), { scale: 1.12, yPercent: -5 }, { scale: 1, yPercent: 5, ease: 'none', scrollTrigger: { trigger: el.querySelector('.case__cover'), start: 'top bottom', end: 'bottom top', scrub: true } })
      el.querySelectorAll<HTMLElement>('.case__stat').forEach((s) => fadeUp(s, { trigger: s, y: 40 }))
      el.querySelectorAll<HTMLElement>('.case__img').forEach((img) => {
        fadeUp(img, { trigger: img, y: 60, start: 'top 92%' })
        gsap.fromTo(img.querySelector('img'), { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
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
          {project.index} · {project.category} · {project.year}
          {project.concept && <span className="case__badge">Concept, not client work</span>}
        </p>
        <h1 className="case__title split-wait">{project.title}</h1>
        <div className="case__meta">
          <div>
            <span className="mono">Client</span>
            <strong>{project.client}</strong>
          </div>
          <div>
            <span className="mono">Role</span>
            <strong>{project.role.join(' · ')}</strong>
          </div>
          <div>
            <span className="mono">Stack</span>
            <strong>{project.stack.join(' · ')}</strong>
          </div>
          {project.url && (
            <div>
              <span className="mono">Live</span>
              <a href={project.url} target="_blank" rel="noreferrer" data-cursor="link">
                {project.url.replace(/^https?:\/\//, '')} ↗
              </a>
            </div>
          )}
        </div>
      </header>

      <div className="case__cover">
        {project.video ? (
          <video src={base + project.video} poster={base + project.cover} muted loop playsInline autoPlay aria-label={`${project.title} film`} />
        ) : (
          <img src={base + project.cover} alt={`${project.title}: ${project.category}`} />
        )}
      </div>

      <div className="case__body">
        <section className="case__section">
          <h2 className="case__h mono">Overview</h2>
          <p className="case__p case__lead split-wait">{project.summary}</p>
        </section>
        {project.stats && (
          <div className="case__stats">
            {project.stats.map((s) => (
              <div className="case__stat" key={s.label}>
                <div className="case__statv">{s.value}</div>
                <div className="mono">{s.label}</div>
              </div>
            ))}
          </div>
        )}
        {project.challenge && (
          <section className="case__section">
            <h2 className="case__h mono">Challenge</h2>
            <p className="case__p split-wait">{project.challenge}</p>
          </section>
        )}
        {project.solution && (
          <section className="case__section">
            <h2 className="case__h mono">Solution</h2>
            <p className="case__p split-wait">{project.solution}</p>
          </section>
        )}
        {project.result && (
          <section className="case__section">
            <h2 className="case__h mono">Result</h2>
            <p className="case__p split-wait">{project.result}</p>
          </section>
        )}
        {project.images.length > 0 && (
          <div className="case__gallery">
            {project.images.map((src) => (
              <div className="case__img" key={src}>
                <img src={base + src} alt={`${project.title}: ${project.category}`} loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
        )}
      </div>

      <TLink to={`/work/${next.slug}`} className="case__next" cursor="view">
        <span className="mono">Next project</span>
        <span className="case__nexttitle">{next.title} →</span>
      </TLink>
      <Footer />
    </article>
  )
}
