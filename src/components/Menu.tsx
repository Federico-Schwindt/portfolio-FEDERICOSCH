import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { useStore } from '../lib/store'
import { nav, site, socials } from '../content'
import { transitionTo } from '../lib/transition'

const items = [{ label: 'Home', href: '/', index: '00' }, ...nav]

export function Menu() {
  const menuOpen = useStore((s) => s.menuOpen)
  const setMenu = useStore((s) => s.setMenu)
  const lenis = useStore((s) => s.lenis)
  const root = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    const el = root.current!
    tl.current = gsap
      .timeline({ paused: true })
      .set(el, { visibility: 'visible' })
      .fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'power4.inOut' })
      .fromTo(el.querySelectorAll('.menu__link'), { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.07, ease: 'power4.out' }, '-=0.4')
      .fromTo(el.querySelectorAll('.menu__bottom > *'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.6 }, '-=0.6')
    return () => {
      tl.current?.kill()
    }
  }, [])

  useEffect(() => {
    const t = tl.current
    if (!t) return
    if (menuOpen) {
      lenis?.stop()
      t.timeScale(1).play()
    } else {
      lenis?.start()
      if (t.progress() > 0) t.timeScale(1.7).reverse()
    }
  }, [menuOpen, lenis])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setMenu])

  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    setMenu(false)
    window.setTimeout(() => transitionTo(href), 150)
  }

  return (
    <div className="menu" ref={root} data-lenis-prevent aria-hidden={!menuOpen}>
      <nav className="menu__links" aria-label="Main">
        {items.map((item) => (
          <div className="menu__item" key={item.href}>
            <a className="menu__link" href={item.href} onClick={(e) => go(e, item.href)} data-cursor="link">
              <sup>{item.index}</sup>
              {item.label}
            </a>
          </div>
        ))}
      </nav>
      <div className="menu__bottom label">
        <div>
          <span className="menu__head">Socials</span>
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          ))}
        </div>
        <div>
          <span className="menu__head">Contact</span>
          <a href={`mailto:${site.email}`}>{site.email}</a>
        </div>
        <div>
          <span className="menu__head">Location</span>
          <span>{site.city}</span>
        </div>
      </div>
    </div>
  )
}
