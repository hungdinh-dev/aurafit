-- Create workouts table
create table public.workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  duration_minutes integer not null default 0,
  calories_burned integer not null default 0,
  xp_gained integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.workouts enable row level security;

-- Setup RLS Policies
create policy "Users can view their own workouts" on public.workouts
  for select using (auth.uid() = user_id);

create policy "Users can insert their own workouts" on public.workouts
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own workouts" on public.workouts
  for delete using (auth.uid() = user_id);

-- Create trigger function to automatically update profile XP & Level
create or replace function public.handle_workout_xp()
returns trigger as $$
declare
  current_xp integer;
  new_xp integer;
  new_level integer;
begin
  -- 1. Get current XP from profiles
  select xp into current_xp from public.profiles where id = new.user_id;
  
  -- 2. Calculate new XP
  new_xp := coalesce(current_xp, 0) + new.xp_gained;
  
  -- 3. Calculate new level (1000 XP per level)
  new_level := floor(new_xp / 1000) + 1;
  
  -- 4. Update profiles table
  update public.profiles
  set 
    xp = new_xp,
    level = new_level,
    updated_at = now()
  where id = new.user_id;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute after insert on public.workouts
create or replace trigger on_workout_inserted
  after insert on public.workouts
  for each row execute procedure public.handle_workout_xp();
