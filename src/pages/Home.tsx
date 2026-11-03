import { useEffect, useRef } from 'react'
import { Overlay } from '../components/Overlay'
import { MagneticButton } from '../components/MagneticButton'
import { TLink } from '../components/TLink'
import { Hud } from '../components/Hud'
import { about, credits, impact, journeyCopy, process, projects, services, site, socials } from '../content'
import { aToP, STATIONS } from '../three/journey'
import { useStore } from '../lib/store'

const JOURNEY_VH = 1400

const around = (a: number, before = 0.012, after = 0.034): [number, number] => [aToP(a) - before, aToP(a) + after]

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
        <Hud />

        {/* 00 — Gargantua */}
        <Overlay range={[0, 0.1]} className="ov--hero">
          <p className="mono ov__kicker">{journeyCopy.intro.kicker}</p>
          <h1 className="ov__title">
            <span className="line">{site.firstName}</span>
            <span className="line">{site.lastName}</span>
          </h1>
          <p className="ov__sub">
            <em>{site.role}</em>
            <span className="mono">{site.location} · working worldwide</span>
          </p>
          <p className="ov__scroll mono">
            <span>{journeyCopy.intro.scroll}</span>
            <i>↓</i>
          </p>
        </Overlay>

        {/* 01 — Approach */}
        <Overlay range={[0.12, 0.26]} className="ov--manifesto" align="right">
          <p className="mono ov__kicker">
            <span className="index">01</span> Approach
          </p>
          <h2 className="ov__big">{journeyCopy.manifesto.title}</h2>
          <p className="ov__text">{journeyCopy.manifesto.text}</p>
        </Overlay>

        {/* 03 — Tesseract */}
        <Overlay range={around(STATIONS.welcome, 0.0, 0.045)} className="ov--welcome" align="center">
          <p className="mono ov__kicker">
            <span className="index">03</span> Tesseract
          </p>
          <h2 className="ov__big">{journeyCopy.tesseract.title}</h2>
          <p className="ov__text ov__text--center">{journeyCopy.tesseract.text}</p>
        </Overlay>

        {/* 04 — Services */}
        {services.map((s, i) => (
          <Overlay key={s.index} range={around(STATIONS.services[i], 0.012, 0.03)} className="ov--service" align={i === 1 ? 'left' : 'right'}>
            <p className="mono ov__kicker">
              <span className="index">04</span> Services — {s.index}
            </p>
            <h2 className="ov__h2">{s.short}</h2>
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
        ))}

        {/* 05 — Process */}
        <Overlay range={around(STATIONS.process, 0.018, 0.034)} className="ov--process" align="left">
          <p className="mono ov__kicker">
            <span className="index">05</span> Process
          </p>
          <h2 className="ov__big">{journeyCopy.process.title}</h2>
          <p className="ov__text">{journeyCopy.process.text}</p>
          <ol className="ov__steps">
            {process.map((p) => (
              <li key={p.index}>
                <span className="index">{p.index}</span>
                <strong>{p.title}</strong>
              </li>
            ))}
          </ol>
        </Overlay>

        {/* 06 — Work */}
        <Overlay range={around(STATIONS.workIntro, 0.01, 0.03)} className="ov--workintro" align="center">
          <p className="mono ov__kicker">
            <span className="index">06</span> {journeyCopy.workIntro.title}
          </p>
          <h2 className="ov__big">
            Five projects. <em>Real numbers.</em>
          </h2>
          <p className="ov__text ov__text--center">{journeyCopy.workIntro.text}</p>
        </Overlay>
        {projects.map((p, i) => (
          <Overlay key={p.slug} range={around(STATIONS.screens[i], 0.014, 0.028)} className="ov--project" align={i % 2 === 0 ? 'right' : 'left'}>
            <p className="mono ov__kicker">
              <span className="index">{p.index}</span> {p.category} — {p.year}
            </p>
            <h2 className="ov__h2">{p.title}</h2>
            <p className="ov__text">{p.summary}</p>
            <TLink to={`/work/${p.slug}`} className="ov__link">
              Open case study <i>→</i>
            </TLink>
          </Overlay>
        ))}
        <Overlay range={around(STATIONS.allWork, 0.008, 0.03)} className="ov--allwork" align="center">
          <TLink to="/work" className="btn btn--lg">
            {journeyCopy.allWork}
          </TLink>
        </Overlay>

        {/* 07 — Track record */}
        <Overlay range={around(STATIONS.trust, 0.016, 0.032)} className="ov--trust" align="right">
          <p className="mono ov__kicker">
            <span className="index">07</span> Track record
          </p>
          <h2 className="ov__big">{journeyCopy.trust.title}</h2>
          <p className="ov__text">{journeyCopy.trust.text}</p>
          <ul className="ov__facts">
            {[about.facts[1], about.facts[0], about.facts[2]].map((f) => (
              <li key={f.label}>
                <strong>{f.value}</strong>
                <span className="mono">{f.label}</span>
              </li>
            ))}
          </ul>
        </Overlay>

        {/* 08 — Impact */}
        <Overlay range={around(STATIONS.impact, 0.014, 0.045)} className="ov--impact" align="center">
          <p className="mono ov__kicker">
            <span className="index">08</span> {impact.kicker}
          </p>
          <div className="ov__stat">{impact.value}</div>
          <p className="ov__statlabel">{impact.label}</p>
          <p className="ov__text ov__text--center">{impact.text}</p>
          <TLink to={`/work/${impact.slug}`} className="ov__link">
            {impact.cta} <i>→</i>
          </TLink>
        </Overlay>

        {/* 09 — About */}
        <Overlay range={around(STATIONS.about, 0.016, 0.034)} className="ov--about" align="left">
          <p className="mono ov__kicker">
            <span className="index">09</span> About
          </p>
          <h2 className="ov__big">{journeyCopy.aboutTeaser.title}</h2>
          <p className="ov__text">{about.intro}</p>
          <TLink to="/about" className="ov__link">
            {journeyCopy.aboutTeaser.cta} <i>→</i>
          </TLink>
        </Overlay>

        {/* 10 — Contact */}
        <Overlay range={[aToP(STATIONS.contact) - 0.01, 1]} className="ov--contact" stay>
          <p className="mono ov__kicker">
            <span className="index">10</span> <i className="dot" /> {site.availability}
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
          <div className="ov__footer mono">
            <div className="ov__socials">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
                  {s.label}
                </a>
              ))}
            </div>
            <span className="ov__credits">
              © {site.year} {site.name} · {site.city}
              {credits.map((c) => (
                <span key={c.href}>
                  {' '}
                  · {c.label}:{' '}
                  <a href={c.href} target="_blank" rel="noreferrer">
                    {c.text}
                  </a>{' '}
                  <a href={c.licenseHref} target="_blank" rel="noreferrer">
                    ({c.license})
                  </a>
                </span>
              ))}
            </span>
            <TLink to="/about" className="ov__about">
              About me →
            </TLink>
          </div>
        </Overlay>
      </div>
    </div>
  )
}
