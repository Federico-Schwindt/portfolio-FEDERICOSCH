import type { APIRoute } from 'astro'
import { projects } from '../data/content'
import { offers } from '../data/offers'
import { canonicalFor } from '../lib/site'

/** Every indexable page in both languages, with the same base as the canonical tags. Each entry names its twin. */
export const GET: APIRoute = () => {
  const paths = [
    '/',
    '/services',
    ...offers.map((o) => `/services/${o.slug}`),
    '/audit',
    '/work',
    ...projects.map((p) => `/work/${p.slug}`),
    '/about',
    '/contact',
  ]
  const es = (p: string) => (p === '/' ? '/es/' : `/es${p}`)
  const alt = (p: string) =>
    `<xhtml:link rel="alternate" hreflang="en" href="${canonicalFor(p)}"/>` +
    `<xhtml:link rel="alternate" hreflang="es" href="${canonicalFor(es(p))}"/>` +
    `<xhtml:link rel="alternate" hreflang="x-default" href="${canonicalFor(p)}"/>`
  const rows = paths.flatMap((p) => [`  <url><loc>${canonicalFor(p)}</loc>${alt(p)}</url>`, `  <url><loc>${canonicalFor(es(p))}</loc>${alt(p)}</url>`])
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join('\n')}\n</urlset>\n`
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
