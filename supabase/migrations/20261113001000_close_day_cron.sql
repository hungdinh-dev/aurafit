-- =============================================================================
-- close-day scheduling (05-coach.md: close-day runs via pg_cron at 03:00 in each
-- user's timezone). Strategy: an hourly cron job calls the Edge Function, which
-- asks public.due_close_days() which users have passed 03:00 local time.
--
-- The schedule itself needs the project URL and a secret, which must NOT be in
-- git. They are stored in Supabase Vault and read at run time. See
-- supabase/README.md §"Schedule close-day".
-- =============================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Calls an Edge Function with the secret stored in Vault.
--   vault secret 'project_url'      e.g. https://<ref>.supabase.co
--   vault secret 'cron_secret'      same value as the CRON_SECRET function secret
create or replace function private.invoke_edge_function(p_name text, p_body jsonb default '{}'::jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url    text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret';
  if v_url is null or v_secret is null then
    raise exception 'vault secrets project_url / cron_secret are not set';
  end if;

  return net.http_post(
    url := v_url || '/functions/v1/' || p_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret),
    body := p_body,
    timeout_milliseconds := 55000);
end;
$$;

revoke all on function private.invoke_edge_function(text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Run ONCE per environment after the vault secrets exist (not part of the
-- migration so that a fresh project without secrets still migrates cleanly):
--
--   select cron.schedule(
--     'close-day-hourly',
--     '5 * * * *',                       -- every hour at :05 (covers every timezone)
--     $$ select private.invoke_edge_function('close-day', '{"source":"cron"}'::jsonb) $$
--   );
--
--   select cron.schedule(
--     'weekly-review-hourly-sunday',
--     '15 * * * 0,1',                    -- Sunday/Monday UTC; the function picks users whose local day is Sunday evening
--     $$ select private.invoke_edge_function('weekly-review', '{"source":"cron"}'::jsonb) $$
--   );
--
-- To remove:  select cron.unschedule('close-day-hourly');
-- ---------------------------------------------------------------------------
