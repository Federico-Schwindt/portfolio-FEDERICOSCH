import { useEffect, useRef } from 'react'
import { process, stats, tools } from '../content'
import { gsap } from '../lib/gsap'
import { fadeUp } from '../lib/reveal'
import { Marquee } from './Marquee'

export function Process() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current!
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>('.step').forEach((step) => {
        gsap.from(step, {
          '--line': 0,
          duration: 1.4,
          ease: 'power3.out',
          scrollTrigger: { trigger: step, start: 'top 85%', once: true },
        })
        fadeUp(step.querySelectorAll('.step__num, .step__title, .step__text'), { trigger: step, start: 'top 82%', stagger: 0.08 })
      })
      fadeUp(el.querySelectorAll('.stat'), { trigger: el.querySelector('.stats')!, start: 'top 85%', stagger: 0.12, y: 40 })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="process" id="process" data-scene="process" ref={root}>
      <div className="section-head">
        <span className="index">04</span>
        <span className="label">Process</span>
      </div>
      <div className="steps">
        {process.map((p) => (
          <div className="step" key={p.index}>
            <span className="step__num index">{p.index}</span>
            <h3 className="step__title">{p.title}</h3>
            <p className="step__text">{p.text}</p>
          </div>
        ))}
      </div>
      <div className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat__value">{s.value}</div>
            <div className="stat__label label">{s.label}</div>
          </div>
        ))}
      </div>
      <Marquee items={tools} size="sm" speed={40} />
    </section>
  )
}
