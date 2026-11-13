/**
 * COA-03 – hard stats (gamification.md §5, `stat_snapshots`) and Aura (§4).
 * Each stat is 0–100 from the last 30 closed days. Days are recency-weighted with the
 * strictness half-life so slacking drops Aura slowly / medium / fast (§1a).
 * Aura = weighted average of available stats; tiers gray → green → blue → purple → gold → red.
 */
import { addDays, diffDays } from './localDate';
import { rulesFor } from './rules';
import { isValidFreeDay } from './dailyScore';
import type { AuraTier, DayRecord, HardStats, StatCode, Strictness } from './types';

export const STAT_WINDOW_DAYS = 30;
export const STAT_CODES: readonly StatCode[] = [
  'diet_discipline',
  'protein',
  'sleep',
  'water',
  'training',
  'strength',
  'body_progress',
  'self_growth',
];

/** Aura weights (assumption; sum 1). */
export const AURA_WEIGHTS: Readonly<Record<StatCode, number>> = {
  diet_discipline: 0.2,
  protein: 0.15,
  sleep: 0.15,
  water: 0.1,
  training: 0.15,
  strength: 0.1,
  body_progress: 0.1,
  self_growth: 0.05,
};

/** Minimum Aura score per tier (assumption). */
export const AURA_TIERS: readonly { tier: AuraTier; min: number }[] = [
  { tier: 'red', min: 92 },
  { tier: 'gold', min: 82 },
  { tier: 'purple', min: 70 },
  { tier: 'blue', min: 55 },
  { tier: 'green', min: 40 },
  { tier: 'gray', min: 0 },
];
export const AURA_TIER_ORDER: readonly AuraTier[] = ['gray', 'green', 'blue', 'purple', 'gold', 'red'];

const clamp100 = (x: number): number => Math.min(100, Math.max(0, x));
const r2 = (x: number): number => Math.round(x * 100) / 100;

/** Strength stat from the 1RM / calisthenics trend vs 30 days ago: 0 % → 50, +10 % → 100, −10 % → 0. */
export function strengthScore(trendPct: number): number {
  return r2(clamp100(50 + 5 * trendPct));
}

/**
 * Body progress: weight trend in the right direction at the chosen pace.
 * Maintain (target 0): 100 − 200 × |kg/week|. Otherwise 100 × (1 − |1 − actual / target|)
 * so both too slow and too fast (unsafe) lower the score.
 */
export function bodyProgressScore(actualKgPerWeek: number, targetKgPerWeek: number): number {
  if (targetKgPerWeek === 0) return r2(clamp100(100 - 200 * Math.abs(actualKgPerWeek)));
  const ratio = actualKgPerWeek / targetKgPerWeek;
  return r2(clamp100(100 * (1 - Math.abs(1 - ratio))));
}

function weightOf(record: DayRecord, asOf: string, halfLife: number): number {
  return 0.5 ** (diffDays(record.localDate, asOf) / halfLife);
}

/** Records within the 30-day window ending at `asOf` (inclusive). */
export function windowRecords(history: readonly DayRecord[], asOf: string): DayRecord[] {
  const from = addDays(asOf, -(STAT_WINDOW_DAYS - 1));
  return history.filter((r) => r.localDate >= from && r.localDate <= asOf);
}

export function computeHardStats(history: readonly DayRecord[], asOf: string, strictness: Strictness): HardStats {
  const halfLife = rulesFor(strictness).auraHalfLifeDays;
  const days = windowRecords(history, asOf).sort((a, b) => a.localDate.localeCompare(b.localDate));
  const share = (value: (r: DayRecord) => number): number | null => {
    if (days.length === 0) return null;
    let num = 0;
    let den = 0;
    for (const r of days) {
      const w = weightOf(r, asOf, halfLife);
      num += w * value(r);
      den += w;
    }
    return r2((100 * num) / den);
  };
  const ratio = (done: (r: DayRecord) => number, planned: (r: DayRecord) => number): number | null => {
    let num = 0;
    let den = 0;
    for (const r of days) {
      const w = weightOf(r, asOf, halfLife);
      num += w * Math.min(done(r), planned(r));
      den += w * planned(r);
    }
    return den > 0 ? r2((100 * num) / den) : null;
  };
  const latest = (pick: (r: DayRecord) => number | null): number | null => {
    for (let i = days.length - 1; i >= 0; i--) {
      const v = pick(days[i] as DayRecord);
      if (v !== null) return v;
    }
    return null;
  };
  const strengthTrend = latest((r) => r.strengthTrendPct);

  return {
    // Valid free days do not count as a miss.
    diet_discipline: share((r) => (r.criteria.kcalInRange || isValidFreeDay(r.freeDay) ? 1 : 0)),
    protein: share((r) => (r.criteria.proteinMet ? 1 : 0)),
    sleep: share((r) => {
      const dur = r.criteria.sleepMet ? 1 : 0;
      return r.criteria.wakeOnTime === null ? dur : 0.6 * dur + 0.4 * (r.criteria.wakeOnTime ? 1 : 0);
    }),
    water: share((r) => (r.criteria.waterMet ? 1 : 0)),
    training: ratio((r) => r.criteria.workoutsCompleted, (r) => r.criteria.workoutsScheduled),
    strength: strengthTrend === null ? null : strengthScore(strengthTrend),
    body_progress: latest((r) => r.bodyProgressScore),
    self_growth: ratio((r) => r.criteria.tasksCompleted, (r) => r.criteria.tasksScheduled),
  };
}

export function auraScore(stats: HardStats): number {
  let num = 0;
  let den = 0;
  for (const code of STAT_CODES) {
    const v = stats[code];
    if (v === null) continue;
    num += v * AURA_WEIGHTS[code];
    den += AURA_WEIGHTS[code];
  }
  return den > 0 ? r2(num / den) : 0;
}

export function auraTierFor(score: number): AuraTier {
  return (AURA_TIERS.find((t) => score >= t.min) ?? { tier: 'gray' as const }).tier;
}

export function compareTiers(a: AuraTier, b: AuraTier): number {
  return AURA_TIER_ORDER.indexOf(a) - AURA_TIER_ORDER.indexOf(b);
}

/** The weakest available stats, ascending (quests target these). */
export function weakestStats(stats: HardStats): { code: StatCode; value: number }[] {
  return STAT_CODES.filter((c) => stats[c] !== null)
    .map((code) => ({ code, value: stats[code] as number }))
    .sort((a, b) => a.value - b.value || STAT_CODES.indexOf(a.code) - STAT_CODES.indexOf(b.code));
}

/** A day where nothing was achieved (used to simulate slacking). */
export function lapseRecord(localDate: string): DayRecord {
  return {
    localDate,
    total: 0,
    result: 'fail',
    freeDay: 'none',
    shieldUsed: false,
    strengthTrendPct: null,
    bodyProgressScore: null,
    criteria: {
      loggedFullDay: false,
      kcalInRange: false,
      proteinMet: false,
      sugarMet: false,
      belowFloor: false,
      sleepMet: false,
      wakeOnTime: null,
      bedtimeOk: null,
      waterMet: false,
      workoutsScheduled: 0,
      workoutsCompleted: 0,
      tasksScheduled: 0,
      tasksCompleted: 0,
      weighed: null,
    },
  };
}

/**
 * Aura warning (§8): how many fully missed days from tomorrow until the tier drops.
 * `null` when already gray or no drop within 30 days.
 */
export function lapseDaysUntilTierDrop(history: readonly DayRecord[], asOf: string, strictness: Strictness): number | null {
  const current = auraTierFor(auraScore(computeHardStats(history, asOf, strictness)));
  if (current === 'gray') return null;
  const sim = [...history];
  for (let d = 1; d <= STAT_WINDOW_DAYS; d++) {
    const date = addDays(asOf, d);
    sim.push(lapseRecord(date));
    const tier = auraTierFor(auraScore(computeHardStats(sim, date, strictness)));
    if (compareTiers(tier, current) < 0) return d;
  }
  return null;
}
