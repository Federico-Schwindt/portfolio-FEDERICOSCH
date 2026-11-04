import { TLink } from '../components/TLink'

export function NotFound() {
  return (
    <section className="page page--404">
      <p className="mono page__kicker">404 · Not found</p>
      <h1 className="page__title">
        <span className="line">Nothing</span>
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
