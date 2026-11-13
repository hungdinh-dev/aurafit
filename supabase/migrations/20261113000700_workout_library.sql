-- =============================================================================
-- 06-workout v1.3 §1 – shared catalog: muscle groups, muscles (18), muscle heads
-- (37), equipment, exercises, exercise ↔ head / equipment, media
-- Spec: docs/04-database/06-workout.md §1, §3, §4, §4b
-- All catalog tables: authenticated read, writes only via service role / seed.
-- =============================================================================

create table public.muscle_groups (
  code       text primary key,
  name_vi    text not null,
  name_en    text not null,
  sort_order smallint not null default 0
);

create table public.muscles (
  code                text primary key,
  group_code          text not null references public.muscle_groups (code),
  name_vi             text not null,
  name_en             text not null,
  view                text not null check (view in ('front', 'back', 'both')),
  size                text not null check (size in ('large', 'medium', 'small')),
  base_recovery_hours smallint not null check (base_recovery_hours between 12 and 168),
  -- v1.3 (WRK-13): default effective-sets/week thresholds
  default_sets_min    smallint not null default 10,
  default_sets_max    smallint not null default 20,
  overreach_sets      smallint not null default 25,
  check (default_sets_min <= default_sets_max and default_sets_max <= overreach_sets)
);

create table public.muscle_heads (
  code                text primary key,
  muscle_code         text not null references public.muscles (code),
  name_vi             text not null,
  name_en             text not null,
  base_recovery_hours smallint check (base_recovery_hours between 12 and 168),
  sort_order          smallint not null default 0
);

create index muscle_heads_muscle_idx on public.muscle_heads (muscle_code);

create table public.equipment (
  code          text primary key,
  name_vi       text not null,
  name_en       text not null,
  home_friendly boolean not null default false,
  sort_order    smallint not null default 0
);

create table public.exercises (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9_]+$'),
  name_vi           text not null,
  name_en           text not null,
  group_code        text not null references public.muscle_groups (code),
  category          text not null default 'strength' check (category in ('strength', 'warmup', 'mobility')),
  mechanic          text not null check (mechanic in ('compound', 'isolation')),
  level             text not null check (level in ('beginner', 'intermediate', 'advanced')),
  movement_pattern  text check (movement_pattern in ('push_h', 'push_v', 'pull_h', 'pull_v', 'squat', 'hinge', 'lunge', 'core', 'carry')),
  measure           text not null default 'reps' check (measure in ('reps', 'time', 'distance')),
  home_friendly     boolean not null default false,
  progression_group text,
  progression_level smallint,
  unlock_criteria   jsonb,
  default_rep_min   smallint check (default_rep_min > 0),
  default_rep_max   smallint check (default_rep_max > 0),
  load_step_kg      numeric(4,2) check (load_step_kg > 0),
  default_rest_sec  smallint not null default 90 check (default_rest_sec between 0 and 600),
  steps_vi          text[] not null default '{}',
  steps_en          text[] not null default '{}',
  tips_vi           text[] not null default '{}',
  tips_en           text[] not null default '{}',
  is_published      boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (default_rep_min is null or default_rep_max is null or default_rep_min <= default_rep_max)
);

comment on column public.exercises.home_friendly is 'From seed CSV column home_friendly (addition to spec v1.3).';

create index exercises_group_published_idx on public.exercises (group_code, is_published);

create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function private.set_updated_at();

create table public.exercise_muscle_heads (
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  head_code   text not null references public.muscle_heads (code),
  stimulus    numeric(3,2) not null check (stimulus between 0 and 1),
  role        text not null check (role in ('primary', 'secondary')),
  primary key (exercise_id, head_code)
);

create index exercise_muscle_heads_head_idx on public.exercise_muscle_heads (head_code);

-- Region-level view (v1.2): a muscle receives the highest stimulus of its heads.
create view public.exercise_muscles with (security_invoker = true) as
select
  emh.exercise_id,
  mh.muscle_code,
  max(emh.stimulus) as stimulus,
  case when bool_or(emh.role = 'primary') then 'primary' else 'secondary' end as role
from public.exercise_muscle_heads emh
join public.muscle_heads mh on mh.code = emh.head_code
group by emh.exercise_id, mh.muscle_code;

create table public.exercise_equipment (
  exercise_id    uuid not null references public.exercises (id) on delete cascade,
  equipment_code text not null references public.equipment (code),
  primary key (exercise_id, equipment_code)
);

create index exercise_equipment_equipment_idx on public.exercise_equipment (equipment_code);

create table public.exercise_media (
  id           uuid primary key default gen_random_uuid(),
  exercise_id  uuid not null references public.exercises (id) on delete cascade,
  kind         text not null check (kind in ('gif', 'mp4', 'webp', 'image')),
  storage_path text not null,
  width        integer check (width > 0),
  height       integer check (height > 0),
  duration_ms  integer check (duration_ms >= 0),
  variant      text not null default 'default' check (variant in ('default', 'kai', 'mira')),
  -- D-041: no row without an explicit source and license.
  source       text not null check (source in ('own', 'licensed', 'open_license')),
  provider     text not null,
  license      text not null check (char_length(license) > 0),
  attribution  text,
  is_primary   boolean not null default false
);

create index exercise_media_exercise_idx on public.exercise_media (exercise_id);

-- ---------------------------------------------------------------------------
-- RLS: catalog = authenticated read-only.
-- ---------------------------------------------------------------------------
alter table public.muscle_groups enable row level security;
alter table public.muscles enable row level security;
alter table public.muscle_heads enable row level security;
alter table public.equipment enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_muscle_heads enable row level security;
alter table public.exercise_equipment enable row level security;
alter table public.exercise_media enable row level security;

create policy muscle_groups_read on public.muscle_groups for select to authenticated using (true);
create policy muscles_read on public.muscles for select to authenticated using (true);
create policy muscle_heads_read on public.muscle_heads for select to authenticated using (true);
create policy equipment_read on public.equipment for select to authenticated using (true);
create policy exercises_read on public.exercises for select to authenticated using (is_published);
create policy exercise_muscle_heads_read on public.exercise_muscle_heads for select to authenticated using (true);
create policy exercise_equipment_read on public.exercise_equipment for select to authenticated using (true);
create policy exercise_media_read on public.exercise_media for select to authenticated using (true);

revoke insert, update, delete, truncate on
  public.muscle_groups, public.muscles, public.muscle_heads, public.equipment,
  public.exercises, public.exercise_muscle_heads, public.exercise_equipment, public.exercise_media
from anon, authenticated;
revoke all on public.exercise_muscles from anon;

-- ---------------------------------------------------------------------------
-- Storage: public-read bucket `exercise-media` (licensed for distribution);
-- no client write policies → only the service role can upload.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exercise-media', 'exercise-media', true, 20971520,
        array['image/gif', 'image/webp', 'image/png', 'image/jpeg', 'video/mp4'])
on conflict (id) do nothing;
