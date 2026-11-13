/**
 * WRK-19 – special loads: weight belt (added load), bands (assist or resist), per-side reps.
 */
import { round2 } from './plates';

/**
 * Share of bodyweight moved in some bodyweight exercises. Push-up ≈ 64 % in the top
 * position (Ebben et al., J Strength Cond Res 2011). Hanging / support moves ≈ 100 %.
 * Exercises not listed default to 1.0 (consistent tracking matters more than precision).
 */
export const BODYWEIGHT_FRACTION: Readonly<Record<string, number>> = {
  push_up: 0.64,
  diamond_push_up: 0.64,
  pull_up: 1,
  chin_up: 1,
  chest_dip: 1,
};

export interface BandUse {
  color: string;
  /** `inventory.bands[].kg_equiv`. */
  kgEquiv: number;
}

export interface SpecialLoadInput {
  exerciseSlug?: string;
  bodyweightKg: number;
  /** Belt / vest / dumbbell between feet (`set_logs.added_load_kg`). */
  addedLoadKg?: number | null;
  bands?: readonly BandUse[];
  /** `assist` (band under knee for pull-ups → subtract) or `resist` (band over back → add). */
  bandMode?: 'assist' | 'resist';
  /** Override the bodyweight fraction. */
  bodyweightFraction?: number;
}

export interface SpecialLoadResult {
  totalLoadKg: number;
  bodyweightPartKg: number;
  addedLoadKg: number;
  bandKg: number;
}

/** Total effective load = bodyweight share + added load ± bands (never below 0). */
export function effectiveLoad(input: SpecialLoadInput): SpecialLoadResult {
  const fraction =
    input.bodyweightFraction ?? (input.exerciseSlug ? BODYWEIGHT_FRACTION[input.exerciseSlug] : undefined) ?? 1;
  const bodyweightPartKg = input.bodyweightKg * fraction;
  const addedLoadKg = input.addedLoadKg ?? 0;
  const bandTotal = (input.bands ?? []).reduce((sum, b) => sum + b.kgEquiv, 0);
  const bandKg = input.bandMode === 'resist' ? bandTotal : -bandTotal;
  const total = Math.max(0, bodyweightPartKg + addedLoadKg + bandKg);
  return {
    totalLoadKg: round2(total),
    bodyweightPartKg: round2(bodyweightPartKg),
    addedLoadKg: round2(addedLoadKg),
    bandKg: round2(bandKg),
  };
}

/**
 * Imbalance flag threshold: a limb-symmetry index below 90 % (> 10 % difference) is the
 * common practical cut-off in strength & rehab testing.
 */
export const IMBALANCE_THRESHOLD_PCT = 10;

export interface SideAnalysis {
  /** Reps credited for progression = weaker side (conservative). */
  creditedReps: number;
  weakerSide: 'left' | 'right' | null;
  imbalancePct: number;
  imbalanced: boolean;
}

/** Compare left / right reps (or seconds) of a unilateral set. */
export function analyzeSides(left: number, right: number, thresholdPct = IMBALANCE_THRESHOLD_PCT): SideAnalysis {
  const max = Math.max(left, right);
  const imbalancePct = max > 0 ? round2((Math.abs(left - right) / max) * 100) : 0;
  return {
    creditedReps: Math.min(left, right),
    weakerSide: left === right ? null : left < right ? 'left' : 'right',
    imbalancePct,
    imbalanced: imbalancePct > thresholdPct,
  };
}

/** Pair up `left` / `right` set logs by set number and analyse each pair. */
export function analyzeUnilateralSets(
  sets: readonly { setNo: number; side: 'left' | 'right' | 'both'; reps: number }[],
  thresholdPct = IMBALANCE_THRESHOLD_PCT,
): (SideAnalysis & { setNo: number })[] {
  const bySet = new Map<number, { left?: number; right?: number }>();
  for (const s of sets) {
    if (s.side === 'both') continue;
    const entry = bySet.get(s.setNo) ?? {};
    entry[s.side] = s.reps;
    bySet.set(s.setNo, entry);
  }
  return [...bySet.entries()]
    .filter(([, v]) => v.left !== undefined && v.right !== undefined)
    .sort(([a], [b]) => a - b)
    .map(([setNo, v]) => ({ setNo, ...analyzeSides(v.left as number, v.right as number, thresholdPct) }));
}
