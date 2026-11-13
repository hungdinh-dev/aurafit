/**
 * Progress & Me data (PRG-02/03/04, COA display): summaries, daily scores, coach state, stats and
 * the weekly boss. All of these are server-written – the app only reads them.
 */
import { time } from '@aurafit/core';
import type { Tables } from '@aurafit/db';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth';
import { assertSupabase, isSupabaseConfigured, supabase } from '@/lib/supabase';

import type { Metric, Range, ScoreRow } from './chart';

const n = (v: number | string | null | undefined): number | null =>
  v === null || v === undefined ? null : Number(v);

export interface SeriesPoint {
  key: string;
  value: number | null;
  target: number | null;
}

const DAILY_FIELD: Record<Metric, keyof Tables<'daily_summaries'>> = {
  kcal: 'kcal_in',
  protein: 'protein_g',
  water: 'water_ml',
  sleep: 'sleep_min',
  weight: 'weight_kg',
};
const VIEW_FIELD = {
  kcal: 'avg_kcal_in',
  protein: 'avg_protein_g',
  water: 'avg_water_ml',
  sleep: 'avg_sleep_min',
  weight: 'avg_weight_kg',
} as const;

/** Bars for a range: day = last 14 daily rows; week / month / year = summary views. */
export function useSeries(range: Range, metric: Metric, today: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['progress', 'series', user?.id ?? 'anonymous', range, metric, today],
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<SeriesPoint[]> => {
      assertSupabase();
      if (range === 'day') {
        const from = time.addDays(today, -13);
        const { data, error } = await supabase
          .from('daily_summaries')
          .select('*')
          .gte('local_date', from)
          .lte('local_date', today)
          .order('local_date');
        if (error) throw error;
        const byDate = new Map(data.map((r) => [r.local_date, r]));
        return time.datesBetween(from, today).map((d) => {
          const r = byDate.get(d);
          return { key: d, value: r ? n(r[DAILY_FIELD[metric]] as number | null) : null, target: r?.kcal_target ?? null };
        });
      }
      const view = range === 'week' ? 'weekly_summaries' : range === 'month' ? 'monthly_summaries' : 'yearly_summaries';
      const count = range === 'week' ? 8 : range === 'month' ? 12 : 5;
      const { data, error } = await supabase
        .from(view)
        .select('*')
        .order('period_start', { ascending: false })
        .limit(count);
      if (error) throw error;
      return data
        .filter((r) => r.period_start !== null)
        .reverse()
        .map((r) => ({ key: r.period_start as string, value: n(r[VIEW_FIELD[metric]]), target: null }));
    },
  });
}

/** Closed days (score, result) since `from`. */
export function useDailyScores(from: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['progress', 'scores', user?.id ?? 'anonymous', from],
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<ScoreRow[]> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('daily_scores')
        .select('local_date, total, result')
        .gte('local_date', from)
        .order('local_date');
      if (error) throw error;
      return data.map((r) => ({ localDate: r.local_date, total: r.total, result: r.result }));
    },
  });
}

export type CoachState = Pick<
  Tables<'coach_state'>,
  'xp' | 'level' | 'streak' | 'best_streak' | 'shields' | 'aura_score' | 'aura_tier' | 'mood'
>;

export function useCoachState() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['progress', 'coachState', user?.id ?? 'anonymous'],
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<CoachState | null> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('coach_state')
        .select('xp, level, streak, best_streak, shields, aura_score, aura_tier, mood')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Latest value of each hard stat (30-day window, server snapshots). */
export function useHardStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['progress', 'stats', user?.id ?? 'anonymous'],
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<Record<string, number>> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('stat_snapshots')
        .select('local_date, stat, value')
        .order('local_date', { ascending: false })
        .limit(64);
      if (error) throw error;
      const out: Record<string, number> = {};
      for (const r of data) if (out[r.stat] === undefined) out[r.stat] = Number(r.value);
      return out;
    },
  });
}

export interface BossInfo {
  bossCode: string;
  hits: number;
  hitsRequired: number;
  won: boolean;
}

export function useWeeklyBoss(today: string) {
  const { user } = useAuth();
  const weekStart = time.startOfWeek(today);
  return useQuery({
    queryKey: ['progress', 'boss', user?.id ?? 'anonymous', weekStart],
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<BossInfo | null> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('boss_battles')
        .select('boss_code, hits, hits_required, won_at')
        .eq('week_start', weekStart)
        .maybeSingle();
      if (error) throw error;
      return data
        ? { bossCode: data.boss_code, hits: data.hits, hitsRequired: data.hits_required, won: !!data.won_at }
        : null;
    },
  });
}

export function useDisplayName() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['progress', 'name', user?.id ?? 'anonymous'],
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<string | null> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, character_name, username')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.character_name ?? data?.display_name ?? data?.username ?? null;
    },
  });
}
