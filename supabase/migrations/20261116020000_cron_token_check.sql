-- =============================================================================
-- close-day / weekly-review accept the token pg_cron sends (Vault secret 'cron_secret')
-- without the same value being copied into Edge Function secrets: the function asks the
-- database whether its bearer token matches (supabase/functions/_shared/supabase.ts).
-- The secret itself is generated inside the database (README §5), so it never leaves it.
-- plpgsql so the body is resolved at call time (vault is absent in the PGlite check).
-- =============================================================================

create or replace function public.is_cron_token(p_token text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_token is null or length(p_token) < 32 then
    return false;
  end if;
  return exists (
    select 1 from vault.decrypted_secrets
    where name = 'cron_secret' and decrypted_secret = p_token
  );
end;
$$;

revoke all on function public.is_cron_token(text) from public, anon, authenticated;
grant execute on function public.is_cron_token(text) to service_role;
