/**
 * WRK-06 – morning readiness 0–100 (signature-features.md §5): sleep vs target, sleep quality,
 * yesterday's kcal & protein, 3-day training load, resting HR (if a watch provides it) and
 * remaining fatigue of today's muscles. Missing factors are skipped and weights renormalised.
 * < 50 → lighter session (−1 set per exercise); ≥ 80 → "good day to try a PR".
 */

export type ReadinessFactorCode =
  | 'sleep_duration'
  | 'sleep_quality'
  | 'kcal_yesterday'
  | 'protein_yesterday'
  | 'training_load'
  | 'resting_hr'
  | 'muscle_recovery';

export interface ReadinessInput {
  sleepMin?: number | null;
  sleepTargetMin?: number | null;
  /** 1–5 (manual quality). */
  sleepQuality?: number | null;
  kcalYesterday?: number | null;
  kcalTargetYesterday?: number | null;
  proteinYesterdayG?: number | null;
  proteinTargetG?: number | null;
  /** Hard (non-warm-up) sets in the last 3 days vs the user's usual 3-day amount. */
  hardSetsLast3Days?: number | null;
  baselineHardSets3Days?: number | null;
  restingHr?: number | null;
  restingHrBaseline?: number | null;
  /** Average recovery % (0–100) of the muscles planned today, from `recovery`. */
  plannedMusclesRecoveryPct?: number | null;
}

export interface ReadinessFactor {
  code: ReadinessFactorCode;
  /** 0–100. */
  score: number;
  weight: number;
  impact: 'positive' | 'neutral' | 'negative';
}

export type ReadinessBand = 'low' | 'normal' | 'high';
export type ReadinessRecommendation = 'lighter_session' | 'as_planned' | 'try_pr';

export interface ReadinessResult {
  /** `null` when no factor is available. */
  score: number | null;
  band: ReadinessBand;
  recommendation: ReadinessRecommendation;
  /** Suggested change of sets per exercise when the user taps "Accept". */
  setDelta: number;
  factors: ReadinessFactor[];
}

/** Starting weights (sum 1). Values are starting points to tune after beta. */
export const READINESS_WEIGHTS: Readonly<Record<ReadinessFactorCode, number>> = {
  sleep_duration: 0.3,
  sleep_quality: 0.1,
  kcal_yesterday: 0.1,
  protein_yesterday: 0.1,
  training_load: 0.15,
  resting_hr: 0.1,
  muscle_recovery: 0.15,
};

export const READINESS_LOW = 50;
export const READINESS_HIGH = 80;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
/** Linear 0 → 100 between `zeroAt` and `fullAt` (either direction). */
const ramp = (x: number, zeroAt: number, fullAt: number): number => clamp01((x - zeroAt) / (fullAt - zeroAt)) * 100;
const has = (x: number | null | undefined): x is number => x !== null && x !== undefined && Number.isFinite(x);

export function computeReadiness(input: ReadinessInput): ReadinessResult {
  const raw: { code: ReadinessFactorCode; score: number }[] = [];
  if (has(input.sleepMin) && has(input.sleepTargetMin) && input.sleepTargetMin > 0) {
    raw.push({ code: 'sleep_duration', score: ramp(input.sleepMin / input.sleepTargetMin, 0.6, 1) });
  }
  if (has(input.sleepQuality)) raw.push({ code: 'sleep_quality', score: ramp(input.sleepQuality, 1, 5) });
  if (has(input.kcalYesterday) && has(input.kcalTargetYesterday) && input.kcalTargetYesterday > 0) {
    // Under-fuelling hurts performance; a surplus does not.
    raw.push({ code: 'kcal_yesterday', score: ramp(input.kcalYesterday / input.kcalTargetYesterday, 0.5, 0.9) });
  }
  if (has(input.proteinYesterdayG) && has(input.proteinTargetG) && input.proteinTargetG > 0) {
    raw.push({ code: 'protein_yesterday', score: ramp(input.proteinYesterdayG / input.proteinTargetG, 0.4, 0.9) });
  }
  if (has(input.hardSetsLast3Days) && has(input.baselineHardSets3Days) && input.baselineHardSets3Days > 0) {
    raw.push({ code: 'training_load', score: ramp(input.hardSetsLast3Days / input.baselineHardSets3Days, 2, 1) });
  }
  if (has(input.restingHr) && has(input.restingHrBaseline)) {
    // Resting HR ≥ 10 bpm above baseline is a common fatigue / illness flag.
    raw.push({ code: 'resting_hr', score: ramp(input.restingHr - input.restingHrBaseline, 10, 0) });
  }
  if (has(input.plannedMusclesRecoveryPct)) {
    raw.push({ code: 'muscle_recovery', score: ramp(input.plannedMusclesRecoveryPct, 30, 80) });
  }

  const totalWeight = raw.reduce((s, f) => s + READINESS_WEIGHTS[f.code], 0);
  const factors: ReadinessFactor[] = raw.map((f) => ({
    code: f.code,
    score: Math.round(f.score),
    weight: totalWeight > 0 ? Math.round((READINESS_WEIGHTS[f.code] / totalWeight) * 1000) / 1000 : 0,
    impact: f.score >= 80 ? 'positive' : f.score < 50 ? 'negative' : 'neutral',
  }));
  if (totalWeight === 0) {
    return { score: null, band: 'normal', recommendation: 'as_planned', setDelta: 0, factors };
  }
  const score = Math.round(raw.reduce((s, f) => s + f.score * READINESS_WEIGHTS[f.code], 0) / totalWeight);
  const band: ReadinessBand = score < READINESS_LOW ? 'low' : score >= READINESS_HIGH ? 'high' : 'normal';
  return {
    score,
    band,
    recommendation: band === 'low' ? 'lighter_session' : band === 'high' ? 'try_pr' : 'as_planned',
    setDelta: band === 'low' ? -1 : 0,
    factors: factors.sort((a, b) => a.score - b.score),
  };
}
