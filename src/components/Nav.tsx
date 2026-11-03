import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import type Lenis from 'lenis'
import { gsap } from '../lib/gsap'
import { journeyProgress, useStore } from '../lib/store'
import { chapters, nav, site } from '../content'
import { SoundToggle } from './SoundToggle'
import { TLink } from './TLink'

const CHAPTER_AT = [0, 0.13, 0.3, 0.49, 0.78, 0.93]

function useLocalTime() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: site.timeZone, hour: '2-digit', minute: '2-digit', hour12: false })
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = window.setInterval(tick, 10000)
    return () => window.clearInterval(id)
  }, [])
  return time
}

export function Nav() {
  const entered = useStore((s) => s.entered)
  const menuOpen = useStore((s) => s.menuOpen)
  const setMenu = useStore((s) => s.setMenu)
  const lenis = useStore((s) => s.lenis)
  const { pathname } = useLocation()
  const home = pathname === '/'
  const ref = useRef<HTMLElement>(null)
  const chapter = useRef<HTMLSpanElement>(null)
  const time = useLocalTime()

  useEffect(() => {
    if (!entered || !ref.current) return
    gsap.fromTo(ref.current, { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, delay: 0.7, ease: 'power3.out' })
  }, [entered])

  useEffect(() => {
    if (!lenis) return
    const onScroll = (l: Lenis) => {
      ref.current?.classList.toggle('is-hidden', l.direction === 1 && l.scroll > 240 && !menuOpen)
    }
    lenis.on('scroll', onScroll)
    return () => lenis.off('scroll', onScroll)
  }, [lenis, menuOpen])

  useEffect(() => {
    if (!home) return
    let last = -1
    const tick = () => {
      const p = journeyProgress()
      let i = 0
      while (i < CHAPTER_AT.length - 1 && p >= CHAPTER_AT[i + 1]) i++
      if (i !== last && chapter.current) {
        last = i
        chapter.current.textContent = `${String(i).padStart(2, '0')} / ${String(chapters.length - 1).padStart(2, '0')} — ${chapters[i].label}`
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [home])

  return (
    <header className={`nav ${menuOpen ? 'is-light' : ''}`} ref={ref}>
      <TLink to="/" className="nav__logo" onClick={() => setMenu(false)}>
        {site.firstName} <span>{site.lastName}</span>
      </TLink>
      <div className="nav__center label">
        <span className="nav__time">
          {site.location} — {time}
        </span>
        {home ? <span className="nav__chapter" ref={chapter}>00 / 05 — Intro</span> : <span className="nav__chapter">{pathname.replace('/', '').split('/')[0] || 'home'}</span>}
      </div>
      <div className="nav__right">
        <nav className="nav__links label" aria-label="Primary">
          {nav.map((n) => (
            <TLink key={n.href} to={n.href} className={pathname.startsWith(n.href) ? 'is-active' : ''}>
              {n.label}
            </TLink>
          ))}
        </nav>
        <SoundToggle />
        <button className="nav__menu label" onClick={() => setMenu(!menuOpen)} aria-expanded={menuOpen} data-cursor="link">
          <i />
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </div>
    </header>
  )
}
