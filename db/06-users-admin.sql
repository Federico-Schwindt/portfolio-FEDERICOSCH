-- v9: accounts are created by the studio. A person can sign in with an email or a username; the studio can
-- switch an account off without deleting its work.
alter table studio.users alter column email drop not null;
alter table studio.users add column if not exists username text;
create unique index if not exists users_username_key on studio.users (lower(username)) where username is not null;
alter table studio.users add column if not exists disabled_at timestamptz;
alter table studio.users add column if not exists created_by uuid references studio.users on delete set null;
-- every account needs a way to sign in
do $$ begin
  alter table studio.users add constraint users_login_present check (email is not null or username is not null);
exception when duplicate_object then null; end $$;
