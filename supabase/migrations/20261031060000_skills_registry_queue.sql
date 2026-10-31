-- Skill registry submission queue for the allsxxing/skills MCP server.
-- Tables are read-only to the publishable key. Every write goes through SECURITY DEFINER
-- functions; enqueue_skill requires a write key whose SHA-256 hash is stored in
-- skills_private.write_keys (the raw key is never stored).

create extension if not exists pgcrypto with schema extensions;

create schema if not exists skills_private;
revoke all on schema skills_private from public, anon, authenticated;

create table if not exists skills_private.write_keys (
  key_hash text primary key,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.skill_queue (
  id text primary key check (id ~ '^[0-9]{14}-[a-z0-9]{6}$'),
  received timestamptz not null,
  skill text not null check (skill ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  platform text not null check (platform ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  files jsonb not null check (jsonb_typeof(files) = 'object'),
  note text check (char_length(note) <= 500),
  promote boolean,
  ported_from_canonical boolean,
  client text
);
create index if not exists skill_queue_received_idx on public.skill_queue (received);

create table if not exists public.skill_clients (
  platform text primary key check (platform ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  client_name text not null check (char_length(client_name) <= 120),
  client_version text check (char_length(client_version) <= 60),
  user_agent text check (char_length(user_agent) <= 300),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

alter table public.skill_queue enable row level security;
alter table public.skill_clients enable row level security;
drop policy if exists skill_queue_read on public.skill_queue;
drop policy if exists skill_clients_read on public.skill_clients;
create policy skill_queue_read on public.skill_queue for select to anon, authenticated using (true);
create policy skill_clients_read on public.skill_clients for select to anon, authenticated using (true);
revoke insert, update, delete, truncate on public.skill_queue, public.skill_clients from anon, authenticated;

create or replace function public.check_skill_key(p_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from skills_private.write_keys
    where key_hash = encode(extensions.digest(coalesce(p_key, ''), 'sha256'), 'hex')
  );
$$;

create or replace function public.enqueue_skill(p_key text, payload jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.check_skill_key(p_key) then
    raise exception 'invalid write key' using errcode = '42501';
  end if;
  if octet_length(payload::text) > 1000000 then
    raise exception 'submission too large';
  end if;
  delete from public.skill_queue where received < now() - interval '14 days';
  if (select count(*) from public.skill_queue) >= 2000 then
    raise exception 'queue full';
  end if;
  insert into public.skill_queue (id, received, skill, platform, files, note, promote, ported_from_canonical, client)
  values (
    payload->>'id',
    coalesce((payload->>'received')::timestamptz, now()),
    payload->>'skill',
    payload->>'platform',
    payload->'files',
    payload->>'note',
    (payload->>'promote')::boolean,
    (payload->>'ported_from_canonical')::boolean,
    payload->>'client'
  );
  return payload->>'id';
end;
$$;

create or replace function public.note_skill_client(p_platform text, p_client_name text, p_client_version text, p_user_agent text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.skill_clients) >= 100
     and not exists (select 1 from public.skill_clients where platform = p_platform) then
    return;
  end if;
  insert into public.skill_clients (platform, client_name, client_version, user_agent)
  values (p_platform, left(coalesce(p_client_name, 'unknown'), 120), left(p_client_version, 60), left(p_user_agent, 300))
  on conflict (platform) do update
    set client_name = excluded.client_name,
        client_version = excluded.client_version,
        user_agent = excluded.user_agent,
        last_seen = now();
end;
$$;

revoke all on function public.check_skill_key(text) from public;
revoke all on function public.enqueue_skill(text, jsonb) from public;
revoke all on function public.note_skill_client(text, text, text, text) from public;
grant execute on function public.check_skill_key(text) to anon, authenticated;
grant execute on function public.enqueue_skill(text, jsonb) to anon, authenticated;
grant execute on function public.note_skill_client(text, text, text, text) to anon, authenticated;
