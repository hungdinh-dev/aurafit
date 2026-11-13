import { health, time } from '@aurafit/core';
import type { Tables } from '@aurafit/db';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { localToday } from '@/features/coach/lib/clock';
import { isRecord } from '@/features/coach/lib/json';
import { useAuth } from '@/lib/auth';
import { deviceTimeZone } from '@/lib/locale';
import { assertSupabase, isSupabaseConfigured, supabase } from '@/lib/supabase';

export type HealthSampleRow = Tables<'health_samples'>;
export type DailySummaryRow = Tables<'daily_summaries'>;

export const healthKeys = {
  all: ['health'] as const,
  weighIns: (uid: string, from: string) => ['health', 'weigh-ins', uid, from] as const,
  water: (uid: string, day: string) => ['health', 'water', uid, day] as const,
  sleep: (uid: string, day: string) => ['health', 'sleep', uid, day] as const,
  summaries: (uid: string, start: string, end: string) => ['health', 'summaries', uid, start, end] as const,
};

/** Weigh-ins of the last `days` days (oldest first) for the trend (HLT-02). */
export function useWeighIns(days = 90) {
  const { user } = useAuth();
  const from = time.addDays(localToday(), -(days - 1));
  return useQuery({
    queryKey: healthKeys.weighIns(user?.id ?? 'anonymous', from),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<health.WeighIn[]> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('health_samples')
        .select('local_date, value, start_at')
        .eq('user_id', user!.id)
        .eq('type', 'weight')
        .gte('local_date', from)
        .order('start_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({ date: r.local_date, weightKg: Number(r.value) }));
    },
  });
}

async function insertManualSample(input: {
  userId: string;
  type: 'weight' | 'water' | 'sleep_session';
  unit: 'kg' | 'ml' | 'min';
  value: number;
  startAt: Date;
  endAt?: Date | null;
  localDate?: string;
  metadata?: Record<string, number | string | null>;
}) {
  assertSupabase();
  const { error } = await supabase.from('health_samples').insert({
    user_id: input.userId,
    type: input.type,
    unit: input.unit,
    value: input.value,
    source: 'manual',
    start_at: input.startAt.toISOString(),
    end_at: input.endAt ? input.endAt.toISOString() : null,
    local_date: input.localDate ?? time.localDate(input.startAt, deviceTimeZone()),
    metadata: input.metadata ?? {},
  });
  if (error) throw error;
}

export function useLogWeight() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (weightKg: number) => {
      if (!user) throw new Error('not_signed_in');
      await insertManualSample({ userId: user.id, type: 'weight', unit: 'kg', value: Math.round(weightKg * 10) / 10, startAt: new Date() });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: healthKeys.all }),
  });
}

/** ml of water logged today (HLT-01). */
export function useWaterToday(day: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: healthKeys.water(user?.id ?? 'anonymous', day),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<number> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('health_samples')
        .select('value')
        .eq('user_id', user!.id)
        .eq('type', 'water')
        .eq('local_date', day);
      if (error) throw error;
      return (data ?? []).reduce((s, r) => s + Number(r.value), 0);
    },
  });
}

/** 1-tap water with optimistic update. */
export function useAddWater(day: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = healthKeys.water(user?.id ?? 'anonymous', day);
  return useMutation({
    mutationFn: async (ml: number) => {
      if (!user) throw new Error('not_signed_in');
      await insertManualSample({ userId: user.id, type: 'water', unit: 'ml', value: ml, startAt: new Date(), localDate: day });
    },
    onMutate: async (ml) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<number>(key);
      qc.setQueryData<number>(key, (previous ?? 0) + ml);
      return { previous };
    },
    onError: (_e, _ml, ctx) => qc.setQueryData(key, ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export type SleepEntry = { durationMin: number; bedAt: string | null; wakeAt: string | null; quality: number | null };

/** Sleep session ending on `day` (sleep belongs to the wake date). Device data wins over manual. */
export function useSleepFor(day: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: healthKeys.sleep(user?.id ?? 'anonymous', day),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<SleepEntry | null> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('health_samples')
        .select('value, start_at, end_at, source, metadata, created_at')
        .eq('user_id', user!.id)
        .eq('type', 'sleep_session')
        .eq('local_date', day)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []).slice().sort(
        (a, b) =>
          health.sourceRank('sleep_session', a.source as health.HealthSource) -
          health.sourceRank('sleep_session', b.source as health.HealthSource),
      );
      const top = rows[0];
      if (!top) return null;
      const quality = isRecord(top.metadata) && typeof top.metadata.quality === 'number' ? top.metadata.quality : null;
      return { durationMin: Number(top.value), bedAt: top.start_at, wakeAt: top.end_at, quality };
    },
  });
}

/** Manual sleep entry from clock times (HLT-04). */
export function useLogSleep() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { day: string; bedMin: number; wakeMin: number; quality: number | null }) => {
      if (!user) throw new Error('not_signed_in');
      const tz = deviceTimeZone();
      const duration = health.sleepDurationFromClock(input.bedMin, input.wakeMin);
      const wakeAt = time.zonedTimeToUtc(input.day, time.formatTimeOfDay(input.wakeMin), tz);
      const bedAt = new Date(wakeAt.getTime() - duration * 60_000);
      await insertManualSample({
        userId: user.id,
        type: 'sleep_session',
        unit: 'min',
        value: duration,
        startAt: bedAt,
        endAt: wakeAt,
        localDate: input.day,
        metadata: { quality: input.quality },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: healthKeys.all }),
  });
}

/** Server daily summaries (steps, sleep, kcal…) for a date range. */
export function useDailySummaries(start: string, end: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: healthKeys.summaries(user?.id ?? 'anonymous', start, end),
    enabled: !!user && isSupabaseConfigured,
    queryFn: async (): Promise<DailySummaryRow[]> => {
      assertSupabase();
      const { data, error } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', user!.id)
        .gte('local_date', start)
        .lte('local_date', end)
        .order('local_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
