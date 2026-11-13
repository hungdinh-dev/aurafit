-- =============================================================================
-- AuraFit – base: extensions, private schema, shared helpers
-- Spec: docs/04-database/README.md §1–§2
-- =============================================================================

create extension if not exists citext with schema extensions;

-- Internal helpers live in `private` (not exposed by PostgREST).
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- Shared `updated_at` trigger (README §1).
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Validates an IANA timezone name (used by profiles.timezone).
create or replace function private.is_valid_timezone(p_tz text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = p_tz);
$$;

-- Default privileges: the anon role never touches user data directly.
-- (Supabase grants table privileges to anon/authenticated by default; RLS is the
-- real gate. Server-only tables additionally revoke write privileges below.)
