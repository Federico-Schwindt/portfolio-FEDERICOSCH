// Prerenders every public route of the built site into dist/<route>/index.html and writes
// dist/sitemap.xml, so crawlers and link previews get real HTML without executing the app.
// Runs after `vite build`. Needs Playwright's Chromium (CI installs it; locally it is preinstalled).
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve('dist')
const BASE = (process.env.BASE_PATH ?? '/').replace(/\/?$/, '/')
const SITE_URL = (process.env.SITE_URL ?? 'https://federico-schwindt.github.io/portfolio-FEDERICOSCH').replace(/\/$/, '')
const PORT = 4175
const ORIGIN = `http://127.0.0.1:${PORT}`
const SKIP = [/^\/admin/]

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('dist/index.html not found — run `vite build` first')
  process.exit(1)
}

const server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], {
  stdio: 'ignore',
  env: { ...process.env, BASE_PATH: BASE },
})
const stop = () => {
  try {
    server.kill()
  } catch {
    /* already gone */
  }
}
process.on('exit', stop)

async function waitForServer() {
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(ORIGIN + BASE)
      if (r.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('preview server did not start')
}

const toRoute = (href) => {
  try {
    const u = new URL(href, ORIGIN)
    if (u.origin !== ORIGIN || !u.pathname.startsWith(BASE)) return null
    const route = '/' + u.pathname.slice(BASE.length).replace(/\/$/, '')
    return route === '/' ? '/' : route.replace(/\/$/, '')
  } catch {
    return null
  }
}

await waitForServer()
let browser
try {
  browser = await chromium.launch({
    executablePath: process.env.PRERENDER_CHROMIUM || undefined,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  })
} catch (e) {
  stop()
  // CI must prerender; a laptop without Chromium still gets a working SPA build.
  if (process.env.CI) throw e
  console.warn('prerender skipped: Chromium is not installed (run `npx playwright install chromium`).')
  process.exit(0)
}
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.addInitScript(() => {
  window.__PRERENDER__ = true
})
page.on('pageerror', (e) => console.warn('  page error:', e.message.slice(0, 160)))

const queue = ['/']
const seen = new Set(queue)
const done = []
while (queue.length) {
  const route = queue.shift()
  const url = ORIGIN + BASE + (route === '/' ? '' : route.slice(1))
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 })
  await page.waitForFunction(() => document.body.dataset.prerenderReady === '1' || document.readyState === 'complete', null, { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(1800)
  const { html, links, title } = await page.evaluate(() => {
    // Drop transient overlays and anything that only makes sense with JavaScript running.
    document.querySelectorAll('.preloader, .cursor, .pt, .xp__html, canvas, [data-prerender-skip]').forEach((n) => n.remove())
    // Vite adds <link rel=modulepreload> for lazy chunks at runtime with absolute URLs of this
    // temporary server; the real page adds its own again when it boots.
    document.querySelectorAll(`link[href^="${location.origin}"], script[src^="${location.origin}"]`).forEach((n) => n.remove())
    // GSAP leaves reveal targets with inline opacity/transform; the static copy must be readable.
    document.querySelectorAll('#root [style]').forEach((el) => {
      const s = el.style
      ;['opacity', 'transform', 'visibility', 'clip-path', 'translate', 'rotate', 'scale'].forEach((p) => s.removeProperty(p))
      if (!s.length) el.removeAttribute('style')
    })
    document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped')
    document.body.removeAttribute('data-prerender-ready')
    // A static curtain covers the snapshot until React mounts its own preloader (seamless hand-off);
    // without JavaScript the noscript rule removes it so the static page stays readable.
    const root = document.getElementById('root')
    root?.insertAdjacentHTML('afterbegin', '<div class="pre" aria-hidden="true"><div class="pre__inner"><span class="mono">Website Development, Design &amp; Marketing</span><span class="pre__name">Federico Schwindt</span><span class="mono pre__count">000</span></div></div>')
    if (!document.querySelector('noscript[data-prerender]')) document.head.insertAdjacentHTML('beforeend', '<noscript data-prerender><style>.pre{display:none!important}</style></noscript>')
    const links = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href') || '').filter((h) => h && !h.startsWith('#') && !/^(mailto|tel|https?):/.test(h))
    return { html: '<!doctype html>\n' + document.documentElement.outerHTML, links, title: document.title }
  })
  for (const l of links) {
    const r = toRoute(l)
    if (r && !seen.has(r) && !SKIP.some((re) => re.test(r))) {
      seen.add(r)
      queue.push(r)
    }
  }
  const out = route === '/' ? join(DIST, 'index.html') : join(DIST, route.slice(1), 'index.html')
  mkdirSync(dirname(out), { recursive: true })
  if (html.includes(ORIGIN)) console.warn(`  ! ${route}: stripped ${html.split(ORIGIN).length - 1} reference(s) to the prerender server`)
  writeFileSync(out, html.split(ORIGIN).join(''))
  done.push(route)
  console.log(`  ✓ ${route.padEnd(36)} ${title}`)
}
await browser.close()
stop()

const today = new Date().toISOString().slice(0, 10)
const urls = done
  .sort()
  .map((r) => {
    const loc = r === '/' ? `${SITE_URL}/` : `${SITE_URL}${r}/`
    const priority = r === '/' ? '1.0' : r.startsWith('/work/') ? '0.7' : '0.8'
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r === '/' ? 'weekly' : 'monthly'}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  })
  .join('\n')
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
// keep robots.txt pointing at the right sitemap even when SITE_URL differs from the default
const robots = join(DIST, 'robots.txt')
if (existsSync(robots)) writeFileSync(robots, readFileSync(robots, 'utf8').replace(/Sitemap: .*/g, `Sitemap: ${SITE_URL}/sitemap.xml`))
console.log(`prerendered ${done.length} routes + sitemap.xml`)
