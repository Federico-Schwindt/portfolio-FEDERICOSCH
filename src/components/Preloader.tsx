import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { gsap } from '../lib/gsap'
import { useStore } from '../lib/store'
import { ambient } from '../lib/audio'
import { site } from '../content'

const CHECKS: [number, string][] = [
  [0, 'Navigation'],
  [18, 'Life support'],
  [36, 'Shaders'],
  [54, 'Models'],
  [72, 'Score'],
  [90, 'Trajectory'],
]

export function Preloader() {
  const sceneReady = useStore((s) => s.sceneReady)
  const modelsReady = useStore((s) => s.modelsReady)
  const lenis = useStore((s) => s.lenis)
  const setEntered = useStore((s) => s.setEntered)
  const setSound = useStore((s) => s.setSound)
  const setLoaded = useStore((s) => s.setLoaded)
  const { pathname } = useLocation()
  const home = pathname === '/'

  const [count, setCount] = useState(0)
  const [fonts, setFonts] = useState(false)
  const [fallback, setFallback] = useState(false)
  const [gone, setGone] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  const assets = !home || modelsReady >= 2
  const ready = count >= 100 && fonts && ((sceneReady && assets) || fallback)

  useEffect(() => {
    lenis?.stop()
  }, [lenis])

  useEffect(() => {
    const obj = { v: 0 }
    const tw = gsap.to(obj, { v: 100, duration: 3.2, ease: 'power2.inOut', onUpdate: () => setCount(Math.round(obj.v)) })
    let cancelled = false
    void document.fonts.ready.then(() => {
      if (!cancelled) setFonts(true)
    })
    const t = window.setTimeout(() => setFallback(true), 14000)
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
      .to(el.querySelector('.preloader__inner'), { opacity: 0, duration: 0.5, ease: 'power2.in' })
      .to(el, { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, '-=0.1')
  }

  if (gone) return null

  return (
    <div className="preloader" ref={root} role="dialog" aria-label="Loading">
      <div className="preloader__inner">
        <div className="preloader__top mono">
          <span>{site.name}</span>
          <span>Mission · {site.year}</span>
        </div>

        <div className="preloader__center">
          {!ready ? (
            <ul className="preloader__checks mono">
              {CHECKS.map(([at, label]) => (
                <li key={label} className={count >= at + 14 ? 'is-ok' : count >= at ? 'is-run' : ''}>
                  <span>{label}</span>
                  <i />
                </li>
              ))}
            </ul>
          ) : (
            <div className="preloader__enter">
              <p className="mono">Best with headphones — original score</p>
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
