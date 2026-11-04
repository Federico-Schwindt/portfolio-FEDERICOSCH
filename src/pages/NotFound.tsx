import { TLink } from '../components/TLink'
import { useSeo } from '../lib/seo'

export function NotFound() {
  useSeo({ title: 'Page not found | Federico Schwindt', description: 'This page does not exist.', path: '/404', noindex: true })
  return (
    <section className="page page--404">
      <p className="mono page__kicker">404 · Not found</p>
      <h1 className="page__title">
        <span className="line">Nothing</span>{' '}
        <span className="line">
          <em>here.</em>
        </span>
      </h1>
      <TLink to="/" className="pill">
        <em>Back home</em>
      </TLink>
    </section>
  )
}
