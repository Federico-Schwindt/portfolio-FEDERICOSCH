import { site, socials } from '../content'
import { MagneticButton } from './MagneticButton'
import { TLink } from './TLink'
import { useStore } from '../lib/store'

export function Footer() {
  const lenis = useStore((s) => s.lenis)
  return (
    <footer className="footer">
      <div className="footer__main">
        <p className="mono footer__kicker">
          <i className="dot" /> {site.availability}
        </p>
        <h2 className="footer__title">
          <span className="line">Let's work</span>
          <span className="line">together</span>
        </h2>
        <div className="footer__cta">
          <MagneticButton href={`mailto:${site.email}`} className="btn btn--lg">
            {site.email}
          </MagneticButton>
          <TLink to="/contact" className="btn btn--ghost btn--lg">
            Contact page
          </TLink>
        </div>
      </div>
      <div className="footer__bottom label">
        <div className="footer__col">
          <span className="footer__head">Socials</span>
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" data-cursor="link">
              {s.label}
            </a>
          ))}
        </div>
        <div className="footer__col">
          <span className="footer__head">Pages</span>
          <TLink to="/">Home</TLink>
          <TLink to="/work">Work</TLink>
          <TLink to="/about">About</TLink>
          <TLink to="/lab">Lab</TLink>
        </div>
        <div className="footer__col">
          <span className="footer__head">Studio</span>
          <span>{site.agency}</span>
          <span>{site.city}</span>
          <span>Working worldwide</span>
        </div>
        <div className="footer__col footer__col--end">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              lenis?.scrollTo(0, { duration: 1.6 })
            }}
            data-cursor="link"
          >
            Back to top ↑
          </a>
          <span>
            © {site.year} {site.name}
          </span>
        </div>
      </div>
    </footer>
  )
}
