import { defineConfig } from "@neon/config/v1";

/**
 * Neon services for the portfolio.
 *
 * - Postgres: the `leads` table (see db/schema.sql, applied by `npm run db:migrate`).
 * - Function `api`: public lead capture + authenticated admin endpoints (functions/api).
 * - Auth: managed Better Auth, used by the /admin page.
 * - Buckets: `media` (public, generated portfolio pieces) and `briefs` (private, lead attachments).
 * - Realtime: live lead list on /admin.
 *
 * Deploy with `neon deploy --env .env.local`. Every key under functions.api.env must exist in that file.
 */
export default defineConfig({
  auth: true,
  functions: {
    api: {
      name: "Portfolio API",
      source: "./functions/api/index.ts",
      env: {
        // comma-separated list of emails allowed to read leads on /admin
        ADMIN_EMAILS: process.env.ADMIN_EMAILS!,
        // comma-separated browser origins allowed to call the API
        WEB_ORIGINS: process.env.WEB_ORIGINS!,
        // Seals live queries for /admin. NEON_* names are reserved for function env, so it is
        // re-exported as REALTIME_SECRET. It only exists after the first deploy pulls it into
        // .env.local, so the first deploy omits it and the second one uploads it.
        ...(process.env.NEON_REALTIME_SECRET ? { REALTIME_SECRET: process.env.NEON_REALTIME_SECRET } : {}),
      },
    },
  },
  buckets: {
    media: { access: "public_read" },
    briefs: { access: "private" },
  },
  preview: {
    realtime: {
      allowedOrigins: ["http://localhost:4321", "http://127.0.0.1:4321", "http://localhost:5173", "https://federico-schwindt.github.io"],
    },
  },
  branch: (branch) => {
    if (branch.isDefault) return {};
    if (!branch.exists) return { ttl: "7d" };
    return {};
  },
});
