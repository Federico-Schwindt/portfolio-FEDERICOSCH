-- Each marker commits with the write it describes, including writes from jobs and webhooks.
create table if not exists studio.state_revisions (
  scope text primary key,
  revision uuid not null default gen_random_uuid(),
  changed_in xid8 not null default pg_current_xact_id()
);
insert into studio.state_revisions(scope) values ('studio'), ('initial') on conflict do nothing;

create index if not exists events_author_account on studio.request_events(author, user_id) where author is not null;
create index if not exists files_author_account on studio.files(uploaded_by, user_id) where uploaded_by is not null;
create index if not exists pins_author_account on studio.annotations(author, user_id) where author is not null;

create or replace function studio.touch_state() returns trigger language plpgsql as $$
declare prior uuid; following uuid; person uuid; authored uuid[];
begin
  update studio.state_revisions set revision = gen_random_uuid(), changed_in = pg_current_xact_id()
    where scope = 'studio' and changed_in <> pg_current_xact_id();
  if tg_table_name = 'users' then
    person := coalesce(new.id, old.id);
    if tg_op <> 'INSERT' then prior := coalesce(old.account_id, old.id); end if;
    if tg_op <> 'DELETE' then following := coalesce(new.account_id, new.id); end if;
    -- An author may have commented in a different account, including before changing teams.
    if tg_op = 'UPDATE' and (old.full_name, old.role) is distinct from (new.full_name, new.role) then
      authored := array(
        select user_id from studio.request_events where author = person
        union select user_id from studio.files where uploaded_by = person and old.role <> new.role
        union select user_id from studio.annotations where author = person and old.role <> new.role
      );
    end if;
  else
    if tg_op <> 'INSERT' then prior := old.user_id; end if;
    if tg_op <> 'DELETE' then following := new.user_id; end if;
  end if;
  insert into studio.state_revisions(scope)
    select id::text from studio.users where id = any(array[prior, following, person] || authored) order by id
    on conflict (scope) do update set revision = excluded.revision, changed_in = excluded.changed_in
      where studio.state_revisions.changed_in <> excluded.changed_in;
  if tg_table_name = 'users' and tg_op = 'DELETE' then
    delete from studio.state_revisions where scope = old.id::text;
  end if;
  return null;
end $$;

do $$
declare relation_name text;
begin
  foreach relation_name in array array['users','subscriptions','requests','request_events','invoices','files','annotations','recurring','plan_changes'] loop
    execute format('drop trigger if exists state_changed on studio.%I', relation_name);
    -- Finish the application's row updates before acquiring the shared studio marker.
    execute format('create constraint trigger state_changed after insert or update or delete on studio.%I deferrable initially deferred for each row execute function studio.touch_state()', relation_name);
  end loop;
end $$;

create index if not exists recurring_account_due on studio.recurring(user_id, next_at) where active;
create index if not exists plan_account_due on studio.plan_changes(user_id, effective_at) where status = 'scheduled';

-- A deadline can change the dashboard before another transaction writes anything.
-- NULL tells the caller to run scheduled work and read the snapshot normally.
create or replace function studio.state_revision(owner_id uuid, is_admin boolean)
returns text language sql stable as $$
  select case when (case when is_admin then
    exists(select 1 from studio.recurring where active and next_at <= now()) or
    exists(select 1 from studio.plan_changes where status = 'scheduled' and effective_at <= now())
  else
    exists(select 1 from studio.recurring where user_id = owner_id and active and next_at <= now()) or
    exists(select 1 from studio.plan_changes where user_id = owner_id and status = 'scheduled' and effective_at <= now())
  end) then null else coalesce(
    (select revision from studio.state_revisions where scope = case when is_admin then 'studio' else owner_id::text end),
    (select revision from studio.state_revisions where scope = 'initial')
  )::text end
$$;
