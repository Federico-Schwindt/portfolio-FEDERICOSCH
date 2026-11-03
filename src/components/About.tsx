import { useEffect, useRef } from 'react'
import { about } from '../content'
import { gsap, SplitText } from '../lib/gsap'

export function About() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current!
    const ctx = gsap.context(() => {
      const text = el.querySelector<HTMLElement>('.about__text')!
      const split = SplitText.create(text, { type: 'words', wordsClass: 'word' })
      text.style.visibility = 'visible'
      gsap.fromTo(
        split.words,
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.03,
          ease: 'none',
          scrollTrigger: { trigger: text, start: 'top 78%', end: 'bottom 45%', scrub: 0.5 },
        },
      )
      gsap.from(el.querySelectorAll('.about__col'), {
        y: 40,
        opacity: 0,
        stagger: 0.12,
        duration: 1.2,
        scrollTrigger: { trigger: el.querySelector('.about__grid'), start: 'top 85%', once: true },
      })
      return () => split.revert()
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="about" id="about" data-scene="about" ref={root}>
      <div className="section-head">
        <span className="index">01</span>
        <span className="label">About</span>
      </div>
      <p className="about__text split-wait">{about.manifesto}</p>
      <div className="about__grid">
        {about.columns.map((col) => (
          <div className="about__col" key={col.title}>
            <h4 className="label">{col.title}</h4>
            <ul>
              {col.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
