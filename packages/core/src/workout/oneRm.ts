/**
 * WRK-07 – estimated 1RM and personal records.
 * Only sets with ≤ 10 reps are used: rep-max equations lose accuracy at higher reps
 * (LeSuer et al. 1997, feature-backlog.md [18]; EXT-09).
 */
import type { SetLog } from './types';
import { round2 } from './plates';

export type OneRmFormula = 'epley' | 'brzycki' | 'average';
export const MAX_REPS_FOR_1RM = 10;

/** Epley: w × (1 + r / 30). One rep returns the load itself. */
export function epley(loadKg: number, reps: number): number {
  return reps === 1 ? loadKg : loadKg * (1 + reps / 30);
}

/** Brzycki: w × 36 / (37 − r). */
export function brzycki(loadKg: number, reps: number): number {
  return loadKg * (36 / (37 - reps));
}

/**
 * Estimated 1RM from a load × reps pair, or `null` when the set is not eligible
 * (reps outside 1–10, non-positive load).
 */
export function estimateOneRm(loadKg: number, reps: number, formula: OneRmFormula = 'epley'): number | null {
  if (!(loadKg > 0) || !Number.isInteger(reps) || reps < 1 || reps > MAX_REPS_FOR_1RM) return null;
  const value =
    formula === 'epley'
      ? epley(loadKg, reps)
      : formula === 'brzycki'
        ? brzycki(loadKg, reps)
        : (epley(loadKg, reps) + brzycki(loadKg, reps)) / 2;
  return round2(value);
}

/**
 * Load that should allow `reps` with `rir` reps in reserve, from a 1RM (inverse Epley on
 * reps-to-failure = reps + RIR, the RIR-based approach of Helms et al. 2016 [5]).
 */
export function loadForReps(oneRmKg: number, reps: number, rir = 0): number {
  const toFailure = Math.max(1, reps + rir);
  return toFailure === 1 ? oneRmKg : oneRmKg / (1 + toFailure / 30);
}

/** Total load of a set: external load + added load (belt). Bodyweight handled by `specialLoad`. */
function setLoad(set: SetLog, bodyweightKg?: number): number {
  return (set.loadKg ?? 0) + (set.addedLoadKg ?? 0) + (bodyweightKg ?? 0);
}

/** Best estimated 1RM over eligible (non-warmup, ≤ 10 reps) sets. */
export function bestEstimatedOneRm(
  sets: readonly SetLog[],
  opts: { formula?: OneRmFormula; bodyweightKg?: number } = {},
): { oneRmKg: number; set: SetLog } | null {
  let best: { oneRmKg: number; set: SetLog } | null = null;
  for (const set of sets) {
    if (set.isWarmup || set.reps == null) continue;
    const est = estimateOneRm(setLoad(set, opts.bodyweightKg), set.reps, opts.formula);
    if (est !== null && (!best || est > best.oneRmKg)) best = { oneRmKg: est, set };
  }
  return best;
}

export type PersonalRecordKind = 'max_load' | 'est_1rm' | 'max_reps' | 'max_time';

/** Previous bests for one exercise (`personal_records`, per kind). */
export type PersonalBests = Partial<Record<PersonalRecordKind, number>>;

export interface PersonalRecordHit {
  kind: PersonalRecordKind;
  value: number;
  previous: number | null;
  set: SetLog;
}

/**
 * New PRs set by today's sets of ONE exercise compared to previous bests.
 * A first-ever value counts as a PR only when `countFirstAsPr` (default false – avoids
 * celebrating the very first session).
 */
export function detectPersonalRecords(
  sets: readonly SetLog[],
  previous: PersonalBests,
  opts: { formula?: OneRmFormula; countFirstAsPr?: boolean; bodyweightKg?: number } = {},
): PersonalRecordHit[] {
  const candidates: Partial<Record<PersonalRecordKind, { value: number; set: SetLog }>> = {};
  const consider = (kind: PersonalRecordKind, value: number | null, set: SetLog): void => {
    if (value === null || !(value > 0)) return;
    const cur = candidates[kind];
    if (!cur || value > cur.value) candidates[kind] = { value, set };
  };
  for (const set of sets) {
    if (set.isWarmup) continue;
    const load = setLoad(set, opts.bodyweightKg);
    if (set.reps != null && set.reps > 0) {
      if (load > 0) consider('max_load', round2(load), set);
      consider('est_1rm', estimateOneRm(load, set.reps, opts.formula), set);
      consider('max_reps', set.reps, set);
    }
    if (set.durationSec != null) consider('max_time', set.durationSec, set);
  }
  const hits: PersonalRecordHit[] = [];
  for (const kind of ['max_load', 'est_1rm', 'max_reps', 'max_time'] as const) {
    const c = candidates[kind];
    if (!c) continue;
    const prev = previous[kind];
    if (prev === undefined ? opts.countFirstAsPr === true : c.value > prev) {
      hits.push({ kind, value: c.value, previous: prev ?? null, set: c.set });
    }
  }
  return hits;
}
