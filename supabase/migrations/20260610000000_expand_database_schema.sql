-- Migration: Expand Database Schema with Alterations and New Tables

-- ==========================================
-- 1. ALTER EXISTING TABLES
-- ==========================================

-- A. Alter profiles table
alter table public.profiles
  add column if not exists cardio_age integer,
  add column if not exists preferred_unit text default 'kg' not null;

-- B. Alter exercises table
alter table public.exercises
  add column if not exists video_url text,
  add column if not exists is_compound boolean default true not null;

-- C. Alter workout_plans table
alter table public.workout_plans
  add column if not exists is_active boolean default true not null;

-- D. Alter workout_plan_exercises table
alter table public.workout_plan_exercises
  add column if not exists rest_duration_seconds integer default 90 not null;

-- E. Alter workouts table
alter table public.workouts
  add column if not exists status text default 'Completed' not null,
  add column if not exists feeling_rating integer;

-- F. Alter exercise_set_logs table
alter table public.exercise_set_logs
  add column if not exists rpe integer;


-- ==========================================
-- 2. CREATE NEW TABLES WITH CONSTRAINTS
-- ==========================================

-- G. Create personal_records table
create table if not exists public.personal_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  max_weight_kg numeric(5,2) not null,
  reps integer not null,
  calculated_1rm numeric(5,2),
  achieved_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- H. Create food_logs table
create table if not exists public.food_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  meal_type text check (meal_type in ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
  food_name text not null,
  calories_kcal integer not null,
  protein_g integer default 0 not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- I. Create lifestyle_metrics table
create table if not exists public.lifestyle_metrics (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  log_date date default current_date not null,
  water_intake_liters numeric(3,2) default 0.00 not null,
  social_media_minutes integer default 0 not null,
  sleep_hours numeric(3,1),
  sleep_quality text check (sleep_quality in ('good', 'medium', 'bad')),
  books_read_pages integer default 0 not null,
  book_title text,
  book_page_image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, log_date)
);

-- J. Create cardio_logs table
create table if not exists public.cardio_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_type text not null,
  duration_minutes integer not null,
  calories_burned integer not null,
  incline_percent numeric(3,1),
  speed_kmh numeric(3,1),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- ==========================================
-- 3. ENABLE RLS FOR NEW TABLES
-- ==========================================

alter table public.personal_records enable row level security;
alter table public.food_logs enable row level security;
alter table public.lifestyle_metrics enable row level security;
alter table public.cardio_logs enable row level security;


-- ==========================================
-- 4. RLS POLICIES FOR NEW TABLES
-- ==========================================

-- PR Policies
create policy "Allow users to view their own personal records" on public.personal_records
  for select using (auth.uid() = user_id);

create policy "Allow users to insert their own personal records" on public.personal_records
  for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own personal records" on public.personal_records
  for update using (auth.uid() = user_id);

create policy "Allow users to delete their own personal records" on public.personal_records
  for delete using (auth.uid() = user_id);

-- Food Logs Policies
create policy "Allow users to view their own food logs" on public.food_logs
  for select using (auth.uid() = user_id);

create policy "Allow users to insert their own food logs" on public.food_logs
  for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own food logs" on public.food_logs
  for update using (auth.uid() = user_id);

create policy "Allow users to delete their own food logs" on public.food_logs
  for delete using (auth.uid() = user_id);

-- Lifestyle Metrics Policies
create policy "Allow users to view their own lifestyle metrics" on public.lifestyle_metrics
  for select using (auth.uid() = user_id);

create policy "Allow users to insert their own lifestyle metrics" on public.lifestyle_metrics
  for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own lifestyle metrics" on public.lifestyle_metrics
  for update using (auth.uid() = user_id);

create policy "Allow users to delete their own lifestyle metrics" on public.lifestyle_metrics
  for delete using (auth.uid() = user_id);

-- Cardio Logs Policies
create policy "Allow users to view their own cardio logs" on public.cardio_logs
  for select using (auth.uid() = user_id);

create policy "Allow users to insert their own cardio logs" on public.cardio_logs
  for insert with check (auth.uid() = user_id);

create policy "Allow users to update their own cardio logs" on public.cardio_logs
  for update using (auth.uid() = user_id);

create policy "Allow users to delete their own cardio logs" on public.cardio_logs
  for delete using (auth.uid() = user_id);
