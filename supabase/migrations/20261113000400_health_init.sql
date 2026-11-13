-- =============================================================================
-- 03-health v1 – health_samples, daily_summaries (+ week/month/year views)
-- Spec: docs/04-database/03-health.md
-- =============================================================================

create table public.health_samples (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  type       text not null check (type in ('weight', 'water', 'sleep_session', 'steps', 'active_energy', 'resting_hr')),
  value      numeric(10,2) not null check (value >= 0),
  unit       text not null check (unit in ('kg', 'ml', 'min', 'count', 'kcal', 'bpm')),
  start_at   timestamptz not null,
  end_at     timestamptz,
  local_date date not null,
  source     text not null default 'manual' check (source in ('manual', 'apple_health', 'garmin', 'google_fit')),
  source_id  text,
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  -- Units are canonical per type (README §1).
  check ((type, unit) in (('weight', 'kg'), ('water', 'ml'), ('sleep_session', 'min'),
                          ('steps', 'count'), ('active_energy', 'kcal'), ('resting_hr', 'bpm'))),
  check (end_at is null or end_at >= start_at),
  -- De-duplication: NULL source_id values never conflict, so manual rows are free.
  constraint health_samples_source_unique unique (user_id, source, source_id)
);

create index health_samples_user_type_date_idx on public.health_samples (user_id, type, local_date);

-- local_date defaults to the owner's local date; sleep counts for the wake-up day.
create or replace function private.health_samples_fill_local_date()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.local_date is null then
    new.local_date := (
      (case when new.type = 'sleep_session' then coalesce(new.end_at, new.start_at) else new.start_at end)
      at time zone coalesce(
        (select p.timezone from public.profiles p where p.user_id = new.user_id),
        'Asia/Ho_Chi_Minh'))::date;
  end if;
  return new;
end;
$$;

create trigger health_samples_fill_local_date
  before insert on public.health_samples
  for each row execute function private.health_samples_fill_local_date();

-- ---------------------------------------------------------------------------
-- daily_summaries – server-only daily rollup
-- ---------------------------------------------------------------------------
create table public.daily_summaries (
  user_id         uuid not null references auth.users (id) on delete cascade,
  local_date      date not null,
  kcal_in         numeric(7,1) not null default 0,
  protein_g       numeric(6,1) not null default 0,
  carb_g          numeric(6,1) not null default 0,
  fat_g           numeric(6,1) not null default 0,
  sugar_g         numeric(6,1) not null default 0,
  kcal_target     integer,
  water_ml        integer not null default 0,
  sleep_min       integer,
  sleep_quality   smallint check (sleep_quality between 1 and 5),
  wake_time       time,
  steps           integer,
  active_kcal     integer,
  resting_hr      smallint,
  weight_kg       numeric(5,1),
  weight_trend_kg numeric(5,2),
  is_free_day     boolean not null default false,
  updated_at      timestamptz not null default now(),
  primary key (user_id, local_date)
);

create trigger daily_summaries_set_updated_at
  before update on public.daily_summaries
  for each row execute function private.set_updated_at();

-- Week / month / year are views over daily_summaries (D-018), RLS of the base
-- table applies (security_invoker).
create view public.weekly_summaries with (security_invoker = true) as
select
  user_id,
  date_trunc('week', local_date)::date        as period_start,
  count(*)::int                               as days,
  round(avg(kcal_in), 1)                      as avg_kcal_in,
  round(avg(protein_g), 1)                    as avg_protein_g,
  round(avg(water_ml), 0)                     as avg_water_ml,
  round(avg(sleep_min), 0)                    as avg_sleep_min,
  round(avg(steps), 0)                        as avg_steps,
  round(avg(weight_kg), 1)                    as avg_weight_kg,
  (array_agg(weight_trend_kg order by local_date desc)
     filter (where weight_trend_kg is not null))[1] as last_weight_trend_kg,
  count(*) filter (where is_free_day)::int    as free_days
from public.daily_summaries
group by user_id, date_trunc('week', local_date);

create view public.monthly_summaries with (security_invoker = true) as
select
  user_id,
  date_trunc('month', local_date)::date       as period_start,
  count(*)::int                               as days,
  round(avg(kcal_in), 1)                      as avg_kcal_in,
  round(avg(protein_g), 1)                    as avg_protein_g,
  round(avg(water_ml), 0)                     as avg_water_ml,
  round(avg(sleep_min), 0)                    as avg_sleep_min,
  round(avg(steps), 0)                        as avg_steps,
  round(avg(weight_kg), 1)                    as avg_weight_kg,
  (array_agg(weight_trend_kg order by local_date desc)
     filter (where weight_trend_kg is not null))[1] as last_weight_trend_kg,
  count(*) filter (where is_free_day)::int    as free_days
from public.daily_summaries
group by user_id, date_trunc('month', local_date);

create view public.yearly_summaries with (security_invoker = true) as
select
  user_id,
  date_trunc('year', local_date)::date        as period_start,
  count(*)::int                               as days,
  round(avg(kcal_in), 1)                      as avg_kcal_in,
  round(avg(protein_g), 1)                    as avg_protein_g,
  round(avg(water_ml), 0)                     as avg_water_ml,
  round(avg(sleep_min), 0)                    as avg_sleep_min,
  round(avg(steps), 0)                        as avg_steps,
  round(avg(weight_kg), 1)                    as avg_weight_kg,
  (array_agg(weight_trend_kg order by local_date desc)
     filter (where weight_trend_kg is not null))[1] as last_weight_trend_kg,
  count(*) filter (where is_free_day)::int    as free_days
from public.daily_summaries
group by user_id, date_trunc('year', local_date);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.health_samples enable row level security;
alter table public.daily_summaries enable row level security;

create policy health_samples_owner_all on public.health_samples
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy daily_summaries_owner_select on public.daily_summaries
  for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete, truncate on public.daily_summaries from anon, authenticated;

revoke all on public.weekly_summaries, public.monthly_summaries, public.yearly_summaries from anon;
