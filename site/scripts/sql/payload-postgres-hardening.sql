-- Payload-on-Supabase hardening for Postgres `public` tables.
-- Keep `anon` / `authenticated` blocked at the grant level and disable RLS
-- on Payload-managed tables so Payload's own access layer can function.

begin;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on tables from authenticated;

do $$
declare
  r record;
begin
  for r in
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
  loop
    execute format(
      'alter table public.%I disable row level security',
      r.table_name
    );
  end loop;
end $$;

commit;
