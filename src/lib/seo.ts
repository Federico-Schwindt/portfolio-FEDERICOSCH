import { useLayoutEffect } from 'react'
import { site, socials } from '../content'

/** Canonical origin + base path of the deployed site (no trailing slash). */
export const SITE_URL = 'https://federico-schwindt.github.io/portfolio-FEDERICOSCH'
export const DEFAULT_IMAGE = `${SITE_URL}/og.jpg`

type Json = Record<string, unknown>

export type Seo = {
  title: string
  description: string
  /** route path, e.g. "/work/joya-hijab" */
  path: string
  image?: string
  type?: 'website' | 'article' | 'profile'
  noindex?: boolean
  jsonLd?: Json | Json[]
}

/** GitHub Pages serves prerendered routes as folders, so inner URLs end with a slash. */
export const canonicalFor = (path: string) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path.replace(/\/$/, '')}/`)

function upsert(selector: string, create: () => HTMLElement, set: (el: HTMLElement) => void) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  set(el)
}

const meta = (attr: 'name' | 'property', key: string, content: string) =>
  upsert(
    `meta[${attr}="${key}"]`,
    () => {
      const m = document.createElement('meta')
      m.setAttribute(attr, key)
      return m
    },
    (m) => m.setAttribute('content', content),
  )

/** Sets title, description, canonical, Open Graph / Twitter tags and JSON-LD for the current route. */
export function useSeo(seo: Seo) {
  const { title, description, path, image = DEFAULT_IMAGE, type = 'website', noindex = false, jsonLd } = seo
  const ld = JSON.stringify(jsonLd ?? null)
  useLayoutEffect(() => {
    const url = canonicalFor(path)
    document.title = title
    meta('name', 'description', description)
    meta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
    meta('property', 'og:title', title)
    meta('property', 'og:description', description)
    meta('property', 'og:url', url)
    meta('property', 'og:image', image)
    meta('property', 'og:type', type)
    meta('property', 'og:site_name', site.name)
    meta('name', 'twitter:title', title)
    meta('name', 'twitter:description', description)
    meta('name', 'twitter:image', image)
    upsert(
      'link[rel="canonical"]',
      () => {
        const l = document.createElement('link')
        l.setAttribute('rel', 'canonical')
        return l
      },
      (l) => l.setAttribute('href', url),
    )
    document.head.querySelectorAll('script[data-seo]').forEach((s) => s.remove())
    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd]
      for (const item of items) {
        const s = document.createElement('script')
        s.type = 'application/ld+json'
        s.dataset.seo = ''
        s.text = JSON.stringify(item)
        document.head.appendChild(s)
      }
    }
    // ld is the serialised form of jsonLd so the effect re-runs only when the content changes
  }, [title, description, path, image, type, noindex, ld]) // eslint-disable-line react-hooks/exhaustive-deps
}

// ── structured data ───────────────────────────────────────────────────────────

export const personLd: Json = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${SITE_URL}/#person`,
  name: site.name,
  givenName: site.firstName,
  familyName: site.lastName,
  jobTitle: 'Web designer, developer & marketer',
  description: `${site.name} builds, designs and markets websites for businesses worldwide from ${site.city}.`,
  url: `${SITE_URL}/`,
  image: `${SITE_URL}/char/portrait.jpg`,
  email: `mailto:${site.email}`,
  worksFor: { '@id': `${SITE_URL}/#org` },
  address: { '@type': 'PostalAddress', addressLocality: 'Gualeguaychú', addressRegion: 'Entre Ríos', addressCountry: 'AR' },
  sameAs: socials.map((s) => s.href),
  knowsAbout: ['Web design', 'Web development', 'WordPress', 'WooCommerce', 'React', 'E-commerce', 'SEO', 'Google Ads', 'Motion design'],
}

export const orgLd = (packages: { name: string; price: string; monthly: string; text: string }[]): Json => ({
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': `${SITE_URL}/#org`,
  name: site.agency,
  alternateName: `${site.name} — ${site.tagline}`,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/favicon.svg`,
  image: DEFAULT_IMAGE,
  email: site.email,
  founder: { '@id': `${SITE_URL}/#person` },
  areaServed: 'Worldwide',
  address: { '@type': 'PostalAddress', addressLocality: 'Gualeguaychú', addressRegion: 'Entre Ríos', addressCountry: 'AR' },
  priceRange: '$300 – $750 setup + monthly plan',
  serviceType: ['Website design', 'Website development', 'E-commerce development', 'Digital marketing', 'SEO'],
  makesOffer: packages.map((p) => ({
    '@type': 'Offer',
    name: `${p.name} website package`,
    description: p.text,
    price: p.price.replace(/[^0-9.]/g, ''),
    priceCurrency: 'USD',
    priceSpecification: { '@type': 'UnitPriceSpecification', price: p.monthly.replace(/[^0-9.]/g, ''), priceCurrency: 'USD', billingIncrement: 1, unitCode: 'MON', description: 'Monthly plan after setup' },
    url: `${SITE_URL}/#pricing`,
    availability: 'https://schema.org/InStock',
  })),
  sameAs: socials.map((s) => s.href),
})

export const breadcrumbLd = (items: { name: string; path: string }[]): Json => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: canonicalFor(it.path) })),
})

export const websiteLd: Json = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: `${site.name} — ${site.tagline}`,
  url: `${SITE_URL}/`,
  inLanguage: 'en',
  publisher: { '@id': `${SITE_URL}/#person` },
}
