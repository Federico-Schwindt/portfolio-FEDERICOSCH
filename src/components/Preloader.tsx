import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'
import { useStore } from '../lib/store'
import { ambient } from '../lib/audio'
import { site } from '../content'

const STATUS: [number, string][] = [
  [0, 'Loading the experience'],
  [30, 'Compiling shaders'],
  [60, 'Tuning frequencies'],
  [85, 'Almost there'],
]

export function Preloader() {
  const sceneReady = useStore((s) => s.sceneReady)
  const lenis = useStore((s) => s.lenis)
  const setEntered = useStore((s) => s.setEntered)
  const setSound = useStore((s) => s.setSound)
  const setLoaded = useStore((s) => s.setLoaded)

  const [count, setCount] = useState(0)
  const [fonts, setFonts] = useState(false)
  const [fallback, setFallback] = useState(false)
  const [gone, setGone] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  const ready = count >= 100 && fonts && (sceneReady || fallback)

  useEffect(() => {
    lenis?.stop()
  }, [lenis])

  useEffect(() => {
    const obj = { v: 0 }
    const tw = gsap.to(obj, {
      v: 100,
      duration: 2.8,
      ease: 'power2.inOut',
      onUpdate: () => setCount(Math.round(obj.v)),
    })
    let cancelled = false
    void document.fonts.ready.then(() => {
      if (!cancelled) setFonts(true)
    })
    const t = window.setTimeout(() => setFallback(true), 6000)
    return () => {
      cancelled = true
      tw.kill()
      window.clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (ready) setLoaded(true)
  }, [ready, setLoaded])

  const enter = (sound: boolean) => {
    if (sound) {
      ambient.init()
      ambient.setPlaying(true)
    }
    setSound(sound)
    setEntered(true)
    lenis?.start()
    const el = root.current!
    gsap
      .timeline({ onComplete: () => setGone(true) })
      .to(el.querySelector('.preloader__inner'), { yPercent: -12, opacity: 0, duration: 0.55, ease: 'power3.in' })
      .to(el, { yPercent: -100, duration: 1.05, ease: 'power4.inOut' }, '-=0.25')
  }

  if (gone) return null

  const status = STATUS.reduce((acc, [at, label]) => (count >= at ? label : acc), STATUS[0][1])

  return (
    <div className="preloader" ref={root} role="dialog" aria-label="Loading">
      <div className="preloader__inner">
        <div className="preloader__top label">
          <span>{site.name}</span>
          <span>Portfolio ©{site.year}</span>
        </div>

        <div className="preloader__center">
          {!ready ? (
            <p className="preloader__status" key={status}>
              {status}
            </p>
          ) : (
            <div className="preloader__enter">
              <p className="label">This site has a generative soundtrack</p>
              <div className="preloader__buttons">
                <button className="btn" onClick={() => enter(true)} data-cursor="link">
                  Enter with sound
                </button>
                <button className="btn btn--ghost" onClick={() => enter(false)} data-cursor="link">
                  Enter muted
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="preloader__bottom">
          <div className="preloader__count" aria-live="polite">
            {count}
            <small>/100</small>
          </div>
          <div className="preloader__bar">
            <span style={{ transform: `scaleX(${count / 100})` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
