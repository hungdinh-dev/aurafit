-- =============================================================================
-- Backfill: auth users created before the signup trigger existed get exactly the
-- rows private.handle_new_user() creates (profile, coach_settings, coach_state with
-- the starter shield + ledger row). Idempotent; a no-op on a fresh project.
-- =============================================================================

insert into public.profiles (user_id, display_name, locale)
select u.id,
       left(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'), 60),
       case when u.raw_user_meta_data ->> 'locale' in ('vi', 'en') then u.raw_user_meta_data ->> 'locale' else 'vi' end
from auth.users u
on conflict (user_id) do nothing;

insert into public.coach_settings (user_id)
select u.id from auth.users u
on conflict (user_id) do nothing;

with created as (
  insert into public.coach_state (user_id, shields, last_monthly_gift)
  select u.id, 1, to_char(private.user_today(u.id), 'YYYY-MM')
  from auth.users u
  on conflict (user_id) do nothing
  returning user_id
)
insert into public.shield_ledger (user_id, delta_shields, delta_fragments, reason, local_date)
select c.user_id, 1, 0, 'starter', private.user_today(c.user_id)
from created c;
