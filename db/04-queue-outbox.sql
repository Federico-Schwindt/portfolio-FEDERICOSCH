-- The caller supplies the order they saw. A second editor must reload if it changed.
create or replace function studio.reorder_queue(owner_id uuid, expected uuid[], desired uuid[])
returns boolean language plpgsql as $$
declare current_ids uuid[]; slots float8[];
begin
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text, 0));
  perform id from studio.requests where user_id = owner_id and status = 'queued' order by id for update;
  select array_agg(id order by position, id), array_agg(position order by position, id)
    into current_ids, slots from studio.requests where user_id = owner_id and status = 'queued';
  if current_ids is distinct from expected or cardinality(desired) <> cardinality(expected)
     or (select count(distinct id) from unnest(desired) id) <> cardinality(expected)
     or not (desired <@ expected) then return false; end if;
  -- Keep the original range so future urgent requests still enter at the front.
  -- A microsecond separates requests that originally landed at the same instant.
  for i in 2..cardinality(slots) loop
    slots[i] := greatest(slots[i], slots[i-1] + 0.000001);
  end loop;
  update studio.requests r set position = slots[d.n]
    from unnest(desired) with ordinality d(id,n) where r.id = d.id;
  return true;
end $$;

create index if not exists events_account_cursor on studio.request_events(user_id, created_at desc, id desc);
create index if not exists events_studio_cursor on studio.request_events(created_at desc, id desc);

create table if not exists studio.outbox (
  id bigint generated always as identity primary key,
  source_id uuid not null,
  owner_id uuid not null references studio.users on delete cascade,
  recipient_id uuid not null references studio.users on delete cascade,
  request_id uuid references studio.requests on delete cascade,
  topic text not null check (topic in ('review','comments','billing')),
  lang text not null,
  title text not null,
  detail text not null default '',
  status text not null default 'queued' check (status in ('queued','sent','failed','skipped')),
  attempts int not null default 0,
  available_at timestamptz not null default now(),
  first_attempt timestamptz,
  envelope jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(source_id, recipient_id, topic)
);
create index if not exists outbox_due on studio.outbox(available_at, id) where status='queued';
create index if not exists outbox_person on studio.outbox(recipient_id, id desc);

create index if not exists outbox_request on studio.outbox(request_id, id desc) where request_id is not null;

create or replace function studio.queue_request_notice() returns trigger language plpgsql as $$
declare category text;
begin
  if new.kind = 'status' and new.body = 'review' then category := 'review';
  elsif new.kind = 'comment' and exists(select 1 from studio.users where id = new.author and role='admin') then category := 'comments';
  else return null; end if;
  insert into studio.outbox(source_id, owner_id, recipient_id, request_id, topic, lang, title, detail)
    select new.id, r.user_id, u.id, r.id, category, u.lang, r.title, case when category='comments' then new.body else '' end
    from studio.requests r join studio.users u on (u.id=r.user_id or u.account_id=r.user_id)
    where r.id=new.request_id and u.role='client' and coalesce((u.notify->>category)::boolean,true)
    on conflict do nothing;
  return null;
end $$;
drop trigger if exists event_outbox on studio.request_events;
create trigger event_outbox after insert on studio.request_events for each row execute function studio.queue_request_notice();

create or replace function studio.queue_plan_notice() returns trigger language plpgsql as $$
begin
  insert into studio.outbox(source_id, owner_id, recipient_id, topic, lang, title, detail)
    select new.id, u.id, u.id, 'billing', u.lang, new.to_plan, new.kind from studio.users u
    where u.id=new.user_id and u.role='client' and coalesce((u.notify->>'billing')::boolean,true)
    on conflict do nothing;
  return null;
end $$;
drop trigger if exists plan_outbox on studio.plan_changes;
create trigger plan_outbox after update of status on studio.plan_changes for each row
  when (new.status='applied' and old.status is distinct from new.status) execute function studio.queue_plan_notice();
