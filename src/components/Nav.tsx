import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import type Lenis from 'lenis'
import { gsap } from '../lib/gsap'
import { useStore } from '../lib/store'
import { nav, site } from '../content'
import { SoundToggle } from './SoundToggle'
import { TLink } from './TLink'

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
  const ref = useRef<HTMLElement>(null)
  const time = useLocalTime()

  useEffect(() => {
    if (!entered || !ref.current) return
    gsap.fromTo(ref.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, delay: 0.8, ease: 'power3.out' })
  }, [entered])

  useEffect(() => {
    if (!lenis) return
    const onScroll = (l: Lenis) => {
      ref.current?.classList.toggle('is-hidden', pathname !== '/' && l.direction === 1 && l.scroll > 240 && !menuOpen)
    }
    lenis.on('scroll', onScroll)
    return () => lenis.off('scroll', onScroll)
  }, [lenis, menuOpen, pathname])

  return (
    <header className={`nav ${menuOpen ? 'is-light' : ''}`} ref={ref}>
      <TLink to="/" className="nav__logo" onClick={() => setMenu(false)}>
        {site.firstName} <span>{site.lastName}</span>
      </TLink>
      <div className="nav__center mono">
        <span>
          {site.location} — {time}
        </span>
      </div>
      <div className="nav__right">
        <nav className="nav__links mono" aria-label="Primary">
          {nav.map((n) => (
            <TLink key={n.href} to={n.href} className={pathname.startsWith(n.href) ? 'is-active' : ''}>
              {n.label}
            </TLink>
          ))}
        </nav>
        <SoundToggle />
        <button className="nav__menu mono" onClick={() => setMenu(!menuOpen)} aria-expanded={menuOpen} data-cursor="link">
          <i />
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </div>
    </header>
  )
}
