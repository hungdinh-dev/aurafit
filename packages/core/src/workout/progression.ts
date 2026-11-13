/**
 * WRK-05 / WRK-03 – between-session progression.
 * - `double`: when EVERY work set reaches the top of the rep range, add the smallest real load
 *   step; otherwise add reps (Plotkin et al. 2022, feature-backlog.md [9]).
 * - `linear` (5×5): add a step after a fully successful session; reset −10 % after 3 failed
 *   sessions in a row (classic linear-progression reset; deload on stall – Bell et al. 2023 [10]).
 * - `calisthenics_level`: 3 × 12 clean reps → move up one level (signature-features.md §8).
 * Thresholds always come from the exercise's own rep range, never hard-coded (workout.md).
 */
import { getExercise, requireExercise, nextProgressionExercise } from './catalog/exercises';
import type { LoadSpec } from './plates';
import { roundLoad, stepLoad, round2 } from './plates';

export type ProgressionRule = 'double' | 'linear' | 'calisthenics_level';

export interface Prescription {
  sets: number;
  repMin: number;
  repMax: number;
  targetRir?: number | null;
  targetLoadKg: number | null;
}

export interface PerformedSet {
  loadKg: number | null;
  reps: number;
  rir?: number | null;
  rpe?: number | null;
  isWarmup?: boolean;
}

export type ProgressionAction = 'increase_load' | 'add_reps' | 'hold' | 'decrease_load' | 'level_up' | 'deload';

export type ProgressionReason =
  | 'no_data'
  | 'all_sets_at_top'
  | 'all_sets_at_top_easy'
  | 'in_range'
  | 'below_range'
  | 'linear_success'
  | 'linear_fail'
  | 'stalled'
  | 'level_criteria_met'
  | 'top_of_chain';

export interface ProgressionDecision {
  action: ProgressionAction;
  /** Load for next session (`null` = bodyweight / unknown). */
  nextLoadKg: number | null;
  /** Rep goal per set for next session. */
  repTarget: number;
  /** Set when `action === 'level_up'`. */
  nextExerciseSlug: string | null;
  reason: ProgressionReason;
}

export interface ProgressionInput {
  rule: ProgressionRule;
  exerciseSlug: string;
  prescription: Prescription;
  /** Sets performed last session (warm-ups ignored). */
  sets: readonly PerformedSet[];
  loadSpec: LoadSpec;
  /** Consecutive previous sessions that failed / did not progress (for `linear` resets). */
  previousFailures?: number;
  /** Calisthenics criterion, default 3 × 12. */
  levelUpCriteria?: { sets: number; reps: number };
}

/** RPE → RIR (RIR = 10 − RPE, Zourdos et al. 2016 [4]). */
export function rirOf(set: { rir?: number | null; rpe?: number | null }): number | null {
  if (set.rir != null) return set.rir;
  if (set.rpe != null) return Math.max(0, 10 - set.rpe);
  return null;
}

/** Number of consecutive failed sessions after which linear progression resets. */
export const LINEAR_STALL_SESSIONS = 3;
export const RESET_FACTOR = 0.9;

function decreased(load: number, spec: LoadSpec): number | null {
  const target = roundLoad(load * RESET_FACTOR, spec, 'nearest');
  if (target === null) return null;
  return target < load ? target : stepLoad(load, spec, -1);
}

function lowerBody(slug: string): boolean {
  const p = getExercise(slug)?.movementPattern;
  return p === 'squat' || p === 'hinge' || p === 'lunge';
}

/** Decide next session's load / reps for one exercise. */
export function nextSessionTarget(input: ProgressionInput): ProgressionDecision {
  const { prescription: rx, loadSpec } = input;
  const work = input.sets.filter((s) => !s.isWarmup);
  const currentLoad =
    work.reduce<number | null>((max, s) => (s.loadKg != null && (max === null || s.loadKg > max) ? s.loadKg : max), null) ??
    rx.targetLoadKg;
  const hold = (reason: ProgressionReason, repTarget = rx.repMin): ProgressionDecision => ({
    action: 'hold',
    nextLoadKg: currentLoad,
    repTarget,
    nextExerciseSlug: null,
    reason,
  });
  if (work.length === 0) return hold('no_data');
  const enoughSets = work.length >= rx.sets;

  if (input.rule === 'calisthenics_level') {
    const crit = input.levelUpCriteria ?? { sets: 3, reps: 12 };
    const qualifying = work.filter((s) => s.reps >= crit.reps).length;
    if (qualifying >= crit.sets) {
      const next = nextProgressionExercise(input.exerciseSlug);
      if (next) {
        const nx = requireExercise(next);
        return { action: 'level_up', nextLoadKg: null, repTarget: nx.defaultRepMin, nextExerciseSlug: next, reason: 'level_criteria_met' };
      }
      // Top of the chain: keep the movement and start adding a small belt load.
      return {
        action: 'increase_load',
        nextLoadKg: round2((currentLoad ?? 0) + 2.5),
        repTarget: rx.repMin,
        nextExerciseSlug: null,
        reason: 'top_of_chain',
      };
    }
    const minReps = Math.min(...work.map((s) => s.reps));
    return { action: 'add_reps', nextLoadKg: currentLoad, repTarget: Math.min(crit.reps, minReps + 1), nextExerciseSlug: null, reason: 'in_range' };
  }

  if (input.rule === 'linear') {
    const success = enoughSets && work.every((s) => s.reps >= rx.repMax);
    if (success) {
      const steps = lowerBody(input.exerciseSlug) ? 2 : 1;
      const next = currentLoad === null ? null : stepLoad(currentLoad, loadSpec, 1, steps);
      return { action: 'increase_load', nextLoadKg: next, repTarget: rx.repMax, nextExerciseSlug: null, reason: 'linear_success' };
    }
    const failures = (input.previousFailures ?? 0) + 1;
    if (failures >= LINEAR_STALL_SESSIONS && currentLoad !== null) {
      return { action: 'deload', nextLoadKg: decreased(currentLoad, loadSpec), repTarget: rx.repMax, nextExerciseSlug: null, reason: 'stalled' };
    }
    return hold('linear_fail', rx.repMax);
  }

  // Double progression.
  const allTop = enoughSets && work.every((s) => s.reps >= rx.repMax);
  if (allTop) {
    if (currentLoad === null || loadSpec.kind === 'bodyweight') {
      const next = nextProgressionExercise(input.exerciseSlug);
      if (next) {
        return { action: 'level_up', nextLoadKg: null, repTarget: requireExercise(next).defaultRepMin, nextExerciseSlug: next, reason: 'level_criteria_met' };
      }
      return { action: 'add_reps', nextLoadKg: currentLoad, repTarget: rx.repMax + 1, nextExerciseSlug: null, reason: 'all_sets_at_top' };
    }
    const rirs = work.map(rirOf).filter((r): r is number => r !== null);
    const target = rx.targetRir ?? 2;
    const easy = rirs.length === work.length && rirs.reduce((a, b) => a + b, 0) / rirs.length >= target + 2;
    const next = stepLoad(currentLoad, loadSpec, 1, easy ? 2 : 1);
    return {
      action: 'increase_load',
      nextLoadKg: next,
      repTarget: rx.repMin,
      nextExerciseSlug: null,
      reason: easy ? 'all_sets_at_top_easy' : 'all_sets_at_top',
    };
  }
  const below = work.filter((s) => s.reps < rx.repMin).length;
  if (below > work.length / 2 && currentLoad !== null && loadSpec.kind !== 'bodyweight') {
    return { action: 'decrease_load', nextLoadKg: decreased(currentLoad, loadSpec), repTarget: rx.repMin, nextExerciseSlug: null, reason: 'below_range' };
  }
  const minReps = Math.min(...work.map((s) => s.reps));
  return {
    action: 'add_reps',
    nextLoadKg: currentLoad,
    repTarget: Math.min(rx.repMax, Math.max(rx.repMin, minReps + 1)),
    nextExerciseSlug: null,
    reason: 'in_range',
  };
}

/**
 * Stall detection (EXT-03 groundwork): true when the best performance score
 * (est. 1RM or load × reps) has not improved for `sessions` sessions in a row.
 */
export function isStalled(performanceBySession: readonly number[], sessions = LINEAR_STALL_SESSIONS): boolean {
  if (performanceBySession.length < sessions + 1) return false;
  const recent = performanceBySession.slice(-sessions);
  const before = Math.max(...performanceBySession.slice(0, -sessions));
  return recent.every((p) => p <= before);
}
