/**
 * Recovery & weekly volume state (WRK-10 … WRK-13), computed on the device with `@aurafit/core`
 * from the last 7–8 days of logged sets (server sets, or preview sets on this device).
 */
import { time, workout } from '@aurafit/core';
import { useEffect, useMemo, useState } from 'react';

import { todayLocal, useTrainingSets } from '@/features/workout/api';

/** Current time, refreshed every minute (recovery decays continuously). */
export function useNowIso(): string {
  const [now, setNow] = useState(() => new Date().toISOString());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date().toISOString()), 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function useRecovery() {
  const { sets, isLoading, isError, refetch } = useTrainingSets(8);
  const nowIso = useNowIso();
  const state = useMemo(() => {
    const heads = workout.computeHeadRecovery(sets, nowIso);
    const muscles = workout.computeMuscleRecovery(heads);
    return {
      heads,
      muscles,
      mostFatigued: workout.mostFatigued(muscles),
      readyGroups: workout.readyGroups(muscles),
    };
  }, [sets, nowIso]);
  return { ...state, sets, nowIso, isLoading, isError, refetch };
}

/** Local Monday 00:00 → next Monday 00:00 of the current week, as ISO instants. */
export function currentWeekRange(today: string = todayLocal()): { from: string; to: string; fromIso: string; toIso: string } {
  const from = time.startOfWeek(today);
  const to = time.addDays(from, 7);
  const at = (d: string) => {
    const [y, m, day] = d.split('-').map(Number) as [number, number, number];
    return new Date(y, m - 1, day).toISOString();
  };
  return { from, to: time.addDays(from, 6), fromIso: at(from), toIso: at(to) };
}

export function useWeeklyVolume() {
  const { sets, isLoading, isError, refetch } = useTrainingSets(8);
  const range = currentWeekRange();
  const volume = useMemo(
    () => workout.weeklyVolume(sets, { fromIso: range.fromIso, toIso: range.toIso }),
    [sets, range.fromIso, range.toIso]
  );
  return { volume, range, isLoading, isError, refetch };
}

/** WRK-12 volume band colours (data colours from the MuscleMap mockup). */
export const VOLUME_COLORS: Readonly<Record<workout.VolumeMapBand, string>> = {
  low: '#2F6BFF',
  moderate: '#2ECC52',
  high: '#E3E04A',
  very_high: '#FF6A1A',
};

/** WRK-13 zone colours (VolumeZones mockup). */
export const ZONE_COLORS: Readonly<Record<workout.VolumeZone, string>> = {
  below_stimulus: '#5AB0FF',
  effective: '#4BE3A7',
  overload_risk: '#FF9F0A',
};
