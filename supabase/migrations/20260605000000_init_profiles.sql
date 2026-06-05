-- Create profiles table linked 1:1 with auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  username text unique,
  full_name text,
  avatar_url text,
  
  -- Gamification indicators
  level integer default 1 not null,
  xp integer default 0 not null,
  streak_days integer default 0 not null,
  aura_shields integer default 0 not null,
  
  -- Biometric indicators
  cardio_age integer,
  metadata jsonb default '{}'::jsonb not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Setup RLS Policies
create policy "Allow public read access to all profiles" on public.profiles
  for select using (true);

create policy "Allow individual users to update their own profiles" on public.profiles
  for update using (auth.uid() = id);

create policy "Allow individual users to insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Create a trigger function to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', substring(new.email from '([^@]+)')),
    coalesce(new.raw_user_meta_data->>'full_name', 'Anonymous Aura'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to execute the function on auth.users inserts
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
