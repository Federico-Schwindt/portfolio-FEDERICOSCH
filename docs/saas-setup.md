# Client app: how it runs

The client app (`/app/`, `/checkout/`, and the same under `/es/`) runs on **Neon Postgres** through the site's own API (`src/pages/api/[...path].ts`, server code in `src/server/`). Without a server it falls back to a **demo** that lives in the browser; `?demo` forces the demo anywhere.

## Pieces

| Piece | Where | Notes |
| --- | --- | --- |
| Database | Neon, schema `studio` | `db/studio.sql`. Apply or update with `node scripts/db-migrate.mjs` (safe to run again). The existing `public.leads` and `neon_auth` tables are not touched. |
| Accounts | `studio.users`, `studio.sessions` | Email and password (scrypt). The session is an httpOnly cookie; only its SHA-256 is stored. Emails listed in `ADMIN_EMAILS` become the studio (admin) when they sign up. |
| Requests and the queue | `studio.requests`, `studio.request_events` | The rule lives in the database: Launch 2, Grow 4, Scale 6 in progress; the next one starts when one is delivered. |
| Files | `studio.files` | Up to 8 MB each, stored in Postgres for now. Only the owner and the studio can read them. Move to object storage (R2, S3) when volume grows; only the API's read and write change. |
| Payments | Studio → Payments | No provider yet: a checkout reserves the plan as `pending` and you activate it in Studio → Clients (bank transfer, for example). Lemon Squeezy: paste the API key, store ID, webhook secret and variant IDs there, and set the webhook in Lemon Squeezy to the URL shown. |

## Dashboard refresh

The migration runner applies `db/studio.sql` and then the numbered SQL files in order. Migration `05-state-revisions.sql` enables the six-second poll to check the signed-in user's account revision. Until that migration is applied, the API continues comparing individual collections.

To verify the migration, sign in and open the Network panel while the tab is visible. An idle `GET /api/state/` returns 204 with `Server-Timing: state-revision`. That response checks the session, the revision and whether any scheduled work is due. A different account or role receives a fresh snapshot. The studio also refreshes its priority counts when its revision changes.

## Changing plans and paying

The rules live in one place, `src/lib/plan-rules.ts` (the server and the demo use the same file), and are applied by `src/server/plans.ts` with the table `studio.plan_changes`. The client sees the price and the date before confirming (Plan & billing: choose → review → done).

| Change | What it costs | When it applies |
| --- | --- | --- |
| Upgrade | Build difference + monthly difference for the days left in the period | As soon as it is paid |
| Downgrade | Free | End of the paid period |
| Community on | One month ($1,000) | As soon as it is paid |
| Community off | Free | End of the paid period |
| Pause / cancel | Free | End of the paid period (can be undone until then) |
| Resume | One month of the plan | As soon as it is paid |

- **With Lemon Squeezy:** the change opens a hosted checkout for the exact amount (`custom_price`) and the webhook applies it.
- **Without a provider:** the change waits as "awaiting payment"; Federico confirms the transfer in Studio → Plan changes, which writes the invoice and applies it.
- Applying is one SQL statement (change, subscription and invoice together), so a failure never leaves a change applied without its invoice, and it can never apply twice.
- Scheduled changes apply the first time anyone opens the dashboard after their date.

## Environment

Server only, never in the browser. Locally they live in `.env` (ignored by git); on the host, as environment variables.

```
DATABASE_URL=postgresql://…           (Neon → Connection string, pooled)
ADMIN_EMAILS=you@domain.com          (comma-separated)
```

## Hosting

The site is no longer only static: `/api/*` needs a Node server. `astro.config.mjs` uses `@astrojs/node` (standalone): `npm run build`, then `node dist/server/entry.mjs` on any Node host (Render, Railway, Fly, a VPS). For Vercel or Netlify, swap the adapter (`@astrojs/vercel`, `@astrojs/netlify`); the code does not change. GitHub Pages can still serve the marketing pages, but the app would run in demo mode there.

## Checks

- `node scripts/api-check.mjs`: accounts, permissions, the queue rule, checkout without a provider, admin, masked keys, webhook signature, files and versions, needed-by date. Uses throwaway `@example.com` accounts and deletes them.
- `node scripts/app-live.mjs`: the real app in a browser against Neon (sign-up at checkout, pending plan, requests, activation, board, file upload, library, reports, updates, shortcuts, studio screens).
- `node scripts/app.mjs` (and `es dark`): the demo flow.
- All need `npx astro preview --port 4330` running after `npx astro build`.

## Working with Codex

`scripts/codex-team.ps1` runs one Codex turn (model gpt-6.2-astra) that may edit code. Both agents coordinate in `CHAT.md` under "Modo equipo" with `CLAIM:` / `DONE:` lines.

## Deploying (ready to use)

- **Docker:** `docker build -t fs-studio .` then `docker run -p 4321:4321 -e DATABASE_URL=… -e ADMIN_EMAILS=… fs-studio`. The image builds the site, keeps only production dependencies, runs as a non-root user and checks `/api/health/`.
- **Render:** `render.yaml` is a blueprint for one Docker web service. In Render, choose "New → Blueprint", point it at the repository, and type `DATABASE_URL`, `ADMIN_EMAILS` and `SITE_URL` in the dashboard.
- **Without Docker:** `npm ci && npm run build && node dist/server/entry.mjs` (set `HOST=0.0.0.0` and `PORT`).
- **GitHub Pages** keeps publishing the marketing pages (`dist/client`); there the app runs in demo mode.
- Every server response carries security headers (`src/middleware.ts`): nosniff, strict referrer, no framing, no camera, microphone, location or payment APIs, and `no-store` unless a route sets its own cache.
