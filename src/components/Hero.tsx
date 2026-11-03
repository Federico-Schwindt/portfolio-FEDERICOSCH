import { useEffect, useRef } from 'react'
import { site } from '../content'
import { useStore } from '../lib/store'
import { gsap } from '../lib/gsap'
import { revealChars, revealLines } from '../lib/reveal'

export function Hero() {
  const entered = useStore((s) => s.entered)
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!entered) return
    const el = root.current!
    const ctx = gsap.context(() => {
      const lines = Array.from(el.querySelectorAll<HTMLElement>('.hero__title .line'))
      const splits = [
        ...lines.map((l, i) => revealChars(l, { immediate: true, delay: 0.55 + i * 0.12, stagger: 0.035 })),
        revealLines(el.querySelector<HTMLElement>('.hero__desc')!, { immediate: true, delay: 1.25 }),
      ]
      gsap.from(el.querySelectorAll('.hero__top > *, .hero__sub, .hero__scroll'), {
        y: 22,
        opacity: 0,
        duration: 1.2,
        stagger: 0.1,
        delay: 1.1,
      })
      gsap.to(el.querySelector('.hero__inner'), {
        yPercent: -14,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      })
      return () => splits.forEach((s) => s.revert())
    }, el)
    return () => ctx.revert()
  }, [entered])

  return (
    <section className="hero" data-scene="hero" id="top" ref={root}>
      <div className="hero__inner">
        <div className="hero__top">
          <p className="label">{site.tagline}</p>
          <p className="label hero__avail">
            <i />
            {site.availability}
          </p>
        </div>

        <div className="hero__title-wrap">
          <h1 className="hero__title">
            <span className="line split-wait">{site.firstName}</span>
            <span className="line split-wait">{site.lastName}</span>
          </h1>
          <p className="hero__sub">
            <em>{site.role}</em>
            <span>— based in {site.location}, working worldwide</span>
          </p>
        </div>

        <div className="hero__bottom">
          <p className="hero__desc split-wait">{site.description}</p>
          <p className="hero__scroll label">
            <span>(Scroll to explore)</span>
            <i>↓</i>
          </p>
        </div>
      </div>
    </section>
  )
}
