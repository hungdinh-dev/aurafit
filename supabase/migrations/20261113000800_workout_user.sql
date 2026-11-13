-- =============================================================================
-- 06-workout v1.3 §2, §4b – user workout data, recovery cache, volume targets,
-- program templates (shared catalog)
-- Spec: docs/04-database/06-workout.md
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Program templates (WRK-20) – shared catalog, read-only
-- ---------------------------------------------------------------------------
create table public.program_templates (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9_]+$'),
  name_vi        text not null,
  name_en        text not null,
  level          text not null check (level in ('beginner', 'intermediate', 'advanced')),
  days_per_week  smallint not null check (days_per_week between 1 and 7),
  split          text not null check (split in ('full_body', 'upper_lower', 'ppl')),
  equipment_kind text not null check (equipment_kind in ('gym', 'home', 'bodyweight')),
  description_vi text,
  description_en text
);

create table public.program_template_sessions (
  id             uuid primary key default gen_random_uuid(),
  template_id    uuid not null references public.program_templates (id) on delete cascade,
  rotation_index smallint not null check (rotation_index >= 0),
  name_vi        text not null,
  name_en        text not null,
  unique (template_id, rotation_index)
);

create table public.program_template_exercises (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references public.program_template_sessions (id) on delete cascade,
  exercise_id        uuid not null references public.exercises (id),
  sort_order         smallint not null,
  sets               smallint not null check (sets between 1 and 10),
  rep_min            smallint check (rep_min > 0),
  rep_max            smallint check (rep_max > 0),
  target_rir         smallint check (target_rir between 0 and 5),
  rest_sec           smallint check (rest_sec between 0 and 600),
  backup_exercise_id uuid references public.exercises (id),
  unique (session_id, sort_order),
  check (rep_min is null or rep_max is null or rep_min <= rep_max)
);

comment on column public.program_template_exercises.rep_min is
  'Reps; for exercises with measure = time this is seconds.';

-- ---------------------------------------------------------------------------
-- equipment_profiles
-- ---------------------------------------------------------------------------
create table public.equipment_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 60),
  kind            text not null check (kind in ('gym', 'home', 'bodyweight')),
  equipment_codes text[] not null default '{}',
  inventory       jsonb not null default '{}'::jsonb,   -- v1.3 (WRK-18)
  is_default      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index equipment_profiles_user_idx on public.equipment_profiles (user_id);
create unique index equipment_profiles_one_default_idx
  on public.equipment_profiles (user_id) where is_default;

-- ---------------------------------------------------------------------------
-- programs / planned_sessions / planned_exercises
-- ---------------------------------------------------------------------------
create table public.programs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  goal_type           text not null check (goal_type in ('lose_fat', 'maintain', 'gain_muscle')),
  split               text not null check (split in ('full_body', 'upper_lower', 'ppl')),
  days_per_week       smallint not null check (days_per_week between 1 and 7),
  session_minutes     smallint check (session_minutes between 10 and 240),
  total_weeks         smallint check (total_weeks between 1 and 52),
  started_on          date not null default current_date,
  status              text not null default 'active' check (status in ('active', 'completed', 'archived')),
  generator_version   text,
  schedule_mode       text not null default 'weekday' check (schedule_mode in ('weekday', 'rotation')),  -- v1.3
  next_rotation_index smallint not null default 0 check (next_rotation_index >= 0),                     -- v1.3
  created_at          timestamptz not null default now()
);

create index programs_user_status_idx on public.programs (user_id, status);

create table public.planned_sessions (
  id                   uuid primary key default gen_random_uuid(),
  program_id           uuid not null references public.programs (id) on delete cascade,
  user_id              uuid not null references auth.users (id) on delete cascade,
  week_no              smallint not null default 1 check (week_no >= 1),
  day_of_week          smallint check (day_of_week between 1 and 7),
  name                 text not null,
  is_deload            boolean not null default false,
  equipment_profile_id uuid references public.equipment_profiles (id) on delete set null,
  rotation_index       smallint check (rotation_index >= 0)                                -- v1.3
);

create index planned_sessions_program_idx on public.planned_sessions (program_id, week_no);
create index planned_sessions_user_idx on public.planned_sessions (user_id);

create table public.planned_exercises (
  id                 uuid primary key default gen_random_uuid(),
  planned_session_id uuid not null references public.planned_sessions (id) on delete cascade,
  exercise_id        uuid not null references public.exercises (id),
  sort_order         smallint not null default 0,
  sets               smallint not null check (sets between 1 and 10),
  rep_min            smallint check (rep_min > 0),
  rep_max            smallint check (rep_max > 0),
  target_load_kg     numeric(6,2) check (target_load_kg >= 0),
  rest_sec           smallint check (rest_sec between 0 and 600),
  is_extra           boolean not null default false,
  backup_exercise_id uuid references public.exercises (id),       -- v1.3 (WRK-17)
  target_rir         smallint check (target_rir between 0 and 5),  -- v1.3 (WRK-14)
  check (rep_min is null or rep_max is null or rep_min <= rep_max)
);

create index planned_exercises_session_idx on public.planned_exercises (planned_session_id, sort_order);

-- ---------------------------------------------------------------------------
-- workout_sessions / set_logs / personal_records
-- ---------------------------------------------------------------------------
create table public.workout_sessions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  planned_session_id   uuid references public.planned_sessions (id) on delete set null,
  equipment_profile_id uuid references public.equipment_profiles (id) on delete set null,
  local_date           date not null,
  started_at           timestamptz not null default now(),
  ended_at             timestamptz,
  readiness            smallint check (readiness between 0 and 100),
  readiness_applied    boolean not null default false,
  status               text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled')),
  feeling              smallint check (feeling between 1 and 5),
  check (ended_at is null or ended_at >= started_at)
);

create index workout_sessions_user_date_idx on public.workout_sessions (user_id, local_date);

create table public.set_logs (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.workout_sessions (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  exercise_id   uuid not null references public.exercises (id),
  set_no        smallint not null check (set_no >= 1),
  load_kg       numeric(6,2) check (load_kg >= 0),
  reps          smallint check (reps >= 0),
  duration_sec  integer check (duration_sec >= 0),
  distance_m    numeric(7,1) check (distance_m >= 0),
  rpe           numeric(3,1) check (rpe between 1 and 10),
  rir           smallint check (rir between 0 and 5),                                  -- v1.3 (WRK-14)
  is_warmup     boolean not null default false,
  completed_at  timestamptz not null default now(),
  added_load_kg numeric(6,2) check (added_load_kg >= 0),                               -- v1.3 (WRK-19)
  side          text not null default 'both' check (side in ('both', 'left', 'right')), -- v1.3 (WRK-19)
  bands         jsonb                                                                  -- v1.3 (WRK-19)
);

comment on column public.set_logs.distance_m is 'For measure = distance exercises (e.g. farmers_walk); addition to spec v1.3.';

create index set_logs_session_idx on public.set_logs (session_id);
create index set_logs_user_completed_idx on public.set_logs (user_id, completed_at desc);
create index set_logs_user_exercise_completed_idx on public.set_logs (user_id, exercise_id, completed_at desc);

create table public.personal_records (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  kind        text not null check (kind in ('max_load', 'est_1rm', 'max_reps', 'max_time', 'progression_level')),
  value       numeric(8,2) not null,
  set_log_id  uuid references public.set_logs (id) on delete set null,
  achieved_at timestamptz not null default now()
);

create index personal_records_user_exercise_idx on public.personal_records (user_id, exercise_id, kind);

-- ---------------------------------------------------------------------------
-- muscle_recovery (server cache per head, v1.2) / muscle_volume_targets (v1.3)
-- ---------------------------------------------------------------------------
create table public.muscle_recovery (
  user_id         uuid not null references auth.users (id) on delete cascade,
  head_code       text not null references public.muscle_heads (code),
  fatigue         numeric(5,2) not null default 0 check (fatigue between 0 and 100),
  last_trained_at timestamptz,
  recovered_at    timestamptz,
  updated_at      timestamptz not null default now(),
  primary key (user_id, head_code)
);

create trigger muscle_recovery_set_updated_at
  before update on public.muscle_recovery
  for each row execute function private.set_updated_at();

create table public.muscle_volume_targets (
  user_id     uuid not null references auth.users (id) on delete cascade,
  muscle_code text not null references public.muscles (code),
  sets_min    smallint not null check (sets_min >= 0),
  sets_max    smallint not null check (sets_max >= 0),
  source      text not null default 'manual' check (source in ('default', 'auto', 'manual')),
  updated_at  timestamptz not null default now(),
  primary key (user_id, muscle_code),
  check (sets_min <= sets_max)
);

create trigger muscle_volume_targets_set_updated_at
  before update on public.muscle_volume_targets
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.program_templates enable row level security;
alter table public.program_template_sessions enable row level security;
alter table public.program_template_exercises enable row level security;
alter table public.equipment_profiles enable row level security;
alter table public.programs enable row level security;
alter table public.planned_sessions enable row level security;
alter table public.planned_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.set_logs enable row level security;
alter table public.personal_records enable row level security;
alter table public.muscle_recovery enable row level security;
alter table public.muscle_volume_targets enable row level security;

-- Shared templates: read-only.
create policy program_templates_read on public.program_templates for select to authenticated using (true);
create policy program_template_sessions_read on public.program_template_sessions for select to authenticated using (true);
create policy program_template_exercises_read on public.program_template_exercises for select to authenticated using (true);
revoke insert, update, delete, truncate on
  public.program_templates, public.program_template_sessions, public.program_template_exercises
from anon, authenticated;

-- Owner full access.
create policy equipment_profiles_owner_all on public.equipment_profiles
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy programs_owner_all on public.programs
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy planned_sessions_owner_all on public.planned_sessions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
              and exists (select 1 from public.programs p
                          where p.id = program_id and p.user_id = (select auth.uid())));

create policy planned_exercises_owner_all on public.planned_exercises
  for all to authenticated
  using (exists (select 1 from public.planned_sessions ps
                 where ps.id = planned_session_id and ps.user_id = (select auth.uid())))
  with check (exists (select 1 from public.planned_sessions ps
                      where ps.id = planned_session_id and ps.user_id = (select auth.uid())));

create policy workout_sessions_owner_all on public.workout_sessions
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy set_logs_owner_all on public.set_logs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
              and exists (select 1 from public.workout_sessions ws
                          where ws.id = session_id and ws.user_id = (select auth.uid())));

create policy muscle_volume_targets_owner_all on public.muscle_volume_targets
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Server-written: owner read-only.
create policy personal_records_owner_select on public.personal_records
  for select to authenticated using (user_id = (select auth.uid()));
create policy muscle_recovery_owner_select on public.muscle_recovery
  for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete, truncate on public.personal_records, public.muscle_recovery
from anon, authenticated;
