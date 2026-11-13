-- =============================================================================
-- 02-nutrition v1 – targets, meals, saved foods, barcode cache, free days,
-- AI request log, meal-photos storage bucket
-- Spec: docs/04-database/02-nutrition.md
-- =============================================================================

-- ---------------------------------------------------------------------------
-- ai_requests – AI call log (server-only writes; owner reads)
-- ---------------------------------------------------------------------------
create table public.ai_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  kind          text not null check (kind in ('meal_image', 'meal_text', 'reanalyze')),
  provider      text not null,
  model         text not null,
  input_tokens  integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  cost_usd      numeric(10,6) check (cost_usd >= 0),
  latency_ms    integer check (latency_ms >= 0),
  status        text not null check (status in ('ok', 'error', 'quota_exceeded')),
  error         text,
  created_at    timestamptz not null default now()
);

comment on column public.ai_requests.error is 'Short error code/message when status = error (addition to spec v1).';

create index ai_requests_user_created_idx on public.ai_requests (user_id, created_at);

-- ---------------------------------------------------------------------------
-- nutrition_targets – target history (today = latest row with effective_from <= today)
-- ---------------------------------------------------------------------------
create table public.nutrition_targets (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  effective_from date not null,
  tdee_kcal      integer check (tdee_kcal between 500 and 10000),
  kcal           integer not null check (kcal between 500 and 10000),
  protein_g      integer not null check (protein_g >= 0),
  carb_g         integer not null check (carb_g >= 0),
  fat_g          integer not null check (fat_g >= 0),
  sugar_g        integer not null check (sugar_g >= 0),
  fiber_g        integer check (fiber_g >= 0),
  sodium_mg      integer check (sodium_mg >= 0),
  reason         text not null check (reason in ('initial', 'weekly_adjust', 'goal_change', 'manual')),
  explanation    jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index nutrition_targets_user_effective_idx
  on public.nutrition_targets (user_id, effective_from desc, created_at desc);

-- ---------------------------------------------------------------------------
-- saved_foods / saved_food_items – "Món của tôi"
-- ---------------------------------------------------------------------------
create table public.saved_foods (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 120),
  kind         text not null default 'item' check (kind in ('item', 'combo')),
  kcal         integer not null default 0 check (kcal >= 0),
  protein_g    numeric(6,1) not null default 0 check (protein_g >= 0),
  carb_g       numeric(6,1) not null default 0 check (carb_g >= 0),
  fat_g        numeric(6,1) not null default 0 check (fat_g >= 0),
  sugar_g      numeric(6,1) not null default 0 check (sugar_g >= 0),
  fiber_g      numeric(6,1) not null default 0 check (fiber_g >= 0),
  sodium_mg    integer not null default 0 check (sodium_mg >= 0),
  usual_slot   text check (usual_slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  use_count    integer not null default 0 check (use_count >= 0),
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);

create index saved_foods_user_use_count_idx on public.saved_foods (user_id, use_count desc);

create table public.saved_food_items (
  id            uuid primary key default gen_random_uuid(),
  saved_food_id uuid not null references public.saved_foods (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 120),
  quantity      numeric(5,2) not null default 1 check (quantity > 0),
  kcal          integer not null default 0 check (kcal >= 0),
  protein_g     numeric(6,1) not null default 0 check (protein_g >= 0),
  carb_g        numeric(6,1) not null default 0 check (carb_g >= 0),
  fat_g         numeric(6,1) not null default 0 check (fat_g >= 0),
  sugar_g       numeric(6,1) not null default 0 check (sugar_g >= 0),
  fiber_g       numeric(6,1) not null default 0 check (fiber_g >= 0),
  sodium_mg     integer not null default 0 check (sodium_mg >= 0)
);

create index saved_food_items_saved_food_idx on public.saved_food_items (saved_food_id);

-- ---------------------------------------------------------------------------
-- meal_entries / meal_items
-- ---------------------------------------------------------------------------
create table public.meal_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  eaten_at      timestamptz not null default now(),
  local_date    date not null,
  meal_slot     text not null check (meal_slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  source        text not null check (source in ('photo', 'text', 'library', 'recent', 'barcode')),
  photo_path    text,
  ai_request_id uuid references public.ai_requests (id) on delete set null,
  is_shared     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index meal_entries_user_date_idx on public.meal_entries (user_id, local_date);

create trigger meal_entries_set_updated_at
  before update on public.meal_entries
  for each row execute function private.set_updated_at();

-- local_date defaults to eaten_at in the owner's timezone.
create or replace function private.meal_entries_fill_local_date()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.local_date is null then
    new.local_date := (new.eaten_at at time zone coalesce(
      (select p.timezone from public.profiles p where p.user_id = new.user_id),
      'Asia/Ho_Chi_Minh'))::date;
  end if;
  return new;
end;
$$;

create trigger meal_entries_fill_local_date
  before insert on public.meal_entries
  for each row execute function private.meal_entries_fill_local_date();

create table public.meal_items (
  id             uuid primary key default gen_random_uuid(),
  meal_entry_id  uuid not null references public.meal_entries (id) on delete cascade,
  user_id        uuid not null references auth.users (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 120),
  portion_text   text,
  quantity       numeric(5,2) not null default 1 check (quantity > 0),
  kcal           integer not null default 0 check (kcal >= 0),
  protein_g      numeric(6,1) not null default 0 check (protein_g >= 0),
  carb_g         numeric(6,1) not null default 0 check (carb_g >= 0),
  fat_g          numeric(6,1) not null default 0 check (fat_g >= 0),
  sugar_g        numeric(6,1) not null default 0 check (sugar_g >= 0),
  fiber_g        numeric(6,1) not null default 0 check (fiber_g >= 0),
  sodium_mg      integer not null default 0 check (sodium_mg >= 0),
  confidence     numeric(3,2) check (confidence between 0 and 1),
  clarifications jsonb,
  saved_food_id  uuid references public.saved_foods (id) on delete set null,
  barcode        text
);

create index meal_items_meal_entry_idx on public.meal_items (meal_entry_id);
create index meal_items_user_idx on public.meal_items (user_id);

-- ---------------------------------------------------------------------------
-- barcode_products – shared cache (server writes, authenticated reads)
-- ---------------------------------------------------------------------------
create table public.barcode_products (
  barcode        text primary key,
  name           text not null,
  brand          text,
  kcal_100g      numeric(7,2) check (kcal_100g >= 0),
  protein_g_100g numeric(6,2) check (protein_g_100g >= 0),
  carb_g_100g    numeric(6,2) check (carb_g_100g >= 0),
  fat_g_100g     numeric(6,2) check (fat_g_100g >= 0),
  sugar_g_100g   numeric(6,2) check (sugar_g_100g >= 0),
  fiber_g_100g   numeric(6,2) check (fiber_g_100g >= 0),
  sodium_mg_100g numeric(8,2) check (sodium_mg_100g >= 0),
  serving_g      numeric(7,2) check (serving_g > 0),
  source         text not null check (source in ('openfoodfacts', 'user')),
  fetched_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- free_days
-- ---------------------------------------------------------------------------
create table public.free_days (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  local_date        date not null,
  kind              text not null check (kind in ('quota', 'shield')),
  quoted_extra_kcal integer check (quoted_extra_kcal >= 0),
  compensated       boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (user_id, local_date)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.ai_requests enable row level security;
alter table public.nutrition_targets enable row level security;
alter table public.saved_foods enable row level security;
alter table public.saved_food_items enable row level security;
alter table public.meal_entries enable row level security;
alter table public.meal_items enable row level security;
alter table public.barcode_products enable row level security;
alter table public.free_days enable row level security;

-- ai_requests: owner read-only; Edge Functions write with the service role.
create policy ai_requests_owner_select on public.ai_requests
  for select to authenticated using (user_id = (select auth.uid()));
revoke insert, update, delete, truncate on public.ai_requests from anon, authenticated;

-- nutrition_targets: owner reads all rows and may add `manual` rows only.
create policy nutrition_targets_owner_select on public.nutrition_targets
  for select to authenticated using (user_id = (select auth.uid()));
create policy nutrition_targets_owner_insert_manual on public.nutrition_targets
  for insert to authenticated
  with check (user_id = (select auth.uid()) and reason = 'manual');
revoke update, delete, truncate on public.nutrition_targets from anon, authenticated;

-- saved_foods / saved_food_items: owner full access.
create policy saved_foods_owner_all on public.saved_foods
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy saved_food_items_owner_all on public.saved_food_items
  for all to authenticated
  using (exists (select 1 from public.saved_foods sf
                 where sf.id = saved_food_id and sf.user_id = (select auth.uid())))
  with check (exists (select 1 from public.saved_foods sf
                      where sf.id = saved_food_id and sf.user_id = (select auth.uid())));

-- meal_entries: owner full access (friend read policy is added in friends_init).
-- photo_path must live in the owner's storage folder.
create policy meal_entries_owner_select on public.meal_entries
  for select to authenticated using (user_id = (select auth.uid()));
create policy meal_entries_owner_insert on public.meal_entries
  for insert to authenticated
  with check (user_id = (select auth.uid())
              and (photo_path is null or photo_path like (select auth.uid())::text || '/%'));
create policy meal_entries_owner_update on public.meal_entries
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
              and (photo_path is null or photo_path like (select auth.uid())::text || '/%'));
create policy meal_entries_owner_delete on public.meal_entries
  for delete to authenticated using (user_id = (select auth.uid()));

-- meal_items: owner full access; the parent meal must belong to the same owner.
create policy meal_items_owner_all on public.meal_items
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
              and exists (select 1 from public.meal_entries me
                          where me.id = meal_entry_id and me.user_id = (select auth.uid())));

-- barcode_products: read-only shared cache.
create policy barcode_products_read on public.barcode_products
  for select to authenticated using (true);
revoke insert, update, delete, truncate on public.barcode_products from anon, authenticated;

-- free_days: owner full access. A row is a REQUEST (`quota` or `shield`); close-day
-- (core resolveFreeDay) decides whether it is valid, spends the shield, or treats it
-- as an excess day – so clients cannot obtain anything they are not entitled to.
-- Rows of already-closed days are immutable: the write policies need daily_scores
-- and are therefore created in 20261113000600_coach_init.sql.
create policy free_days_owner_select on public.free_days
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage: private bucket `meal-photos`, folder `<user_id>/…`, owner only.
-- Friends see shared photos through server-issued signed URLs.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy meal_photos_owner_select on storage.objects
  for select to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy meal_photos_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy meal_photos_owner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy meal_photos_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
