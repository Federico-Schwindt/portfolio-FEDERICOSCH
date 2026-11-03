import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { Overlay } from '../components/Overlay'
import { MagneticButton } from '../components/MagneticButton'
import { TLink } from '../components/TLink'
import { impact, manifesto, projects, services, site, socials } from '../content'
import { galleryProgress } from '../three/path'
import { useStore } from '../lib/store'

const JOURNEY_VH = 950

export function Home() {
  const ref = useRef<HTMLDivElement>(null)
  const setJourneyHeight = useStore((s) => s.setJourneyHeight)
  const hoverView = useStore((s) => s.hoverView)

  useEffect(() => {
    const measure = () => setJourneyHeight(ref.current?.offsetHeight ?? 0)
    measure()
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('resize', measure)
      setJourneyHeight(0)
    }
  }, [setJourneyHeight])

  return (
    <div className={`journey ${hoverView ? 'is-view' : ''}`} ref={ref} style={{ height: `${JOURNEY_VH}vh` }}>
      <div className="journey__sticky">
        {/* 00 — Intro */}
        <Overlay range={[0, 0.115]} className="ov--hero">
          <p className="label ov__kicker">{site.tagline}</p>
          <h1 className="ov__title">
            <span className="line">{site.firstName}</span>
            <span className="line">{site.lastName}</span>
          </h1>
          <p className="ov__sub">
            <em>{site.role}</em>
            <span>— {site.location}, working worldwide</span>
          </p>
          <p className="ov__scroll label">
            <span>Scroll to begin</span>
            <i>↓</i>
          </p>
        </Overlay>

        {/* 01 — Manifesto */}
        <Overlay range={[0.135, 0.275]} className="ov--manifesto" align="right">
          <p className="label ov__kicker">
            <span className="index">01</span> Manifesto
          </p>
          <h2 className="ov__big">{manifesto.text}</h2>
          <p className="ov__text">{manifesto.sub}</p>
          <ul className="ov__pillars">
            {manifesto.pillars.map((p, i) => (
              <li key={p}>
                <span className="index">0{i + 1}</span>
                {p}
              </li>
            ))}
          </ul>
        </Overlay>

        {/* 02 — Services */}
        {services.map((s, i) => {
          const ranges: [number, number][] = [
            [0.305, 0.385],
            [0.385, 0.44],
            [0.44, 0.478],
          ]
          return (
            <Overlay key={s.index} range={ranges[i]} className="ov--service" align={i === 1 ? 'left' : 'right'}>
              <p className="label ov__kicker">
                <span className="index">02</span> Services — {s.index}
              </p>
              <h2 className="ov__big">{s.short}</h2>
              <p className="ov__kick">
                <em>{s.kicker}</em>
              </p>
              <p className="ov__text">{s.text}</p>
              <ul className="tags">
                {s.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Overlay>
          )
        })}

        {/* 03 — Work */}
        <Overlay range={[0.478, 0.507]} className="ov--workintro" align="center">
          <p className="label ov__kicker">
            <span className="index">03</span> Selected work
          </p>
          <h2 className="ov__big">
            Five projects. <em>Real numbers.</em>
          </h2>
          <p className="ov__text">Fly through the gallery — click a screen to open the case study.</p>
        </Overlay>
        {projects.map((p, i) => {
          const c = galleryProgress(i)
          return (
            <Overlay key={p.slug} range={[c - 0.008, c + 0.03]} className="ov--project" align={i % 2 === 0 ? 'right' : 'left'}>
              <p className="label ov__kicker">
                <span className="index">{p.index}</span> {p.category} — {p.year}
              </p>
              <h2 className="ov__title ov__title--sm">{p.title}</h2>
              <p className="ov__text">{p.summary}</p>
              <TLink to={`/work/${p.slug}`} className="ov__link">
                Open case study <i>→</i>
              </TLink>
            </Overlay>
          )
        })}
        <Overlay range={[0.7, 0.755]} className="ov--allwork" align="center">
          <TLink to="/work" className="btn btn--lg">
            See all work
          </TLink>
        </Overlay>

        {/* 04 — Impact */}
        <Overlay range={[0.78, 0.9]} className="ov--impact" align="center">
          <p className="label ov__kicker">
            <span className="index">04</span> Impact
          </p>
          <div className="ov__stat">{impact.value}</div>
          <p className="ov__statlabel">{impact.label}</p>
          <p className="ov__text ov__text--center">{impact.text}</p>
          <TLink to={`/work/${impact.slug}`} className="ov__link">
            {impact.cta} <i>→</i>
          </TLink>
        </Overlay>

        {/* 05 — Contact */}
        <Overlay range={[0.93, 1]} className="ov--contact" stay>
          <p className="label ov__kicker">
            <span className="index">05</span> <i className="dot" /> {site.availability}
          </p>
          <h2 className="ov__title">
            <span className="line">Let's work</span>
            <span className="line">together</span>
          </h2>
          <div className="ov__cta">
            <MagneticButton href={`mailto:${site.email}`} className="btn btn--lg">
              {site.email}
            </MagneticButton>
            <TLink to="/contact" className="btn btn--ghost btn--lg">
              Contact page
            </TLink>
          </div>
          <div className="ov__footer label">
            <div className="ov__socials">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              ))}
            </div>
            <span>
              © {site.year} {site.name} · {site.city}
            </span>
            <Link to="/about" className="ov__about">
              About me →
            </Link>
          </div>
        </Overlay>
      </div>
    </div>
  )
}
