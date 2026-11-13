/**
 * Friends (FRD-01 / FRD-02 / FRD-03): friendships, invites, duo streaks, friends' shared meals and
 * reactions. Duo streaks are server-written (read + start RPC only).
 */
import type { Tables } from '@aurafit/db';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { useAuth } from '@/lib/auth';
import { assertSupabase, isSupabaseConfigured, supabase } from '@/lib/supabase';

export const REACTIONS = ['fire', 'clap', 'heart', 'drool', 'strong'] as const;
export type Reaction = (typeof REACTIONS)[number];

export interface FriendView {
  userId: string;
  username: string | null;
  name: string;
  streak: number | null;
  auraTier: string | null;
  friendshipId: string;
}

export interface FriendsData {
  friends: FriendView[];
  incoming: FriendView[];
  outgoing: FriendView[];
  duos: Tables<'duo_streaks'>[];
}

export function useFriends() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['friends', 'list', user?.id ?? 'anonymous'],
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<FriendsData> => {
      assertSupabase();
      const me = user!.id;
      const [ships, profiles, coach, duos] = await Promise.all([
        supabase.from('friendships').select('*'),
        supabase.from('public_profiles').select('*'),
        supabase.from('public_coach_state').select('*'),
        supabase.from('duo_streaks').select('*').eq('status', 'active'),
      ]);
      if (ships.error) throw ships.error;
      if (profiles.error) throw profiles.error;
      if (coach.error) throw coach.error;
      if (duos.error) throw duos.error;
      const profileOf = new Map(profiles.data.map((p) => [p.user_id, p]));
      const coachOf = new Map(coach.data.map((c) => [c.user_id, c]));
      const view = (f: Tables<'friendships'>): FriendView => {
        const other = f.requester_id === me ? f.addressee_id : f.requester_id;
        const p = profileOf.get(other);
        const c = coachOf.get(other);
        return {
          userId: other,
          username: p?.username ?? null,
          name: p?.character_name ?? p?.display_name ?? p?.username ?? '—',
          streak: c?.streak ?? null,
          auraTier: c?.aura_tier ?? null,
          friendshipId: f.id,
        };
      };
      return {
        friends: ships.data.filter((f) => f.status === 'accepted').map(view),
        incoming: ships.data.filter((f) => f.status === 'pending' && f.addressee_id === me).map(view),
        outgoing: ships.data.filter((f) => f.status === 'pending' && f.requester_id === me).map(view),
        duos: duos.data,
      };
    },
  });
}

const invalidate = (qc: ReturnType<typeof useQueryClient>) => qc.invalidateQueries({ queryKey: ['friends'] });

export const usernameSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/^@/, '').toLowerCase())
  .pipe(z.string().regex(/^[a-z0-9._]{3,30}$/));

/** Add by exact username → pending request. Returns `null` when the user does not exist. */
export function useAddFriend() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (raw: string): Promise<string | null> => {
      assertSupabase();
      const username = usernameSchema.parse(raw);
      const { data, error } = await supabase.rpc('find_user_by_username', { p_username: username });
      if (error) throw error;
      const target = data[0];
      if (!target) return null;
      const { error: insErr } = await supabase
        .from('friendships')
        .insert({ requester_id: user!.id, addressee_id: target.user_id, status: 'pending' });
      if (insErr) throw insErr;
      return target.username;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useRespondRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ friendshipId, accept }: { friendshipId: string; accept: boolean }) => {
      assertSupabase();
      const { error } = accept
        ? await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
        : await supabase.from('friendships').delete().eq('id', friendshipId);
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
}

/** Latest valid invite of mine, or a new one (7 days, 5 uses – DB defaults). */
export function useInvite() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['friends', 'invite', user?.id ?? 'anonymous'],
    enabled: !!user && isSupabaseConfigured,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<string> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('invites')
        .select('code, uses, max_uses, expires_at')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      const usable = data.find((i) => i.uses < i.max_uses);
      if (usable) return usable.code;
      const { data: created, error: cErr } = await supabase
        .from('invites')
        .insert({ inviter_id: user!.id })
        .select('code')
        .single();
      if (cErr) throw cErr;
      return created.code;
    },
  });
}

export function inviteLink(code: string): string {
  return `aurafit://invite/${code}`;
}

export function useRedeemInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      assertSupabase();
      const clean = z.string().trim().regex(/^[A-Za-z0-9]{10}$/).parse(code);
      const { error } = await supabase.rpc('redeem_invite', { p_code: clean });
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useStartDuo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (friendId: string) => {
      assertSupabase();
      const { error } = await supabase.rpc('start_duo_streak', { p_friend_id: friendId });
      if (error) throw error;
    },
    onSuccess: () => invalidate(qc),
  });
}

export interface StoryMeal {
  id: string;
  slot: string;
  eatenAt: string;
  kcal: number | null;
  proteinG: number | null;
  items: string[];
  myReaction: Reaction | null;
}

/** Friend's meals shared today (RLS returns only shared + today) with my reaction. */
export function useFriendStory(friendId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['friends', 'story', user?.id ?? 'anonymous', friendId ?? ''],
    enabled: !!user && isSupabaseConfigured && !!friendId,
    queryFn: async (): Promise<StoryMeal[]> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('meal_entries')
        .select('id, meal_slot, eaten_at, meal_items(name, kcal, protein_g), meal_reactions(user_id, reaction)')
        .eq('user_id', friendId!)
        .eq('is_shared', true)
        .order('eaten_at');
      if (error) throw error;
      return data.map((m) => {
        const items = m.meal_items;
        const mine = m.meal_reactions.find((r) => r.user_id === user!.id)?.reaction;
        return {
          id: m.id,
          slot: m.meal_slot,
          eatenAt: m.eaten_at,
          kcal: items.length ? items.reduce((s, i) => s + Number(i.kcal), 0) : null,
          proteinG: items.length ? items.reduce((s, i) => s + Number(i.protein_g), 0) : null,
          items: items.map((i) => i.name),
          myReaction: (REACTIONS as readonly string[]).includes(mine ?? '') ? (mine as Reaction) : null,
        };
      });
    },
  });
}

export function useReact() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ mealId, reaction }: { mealId: string; reaction: Reaction }) => {
      assertSupabase();
      const { error } = await supabase
        .from('meal_reactions')
        .upsert({ meal_entry_id: mealId, user_id: user!.id, reaction }, { onConflict: 'meal_entry_id,user_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friends', 'story'] }),
  });
}
