import { useEffect, useRef } from 'react'
import { projects, workIntro } from '../content'
import { TLink } from '../components/TLink'
import { Footer } from '../components/Footer'
import { gsap } from '../lib/gsap'
import { fadeUp, revealChars } from '../lib/reveal'
import { breadcrumbLd, canonicalFor, SITE_URL, useSeo } from '../lib/seo'
import type { Project } from '../content'

const base = import.meta.env.BASE_URL

function Card({ p, i }: { p: Project; i: number }) {
  return (
    <TLink to={`/work/${p.slug}`} className={`wcard ${p.featured ? 'wcard--featured' : ''} ${p.concept ? 'wcard--concept' : ''}`} cursor="view">
      <div className="wcard__media">
        {p.video ? (
          <video src={base + p.video} poster={base + p.cover} muted loop playsInline autoPlay preload="metadata" aria-label={`${p.title}: ${p.category}`} />
        ) : (
          <img src={base + p.cover} alt={`${p.title}: ${p.category}`} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
        )}
        <span className="wcard__index mono">{p.index}</span>
        {p.concept && <span className="wcard__badge mono">Concept</span>}
      </div>
      <div className="wcard__meta">
        <h2 className="wcard__title">{p.title}</h2>
        <span className="mono">{p.category}</span>
        <span className="mono">{p.year}</span>
      </div>
      {p.stats && (
        <p className="wcard__stat">
          {p.stats[0].value} <span>{p.stats[0].label}</span>
        </p>
      )}
    </TLink>
  )
}

export function Work() {
  const root = useRef<HTMLElement>(null)
  const client = projects.filter((p) => !p.concept)
  const concepts = projects.filter((p) => p.concept)
  useSeo({
    title: 'Work · Websites, online stores & motion | Federico Schwindt',
    description: `${client.length} client projects (e-commerce, car dealer, spa, architecture and more) plus concept pieces in web design and motion. See the case studies and results.`,
    path: '/work',
    jsonLd: [
      breadcrumbLd([
        { name: 'Home', path: '/' },
        { name: 'Work', path: '/work' },
      ]),
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Selected work',
        url: canonicalFor('/work'),
        isPartOf: { '@id': `${SITE_URL}/#website` },
        hasPart: projects.map((p) => ({ '@type': 'CreativeWork', name: p.title, url: canonicalFor(`/work/${p.slug}`), image: `${SITE_URL}/${p.cover}` })),
      },
    ],
  })
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
        <p className="mono page__kicker">({client.length}) Client projects · ({concepts.length}) Concepts</p>
        <h1 className="page__title">
          <span className="line split-wait">Selected</span>{' '}
          <span className="line split-wait">
            <em>Work</em>
          </span>
        </h1>
        <p className="page__intro">{workIntro}</p>
      </header>
      <div className="wgrid">
        {client.map((p, i) => (
          <Card p={p} i={i} key={p.slug} />
        ))}
      </div>
      <header className="page__head page__head--sub">
        <p className="mono page__kicker">Self-initiated</p>
        <h2 className="page__subtitle">
          Concepts <em>&amp; motion</em>
        </h2>
        <p className="page__intro">
          Pieces I make to explore an industry before pitching it: website concepts and short films, produced with design tools and AI video (Higgsfield). They are not client work, and they are labelled as such.
        </p>
      </header>
      <div className="wgrid wgrid--concepts">
        {concepts.map((p, i) => (
          <Card p={p} i={i + client.length} key={p.slug} />
        ))}
      </div>
      <Footer />
    </section>
  )
}
