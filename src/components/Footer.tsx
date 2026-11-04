import { useEffect, useState } from 'react'
import { nav, site, socials } from '../content'
import { TLink } from './TLink'
import { Wordmark } from './Wordmark'

export function Footer() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: site.timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])
  return (
    <footer className="footer">
      <div className="footer__grid">
        <a href={`mailto:${site.email}`} className="footer__mail" data-cursor="link">
          <em>{site.email}</em>
        </a>
        <div className="mono footer__time">
          <span>Local time</span>
          <span>
            {time} ({site.utc})
          </span>
        </div>
        <ul className="footer__col">
          {socials.map((s) => (
            <li key={s.label}>
              <a href={s.href} target="_blank" rel="noreferrer" data-cursor="link">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <ul className="footer__col">
          {nav.map((n) => (
            <li key={n.href}>
              <TLink to={n.href}>{n.label}</TLink>
            </li>
          ))}
          <li>
            <TLink to="/contact">Contact</TLink>
          </li>
        </ul>
      </div>
      <Wordmark />
      <p className="mono footer__legal">
        © {site.year} {site.name} · {site.city} · {site.agency}
      </p>
    </footer>
  )
}
