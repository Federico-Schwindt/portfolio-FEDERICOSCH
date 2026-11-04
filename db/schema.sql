-- Leads captured by the website (contact form, free audit, pricing CTAs).
-- Applied with `npm run db:migrate` (uses DATABASE_URL_UNPOOLED from .env.local).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS leads (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  source      text NOT NULL DEFAULT 'contact',   -- contact | audit | pricing
  status      text NOT NULL DEFAULT 'new',       -- new | contacted | won | lost
  name        text NOT NULL,
  email       text NOT NULL,
  company     text,
  website     text,
  package     text,                              -- launch | grow | scale | unsure
  budget      text,
  message     text,
  page        text,                              -- path the form was submitted from
  user_agent  text,
  brief_key   text,                              -- object key in the private `briefs` bucket
  brief_name  text,
  notes       text
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
