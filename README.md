# Federico Schwindt — portfolio

Website development, design & marketing. Black, white and one red: a static Astro site built to load fast and make the work the loudest thing on the page.

Live: https://federico-schwindt.github.io/portfolio-FEDERICOSCH/

## Brand

- **Colors:** ink `#0b0b0b`, paper `#ffffff`, red `#ff2a1a`. Small red text on white uses `#d9140b` so it passes WCAG AA; red fills carry black text.
- **Type:** Geist Variable for everything, Geist Mono for labels. Display sizes are heavy, uppercase and tightly tracked.
- **Mark:** a red square with a blocky “FS” (`src/components/Logo.astro`, `public/favicon.svg`).
- **Signature moments:** the red lens that inverts the hero headline under the cursor (it drifts on its own on touch screens), the red band, one big proof number, and a work list whose preview follows the cursor.

## Stack

- [Astro](https://astro.build) 7, static output, no CSS framework
- Vanilla TypeScript for interactions (`src/scripts/app.ts`): reveals, counters, lens, previews, filters, tabs. Native cross-document View Transitions between pages.
- React only for the private `/admin` island (Neon Auth + Realtime)
- Neon for the lead API, database, auth, storage and realtime (see below)

## Pages

| Route | What it is |
| --- | --- |
| `/` | Hero with the lens and a reel of project films, proof, the full project list, the Redesign a Day series, services, process, pricing, FAQ, free audit form, contact |
| `/work/` | Every project in one grid, filterable by Websites, E-commerce and Motion |
| `/work/:slug/` | Case study: summary, key numbers, challenge and solution, “What I built”, Lighthouse results, result, gallery, next project |
| `/about/` | Bio, numbers, disciplines, timeline, tools |
| `/contact/` | Lead form (stored in Neon Postgres, falls back to email), email, socials |
| `/admin/` | Private lead inbox: Neon Auth sign-in, live list via Neon Realtime (noindex, not linked) |

Client work and self-initiated concepts share one list and one numbering. Concepts keep a small “Concept” tag and a not-affiliated note on their case study.

## SEO

Every page is static HTML with its own title, description, canonical URL, Open Graph tags and JSON-LD (Person, ProfessionalService with the three packages as Offers, WebSite, FAQPage, Service list, BreadcrumbList, CreativeWork / VideoObject per case study), set in `src/layouts/Base.astro` and `src/lib/site.ts`. `sitemap.xml` is generated at build time. `npm run og` renders `public/og.jpg`.

On a GitHub Pages project site, crawlers only read `robots.txt` at the domain root, so submit `https://federico-schwindt.github.io/portfolio-FEDERICOSCH/sitemap.xml` in Google Search Console. A custom domain fixes both.

## Neon (database, API, auth, storage, realtime)

| Piece | Where |
| --- | --- |
| Services | `neon.ts` (auth, function `api`, buckets `media` + `briefs`, realtime) |
| Schema | `db/schema.sql`, applied with `npm run db:migrate` |
| API | `functions/api` (Hono): `POST /leads`, `POST /leads/:id/brief`, admin `GET/PATCH /leads`, `POST /leads/live` |
| Browser | `src/lib/api.ts`, `src/components/LeadForm.astro` + `src/scripts/lead.ts`, `src/components/admin/Admin.tsx` |

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

Everything editable lives in `src/data/content.ts`: copy, projects (in display order), the series, services, packages and prices, FAQ, socials. Images live in `public/work` (covers, plus 720px versions in `public/work/sm`), `public/case`, `public/media` and `public/char`.

## Develop

```bash
npm install
npm run dev
```

```bash
npm run build && npm run preview
```

## Deploy

Pushing to `main` builds the site and publishes it to GitHub Pages through `.github/workflows/deploy.yml`. The build sets `BASE_PATH=/portfolio-FEDERICOSCH/` and `SITE_URL`; Astro writes a folder per route, so deep links work without a redirect page.
