-- =============================================================================
-- 04-tasks v1 – task templates (catalog), task definitions, task logs, focus sessions
-- Spec: docs/04-database/04-tasks.md, docs/02-features/daily-tasks.md §2
-- =============================================================================

-- Catalog of task templates (daily-tasks.md §2). Not a table in the DB spec
-- (`template_code` was free text); added so the template list is data, not code.
create table public.task_templates (
  code                 text primary key check (code ~ '^[a-z0-9_]+$'),
  title_vi             text not null,
  title_en             text not null,
  kind                 text not null check (kind in ('check', 'count', 'timer', 'auto')),
  default_target_value numeric,
  unit                 text,
  auto_source          text check (auto_source in ('steps', 'wake_before')),
  icon                 text,
  sort_order           smallint not null default 0
);

create table public.task_definitions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  template_code text references public.task_templates (code) on delete set null,
  title         text not null check (char_length(title) between 1 and 80),
  kind          text not null check (kind in ('check', 'count', 'timer', 'auto')),
  target_value  numeric check (target_value > 0),
  unit          text,
  auto_source   text check (auto_source in ('steps', 'wake_before')),
  days_of_week  smallint[] not null default '{1,2,3,4,5,6,7}'
                  check (cardinality(days_of_week) between 1 and 7
                         and days_of_week <@ array[1,2,3,4,5,6,7]::smallint[]),
  reminder_time time,
  is_active     boolean not null default true,
  sort_order    smallint not null default 0,
  created_at    timestamptz not null default now(),
  check ((kind = 'auto') = (auto_source is not null))
);

create index task_definitions_user_active_idx on public.task_definitions (user_id, is_active);

-- At most 7 active tasks per user (04-tasks.md: "kiểm tra ở server").
create or replace function private.task_definitions_limit_active()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_active and (
    select count(*) from public.task_definitions t
    where t.user_id = new.user_id and t.is_active and t.id <> new.id
  ) >= 7 then
    raise exception 'at most 7 active tasks are allowed' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger task_definitions_limit_active
  before insert or update of is_active, user_id on public.task_definitions
  for each row execute function private.task_definitions_limit_active();

create table public.task_logs (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.task_definitions (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  local_date   date not null,
  value        numeric not null default 0 check (value >= 0),
  is_completed boolean not null default false,
  source       text not null default 'manual' check (source in ('manual', 'auto', 'timer')),
  note         text check (char_length(note) <= 200),
  photo_path   text,
  updated_at   timestamptz not null default now(),
  unique (task_id, local_date)
);

create index task_logs_user_date_idx on public.task_logs (user_id, local_date);

create trigger task_logs_set_updated_at
  before update on public.task_logs
  for each row execute function private.set_updated_at();

create table public.focus_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  task_id     uuid references public.task_definitions (id) on delete set null,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz,
  planned_min smallint not null default 50 check (planned_min between 1 and 240),
  completed   boolean not null default false,
  check (ended_at is null or ended_at >= started_at)
);

create index focus_sessions_user_started_idx on public.focus_sessions (user_id, started_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.task_templates enable row level security;
alter table public.task_definitions enable row level security;
alter table public.task_logs enable row level security;
alter table public.focus_sessions enable row level security;

create policy task_templates_read on public.task_templates
  for select to authenticated using (true);
revoke insert, update, delete, truncate on public.task_templates from anon, authenticated;

create policy task_definitions_owner_all on public.task_definitions
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy task_logs_owner_all on public.task_logs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
              and exists (select 1 from public.task_definitions t
                          where t.id = task_id and t.user_id = (select auth.uid()))
              and (photo_path is null or photo_path like (select auth.uid())::text || '/%'));

create policy focus_sessions_owner_all on public.focus_sessions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
              and (task_id is null or exists (select 1 from public.task_definitions t
                                              where t.id = task_id and t.user_id = (select auth.uid()))));

-- ---------------------------------------------------------------------------
-- Storage: private bucket `task-photos` (book covers, no AI) – owner only.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('task-photos', 'task-photos', false, 3145728,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy task_photos_owner_select on storage.objects
  for select to authenticated
  using (bucket_id = 'task-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy task_photos_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'task-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy task_photos_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'task-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
