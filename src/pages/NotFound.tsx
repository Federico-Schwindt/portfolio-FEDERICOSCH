import { TLink } from '../components/TLink'

export function NotFound() {
  return (
    <section className="page page--404">
      <p className="label page__kicker">
        <span className="index">404</span> Lost in the void
      </p>
      <h1 className="page__title">
        <span className="line">Nothing</span>
        <span className="line">here</span>
      </h1>
      <TLink to="/" className="btn btn--lg">
        Back home
      </TLink>
    </section>
  )
}
