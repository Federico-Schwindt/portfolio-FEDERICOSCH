import { packages, projects, site, socials, type Project } from '../data/content'

/** Canonical origin + base path of the deployed site (no trailing slash). */
export const SITE_URL = (import.meta.env.SITE_URL as string | undefined) ?? 'https://federico-schwindt.github.io/portfolio-FEDERICOSCH'
export const DEFAULT_IMAGE = `${SITE_URL}/og.jpg`

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

/** Internal link or asset path, prefixed with the base path. External links pass through. */
export const url = (p = '/') => (/^(https?:|mailto:|tel:|#)/.test(p) ? p : `${BASE}${p.startsWith('/') ? p : `/${p}`}`)
/** Absolute canonical URL for a route ("/work/x" → ".../work/x/") */
export const canonicalFor = (path: string) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path.replace(/\/$/, '')}/`)
export const abs = (asset: string) => `${SITE_URL}/${asset.replace(/^\//, '')}`

/** Display number for a project: its position in the one list ("01" … "12") */
export const numberOf = (p: Project) => String(projects.indexOf(p) + 1).padStart(2, '0')
export const bySlug = (slug: string) => projects.find((p) => p.slug === slug)
/** 720px version of a project cover (previews, posters) */
export const thumbOf = (p: Project) => p.cover.replace('work/', 'work/sm/')
export const hostOf = (u?: string) => u?.replace(/^https?:\/\//, '').replace(/\/$/, '')

type Json = Record<string, unknown>

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
  knowsAbout: ['Web design', 'Web development', 'Astro', 'WordPress', 'WooCommerce', 'React', 'E-commerce', 'SEO', 'Google Ads', 'Motion design'],
}

export const orgLd: Json = {
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
}

export const websiteLd: Json = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: `${site.name} — ${site.tagline}`,
  url: `${SITE_URL}/`,
  inLanguage: 'en',
  publisher: { '@id': `${SITE_URL}/#person` },
}

export const breadcrumbLd = (items: { name: string; path: string }[]): Json => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: canonicalFor(it.path) })),
})

export const projectLd = (p: Project): Json => ({
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: p.title,
  headline: `${p.title}: ${p.category}`,
  description: p.summary,
  url: canonicalFor(`/work/${p.slug}`),
  image: [p.cover, ...p.images].map(abs),
  ...(p.video ? { video: { '@type': 'VideoObject', name: `${p.title} film`, description: p.summary, contentUrl: abs(p.video), thumbnailUrl: abs(p.cover), uploadDate: `${p.year.slice(0, 4)}-01-01` } } : {}),
  creator: { '@id': `${SITE_URL}/#person` },
  dateCreated: p.year.slice(0, 4),
  keywords: [...p.stack, ...p.role].join(', '),
  ...(p.url ? { sameAs: p.url } : {}),
  ...(p.concept ? { genre: 'Concept' } : { sourceOrganization: p.client }),
})
