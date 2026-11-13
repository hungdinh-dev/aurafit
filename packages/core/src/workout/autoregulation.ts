/**
 * WRK-05 / WRK-14 – in-session autoregulation from reps and optional RIR / RPE.
 * Thresholds come from the exercise's own rep range (never hard-coded). When RIR is logged it
 * is used: reps-to-failure = reps + RIR feeds an Epley estimate (RIR-based RPE, Helms et al.
 * 2016 / Zourdos et al. 2016 – feature-backlog.md [4][5]) and the next load is solved for the
 * middle of the rep range at the target RIR, rounded to a real load step.
 */
import { epley, loadForReps } from './oneRm';
import type { LoadSpec } from './plates';
import { round2, roundLoad, stepLoad } from './plates';
import { rirOf } from './progression';

export type AutoregAction = 'increase' | 'hold' | 'decrease';
export type AutoregReason =
  | 'reps_above_range'
  | 'reps_below_range'
  | 'rir_above_target'
  | 'rir_below_target'
  | 'on_target';

export interface AutoregInput {
  set: { loadKg: number | null; reps: number; rir?: number | null; rpe?: number | null };
  repMin: number;
  repMax: number;
  /** Default 2 (RIR 1–3 for most sets, feature-backlog.md §6 [6][7]). */
  targetRir?: number | null;
  loadSpec: LoadSpec;
  /** Last set of the exercise → the suggestion applies to next session. */
  isLastSet?: boolean;
}

export interface AutoregSuggestion {
  action: AutoregAction;
  /** `null` when the load cannot be expressed (bodyweight → app offers belt / band / variation). */
  suggestedLoadKg: number | null;
  scope: 'next_set' | 'next_session';
  reason: AutoregReason;
  estimatedOneRmKg: number | null;
  rir: number | null;
}

export const DEFAULT_TARGET_RIR = 2;
/** RIR deviation (in reps) tolerated before changing the load. */
export const RIR_TOLERANCE = 1;

export function autoregulate(input: AutoregInput): AutoregSuggestion {
  const { set, repMin, repMax, loadSpec } = input;
  const targetRir = input.targetRir ?? DEFAULT_TARGET_RIR;
  const rir = rirOf(set);
  const scope = input.isLastSet ? 'next_session' : 'next_set';

  let action: AutoregAction = 'hold';
  let reason: AutoregReason = 'on_target';
  if (set.reps < repMin) {
    action = 'decrease';
    reason = 'reps_below_range';
  } else if (set.reps > repMax) {
    action = 'increase';
    reason = 'reps_above_range';
  } else if (rir !== null && rir > targetRir + RIR_TOLERANCE) {
    action = 'increase';
    reason = 'rir_above_target';
  } else if (rir !== null && rir < targetRir - RIR_TOLERANCE) {
    action = 'decrease';
    reason = 'rir_below_target';
  }

  const load = set.loadKg;
  // Without RIR, out-of-range sets are assumed taken to (near) failure – the conservative choice.
  const toFailure = set.reps + (rir ?? 0);
  const e1rm = load != null && load > 0 && toFailure > 0 ? epley(load, toFailure) : null;
  const base = { scope, reason, rir, estimatedOneRmKg: e1rm === null ? null : round2(e1rm) } as const;

  if (action === 'hold' || load == null || load <= 0 || e1rm === null || loadSpec.kind === 'bodyweight') {
    return { ...base, action, suggestedLoadKg: action === 'hold' ? load : null };
  }
  const midReps = Math.round((repMin + repMax) / 2);
  const ideal = loadForReps(e1rm, midReps, targetRir);
  let suggested = roundLoad(ideal, loadSpec, 'nearest');
  if (action === 'increase' && (suggested === null || suggested <= load)) suggested = stepLoad(load, loadSpec, 1);
  if (action === 'decrease' && (suggested === null || suggested >= load)) suggested = stepLoad(load, loadSpec, -1);
  return { ...base, action, suggestedLoadKg: suggested };
}
