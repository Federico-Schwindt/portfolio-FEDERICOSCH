# Federico Schwindt · portfolio and studio

The public site (home, work, services, pricing, about, contact, in English and Spanish) and the client studio app: monthly plans by requests, a dashboard for clients and a studio view for Federico.

- **Site:** Astro, block-by-block home with GSAP motion, light and dark themes, `/es/` twins.
- **App:** a React island at `/app/` and `/checkout/`, backed by the site's own API (`src/pages/api/`) on Neon Postgres. Without a server it runs as an in-browser demo; `?demo` forces it.

## Run it

```bash
npm ci
npm run build
npx astro preview --port 4330
```

The API needs `DATABASE_URL` and `ADMIN_EMAILS` in `.env` (never committed). `node scripts/db-migrate.mjs` creates or updates the database schema.

## More

- How the app, payments, hosting and deploys work: [`docs/saas-setup.md`](docs/saas-setup.md)
- Checks: `scripts/api-check.mjs`, `scripts/app-live.mjs`, `scripts/app.mjs`, `scripts/contrast-check.mjs` and the rest of `scripts/*-check.mjs` (they need the preview on port 4330).
- GitHub Pages publishes the static site from `main` (`.github/workflows/deploy.yml`); there the app runs in demo mode. The full app needs a Node host (Docker, Render).
