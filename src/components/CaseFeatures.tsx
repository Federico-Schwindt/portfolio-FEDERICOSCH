import type { Project } from '../content'

const base = import.meta.env.BASE_URL

type Feature = NonNullable<Project['features']>[number]

/** “What I built”: alternating image / text rows for a case study. */
export function CaseFeatures({ items, title }: { items: Feature[]; title: string }) {
  return (
    <section className="cfeat" aria-labelledby="cfeat-title">
      <h2 className="case__h mono" id="cfeat-title">
        What I built
      </h2>
      <div className="cfeat__list">
        {items.map((f, i) => (
          <article className={`cfeat__row ${i % 2 ? 'cfeat__row--rev' : ''}`} key={f.title}>
            {f.image && (
              <div className="cfeat__img">
                <img src={base + f.image} alt={`${title}: ${f.title}`} loading="lazy" decoding="async" width="1440" height="900" />
              </div>
            )}
            <div className="cfeat__text">
              <span className="mono cfeat__n">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="cfeat__title">{f.title}</h3>
              <p className="cfeat__p">{f.text}</p>
              {f.stat && <p className="mono cfeat__stat">{f.stat}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
