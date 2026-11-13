-- =============================================================================
-- 01-profile v1 – profiles, goals, coach_settings
-- Spec: docs/04-database/01-profile.md
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles – 1 row per user (created by trigger on auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id                 uuid primary key references auth.users (id) on delete cascade,
  username                extensions.citext unique
                            check (username::text ~ '^[a-z0-9_.]{3,20}$'),
  display_name            text check (char_length(display_name) <= 60),
  locale                  text not null default 'vi' check (locale in ('vi', 'en')),
  timezone                text not null default 'Asia/Ho_Chi_Minh',
  sex                     text check (sex in ('male', 'female')),
  birth_date              date check (birth_date >= date '1900-01-01'),
  height_cm               numeric(5,1) check (height_cm between 100 and 250),
  activity_level          text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  experience_level        text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  body_fat_pct            numeric(4,1) check (body_fat_pct between 2 and 70),
  "character"             text check ("character" in ('kai', 'mira')),
  character_name          text check (char_length(character_name) <= 30),
  onboarding_completed_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.profiles is '01-profile v1. Weight lives in health_samples, not here.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Timezone must be a valid IANA name (close-day depends on it) and the
-- character name defaults to the chosen character.
create or replace function private.profiles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not private.is_valid_timezone(new.timezone) then
    raise exception 'invalid timezone: %', new.timezone using errcode = '22023';
  end if;
  if new."character" is not null and new.character_name is null then
    new.character_name := initcap(new."character");
  end if;
  return new;
end;
$$;

create trigger profiles_before_write
  before insert or update on public.profiles
  for each row execute function private.profiles_before_write();

-- Current local date of a user (used by RLS policies and server functions).
create or replace function private.user_today(p_user_id uuid)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (now() at time zone coalesce(
    (select p.timezone from public.profiles p where p.user_id = p_user_id),
    'Asia/Ho_Chi_Minh'))::date;
$$;

revoke all on function private.user_today(uuid) from public;
grant execute on function private.user_today(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- goals – goal history (current goal = latest row with effective_from <= today)
-- ---------------------------------------------------------------------------
create table public.goals (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  goal_type        text not null check (goal_type in ('lose_fat', 'maintain', 'gain_muscle')),
  pace             text not null default 'auto' check (pace in ('slow', 'medium', 'fast', 'auto')),
  target_weight_kg numeric(5,1) check (target_weight_kg between 20 and 400),
  effective_from   date not null default current_date,
  created_at       timestamptz not null default now()
);

create index goals_user_effective_idx on public.goals (user_id, effective_from desc);

-- ---------------------------------------------------------------------------
-- coach_settings – 1 row per user
-- ---------------------------------------------------------------------------
create table public.coach_settings (
  user_id               uuid primary key references auth.users (id) on delete cascade,
  strictness            text not null default 'standard' check (strictness in ('gentle', 'standard', 'hardcore')),
  strictness_changed_at timestamptz,
  voice                 text not null default 'bestie' check (voice in ('bestie', 'coach', 'drama')),
  free_days_per_week    smallint not null default 1 check (free_days_per_week between 0 and 3),
  free_day_mode         text not null default 'compensate' check (free_day_mode in ('compensate', 'no_compensate')),
  quiet_start           time not null default '22:30',
  quiet_end             time not null default '06:30',
  work_start            time,
  work_end              time,
  photo_quota_per_day   smallint not null default 15 check (photo_quota_per_day between 0 and 100),
  updated_at            timestamptz not null default now(),
  check ((work_start is null) = (work_end is null))
);

create trigger coach_settings_set_updated_at
  before update on public.coach_settings
  for each row execute function private.set_updated_at();

-- Strictness may change at most once per 7 days (01-profile.md).
create or replace function private.coach_settings_strictness_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.strictness is distinct from old.strictness then
    if old.strictness_changed_at is not null
       and old.strictness_changed_at > now() - interval '7 days'
       and coalesce(auth.role(), '') <> 'service_role' then
      raise exception 'strictness can only be changed once per week' using errcode = 'P0001';
    end if;
    new.strictness_changed_at := now();
  else
    new.strictness_changed_at := old.strictness_changed_at;
  end if;
  return new;
end;
$$;

create trigger coach_settings_strictness_guard
  before update on public.coach_settings
  for each row execute function private.coach_settings_strictness_guard();

-- ---------------------------------------------------------------------------
-- New auth user → profile + default coach settings.
-- (Extended in the coach migration to also create coach_state + starter shield.)
-- ---------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locale text := new.raw_user_meta_data ->> 'locale';
begin
  insert into public.profiles (user_id, display_name, locale)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 60),
    case when v_locale in ('vi', 'en') then v_locale else 'vi' end
  )
  on conflict (user_id) do nothing;

  insert into public.coach_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS – owner has full access on all three tables (01-profile.md §RLS)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.coach_settings enable row level security;

create policy profiles_owner_select on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy profiles_owner_update on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- Rows are created by the auth trigger; deleting the auth user cascades.

create policy goals_owner_all on public.goals
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy coach_settings_owner_select on public.coach_settings
  for select to authenticated using (user_id = (select auth.uid()));
create policy coach_settings_owner_update on public.coach_settings
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- photo_quota_per_day is an AI-cost control: clients may not change it.
revoke insert, update, delete on public.coach_settings from anon, authenticated;
grant update (strictness, voice, free_days_per_week, free_day_mode,
              quiet_start, quiet_end, work_start, work_end)
  on public.coach_settings to authenticated;

revoke insert, delete on public.profiles from anon, authenticated;
revoke update on public.profiles from anon, authenticated;
grant update (username, display_name, locale, timezone, sex, birth_date, height_cm,
              activity_level, experience_level, body_fat_pct, "character",
              character_name, onboarding_completed_at)
  on public.profiles to authenticated;
