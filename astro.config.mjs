import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import node from '@astrojs/node'

// The Pages workflow sets SITE_URL (canonical origin + path) and BASE_PATH (/<repo>/). Locally both default.
const SITE_URL = process.env.SITE_URL ?? 'https://federico-schwindt.github.io/portfolio-FEDERICOSCH'

export default defineConfig({
  site: new URL(SITE_URL).origin,
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'always',
  output: 'static',
  integrations: [react()], // the client app (/app) only; the marketing pages stay plain
  // the public plans and checkout are gone: clients get their dashboard from Federico directly
  redirects: { '/pricing': '/contact', '/es/pricing': '/es/contact', '/checkout': '/app', '/es/checkout': '/es/app' },
  // pages are prerendered as before; only /api/* runs on the server (see src/pages/api). Swap the adapter for the host (Vercel, Netlify...).
  adapter: node({ mode: 'standalone' }),
  // the API has its own guard (a custom header plus Origin against Host, see src/server/db.ts); Astro's form check compares against the internal URL and refuses uploads behind proxies
  security: { checkOrigin: false },
  compressHTML: true,
  build: { format: 'directory', assets: '_assets' },
  vite: { envPrefix: ['VITE_', 'PUBLIC_'], define: { 'import.meta.env.SITE_URL': JSON.stringify(SITE_URL) } },
})
