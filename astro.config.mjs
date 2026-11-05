import { defineConfig } from 'astro/config'
import react from '@astrojs/react'

// The Pages workflow sets SITE_URL (canonical origin + path) and BASE_PATH (/<repo>/). Locally both default.
const SITE_URL = process.env.SITE_URL ?? 'https://federico-schwindt.github.io/portfolio-FEDERICOSCH'

export default defineConfig({
  site: new URL(SITE_URL).origin,
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'always',
  output: 'static',
  compressHTML: true,
  build: { format: 'directory', inlineStylesheets: 'always', assets: '_assets' },
  // React is only used by the private /admin island (Neon Auth + Realtime)
  integrations: [react({ include: ['**/admin/**'] })],
  // VITE_* repository variables (Neon) keep working: they are inlined at build time
  vite: { envPrefix: ['VITE_', 'PUBLIC_'], define: { 'import.meta.env.SITE_URL': JSON.stringify(SITE_URL) } },
})
