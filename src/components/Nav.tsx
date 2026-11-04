import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import type Lenis from 'lenis'
import { nav, site } from '../content'
import { useStore } from '../lib/store'
import { TLink } from './TLink'

export function Nav() {
  const { pathname } = useLocation()
  const menuOpen = useStore((s) => s.menuOpen)
  const setMenu = useStore((s) => s.setMenu)
  const lenis = useStore((s) => s.lenis)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!lenis) return
    const onScroll = (l: Lenis) => {
      ref.current?.classList.toggle('is-compact', l.scroll > 140)
    }
    lenis.on('scroll', onScroll)
    return () => lenis.off('scroll', onScroll)
  }, [lenis])

  return (
    <header className={`nav ${pathname === '/' ? 'nav--home' : ''} ${menuOpen ? 'is-open' : ''}`} ref={ref}>
      <TLink to="/" className="nav__logo" onClick={() => setMenu(false)}>
        {site.firstName} <span>{site.lastName}</span>
      </TLink>
      <nav className="nav__links" aria-label="Primary">
        {nav.map((n) => (
          <TLink key={n.href} to={n.href} className={pathname === n.href ? 'is-active' : ''}>
            {n.label}
          </TLink>
        ))}
        <TLink to="/contact" className="nav__cta">
          Book a call
        </TLink>
      </nav>
      <a href={`mailto:${site.email}`} className="nav__mail" data-cursor="link">
        <em>{site.email}</em>
      </a>
      <button className="nav__burger mono" onClick={() => setMenu(!menuOpen)} aria-expanded={menuOpen} data-cursor="link">
        {menuOpen ? 'Close' : 'Menu'}
      </button>
    </header>
  )
}
