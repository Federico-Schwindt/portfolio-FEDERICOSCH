import { useEffect, useRef, type CSSProperties } from 'react'
import { projects } from '../content'
import { gsap } from '../lib/gsap'
import { fadeUp } from '../lib/reveal'

const base = import.meta.env.BASE_URL

export function Work() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current!
    const mm = gsap.matchMedia()

    mm.add('(min-width: 901px)', () => {
      const track = el.querySelector<HTMLElement>('.work__track')!
      const pin = el.querySelector<HTMLElement>('.work__pin')!
      const dist = () => Math.max(track.scrollWidth - window.innerWidth, 0)
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: pin,
          start: 'top top',
          end: () => '+=' + dist(),
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      })
      el.querySelectorAll<HTMLElement>('.project__img').forEach((img) => {
        gsap.fromTo(
          img,
          { xPercent: -5 },
          {
            xPercent: 5,
            ease: 'none',
            scrollTrigger: {
              trigger: img.parentElement,
              containerAnimation: tween,
              start: 'left right',
              end: 'right left',
              scrub: true,
            },
          },
        )
      })
      fadeUp(el.querySelectorAll('.work__intro > *'), { trigger: pin, start: 'top 70%', stagger: 0.1 })
    })

    mm.add('(max-width: 900px)', () => {
      el.querySelectorAll<HTMLElement>('.project, .work__intro').forEach((p) => fadeUp(p, { trigger: p, y: 48 }))
    })

    return () => mm.revert()
  }, [])

  return (
    <section className="work" id="work" data-scene="work" ref={root}>
      <div className="section-head">
        <span className="index">03</span>
        <span className="label">Selected Work</span>
      </div>
      <div className="work__pin">
        <div className="work__track">
          <div className="work__intro">
            <h2>
              Selected
              <br />
              <em>work</em>
            </h2>
            <p>A selection of projects where design, code and strategy meet.</p>
            <p className="label">({projects.length}) — Keep scrolling</p>
          </div>
          {projects.map((p) => (
            <a className="project" href={p.href} key={p.index} data-cursor="view" style={{ '--c': p.color } as CSSProperties}>
              <div className="project__media">
                <div className="project__img">
                  <img src={base + p.cover} alt={`${p.title} — ${p.category}`} loading="lazy" decoding="async" />
                </div>
                <span className="project__index label">{p.index}</span>
              </div>
              <div className="project__meta">
                <h3 className="project__title">{p.title}</h3>
                <span className="label">{p.category}</span>
                <span className="label project__year">{p.year}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
