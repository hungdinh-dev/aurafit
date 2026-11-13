/**
 * Sleep (HLT-04, lifestyle.md §3, gamification §3).
 * - Manual entry: bed time, wake time, quality 1–5. A session counts for the day you wake up.
 * - Goal: duration by age (adults 7–9 h, user-adjustable) and a regular wake time
 *   (≤ 30 min from the target).
 * - Metrics: duration, 7-day wake regularity, average quality.
 * - Daily score pillar (gamification §3): duration met = 12 pts, wake on time ±30 min = 8 pts.
 */
import {
  addDays,
  clockDiffMinutes,
  DEFAULT_TIME_ZONE,
  localDate,
  MINUTES_PER_DAY,
  parseTimeOfDay,
  toDate,
  zonedTimeToUtc,
  type Instant,
  type LocalDate,
} from '../time';

export const WAKE_TOLERANCE_MIN = 30;
export const SLEEP_SCORE_POINTS = { duration: 12, wake: 8 } as const;

export interface SleepRange {
  minMin: number;
  maxMin: number;
}

/**
 * Recommended sleep by age – National Sleep Foundation (Hirshkowitz et al., Sleep Health
 * 2015): 6–13 y 9–11 h, 14–17 y 8–10 h, 18–64 y 7–9 h, ≥ 65 y 7–8 h. Docs: adults 7–9 h.
 */
export function recommendedSleepRange(ageYears: number): SleepRange {
  if (ageYears < 14) return { minMin: 9 * 60, maxMin: 11 * 60 };
  if (ageYears < 18) return { minMin: 8 * 60, maxMin: 10 * 60 };
  if (ageYears < 65) return { minMin: 7 * 60, maxMin: 9 * 60 };
  return { minMin: 7 * 60, maxMin: 8 * 60 };
}

/** Minutes between two instants (sleep start → end). Throws if end is before start. */
export function sleepDurationMin(start: Instant, end: Instant): number {
  const ms = toDate(end).getTime() - toDate(start).getTime();
  if (ms < 0) throw new RangeError('sleep_end_before_start');
  return Math.round(ms / 60_000);
}

/** Duration from clock times (`HH:mm` or minutes), crossing midnight when bed > wake. */
export function sleepDurationFromClock(bedTime: number | string, wakeTime: number | string): number {
  const bed = typeof bedTime === 'string' ? parseTimeOfDay(bedTime) : bedTime;
  const wake = typeof wakeTime === 'string' ? parseTimeOfDay(wakeTime) : wakeTime;
  return (((wake - bed) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/** Sleep is stored under the local date of waking up (`health_samples.local_date`). */
export function sleepLocalDate(endAt: Instant, timeZone: string = DEFAULT_TIME_ZONE): LocalDate {
  return localDate(endAt, timeZone);
}

/**
 * Builds the UTC interval for a manual entry ("giờ đi ngủ, giờ dậy" on the morning screen).
 * Bed time later on the clock than wake time means it was the previous evening.
 */
export function manualSleepSession(input: {
  wakeDate: LocalDate;
  bedTime: string | number;
  wakeTime: string | number;
  timeZone?: string;
}): { start_at: string; end_at: string; local_date: LocalDate; durationMin: number } {
  const tz = input.timeZone ?? DEFAULT_TIME_ZONE;
  const bed = typeof input.bedTime === 'string' ? parseTimeOfDay(input.bedTime) : input.bedTime;
  const wake = typeof input.wakeTime === 'string' ? parseTimeOfDay(input.wakeTime) : input.wakeTime;
  const bedDate = bed > wake ? addDays(input.wakeDate, -1) : input.wakeDate;
  const start = zonedTimeToUtc(bedDate, bed, tz);
  const end = zonedTimeToUtc(input.wakeDate, wake, tz);
  return {
    start_at: start.toISOString(),
    end_at: end.toISOString(),
    local_date: input.wakeDate,
    durationMin: sleepDurationMin(start, end),
  };
}

export interface SleepGoal {
  /** Minimum duration that counts as "met" (default from age: lower bound). */
  minDurationMin: number;
  /** Upper bound of the recommended range – above it the status is `long` (still met). */
  maxDurationMin?: number;
  /** Target wake time, minutes after midnight. */
  targetWakeMin: number;
  toleranceMin?: number;
}

export interface SleepEvaluation {
  durationMet: boolean;
  durationStatus: 'short' | 'ok' | 'long';
  /** Signed minutes from the target wake time (+ = later). */
  wakeDeviationMin: number | null;
  wakeOnTime: boolean;
  points: { duration: number; wake: number; total: number };
  /** total / 20 as 0–100. */
  score: number;
}

/** Evaluates one night against the goal (duration 12 pts + wake on time 8 pts). */
export function evaluateSleep(input: {
  durationMin: number | null;
  wakeMinutesOfDay: number | null;
  goal: SleepGoal;
}): SleepEvaluation {
  const { goal } = input;
  const d = input.durationMin ?? 0;
  const durationMet = input.durationMin != null && d >= goal.minDurationMin;
  const durationStatus: SleepEvaluation['durationStatus'] = !durationMet
    ? 'short'
    : goal.maxDurationMin != null && d > goal.maxDurationMin
      ? 'long'
      : 'ok';
  const dev = input.wakeMinutesOfDay == null ? null : clockDiffMinutes(goal.targetWakeMin, input.wakeMinutesOfDay);
  const wakeOnTime = dev !== null && Math.abs(dev) <= (goal.toleranceMin ?? WAKE_TOLERANCE_MIN);
  const points = {
    duration: durationMet ? SLEEP_SCORE_POINTS.duration : 0,
    wake: wakeOnTime ? SLEEP_SCORE_POINTS.wake : 0,
    total: 0,
  };
  points.total = points.duration + points.wake;
  return {
    durationMet,
    durationStatus,
    wakeDeviationMin: dev,
    wakeOnTime,
    points,
    score: Math.round((points.total / (SLEEP_SCORE_POINTS.duration + SLEEP_SCORE_POINTS.wake)) * 100),
  };
}

export interface WakeConsistency {
  nights: number;
  /** Circular mean wake time (minutes after midnight). */
  meanWakeMin: number | null;
  /** Standard deviation in minutes (lower = more regular). */
  sdMin: number | null;
  /** Share of nights within tolerance of the target (when a target is given). */
  onTimeRate: number | null;
}

/** Wake-time regularity over a set of nights (docs: 7 days), safe around midnight. */
export function wakeConsistency(
  wakeMinutes: readonly number[],
  targetWakeMin?: number | null,
  toleranceMin: number = WAKE_TOLERANCE_MIN,
): WakeConsistency {
  const vals = wakeMinutes.filter((m) => Number.isFinite(m));
  if (vals.length === 0) return { nights: 0, meanWakeMin: null, sdMin: null, onTimeRate: null };
  const ref = vals[0]!;
  const offsets = vals.map((m) => clockDiffMinutes(ref, m));
  const meanOff = offsets.reduce((a, b) => a + b, 0) / offsets.length;
  const variance = offsets.reduce((a, o) => a + (o - meanOff) ** 2, 0) / offsets.length;
  const mean = (((Math.round(ref + meanOff) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY);
  const onTimeRate =
    targetWakeMin == null
      ? null
      : Math.round((vals.filter((m) => Math.abs(clockDiffMinutes(targetWakeMin, m)) <= toleranceMin).length / vals.length) * 100) /
        100;
  return { nights: vals.length, meanWakeMin: mean, sdMin: Math.round(Math.sqrt(variance)), onTimeRate };
}

/** Mean of valid 1–5 quality ratings, 1 decimal; `null` when none. */
export function averageSleepQuality(ratings: readonly (number | null | undefined)[]): number | null {
  const v = ratings.filter((r): r is number => typeof r === 'number' && r >= 1 && r <= 5);
  if (v.length === 0) return null;
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
}
