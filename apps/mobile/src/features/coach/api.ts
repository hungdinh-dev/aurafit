import type { Tables, TablesUpdate } from '@aurafit/db';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { assertSupabase, isSupabaseConfigured, supabase } from '@/lib/supabase';

export type CoachSettings = Tables<'coach_settings'>;
export type CoachState = Tables<'coach_state'>;
export type DailyScore = Tables<'daily_scores'>;
export type QuestRow = Tables<'quests'>;
export type BossBattleRow = Tables<'boss_battles'>;

/** Columns a client may update (column grants in the profile migration). */
export type CoachSettingsPatch = Pick<
  TablesUpdate<'coach_settings'>,
  'strictness' | 'voice' | 'free_days_per_week' | 'free_day_mode' | 'quiet_start' | 'quiet_end' | 'work_start' | 'work_end'
>;

export const coachKeys = {
  all: ['coach'] as const,
  settings: (uid: string) => ['coach', 'settings', uid] as const,
  state: (uid: string) => ['coach', 'state', uid] as const,
  score: (uid: string, day: string) => ['coach', 'score', uid, day] as const,
  quests: (uid: string, day: string) => ['coach', 'quests', uid, day] as const,
  boss: (uid: string, weekStart: string) => ['coach', 'boss', uid, weekStart] as const,
};

/** `coach_settings` (strictness, voice, free days, quiet/work hours). `null` without account. */
export function useCoachSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: coachKeys.settings(user?.id ?? 'anonymous'),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<CoachSettings | null> => {
      assertSupabase();
      const { data, error } = await supabase.from('coach_settings').select('*').eq('user_id', user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Thrown when the DB guard refuses a second strictness change within 7 days. */
export class StrictnessLockedError extends Error {
  constructor() {
    super('strictness_locked');
    this.name = 'StrictnessLockedError';
  }
}

export function useUpdateCoachSettings() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: CoachSettingsPatch) => {
      assertSupabase();
      if (!user) throw new Error('not_signed_in');
      const { error } = await supabase.from('coach_settings').update(patch).eq('user_id', user.id);
      if (error) {
        if (error.code === 'P0001' && /strictness/i.test(error.message)) throw new StrictnessLockedError();
        throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: coachKeys.all }),
  });
}

/** Server-written streak / shields / XP / aura / mood (read-only for the app). */
export function useCoachState() {
  const { user } = useAuth();
  return useQuery({
    queryKey: coachKeys.state(user?.id ?? 'anonymous'),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<CoachState | null> => {
      assertSupabase();
      const { data, error } = await supabase.from('coach_state').select('*').eq('user_id', user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Closed score of a day (written by close-day at 03:00 next day). */
export function useDailyScore(day: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: coachKeys.score(user?.id ?? 'anonymous', day),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<DailyScore | null> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('daily_scores')
        .select('*')
        .eq('user_id', user!.id)
        .eq('local_date', day)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Today's coach quests (generated and checked by the server). */
export function useQuests(day: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: coachKeys.quests(user?.id ?? 'anonymous', day),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<QuestRow[]> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', user!.id)
        .eq('local_date', day)
        .order('xp_reward', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** This week's boss (Monday `week_start`). */
export function useBossBattle(weekStart: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: coachKeys.boss(user?.id ?? 'anonymous', weekStart),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<BossBattleRow | null> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('boss_battles')
        .select('*')
        .eq('user_id', user!.id)
        .eq('week_start', weekStart)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
