/**
 * WRK-13 / WRK-12 – weekly effective sets per muscle and per head, volume zones and map bands.
 * Defaults 10–20 effective sets / week / muscle, overreach flag at 25 (06-workout.md §4b;
 * dose–response: Schoenfeld 2017, Pelland 2026 – feature-backlog.md [1][2]).
 */
import { MUSCLES, MUSCLE_CODES, MUSCLE_HEAD_CODES } from './catalog/muscles';
import { getExercise } from './catalog/exercises';
import { headStimulus, muscleStimulus } from './stimulus';
import { rirOf } from './progression';
import type { ExperienceLevel, MuscleCode, MuscleHeadCode, SetLog } from './types';

/**
 * A set counts as "effective" when it is not a warm-up and not far from failure:
 * RIR ≤ 4 (or unknown). Sets ≥ 5 RIR give little stimulus (Refalo 2023; Robinson 2024 [6][7]).
 */
export const MAX_EFFECTIVE_RIR = 4;

export function isEffectiveSet(set: SetLog): boolean {
  if (set.isWarmup) return false;
  if (set.side === 'right') return false; // a left/right pair counts once (logged on the left row)
  const rir = rirOf(set);
  return rir === null || rir <= MAX_EFFECTIVE_RIR;
}

export interface WeeklyVolume {
  /** Number of effective sets logged (each set once). */
  effectiveSets: number;
  byMuscle: Record<MuscleCode, number>;
  byHead: Record<MuscleHeadCode, number>;
}

const zeroes = <K extends string>(keys: readonly K[]): Record<K, number> =>
  Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;

/** Sum effective sets for the given logs (caller passes one week, or use `range`). */
export function weeklyVolume(sets: readonly SetLog[], range?: { fromIso: string; toIso: string }): WeeklyVolume {
  const byMuscle = zeroes(MUSCLE_CODES);
  const byHead = zeroes(MUSCLE_HEAD_CODES);
  const from = range ? Date.parse(range.fromIso) : Number.NEGATIVE_INFINITY;
  const to = range ? Date.parse(range.toIso) : Number.POSITIVE_INFINITY;
  let effectiveSets = 0;
  for (const set of sets) {
    const t = Date.parse(set.completedAt);
    if (t < from || t >= to || !isEffectiveSet(set) || !getExercise(set.exerciseSlug)) continue;
    effectiveSets += 1;
    for (const [m, v] of muscleStimulus(set.exerciseSlug)) byMuscle[m] += v;
    for (const [h, v] of headStimulus(set.exerciseSlug)) byHead[h] += v;
  }
  const r = (n: number): number => Math.round(n * 10) / 10;
  for (const k of MUSCLE_CODES) byMuscle[k] = r(byMuscle[k]);
  for (const k of MUSCLE_HEAD_CODES) byHead[k] = r(byHead[k]);
  return { effectiveSets, byMuscle, byHead };
}

export type VolumeZone = 'below_stimulus' | 'effective' | 'overload_risk';
export type VolumeRecommendation = 'add_sets' | 'maintain' | 'monitor_recovery' | 'reduce_sets';

export interface VolumeTarget {
  setsMin: number;
  setsMax: number;
  overreachSets: number;
}

export function defaultVolumeTarget(muscle: MuscleCode): VolumeTarget {
  const m = MUSCLES[muscle];
  return { setsMin: m.defaultSetsMin, setsMax: m.defaultSetsMax, overreachSets: m.overreachSets };
}

export interface VolumeAssessment {
  muscle: MuscleCode;
  sets: number;
  zone: VolumeZone;
  recommendation: VolumeRecommendation;
  target: VolumeTarget;
}

/** Zone + recommendation code for one muscle (user targets from `muscle_volume_targets` win). */
export function assessVolume(muscle: MuscleCode, sets: number, target: Partial<VolumeTarget> = {}): VolumeAssessment {
  const t = { ...defaultVolumeTarget(muscle), ...target };
  const zone: VolumeZone = sets < t.setsMin ? 'below_stimulus' : sets <= t.setsMax ? 'effective' : 'overload_risk';
  const recommendation: VolumeRecommendation =
    zone === 'below_stimulus' ? 'add_sets' : zone === 'effective' ? 'maintain' : sets >= t.overreachSets ? 'reduce_sets' : 'monitor_recovery';
  return { muscle, sets, zone, recommendation, target: t };
}

export function assessWeek(
  volume: WeeklyVolume,
  targets: Partial<Record<MuscleCode, Partial<VolumeTarget>>> = {},
): VolumeAssessment[] {
  return MUSCLE_CODES.map((m) => assessVolume(m, volume.byMuscle[m], targets[m]));
}

/** Starting weekly set goal by level: beginners start at the low end (feature-backlog.md §6). */
export function startingWeeklySets(level: ExperienceLevel, muscle: MuscleCode = 'chest'): number {
  const t = defaultVolumeTarget(muscle);
  const goal = level === 'beginner' ? t.setsMin : level === 'intermediate' ? 14 : 18;
  return Math.min(t.setsMax, Math.max(t.setsMin, goal));
}

/** WRK-12 "weekly volume" map band per head: blue < 6 · green 6–11 · yellow 12–17 · orange ≥ 18. */
export type VolumeMapBand = 'low' | 'moderate' | 'high' | 'very_high';
export function volumeMapBand(sets: number): VolumeMapBand {
  if (sets < 6) return 'low';
  if (sets < 12) return 'moderate';
  if (sets < 18) return 'high';
  return 'very_high';
}

/** Summary line under the map: total sets, highest and lowest head (WRK-12). */
export function volumeSummary(volume: WeeklyVolume): {
  totalSets: number;
  highest: { head: MuscleHeadCode; sets: number };
  lowest: { head: MuscleHeadCode; sets: number };
} {
  const entries = MUSCLE_HEAD_CODES.map((head) => ({ head, sets: volume.byHead[head] }));
  const sorted = [...entries].sort((a, b) => b.sets - a.sets);
  return { totalSets: volume.effectiveSets, highest: sorted[0] as { head: MuscleHeadCode; sets: number }, lowest: sorted[sorted.length - 1] as { head: MuscleHeadCode; sets: number } };
}
