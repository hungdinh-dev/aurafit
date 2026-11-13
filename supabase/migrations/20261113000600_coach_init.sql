-- =============================================================================
-- 05-coach v1 – gamification state. EVERY table here is server-authoritative:
-- clients can only read their own rows; Edge Function `close-day` (service role,
-- logic in packages/core/src/coach) writes through public.apply_close_day().
-- Spec: docs/04-database/05-coach.md, docs/02-features/gamification.md
-- =============================================================================

-- Pillar columns store the points actually counted toward `total` (core
-- `DailyScoreResult.pillars`). With no daily tasks the 10 task points are
-- redistributed ×100/90, so a pillar can exceed its nominal maximum.
create table public.daily_scores (
  user_id       uuid not null references auth.users (id) on delete cascade,
  local_date    date not null,
  nutrition_pts smallint not null default 0 check (nutrition_pts between 0 and 45),
  sleep_pts     smallint not null default 0 check (sleep_pts between 0 and 23),
  training_pts  smallint not null default 0 check (training_pts between 0 and 17),
  water_pts     smallint not null default 0 check (water_pts between 0 and 12),
  tasks_pts     smallint not null default 0 check (tasks_pts between 0 and 10),
  weight_pts    smallint not null default 0 check (weight_pts between 0 and 6),
  penalty_pts   smallint not null default 0 check (penalty_pts between 0 and 100),
  total         smallint not null check (total between 0 and 100),
  result        text not null check (result in ('excellent', 'pass', 'fail')),
  strictness    text not null check (strictness in ('gentle', 'standard', 'hardcore')),
  is_free_day   boolean not null default false,
  shield_used   boolean not null default false,
  breakdown     jsonb not null default '{}'::jsonb,
  closed_at     timestamptz not null default now(),
  primary key (user_id, local_date)
);

comment on column public.daily_scores.breakdown is
  'record (core DayRecord, used to rebuild the 37-day history), detail, tasks_redistributed, free_day, events (CoachEvent[] for celebrations), xp_gained, engine.';

create table public.coach_state (
  user_id               uuid primary key references auth.users (id) on delete cascade,
  xp                    bigint not null default 0 check (xp >= 0),
  level                 integer not null default 1 check (level >= 1),
  streak                integer not null default 0 check (streak >= 0),
  best_streak           integer not null default 0 check (best_streak >= 0),
  shields               smallint not null default 0 check (shields between 0 and 3),
  shield_fragments      smallint not null default 0 check (shield_fragments between 0 and 2),
  aura_score            numeric(5,2) not null default 0 check (aura_score between 0 and 100),
  aura_tier             text not null default 'gray' check (aura_tier in ('gray', 'green', 'blue', 'purple', 'gold', 'red')),
  mood                  text not null default 'neutral' check (mood in ('radiant', 'sleepy', 'thirsty', 'hungry', 'fired_up', 'sad', 'neutral')),
  -- Additions to spec v1: rest of core CoachState (history is rebuilt from daily_scores).
  last_closed_date      date,
  last_streak_lost_date date,
  last_monthly_gift     text check (last_monthly_gift ~ '^[0-9]{4}-[0-9]{2}$'),
  boss_wins             integer not null default 0 check (boss_wins >= 0),
  updated_at            timestamptz not null default now()
);

create trigger coach_state_set_updated_at
  before update on public.coach_state
  for each row execute function private.set_updated_at();

create table public.shield_ledger (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  delta_shields   smallint not null default 0,
  delta_fragments smallint not null default 0,
  reason          text not null check (reason in ('excellent_day', 'monthly_gift', 'starter', 'protect_streak', 'free_day', 'boss_reward')),
  local_date      date,
  created_at      timestamptz not null default now()
);

create index shield_ledger_user_created_idx on public.shield_ledger (user_id, created_at);

create table public.stat_snapshots (
  user_id    uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  stat       text not null check (stat in ('diet_discipline', 'protein', 'sleep', 'water', 'training', 'strength', 'body_progress', 'self_growth')),
  value      numeric(5,2) not null check (value between 0 and 100),
  primary key (user_id, local_date, stat)
);

create table public.quests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  local_date   date not null,
  code         text not null,
  -- Addition to spec v1: the hard stat the quest targets (core Quest.stat).
  stat         text check (stat in ('diet_discipline', 'protein', 'sleep', 'water', 'training', 'strength', 'body_progress', 'self_growth')),
  params       jsonb not null default '{}'::jsonb,
  xp_reward    smallint not null default 10 check (xp_reward between 0 and 100),
  completed_at timestamptz,
  unique (user_id, local_date, code)
);

create table public.boss_battles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  week_start    date not null,
  boss_code     text not null,
  hits_required smallint not null check (hits_required between 1 and 14),
  hits          smallint not null default 0 check (hits >= 0),
  won_at        timestamptz,
  reward        jsonb not null default '{}'::jsonb,
  unique (user_id, week_start)
);

comment on column public.boss_battles.reward is 'core BossReward {shieldFragments, accessoryCode, badgeCode} + won_on (local date of the win).';

create table public.badges (
  code            text primary key check (code ~ '^[a-z0-9_]+$'),
  name_key        text not null,
  description_key text not null,
  icon            text not null,
  rarity          text not null default 'common' check (rarity in ('common', 'rare', 'epic', 'legendary'))
);

create table public.user_badges (
  user_id    uuid not null references auth.users (id) on delete cascade,
  badge_code text not null references public.badges (code) on delete cascade,
  earned_at  timestamptz not null default now(),
  primary key (user_id, badge_code)
);

-- ---------------------------------------------------------------------------
-- RLS: owner read-only on every user table; badges readable by authenticated.
-- No insert/update/delete policies AND write privileges revoked (defense in depth).
-- ---------------------------------------------------------------------------
alter table public.daily_scores enable row level security;
alter table public.coach_state enable row level security;
alter table public.shield_ledger enable row level security;
alter table public.stat_snapshots enable row level security;
alter table public.quests enable row level security;
alter table public.boss_battles enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

create policy daily_scores_owner_select on public.daily_scores
  for select to authenticated using (user_id = (select auth.uid()));
create policy coach_state_owner_select on public.coach_state
  for select to authenticated using (user_id = (select auth.uid()));
create policy shield_ledger_owner_select on public.shield_ledger
  for select to authenticated using (user_id = (select auth.uid()));
create policy stat_snapshots_owner_select on public.stat_snapshots
  for select to authenticated using (user_id = (select auth.uid()));
create policy quests_owner_select on public.quests
  for select to authenticated using (user_id = (select auth.uid()));
create policy boss_battles_owner_select on public.boss_battles
  for select to authenticated using (user_id = (select auth.uid()));
create policy user_badges_owner_select on public.user_badges
  for select to authenticated using (user_id = (select auth.uid()));
create policy badges_read on public.badges
  for select to authenticated using (true);

revoke insert, update, delete, truncate on
  public.daily_scores, public.coach_state, public.shield_ledger, public.stat_snapshots,
  public.quests, public.boss_battles, public.badges, public.user_badges
from anon, authenticated;

-- free_days write policies (see nutrition_init): requests are editable until the day is closed.
create policy free_days_owner_insert on public.free_days
  for insert to authenticated
  with check (user_id = (select auth.uid())
              and not exists (select 1 from public.daily_scores s
                              where s.user_id = (select auth.uid()) and s.local_date = free_days.local_date));
create policy free_days_owner_update on public.free_days
  for update to authenticated
  using (user_id = (select auth.uid())
         and not exists (select 1 from public.daily_scores s
                         where s.user_id = (select auth.uid()) and s.local_date = free_days.local_date))
  with check (user_id = (select auth.uid()));
create policy free_days_owner_delete on public.free_days
  for delete to authenticated
  using (user_id = (select auth.uid())
         and not exists (select 1 from public.daily_scores s
                         where s.user_id = (select auth.uid()) and s.local_date = free_days.local_date));

-- ---------------------------------------------------------------------------
-- New user: also create coach_state with the starter shield, mirroring core
-- `createInitialCoachState` (the starter shield counts as this month's gift).
-- ---------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locale text := new.raw_user_meta_data ->> 'locale';
  v_today  date;
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

  v_today := private.user_today(new.id);

  insert into public.coach_state (user_id, shields, last_monthly_gift)
  values (new.id, 1, to_char(v_today, 'YYYY-MM'))
  on conflict (user_id) do nothing;

  if found then
    insert into public.shield_ledger (user_id, delta_shields, delta_fragments, reason, local_date)
    values (new.id, 1, 0, 'starter', v_today);
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Server API for close-day (service role only)
-- ---------------------------------------------------------------------------

-- Days that are due to be closed: the user's local clock has passed 03:00 of the
-- following day and no daily_scores row exists yet. Backfills at most
-- p_max_backfill days (e.g. after an outage), never before onboarding.
create or replace function public.due_close_days(
  p_now timestamptz default now(),
  p_max_backfill integer default 3,
  p_limit integer default 500
)
returns table (user_id uuid, local_date date, timezone text)
language sql
stable
security definer
set search_path = ''
as $$
  with u as (
    select p.user_id,
           p.timezone,
           ((p_now at time zone p.timezone) - interval '3 hours')::date - 1 as last_closable,
           (p.onboarding_completed_at at time zone p.timezone)::date        as first_day
    from public.profiles p
    where p.onboarding_completed_at is not null
  ),
  d as (
    select u.user_id, u.timezone, g::date as local_date
    from u
    cross join lateral generate_series(
      greatest(u.first_day, u.last_closable - (p_max_backfill - 1))::timestamp,
      u.last_closable::timestamp,
      interval '1 day') as g
  )
  select d.user_id, d.local_date, d.timezone
  from d
  where not exists (
    select 1 from public.daily_scores s
    where s.user_id = d.user_id and s.local_date = d.local_date)
  order by d.local_date, d.user_id
  limit p_limit;
$$;

-- Persists one closed day atomically and idempotently. Returns false when the
-- day was already closed. Payload shape: supabase/functions/close-day/types.ts
-- (CloseDayPayload), produced from core `CloseDayResult` by coach-adapter.ts.
create or replace function public.apply_close_day(p jsonb)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user  uuid  := (p ->> 'user_id')::uuid;
  v_date  date  := (p ->> 'local_date')::date;
  v_sum   jsonb := coalesce(p -> 'summary', '{}'::jsonb);
  v_score jsonb := p -> 'score';
  v_state jsonb := p -> 'state';
  v_boss  jsonb := p -> 'boss';
begin
  if v_user is null or v_date is null or v_score is null or v_state is null then
    raise exception 'apply_close_day: user_id, local_date, score and state are required';
  end if;

  -- Serialize concurrent runs for the same user.
  perform pg_advisory_xact_lock(hashtext('close_day:' || v_user::text));

  if exists (select 1 from public.daily_scores s where s.user_id = v_user and s.local_date = v_date) then
    return false;
  end if;

  insert into public.daily_summaries as ds (
    user_id, local_date, kcal_in, protein_g, carb_g, fat_g, sugar_g, kcal_target, water_ml,
    sleep_min, sleep_quality, wake_time, steps, active_kcal, resting_hr, weight_kg,
    weight_trend_kg, is_free_day)
  values (
    v_user, v_date,
    coalesce((v_sum ->> 'kcal_in')::numeric, 0),
    coalesce((v_sum ->> 'protein_g')::numeric, 0),
    coalesce((v_sum ->> 'carb_g')::numeric, 0),
    coalesce((v_sum ->> 'fat_g')::numeric, 0),
    coalesce((v_sum ->> 'sugar_g')::numeric, 0),
    (v_sum ->> 'kcal_target')::integer,
    coalesce((v_sum ->> 'water_ml')::integer, 0),
    (v_sum ->> 'sleep_min')::integer,
    (v_sum ->> 'sleep_quality')::smallint,
    (v_sum ->> 'wake_time')::time,
    (v_sum ->> 'steps')::integer,
    (v_sum ->> 'active_kcal')::integer,
    (v_sum ->> 'resting_hr')::smallint,
    (v_sum ->> 'weight_kg')::numeric,
    (v_sum ->> 'weight_trend_kg')::numeric,
    coalesce((v_sum ->> 'is_free_day')::boolean, false))
  on conflict (user_id, local_date) do update set
    kcal_in = excluded.kcal_in, protein_g = excluded.protein_g, carb_g = excluded.carb_g,
    fat_g = excluded.fat_g, sugar_g = excluded.sugar_g, kcal_target = excluded.kcal_target,
    water_ml = excluded.water_ml, sleep_min = excluded.sleep_min,
    sleep_quality = excluded.sleep_quality, wake_time = excluded.wake_time,
    steps = excluded.steps, active_kcal = excluded.active_kcal,
    resting_hr = excluded.resting_hr, weight_kg = excluded.weight_kg,
    weight_trend_kg = excluded.weight_trend_kg, is_free_day = excluded.is_free_day;

  insert into public.daily_scores (
    user_id, local_date, nutrition_pts, sleep_pts, training_pts, water_pts, tasks_pts,
    weight_pts, penalty_pts, total, result, strictness, is_free_day, shield_used, breakdown)
  values (
    v_user, v_date,
    (v_score ->> 'nutrition_pts')::smallint,
    (v_score ->> 'sleep_pts')::smallint,
    (v_score ->> 'training_pts')::smallint,
    (v_score ->> 'water_pts')::smallint,
    (v_score ->> 'tasks_pts')::smallint,
    (v_score ->> 'weight_pts')::smallint,
    coalesce((v_score ->> 'penalty_pts')::smallint, 0),
    (v_score ->> 'total')::smallint,
    v_score ->> 'result',
    v_score ->> 'strictness',
    coalesce((v_score ->> 'is_free_day')::boolean, false),
    coalesce((v_score ->> 'shield_used')::boolean, false),
    coalesce(v_score -> 'breakdown', '{}'::jsonb));

  insert into public.coach_state (
    user_id, xp, level, streak, best_streak, shields, shield_fragments, aura_score, aura_tier, mood,
    last_closed_date, last_streak_lost_date, last_monthly_gift, boss_wins)
  values (
    v_user,
    (v_state ->> 'xp')::bigint,
    (v_state ->> 'level')::integer,
    (v_state ->> 'streak')::integer,
    (v_state ->> 'best_streak')::integer,
    (v_state ->> 'shields')::smallint,
    (v_state ->> 'shield_fragments')::smallint,
    (v_state ->> 'aura_score')::numeric,
    v_state ->> 'aura_tier',
    v_state ->> 'mood',
    v_date,
    (v_state ->> 'last_streak_lost_date')::date,
    v_state ->> 'last_monthly_gift',
    coalesce((v_state ->> 'boss_wins')::integer, 0))
  on conflict (user_id) do update set
    xp = greatest(public.coach_state.xp, excluded.xp),   -- XP never decreases
    level = greatest(public.coach_state.level, excluded.level),
    streak = excluded.streak, best_streak = excluded.best_streak,
    shields = excluded.shields, shield_fragments = excluded.shield_fragments,
    aura_score = excluded.aura_score, aura_tier = excluded.aura_tier, mood = excluded.mood,
    last_closed_date = excluded.last_closed_date,
    last_streak_lost_date = excluded.last_streak_lost_date,
    last_monthly_gift = excluded.last_monthly_gift, boss_wins = excluded.boss_wins;

  insert into public.shield_ledger (user_id, delta_shields, delta_fragments, reason, local_date)
  select v_user,
         coalesce((e ->> 'delta_shields')::smallint, 0),
         coalesce((e ->> 'delta_fragments')::smallint, 0),
         e ->> 'reason',
         coalesce((e ->> 'local_date')::date, v_date)
  from jsonb_array_elements(coalesce(p -> 'ledger', '[]'::jsonb)) as e;

  insert into public.user_badges (user_id, badge_code)
  select v_user, b.code
  from jsonb_array_elements_text(coalesce(p -> 'badges', '[]'::jsonb)) as c(code)
  join public.badges b on b.code = c.code
  on conflict do nothing;

  insert into public.stat_snapshots (user_id, local_date, stat, value)
  select v_user, v_date, s ->> 'stat', (s ->> 'value')::numeric
  from jsonb_array_elements(coalesce(p -> 'stats', '[]'::jsonb)) as s
  on conflict (user_id, local_date, stat) do update set value = excluded.value;

  -- Quests of the closed day that were completed.
  update public.quests q set completed_at = now()
  where q.user_id = v_user and q.local_date = v_date and q.completed_at is null
    and q.code in (select jsonb_array_elements_text(coalesce(p -> 'quests_completed', '[]'::jsonb)));

  -- Quests for the next day (generated from the fresh hard stats).
  insert into public.quests (user_id, local_date, code, stat, params, xp_reward)
  select v_user, (q ->> 'local_date')::date, q ->> 'code', q ->> 'stat',
         coalesce(q -> 'params', '{}'::jsonb), (q ->> 'xp_reward')::smallint
  from jsonb_array_elements(coalesce(p -> 'quests_next', '[]'::jsonb)) as q
  on conflict (user_id, local_date, code) do nothing;

  -- Weekly boss of the closed day's week.
  if v_boss is not null and jsonb_typeof(v_boss) = 'object' then
    insert into public.boss_battles (user_id, week_start, boss_code, hits_required, hits, won_at, reward)
    values (
      v_user,
      (v_boss ->> 'week_start')::date,
      v_boss ->> 'boss_code',
      (v_boss ->> 'hits_required')::smallint,
      (v_boss ->> 'hits')::smallint,
      case when v_boss ->> 'won_on' is not null then now() end,
      coalesce(v_boss -> 'reward', '{}'::jsonb))
    on conflict (user_id, week_start) do update set
      boss_code = excluded.boss_code, hits_required = excluded.hits_required, hits = excluded.hits,
      won_at = coalesce(public.boss_battles.won_at, excluded.won_at), reward = excluded.reward;
  end if;

  return true;
end;
$$;

revoke all on function public.due_close_days(timestamptz, integer, integer) from public, anon, authenticated;
revoke all on function public.apply_close_day(jsonb) from public, anon, authenticated;
grant execute on function public.due_close_days(timestamptz, integer, integer) to service_role;
grant execute on function public.apply_close_day(jsonb) to service_role;
