/**
 * COA-01 – daily score 0–100 (gamification.md §3), closed at 03:00 next day on the server.
 *
 * | Pillar     | Pts | Full when |
 * | nutrition  | 40  | logged full day 15 · kcal in range 15 · protein ≥ 90 % 7 · sugar ≤ limit 3 |
 * | sleep      | 20  | duration reached 12 · wake within ±30 min 8 |
 * | training   | 15  | scheduled sessions completed; scheduled rest day → 15 |
 * | water      | 10  | proportional to % of target |
 * | tasks      | 10  | % of today's tasks done; no tasks → redistributed to other pillars |
 * | weight     | 5   | weighed when due; not due → 5 |
 * Valid free day: kcal & sugar criteria pass automatically (logging still needed).
 * Free day beyond allowance: scored normally, minus the strictness penalty (0 / 5 / 10).
 * Eating below the safety floor is never rewarded (R12).
 */
import { rulesFor } from './rules';
import type { DayResult, FreeDayKind, ScoreCriteria, Strictness } from './types';

export const PILLAR_MAX = { nutrition: 40, sleep: 20, training: 15, water: 10, tasks: 10, weight: 5 } as const;
export type Pillar = keyof typeof PILLAR_MAX;

export const NUTRITION_PTS = { logged: 15, kcal: 15, protein: 7, sugar: 3 } as const;
export const SLEEP_PTS = { duration: 12, wake: 8 } as const;
export const PROTEIN_MET_RATIO = 0.9;
export const WAKE_TOLERANCE_MIN = 30;
/** Bedtime used by quests / boss ("Ngủ trước 23:30"). */
export const BEDTIME_LIMIT_MIN = 23 * 60 + 30;

export interface NutritionDay {
  /** "Logged the full day" – decided by the nutrition module. */
  loggedFullDay: boolean;
  kcalIn: number;
  kcalTarget: number;
  /** Safety floor (NUT-01); below it the kcal criterion never passes. */
  kcalFloor?: number | null;
  proteinG: number;
  proteinTargetG: number;
  sugarG: number;
  sugarLimitG: number;
}

export interface SleepDay {
  sleepMin: number | null;
  targetMin: number;
  /** Minutes after local midnight. */
  wakeTimeMin?: number | null;
  wakeTargetMin?: number | null;
  /** Minutes after local midnight; values before noon are read as after midnight. */
  bedtimeMin?: number | null;
}

export interface DayScoreData {
  nutrition: NutritionDay | null;
  sleep: SleepDay | null;
  workout: { scheduledSessions: number; completedSessions: number };
  water: { ml: number; targetMl: number } | null;
  tasks: { scheduled: number; completed: number };
  weight: { weighInDue: boolean; weighed: boolean };
}

export interface DailyScoreInput extends DayScoreData {
  strictness: Strictness;
  freeDay: FreeDayKind;
}

export type PillarPoints = Record<Pillar, number>;

export interface DailyScoreResult {
  pillars: PillarPoints;
  penaltyPts: number;
  total: number;
  result: DayResult;
  strictness: Strictness;
  isFreeDay: boolean;
  tasksRedistributed: boolean;
  criteria: ScoreCriteria;
  /** Sub-criteria points before redistribution (for "how was this computed?"). */
  detail: {
    nutrition: { logged: number; kcal: number; protein: number; sugar: number };
    sleep: { duration: number; wake: number };
  };
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** Bedtime normalised to minutes after the previous midnight (00:30 → 1470). */
export function normalizeBedtime(min: number): number {
  return min < 12 * 60 ? min + 24 * 60 : min;
}

function circularDiffMin(a: number, b: number): number {
  const d = Math.abs(a - b) % 1440;
  return Math.min(d, 1440 - d);
}

export function isValidFreeDay(kind: FreeDayKind): boolean {
  return kind === 'quota' || kind === 'shield';
}

export function resultFor(total: number, strictness: Strictness): DayResult {
  const r = rulesFor(strictness);
  if (total >= r.excellentThreshold) return 'excellent';
  if (total >= r.passThreshold) return 'pass';
  return 'fail';
}

/** Largest-remainder rounding so the rounded parts add up to the rounded sum. */
export function roundPreservingSum(values: Record<Pillar, number>): PillarPoints {
  const keys = Object.keys(values) as Pillar[];
  const target = Math.round(keys.reduce((s, k) => s + values[k], 0));
  const floors = Object.fromEntries(keys.map((k) => [k, Math.floor(values[k] + 1e-9)])) as PillarPoints;
  let rest = target - keys.reduce((s, k) => s + floors[k], 0);
  const order = [...keys].sort((a, b) => values[b] - floors[b] - (values[a] - floors[a]) || keys.indexOf(a) - keys.indexOf(b));
  for (const k of order) {
    if (rest <= 0) break;
    floors[k] += 1;
    rest -= 1;
  }
  return floors;
}

export function computeDailyScore(input: DailyScoreInput): DailyScoreResult {
  const rules = rulesFor(input.strictness);
  const freeValid = isValidFreeDay(input.freeDay);

  // Nutrition
  const n = input.nutrition;
  const belowFloor = n !== null && n.kcalFloor != null && n.kcalIn < n.kcalFloor;
  const kcalInRange =
    n !== null && n.kcalTarget > 0 && !belowFloor && Math.abs(n.kcalIn - n.kcalTarget) <= rules.kcalTolerance * n.kcalTarget;
  const proteinMet = n !== null && n.proteinTargetG > 0 && n.proteinG >= PROTEIN_MET_RATIO * n.proteinTargetG;
  const sugarMet = n !== null && n.sugarG <= n.sugarLimitG;
  const loggedFullDay = n?.loggedFullDay ?? false;
  const nut = {
    logged: loggedFullDay ? NUTRITION_PTS.logged : 0,
    kcal: freeValid || kcalInRange ? NUTRITION_PTS.kcal : 0,
    protein: proteinMet ? NUTRITION_PTS.protein : 0,
    sugar: freeValid || sugarMet ? NUTRITION_PTS.sugar : 0,
  };

  // Sleep
  const s = input.sleep;
  const hasSleep = s !== null && s.sleepMin !== null && s.targetMin > 0;
  const sleepRatio = hasSleep ? clamp01((s.sleepMin as number) / s.targetMin) : 0;
  const wakeOnTime =
    s !== null && s.wakeTargetMin != null && s.wakeTimeMin != null
      ? circularDiffMin(s.wakeTimeMin, s.wakeTargetMin) <= WAKE_TOLERANCE_MIN
      : null;
  const sl = {
    duration: SLEEP_PTS.duration * sleepRatio,
    // No wake target configured → wake points follow "sleep was logged".
    wake: (wakeOnTime ?? hasSleep) && hasSleep ? SLEEP_PTS.wake : 0,
  };
  const bedtimeOk = s?.bedtimeMin != null ? normalizeBedtime(s.bedtimeMin) <= BEDTIME_LIMIT_MIN : null;

  // Training
  const w = input.workout;
  const training = w.scheduledSessions <= 0 ? PILLAR_MAX.training : PILLAR_MAX.training * clamp01(w.completedSessions / w.scheduledSessions);

  // Water
  const water = input.water && input.water.targetMl > 0 ? PILLAR_MAX.water * clamp01(input.water.ml / input.water.targetMl) : 0;
  const waterMet = input.water !== null && input.water.targetMl > 0 && input.water.ml >= input.water.targetMl;

  // Tasks
  const t = input.tasks;
  const tasksRedistributed = t.scheduled <= 0;
  const tasks = tasksRedistributed ? 0 : PILLAR_MAX.tasks * clamp01(t.completed / t.scheduled);

  // Weight
  const weight = !input.weight.weighInDue || input.weight.weighed ? PILLAR_MAX.weight : 0;

  const raw: Record<Pillar, number> = {
    nutrition: nut.logged + nut.kcal + nut.protein + nut.sugar,
    sleep: sl.duration + sl.wake,
    training,
    water,
    tasks,
    weight,
  };
  if (tasksRedistributed) {
    const scale = 100 / (100 - PILLAR_MAX.tasks);
    for (const k of Object.keys(raw) as Pillar[]) raw[k] *= scale;
  }
  const pillars = roundPreservingSum(raw);
  const sum = (Object.keys(pillars) as Pillar[]).reduce((acc, k) => acc + pillars[k], 0);
  const penaltyPts = input.freeDay === 'excess' ? rules.excessFreeDayPenalty : 0;
  const total = Math.max(0, Math.min(100, sum - penaltyPts));

  return {
    pillars,
    penaltyPts,
    total,
    result: resultFor(total, input.strictness),
    strictness: input.strictness,
    isFreeDay: freeValid,
    tasksRedistributed,
    criteria: {
      loggedFullDay,
      kcalInRange,
      proteinMet,
      sugarMet,
      belowFloor,
      sleepMet: hasSleep && sleepRatio >= 1,
      wakeOnTime,
      bedtimeOk,
      waterMet,
      workoutsScheduled: Math.max(0, w.scheduledSessions),
      workoutsCompleted: Math.max(0, w.completedSessions),
      tasksScheduled: Math.max(0, t.scheduled),
      tasksCompleted: Math.max(0, Math.min(t.completed, t.scheduled)),
      weighed: input.weight.weighInDue ? input.weight.weighed : null,
    },
    detail: { nutrition: nut, sleep: { duration: Math.round(sl.duration * 10) / 10, wake: sl.wake } },
  };
}
