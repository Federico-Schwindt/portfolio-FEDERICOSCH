import { useEffect, useRef, useState } from 'react'
import type Lenis from 'lenis'
import { gsap } from '../lib/gsap'
import { useStore } from '../lib/store'
import { site } from '../content'
import { SoundToggle } from './SoundToggle'
import { SECTION_ORDER, useActiveSection } from '../lib/useActiveSection'

function useLocalTime() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: site.timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
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
  const ref = useRef<HTMLElement>(null)
  const time = useLocalTime()
  const active = useActiveSection()
  const idx = Math.max(SECTION_ORDER.indexOf(active), 0)

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

  const toTop = (e: React.MouseEvent) => {
    e.preventDefault()
    setMenu(false)
    lenis?.scrollTo(0, { duration: 1.6 })
  }

  return (
    <header className={`nav ${menuOpen ? 'is-light' : ''}`} ref={ref}>
      <a href="#top" className="nav__logo" onClick={toTop} aria-label="Back to top">
        {site.firstName} <span>{site.lastName}</span>
      </a>
      <div className="nav__center label">
        <span className="nav__time">
          {site.location} — {time}
        </span>
        <span className="nav__chapter">
          {String(idx).padStart(2, '0')} / {String(SECTION_ORDER.length - 1).padStart(2, '0')}
        </span>
      </div>
      <div className="nav__right">
        <SoundToggle />
        <button className="nav__menu label" onClick={() => setMenu(!menuOpen)} aria-expanded={menuOpen} data-cursor="link">
          <i />
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      </div>
    </header>
  )
}
