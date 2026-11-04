import { lazy, Suspense, useEffect, useRef } from 'react'
import { audit, contact, equation, faq, hero, manifesto, packages, pricingNote, process, projects, services, site, workIntro, xp } from '../content'
import { gsap, ScrollTrigger } from '../lib/gsap'
import { fadeUp, revealLines } from '../lib/reveal'
import { useStore, xpProgress } from '../lib/store'
import { useIsMobile } from '../lib/hooks'
import { TLink } from '../components/TLink'
import { Footer } from '../components/Footer'
import { Wordmark } from '../components/Wordmark'
import { Shape } from '../components/Shape'
import { LeadForm } from '../components/LeadForm'
import { orgLd, personLd, SITE_URL, useSeo, websiteLd } from '../lib/seo'

const Retro = lazy(() => import('../three/Retro').then((m) => ({ default: m.Retro })))
const base = import.meta.env.BASE_URL

export function Home() {
  const root = useRef<HTMLDivElement>(null)
  const entered = useStore((s) => s.entered)
  const workHover = useStore((s) => s.workHover)
  const featured = projects.filter((p) => p.featured)
  const setWorkHover = useStore((s) => s.setWorkHover)
  const isMobile = useIsMobile()
  useSeo({
    title: 'Federico Schwindt · Web Designer & Developer · Websites from $300',
    description:
      'Freelance web designer, developer and marketer. Business websites, WooCommerce & Shopify stores, car dealer sites, SEO and Google Ads. From $300 + $50/month. 13 projects, 5.0 rating, +551% sales for Universal Driveshafts.',
    path: '/',
    jsonLd: [
      websiteLd,
      personLd,
      orgLd(packages),
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Web design services',
        itemListElement: services.map((sv, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: { '@type': 'Service', name: sv.title, description: sv.text, provider: { '@id': `${SITE_URL}/#org` }, areaServed: 'Worldwide' },
        })),
      },
    ],
  })

  useEffect(() => {
    if (!entered) return
    const el = root.current!
    const ctx = gsap.context(() => {
      // hero
      const splits = [
        revealLines(el.querySelector<HTMLElement>('.hero__title')!, { immediate: true, delay: 0.3, stagger: 0.1 }),
        ...Array.from(el.querySelectorAll<HTMLElement>('.rv-lines')).map((p) => revealLines(p, { start: 'top 88%' })),
      ]
      fadeUp(el.querySelectorAll('.hero__sub, .hero__meta > *'), { immediate: true, delay: 0.9, stagger: 0.08 })
      gsap.from(el.querySelectorAll('.eq > *'), { y: 16, opacity: 0, stagger: 0.08, duration: 0.8, scrollTrigger: { trigger: el.querySelector('.eq'), start: 'top 90%', once: true } })

      // manifesto words
      el.querySelectorAll<HTMLElement>('.rv-fade').forEach((n) => fadeUp(n, { trigger: n, start: 'top 88%' }))

      // process cards: slide up in sequence, shapes draw
      const cards = gsap.utils.toArray<HTMLElement>('.step', el)
      gsap.from(cards, { yPercent: 18, opacity: 0, stagger: 0.12, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el.querySelector('.steps'), start: 'top 80%', once: true } })
      cards.forEach((c, i) => {
        const path = c.querySelector<SVGPathElement>('.shape path')
        if (!path) return
        const len = path.getTotalLength()
        gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', delay: 0.2 + i * 0.15, scrollTrigger: { trigger: c, start: 'top 80%', once: true } })
      })

      // work list: image follows hover
      fadeUp(el.querySelectorAll('.wl__row'), { trigger: el.querySelector('.wl')!, start: 'top 85%', stagger: 0.08 })

      // the XP sequence: a pinned section; progress feeds the 3D camera
      ScrollTrigger.create({
        trigger: el.querySelector('.xp'),
        start: 'top top',
        end: '+=220%',
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          xpProgress.current = self.progress
          el.querySelector('.xp')!.classList.toggle('is-out', self.progress > 0.4)
        },
      })
      // packages fly in from the desk before the XP section
      gsap.from(el.querySelectorAll('.pkg--lg'), { y: 80, rotate: (i: number) => (i - 1) * 3, opacity: 0, stagger: 0.12, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el.querySelector('.pricing'), start: 'top 75%', once: true } })

      ScrollTrigger.refresh()
      return () => splits.forEach((s) => s.revert())
    }, el)
    return () => ctx.revert()
  }, [entered])

  return (
    <div className="home" ref={root}>
      {/* ── Hero ── */}
      <section className="hero">
        <Wordmark />
        <div className="hero__grid">
          <div className="hero__meta">
            <p className="mono">
              {site.name} · {site.tagline}
            </p>
            <p className="mono hero__open">
              <i className="dot" /> {site.availability}
            </p>
          </div>
          <div className="hero__copy">
            <h1 className="hero__title split-wait">
              {hero.title[0]} <em>{hero.title[1]}</em>
            </h1>
            <p className="hero__sub">{hero.sub}</p>
          </div>
        </div>
        <div className="hero__strip">
          <img src={base + 'work/uds.jpg'} alt="Universal Driveshafts storefront" />
          <img src={base + 'work/joya.jpg'} alt="Joya Hijab store" />
        </div>
      </section>

      {/* ── Equation ── */}
      <div className="eq mono">
        {equation.map((e, i) => (
          <span key={i} className={e.length > 1 && e !== '+551%' ? 'eq__word' : e === '+551%' ? 'eq__result' : 'eq__op'}>
            {e}
          </span>
        ))}
      </div>

      {/* ── Manifesto ── */}
      <section className="manifesto">
        <h2 className="manifesto__lead rv-lines split-wait">
          {manifesto.lead} <em>{manifesto.leadItalic}</em>
        </h2>
        <div className="manifesto__grid">
          <p className="manifesto__text rv-fade">{manifesto.text}</p>
          <p className="manifesto__line rv-lines split-wait">
            {manifesto.line} <em>{manifesto.lineItalic}</em>
          </p>
        </div>
        <div className="manifesto__foot">
          <span className="mono ab">
            A <i>→</i> B
          </span>
          <p className="rv-fade">
            {manifesto.road} <em>{manifesto.roadItalic}</em>
          </p>
          <a href="#process" className="pill" data-cursor="link">
            <em>My process</em>
          </a>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="process" id="process">
        <div className="steps">
          {process.map((p, i) => (
            <article className="step" key={p.index} style={{ ['--i' as string]: i }}>
              <span className="mono step__num">{p.index}</span>
              <Shape sides={p.sides} />
              <div className="step__text">
                <h3>
                  {p.title} <em>{p.italic}</em>
                </h3>
                <p>{p.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Selected work ── */}
      <section className="work" id="work">
        <div className="work__head">
          <h2>
            Selected <em>Work</em>
          </h2>
          <p>{workIntro}</p>
        </div>
        <div className="wl">
          <ul className="wl__list">
            {featured.map((p, i) => (
              <li key={p.slug} className={`wl__row ${workHover === i ? 'is-on' : ''}`} onPointerEnter={() => setWorkHover(i)}>
                <TLink to={`/work/${p.slug}`} cursor="view">
                  <span className="mono">{p.index}.</span>
                  <em>{p.title}</em>
                  <span className="mono wl__tags">{p.tags}</span>
                </TLink>
              </li>
            ))}
          </ul>
          <div className="wl__media" aria-hidden="true">
            {featured.map((p, i) => (
              <img key={p.slug} src={base + p.cover} alt="" className={workHover === i ? 'is-on' : ''} />
            ))}
          </div>
        </div>
        <div className="work__more mono">
          <TLink to="/work">• • • Explore more • • • Explore more • • • Explore more • • •</TLink>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="services" id="services" aria-labelledby="services-title">
        <div className="work__head">
          <h2 id="services-title" className="rv-lines split-wait">
            What I <em>build</em>
          </h2>
          <p className="rv-fade">Websites, stores and campaigns for businesses that want more enquiries, not just a nicer homepage.</p>
        </div>
        <div className="services__grid">
          {services.map((sv, i) => (
            <article className="service" key={sv.slug} id={sv.slug}>
              <span className="mono service__num">{String(i + 1).padStart(2, '0')}</span>
              <h3>
                {sv.title} <em>{sv.italic}</em>
              </h3>
              <p>{sv.text}</p>
              <ul className="mono service__tags">
                {sv.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="pricing" id="pricing">
        <p className="pill pill--static">
          <em>Packages</em>
        </p>
        <div className="pricing__grid">
          {packages.map((p) => (
            <article className="pkg pkg--lg" key={p.code}>
              <div className="pkg__top">
                <span className="mono pkg__code">
                  <i className="pkg__qr" /> {p.code}
                </span>
                <h3>{p.name}</h3>
                <p>{p.text}</p>
                <ul>
                  {p.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
                <span className="pkg__short">{p.short}</span>
                <span className="mono pkg__tearlabel">▸▸▸ Tear along line ▸▸▸</span>
              </div>
              <div className="pkg__tear" />
              <div className="pkg__bottom">
                <div className="pkg__price">
                  <span className="mono">Setup:</span>
                  <strong className="mono">{p.price}</strong>
                </div>
                <div className="pkg__price pkg__price--monthly">
                  <span className="mono">Then:</span>
                  <strong className="mono">{p.monthly}</strong>
                </div>
                <div className="pkg__barcode" aria-hidden="true" />
                <TLink to={`/contact?package=${p.name.toLowerCase()}`} className="pkg__cta" cursor="link">
                  <em>Schedule a free call</em>
                </TLink>
                <span className="mono pkg__stamp">{p.stub}</span>
              </div>
            </article>
          ))}
        </div>
        <p className="pricing__note">
          <em>{pricingNote.lead}</em> {pricingNote.text}
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="faq" id="faq" aria-labelledby="faq-title">
        <div className="work__head">
          <h2 id="faq-title" className="rv-lines split-wait">
            Questions, <em>answered</em>
          </h2>
          <p className="rv-fade">Straight answers about prices, timelines and how the monthly plan works.</p>
        </div>
        <div className="faq__list">
          {faq.map((f) => (
            <details className="faq__item" key={f.q}>
              <summary>
                <h3>{f.q}</h3>
                <span className="faq__icon" aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── The computer ── */}
      <section className="xp">
        <div className="xp__sky" />
        <div className="xp__scene">
          <Suspense fallback={null}>
            <Retro />
          </Suspense>
        </div>
        <div className="xp__copy">
          <h2>
            {xp.title} <em>{xp.titleItalic}</em>
          </h2>
          <p className="mono">Double-click the icons. The windows drag.</p>
        </div>
        {isMobile && <p className="mono xp__hint">Scroll to zoom out</p>}
      </section>

      {/* ── Free audit (lead magnet) ── */}
      <section className="audit" id="audit" aria-labelledby="audit-title">
        <div className="audit__copy">
          <p className="pill pill--static">
            <em>{audit.kicker}</em>
          </p>
          <h2 id="audit-title" className="rv-lines split-wait">
            {audit.title} <em>{audit.titleItalic}</em>
          </h2>
          <p className="rv-fade">{audit.text}</p>
          <ul className="mono audit__points">
            {audit.points.map((pt) => (
              <li key={pt}>{pt}</li>
            ))}
          </ul>
        </div>
        <LeadForm variant="audit" compact />
      </section>

      {/* ── Contact ── */}
      <section className="contact" id="contact">
        <div className="contact__grid">
          <h2 className="rv-lines split-wait">
            {contact.title} <em>{contact.titleItalic}</em>
          </h2>
          <p className="rv-fade">{contact.text}</p>
        </div>
        <div className="contact__line">
          <TLink to="/contact" className="diamond" cursor="link">
            <span className="mono">{contact.cta}</span>
          </TLink>
        </div>
      </section>

      <Footer />
    </div>
  )
}
