import type { APIRoute } from 'astro'
import { projects } from '../data/content'
import { canonicalFor } from '../lib/site'

const today = new Date().toISOString().slice(0, 10)
const routes = ['/', '/work', '/about', '/contact', ...projects.map((p) => `/work/${p.slug}`)]

export const GET: APIRoute = () =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
      .map((r) => `  <url><loc>${canonicalFor(r)}</loc><lastmod>${today}</lastmod><priority>${r === '/' ? '1.0' : r.startsWith('/work/') ? '0.8' : '0.6'}</priority></url>`)
      .join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  )
