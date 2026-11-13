-- =============================================================================
-- 07-friends v1 – friendships, invites, meal reactions, duo streaks,
-- friend-visibility policies and public views
-- Spec: docs/04-database/07-friends.md, 01-profile.md §RLS, 05-coach.md §RLS
-- =============================================================================

create table public.friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

-- One row per unordered pair.
create unique index friendships_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_status_idx on public.friendships (addressee_id, status);
create index friendships_requester_status_idx on public.friendships (requester_id, status);

create or replace function private.friendships_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'pending' then
      raise exception 'a friendship cannot go back to pending' using errcode = 'P0001';
    end if;
    new.responded_at := now();
  end if;
  return new;
end;
$$;

create trigger friendships_before_update
  before update on public.friendships
  for each row execute function private.friendships_before_update();

-- are_friends(a, b): used by other policies (security definer, bypasses RLS).
create or replace function private.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select a is not null and b is not null and exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and least(f.requester_id, f.addressee_id) = least(a, b)
      and greatest(f.requester_id, f.addressee_id) = greatest(a, b));
$$;

revoke all on function private.are_friends(uuid, uuid) from public;
grant execute on function private.are_friends(uuid, uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- invites – invite link / QR code (D-036)
-- ---------------------------------------------------------------------------
create or replace function private.gen_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  v_bytes bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  v_pos   int[] := array[0, 1, 2, 3, 4, 5, 10, 11, 12, 13];  -- skip uuid version/variant bytes
  v_code  text := '';
  i       int;
begin
  foreach i in array v_pos loop
    v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % length(v_alphabet)) + 1, 1);
  end loop;
  return v_code;
end;
$$;

create table public.invites (
  code       text primary key default private.gen_invite_code() check (code ~ '^[A-Za-z0-9]{10}$'),
  inviter_id uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null default now() + interval '7 days',
  max_uses   smallint not null default 5 check (max_uses between 1 and 50),
  uses       smallint not null default 0 check (uses >= 0 and uses <= max_uses),
  created_at timestamptz not null default now()
);

create index invites_inviter_idx on public.invites (inviter_id);

-- ---------------------------------------------------------------------------
-- meal_reactions
-- ---------------------------------------------------------------------------
create table public.meal_reactions (
  id            uuid primary key default gen_random_uuid(),
  meal_entry_id uuid not null references public.meal_entries (id) on delete cascade,
  user_id       uuid not null references auth.users (id) on delete cascade,
  reaction      text not null check (reaction in ('fire', 'clap', 'heart', 'drool', 'strong')),
  created_at    timestamptz not null default now(),
  unique (meal_entry_id, user_id)
);

create index meal_reactions_meal_idx on public.meal_reactions (meal_entry_id);

-- ---------------------------------------------------------------------------
-- duo_streaks – server updates them in close-day
-- ---------------------------------------------------------------------------
create table public.duo_streaks (
  id                uuid primary key default gen_random_uuid(),
  user_a            uuid not null references auth.users (id) on delete cascade,
  user_b            uuid not null references auth.users (id) on delete cascade,
  streak            integer not null default 0 check (streak >= 0),
  best_streak       integer not null default 0 check (best_streak >= 0),
  started_at        timestamptz not null default now(),
  last_counted_date date,
  status            text not null default 'active' check (status in ('active', 'ended')),
  check (user_a < user_b)
);

create unique index duo_streaks_active_pair_idx on public.duo_streaks (user_a, user_b) where status = 'active';
create index duo_streaks_user_b_idx on public.duo_streaks (user_b);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.friendships enable row level security;
alter table public.invites enable row level security;
alter table public.meal_reactions enable row level security;
alter table public.duo_streaks enable row level security;

-- friendships: both sides read; requester creates; addressee updates status;
-- requester may withdraw/unfriend unless blocked; addressee may delete any.
create policy friendships_pair_select on public.friendships
  for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));
create policy friendships_requester_insert on public.friendships
  for insert to authenticated
  with check (requester_id = (select auth.uid()) and status = 'pending');
create policy friendships_addressee_update on public.friendships
  for update to authenticated
  using (addressee_id = (select auth.uid()))
  with check (addressee_id = (select auth.uid()) and status in ('accepted', 'blocked'));
create policy friendships_delete on public.friendships
  for delete to authenticated
  using ((requester_id = (select auth.uid()) and status <> 'blocked')
         or addressee_id = (select auth.uid()));

revoke update on public.friendships from anon, authenticated;
grant update (status) on public.friendships to authenticated;
revoke insert on public.friendships from anon, authenticated;
grant insert (requester_id, addressee_id, status) on public.friendships to authenticated;

-- invites: owner creates / reads / deletes. Redeeming goes through redeem_invite().
create policy invites_owner_select on public.invites
  for select to authenticated using (inviter_id = (select auth.uid()));
create policy invites_owner_insert on public.invites
  for insert to authenticated
  with check (inviter_id = (select auth.uid())
              and uses = 0
              and expires_at <= now() + interval '30 days');
create policy invites_owner_delete on public.invites
  for delete to authenticated using (inviter_id = (select auth.uid()));
revoke update on public.invites from anon, authenticated;

-- meal_entries: friends read meals that are shared AND from the owner's today.
create policy meal_entries_friends_select on public.meal_entries
  for select to authenticated
  using (is_shared
         and local_date = private.user_today(user_id)
         and private.are_friends((select auth.uid()), user_id));

-- meal_reactions: react if you can see the meal (RLS of meal_entries applies to
-- the subquery); meal owner and reactor can read.
create policy meal_reactions_select on public.meal_reactions
  for select to authenticated
  using (user_id = (select auth.uid())
         or exists (select 1 from public.meal_entries me
                    where me.id = meal_entry_id and me.user_id = (select auth.uid())));
create policy meal_reactions_insert on public.meal_reactions
  for insert to authenticated
  with check (user_id = (select auth.uid())
              and exists (select 1 from public.meal_entries me where me.id = meal_entry_id));
create policy meal_reactions_update on public.meal_reactions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid())
              and exists (select 1 from public.meal_entries me where me.id = meal_entry_id));
create policy meal_reactions_delete on public.meal_reactions
  for delete to authenticated using (user_id = (select auth.uid()));

-- duo_streaks: both members read only.
create policy duo_streaks_pair_select on public.duo_streaks
  for select to authenticated
  using ((select auth.uid()) in (user_a, user_b));
revoke insert, update, delete, truncate on public.duo_streaks from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public views (security definer by design: they expose only safe columns of
-- self + friends; write privileges are revoked so they can't be used to update).
-- ---------------------------------------------------------------------------
create view public.public_profiles with (security_barrier = true) as
select p.user_id, p.username::text as username, p.display_name, p."character", p.character_name
from public.profiles p
where p.user_id = (select auth.uid())
   or exists (
     select 1 from public.friendships f
     where f.status in ('pending', 'accepted')
       and ((f.requester_id = (select auth.uid()) and f.addressee_id = p.user_id)
         or (f.addressee_id = (select auth.uid()) and f.requester_id = p.user_id)));

create view public.public_coach_state with (security_barrier = true) as
select c.user_id, c.streak, c.aura_tier, c.mood
from public.coach_state c
where c.user_id = (select auth.uid())
   or private.are_friends((select auth.uid()), c.user_id);

revoke all on public.public_profiles, public.public_coach_state from anon, authenticated;
grant select on public.public_profiles, public.public_coach_state to authenticated;

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

-- Exact username lookup for "add friend" (no listing/enumeration).
create or replace function public.find_user_by_username(p_username text)
returns table (user_id uuid, username text, display_name text, "character" text, character_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.user_id, p.username::text, p.display_name, p."character", p.character_name
  from public.profiles p
  where (select auth.uid()) is not null
    and p.username = lower(trim(p_username))::extensions.citext
    and p.user_id <> (select auth.uid())
  limit 1;
$$;

-- Redeem an invite code: creates (or accepts) the friendship with the inviter.
create or replace function public.redeem_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid    uuid := auth.uid();
  v_invite public.invites%rowtype;
  v_friend public.friendships%rowtype;
  v_id     uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select * into v_invite from public.invites i where i.code = p_code for update;
  if not found or v_invite.expires_at < now() or v_invite.uses >= v_invite.max_uses then
    raise exception 'invite is invalid or expired' using errcode = 'P0002';
  end if;
  if v_invite.inviter_id = v_uid then
    raise exception 'cannot redeem your own invite' using errcode = 'P0001';
  end if;

  select * into v_friend from public.friendships f
  where least(f.requester_id, f.addressee_id) = least(v_uid, v_invite.inviter_id)
    and greatest(f.requester_id, f.addressee_id) = greatest(v_uid, v_invite.inviter_id)
  for update;

  if found then
    if v_friend.status = 'blocked' then
      raise exception 'cannot add this user' using errcode = 'P0001';
    end if;
    update public.friendships set status = 'accepted'
    where id = v_friend.id and status = 'pending';
    v_id := v_friend.id;
  else
    insert into public.friendships (requester_id, addressee_id, status, responded_at)
    values (v_invite.inviter_id, v_uid, 'accepted', now())
    returning id into v_id;
  end if;

  update public.invites set uses = uses + 1 where code = v_invite.code;
  return v_id;
end;
$$;

-- Start a duo streak with an accepted friend (no-op if one is already active).
create or replace function public.start_duo_streak(p_friend_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if not private.are_friends(v_uid, p_friend_id) then
    raise exception 'not friends' using errcode = 'P0001';
  end if;

  select d.id into v_id from public.duo_streaks d
  where d.user_a = least(v_uid, p_friend_id) and d.user_b = greatest(v_uid, p_friend_id)
    and d.status = 'active';
  if found then
    return v_id;
  end if;

  insert into public.duo_streaks (user_a, user_b)
  values (least(v_uid, p_friend_id), greatest(v_uid, p_friend_id))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.find_user_by_username(text) from public, anon;
revoke all on function public.redeem_invite(text) from public, anon;
revoke all on function public.start_duo_streak(uuid) from public, anon;
grant execute on function public.find_user_by_username(text) to authenticated;
grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.start_duo_streak(uuid) to authenticated;
