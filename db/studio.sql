-- The client app, on Neon. Everything lives in its own schema, `studio`, next to (and apart from) the existing
-- `public.leads` and `neon_auth` tables. Safe to run again: it only creates what is missing.
-- Access rules are enforced by the API (src/pages/api); the queue rule lives here, in the database.

create schema if not exists studio;
set search_path = studio, public;

create table if not exists studio.plans (
  id text primary key, name text not null, setup_cents int not null, monthly_cents int not null, active_slots int not null, sort int not null default 0
);
insert into studio.plans (id, name, setup_cents, monthly_cents, active_slots, sort) values
  ('launch', 'Launch', 60000, 8000, 2, 1), ('grow', 'Grow', 120000, 15000, 4, 2), ('scale', 'Scale', 300000, 25000, 6, 3)
on conflict (id) do update set setup_cents = excluded.setup_cents, monthly_cents = excluded.monthly_cents, active_slots = excluded.active_slots;

create table if not exists studio.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  full_name text not null default '',
  company text not null default '',
  lang text not null default 'en',
  role text not null default 'client' check (role in ('client', 'admin')),
  brand jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists studio.sessions (
  token_hash text primary key,                 -- sha-256 of the cookie value; the value itself is never stored
  user_id uuid not null references studio.users on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user on studio.sessions (user_id);

create table if not exists studio.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references studio.users on delete cascade,
  plan_id text not null references studio.plans,
  status text not null default 'pending' check (status in ('pending', 'building', 'active', 'past_due', 'paused', 'cancelled')),
  addon_community boolean not null default false,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  portal_url text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists studio.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references studio.users on delete cascade,
  label text not null, amount_cents int not null, currency text not null default 'USD', status text not null default 'paid', url text,
  created_at timestamptz not null default now()
);

do $$ begin create type studio.request_status as enum ('queued', 'active', 'review', 'done', 'cancelled'); exception when duplicate_object then null; end $$;
do $$ begin create type studio.request_kind as enum ('page', 'design', 'copy', 'campaign', 'fix', 'social', 'automation', 'other'); exception when duplicate_object then null; end $$;

create table if not exists studio.requests (
  id uuid primary key default gen_random_uuid(),
  number serial,
  user_id uuid not null references studio.users on delete cascade,
  title text not null check (length(title) between 3 and 140),
  kind studio.request_kind not null default 'other',
  brief text not null default '',
  checklist jsonb not null default '[]'::jsonb,
  files jsonb not null default '[]'::jsonb,
  priority smallint not null default 2 check (priority between 1 and 3),
  status studio.request_status not null default 'queued',
  position double precision not null default extract(epoch from now()),
  progress smallint not null default 0 check (progress between 0 and 100),
  deliverable_url text,
  started_at timestamptz, review_at timestamptz, done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists requests_user on studio.requests (user_id, status, position);

create table if not exists studio.request_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references studio.requests on delete cascade,
  user_id uuid not null references studio.users on delete cascade,   -- the request's owner
  author uuid references studio.users on delete set null,           -- null = the queue itself
  kind text not null check (kind in ('comment', 'status', 'file', 'ai')),
  body text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists events_request on studio.request_events (request_id, created_at);
create index if not exists events_user on studio.request_events (user_id, created_at);

-- studio-wide settings, e.g. the payment provider and its keys (written only by an admin through the API)
create table if not exists studio.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ───────────── the queue rule ─────────────
create or replace function studio.slots_for(uid uuid) returns int language sql stable as $$
  select coalesce(max(p.active_slots), 0) from studio.subscriptions s join studio.plans p on p.id = s.plan_id
  where s.user_id = uid and s.status in ('building', 'active')
$$;

create or replace function studio.promote_queue(uid uuid) returns void language plpgsql as $$
declare free int; nxt uuid;
begin
  loop
    select studio.slots_for(uid) - count(*) into free from studio.requests where user_id = uid and status = 'active';
    exit when free <= 0;
    select id into nxt from studio.requests where user_id = uid and status = 'queued' order by position limit 1;
    exit when nxt is null;
    update studio.requests set status = 'active', started_at = now() where id = nxt;
  end loop;
end $$;

create or replace function studio.requests_touch() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  if new.status = 'review' and old.status is distinct from 'review' then new.review_at = now(); new.progress = 100; end if;
  if new.status = 'done' and old.status is distinct from 'done' then new.done_at = now(); new.progress = 100; end if;
  return new;
end $$;
drop trigger if exists requests_touch on studio.requests;
create trigger requests_touch before update on studio.requests for each row execute function studio.requests_touch();

-- every status change is written to the timeline, and free slots are filled
create or replace function studio.requests_after() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into studio.request_events (request_id, user_id, author, kind, body) values (new.id, new.user_id, new.user_id, 'status', 'queued');
  elsif new.status is distinct from old.status then
    insert into studio.request_events (request_id, user_id, author, kind, body)
    values (new.id, new.user_id, nullif(current_setting('studio.actor', true), '')::uuid, 'status', new.status::text);
  end if;
  perform studio.promote_queue(new.user_id);
  return null;
end $$;
drop trigger if exists requests_after on studio.requests;
create trigger requests_after after insert or update of status on studio.requests for each row execute function studio.requests_after();

create or replace function studio.subscriptions_after() returns trigger language plpgsql as $$
begin perform studio.promote_queue(new.user_id); return null; end $$;
drop trigger if exists subscriptions_after on studio.subscriptions;
create trigger subscriptions_after after insert or update on studio.subscriptions for each row execute function studio.subscriptions_after();

-- ───────────── files (v2) ─────────────
-- Stored in Postgres for now (up to 10 MB each), so uploads work with this one database. Moving to object
-- storage later only changes the API's read and write of `data`.
create table if not exists studio.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references studio.users on delete cascade,          -- the client the file belongs to
  request_id uuid references studio.requests on delete cascade,             -- null = library or brand file
  uploaded_by uuid references studio.users on delete set null,
  kind text not null default 'asset' check (kind in ('brief', 'deliverable', 'asset', 'brand')),
  version int not null default 1,                                           -- deliverables: v1, v2…
  name text not null,
  mime text not null default 'application/octet-stream',
  size int not null,
  data bytea not null,
  created_at timestamptz not null default now()
);
create index if not exists files_user on studio.files (user_id, created_at desc);
create index if not exists files_request on studio.files (request_id);

alter table studio.users add column if not exists last_seen_at timestamptz not null default now();
alter table studio.requests add column if not exists due_date date;

-- v3: a change request is its own event, so the studio sees the correction next to the version it is about
alter table studio.request_events drop constraint if exists request_events_kind_check;
alter table studio.request_events add constraint request_events_kind_check check (kind in ('comment', 'status', 'file', 'ai', 'changes'));

-- v4: pins on an image. They belong to one file (one version), so v1's pins stay on v1 after v2 arrives.
create table if not exists studio.annotations (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references studio.files on delete cascade,
  user_id uuid not null references studio.users on delete cascade,      -- the file's owner (the client)
  author uuid references studio.users on delete set null,
  x real not null check (x between 0 and 1),
  y real not null check (y between 0 and 1),
  body text not null check (length(body) between 1 and 2000),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists annotations_file on studio.annotations (file_id, created_at);

-- v5: the client's team. A member belongs to one client account (users.account_id = the owner) and sees what the
-- owner sees: requests, files, pins. Billing stays with the owner. Removing a member clears account_id.
alter table studio.users add column if not exists account_id uuid references studio.users on delete cascade;
alter table studio.requests add column if not exists created_by uuid references studio.users on delete set null;
create table if not exists studio.invites (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references studio.users on delete cascade,
  email text not null,
  token_hash text not null unique,                       -- sha-256 of the link's token; the token itself is never stored
  created_by uuid references studio.users on delete set null,
  accepted_by uuid references studio.users on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days'
);
create index if not exists invites_account on studio.invites (account_id, created_at desc);

-- v5b: deleting an owner frees their teammates (their own accounts stay)
alter table studio.users drop constraint if exists users_account_id_fkey;
alter table studio.users add constraint users_account_id_fkey foreign key (account_id) references studio.users on delete set null;
create index if not exists users_account_idx on studio.users (account_id) where account_id is not null;

-- v6: plan changes (upgrade, downgrade, community on/off, pause, resume, cancel). The rules live in src/server/plans.ts.
create table if not exists studio.plan_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references studio.users on delete cascade,
  kind text not null check (kind in ('upgrade', 'downgrade', 'community_on', 'community_off', 'pause', 'resume', 'cancel')),
  from_plan text not null references studio.plans, to_plan text not null references studio.plans,
  amount_cents int not null default 0,
  status text not null check (status in ('awaiting_payment', 'scheduled', 'applied', 'cancelled')),
  effective_at timestamptz,
  quote jsonb not null default '{}',
  created_by uuid references studio.users on delete set null,
  applied_by uuid references studio.users on delete set null,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists plan_changes_open_idx on studio.plan_changes (user_id, status) where status in ('awaiting_payment', 'scheduled');
create index if not exists plan_changes_due_idx on studio.plan_changes (effective_at) where status = 'scheduled';


-- v7: a rating for each approved delivery, and requests that repeat on their own
alter table studio.requests add column if not exists rating smallint check (rating between 1 and 5);
alter table studio.requests add column if not exists rating_note text;
create table if not exists studio.recurring (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references studio.users on delete cascade,
  created_by uuid references studio.users on delete set null,
  title text not null, kind text not null default 'other', brief text not null default '', checklist jsonb not null default '[]', priority int not null default 2,
  every text not null check (every in ('week', 'month')),
  next_at timestamptz not null, active boolean not null default true, made int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists recurring_due_idx on studio.recurring (next_at) where active;

alter table studio.requests add column if not exists recurring_id uuid references studio.recurring on delete set null;

-- v8: a profile for every person, and sessions you can recognise and close
alter table studio.users add column if not exists phone text not null default '';
alter table studio.users add column if not exists job_title text not null default '';
alter table studio.users add column if not exists timezone text not null default '';
alter table studio.users add column if not exists avatar text;                       -- a small data: URL (256 px), resized in the browser
alter table studio.users add column if not exists notify jsonb not null default '{"review": true, "comments": true, "weekly": true, "billing": true}';
alter table studio.sessions add column if not exists user_agent text not null default '';
alter table studio.sessions add column if not exists id uuid not null default gen_random_uuid();
