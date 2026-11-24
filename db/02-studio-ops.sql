-- Notes belong to the account, separately from events visible to its team.
create table if not exists studio.client_notes (
  id uuid primary key,
  client_id uuid not null references studio.users on delete cascade,
  author_id uuid references studio.users on delete set null,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists client_notes_history on studio.client_notes (client_id, created_at desc);
