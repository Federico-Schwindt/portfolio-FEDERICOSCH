# Federico Schwindt — portfolio

Website development, design & marketing. A red-on-white editorial site whose centrepiece is a scroll-driven retro computer: the section opens on a Windows-XP-style desktop that fills the viewport, then the camera pulls back to reveal a 3D all-in-one PC on a desk whose screen keeps rendering that same desktop, live and clickable.

Live: https://federico-schwindt.github.io/portfolio-FEDERICOSCH/

## Stack

- Vite 8 + React 19 + TypeScript
- Three.js r187, `@react-three/fiber`, `@react-three/drei` (the computer is built from primitives and lit by a studio environment)
- GSAP 3 + ScrollTrigger (pinned, scrubbed sections), Lenis smooth scroll
- `react-router` with lazy pages, `zustand` for the small shared state
- Fonts: Archivo Variable, Space Mono, Instrument Serif

## Pages

| Route | What it is |
| --- | --- |
| `/` | Hero, the Design + Code + Marketing equation, manifesto, process, selected work, packages, the XP computer, contact |
| `/work` | All projects |
| `/work/:slug` | Case study for every project: client work (Universal Driveshafts plus the Freelancer.com portfolio) and concepts |
| `/about` | Bio, tools, stats |
| `/contact` | Lead form (stored in Neon Postgres), email, socials |
| `/admin` | Private lead inbox: Neon Auth sign-in, live list via Neon Realtime (noindex, not linked) |

## The XP section

`src/three/Retro.tsx` renders the machine. The desktop (`src/components/Desktop.tsx`) is real DOM placed on the screen plane with drei's `<Html transform>`, so windows open, drag and close inside the monitor while the monitor itself sits in 3D. Scroll progress (`xpProgress` in `src/lib/store.ts`) drives one camera move: face-on with the screen filling the viewport, pull back to the full machine, then ease to a three-quarter hero angle.

Two things are easy to break:

- **Hit-testing.** Chromium mis-hit-tests CSS3D content whose layout position in the viewport is fractional, which a GSAP pin or smooth scroll produces. The DOM layer is therefore portalled to `<body>`, kept `position: fixed` at an integer offset and follows the section with a transform (`LayerSync`).
- **Cropping.** When the desktop fills the viewport the camera fits the shorter axis, so part of the 1280×960 desktop is off-screen. `safeArea()` in `Desktop.tsx` keeps windows and icons inside the visible region on every aspect ratio.

## SEO

- Every route sets its own title, description, canonical URL, Open Graph tags and JSON-LD through `useSeo` (`src/lib/seo.ts`): Person, ProfessionalService with the three packages as Offers, WebSite, FAQPage, Service list, BreadcrumbList, CreativeWork / VideoObject per case study.
- `npm run build` ends with `scripts/prerender.mjs`, which loads every public route in headless Chromium and writes static HTML to `dist/<route>/index.html`, plus `dist/sitemap.xml`. Crawlers and link previews get real content without running JavaScript; the page boots normally on top.
- On a GitHub Pages project site, crawlers only read `robots.txt` at the domain root, so submit `https://federico-schwindt.github.io/portfolio-FEDERICOSCH/sitemap.xml` in Google Search Console. A custom domain fixes both.

## Neon (database, API, auth, storage, realtime)

| Piece | Where |
| --- | --- |
| Services | `neon.ts` (auth, function `api`, buckets `media` + `briefs`, realtime) |
| Schema | `db/schema.sql`, applied with `npm run db:migrate` |
| API | `functions/api` (Hono): `POST /leads`, `POST /leads/:id/brief`, admin `GET/PATCH /leads`, `POST /leads/live` |
| Browser | `src/lib/api.ts`, `src/components/LeadForm.tsx`, `src/pages/Admin.tsx` |

Set up or redeploy:

```bash
npm i -g neon@latest && neon login
```

```bash
cp .env.example .env.local   # then fill ADMIN_EMAILS / WEB_ORIGINS
```

```bash
neon deploy --env .env.local && neon env pull && neon deploy --env .env.local
```

```bash
npm run db:migrate
```

```bash
neon functions get api        # copy invocation_url
```

The second deploy uploads the Realtime secret, which only exists after the first one. Then add three repository variables (Settings → Secrets and variables → Actions → Variables) so the Pages build can reach Neon: `VITE_API_URL` (the function URL), `VITE_NEON_AUTH_URL` (`NEON_AUTH_BASE_URL`), `VITE_NEON_REALTIME_URL` (`NEON_REALTIME_URL`). Register the site origin with Neon Auth:

```bash
neon neon-auth domain add https://federico-schwindt.github.io
```

Without `VITE_API_URL` the forms fall back to a pre-filled email, so the site never loses a lead. `npm run api:dev` runs the function locally against `.env.local` (`DB_DRIVER=http` uses Neon's HTTPS SQL endpoint where port 5432 is blocked).

## Content

Everything editable lives in `src/content.ts`: copy, projects, packages and prices, icons on the desktop, socials. Images live in `public/work`, `public/case` and `public/char`.

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build && npm run preview
```

## Deploy

Pushing to `main` builds the site and publishes it to GitHub Pages through `.github/workflows/deploy.yml`. The build uses `BASE_PATH=/portfolio-FEDERICOSCH/`; `public/404.html` redirects deep links back into the router.
