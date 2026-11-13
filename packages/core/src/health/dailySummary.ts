/**
 * Daily aggregation for `daily_summaries` (HLT-06, D-018). Health samples go through
 * `selectPreferredSamples` first (dedupe + one source per metric per day), then:
 *   water / steps / active energy → sum
 *   sleep  → union of session intervals (overlapping sessions never double count)
 *   weight → first weigh-in of the day (morning weigh-in is recommended, lifestyle.md §2)
 *   resting HR → mean
 * Metrics with no data are `null` (missing ≠ zero). Nutrition totals come from `meal_items`.
 */
import { compareDates, type LocalDate } from '../time';
import { sumNutrients, type NutrientLike } from '../nutrition/nutrients';
import { selectPreferredSamples, type HealthMetric, type HealthSample, type HealthSource, type SourcePriority } from './samples';
import { averageSleepQuality } from './sleep';

export interface HealthDaySummary {
  local_date: LocalDate;
  water_ml: number | null;
  sleep_min: number | null;
  sleep_quality: number | null;
  /** UTC ISO end of the (last) sleep session. */
  wake_time: string | null;
  steps: number | null;
  active_kcal: number | null;
  resting_hr: number | null;
  weight_kg: number | null;
  /** Which source each metric came from (for "Nguồn: Apple Health" labels). */
  sources: Partial<Record<HealthMetric, HealthSource>>;
}

/** Total minutes covered by a set of intervals, overlaps merged. */
export function unionMinutes(intervals: readonly { start: number; end: number }[]): number {
  const sorted = intervals.filter((i) => i.end > i.start).sort((a, b) => a.start - b.start);
  let total = 0;
  let curStart = -Infinity;
  let curEnd = -Infinity;
  for (const i of sorted) {
    if (i.start > curEnd) {
      if (curEnd > curStart) total += curEnd - curStart;
      curStart = i.start;
      curEnd = i.end;
    } else if (i.end > curEnd) {
      curEnd = i.end;
    }
  }
  if (curEnd > curStart) total += curEnd - curStart;
  return total / 60_000;
}

function qualityOf(s: HealthSample): number | null {
  const q = s.metadata?.['quality'];
  return typeof q === 'number' ? q : null;
}

function sleepMinutes(sessions: readonly HealthSample[]): number {
  const intervals: { start: number; end: number }[] = [];
  let loose = 0;
  for (const s of sessions) {
    const start = Date.parse(s.start_at);
    const end = s.end_at ? Date.parse(s.end_at) : Number.NaN;
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) intervals.push({ start, end });
    else loose += Math.max(0, s.value);
  }
  return Math.round(unionMinutes(intervals) + loose);
}

/**
 * Summarises one local date. `allSamples` may contain other dates and sources; the
 * source-priority rule is applied here.
 */
export function summarizeHealthDay(
  date: LocalDate,
  allSamples: readonly HealthSample[],
  priority: SourcePriority = {},
): HealthDaySummary {
  const raw = allSamples.filter((s) => s.local_date === date);
  const chosen = selectPreferredSamples(raw, priority);
  const of = (t: HealthMetric): HealthSample[] => chosen.filter((s) => s.type === t);
  const sources: Partial<Record<HealthMetric, HealthSource>> = {};
  for (const s of chosen) sources[s.type] = s.source;
  const sum = (t: HealthMetric): number | null => {
    const xs = of(t);
    return xs.length === 0 ? null : Math.round(xs.reduce((a, s) => a + s.value, 0));
  };

  const weights = of('weight').sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at));
  const hr = of('resting_hr');
  const sleep = of('sleep_session');
  // The user may rate a device-recorded night manually: fall back to any rating that day.
  let quality = averageSleepQuality(sleep.map(qualityOf));
  if (quality === null) quality = averageSleepQuality(raw.filter((s) => s.type === 'sleep_session').map(qualityOf));
  const wakeMs = sleep
    .map((s) => (s.end_at ? Date.parse(s.end_at) : Number.NaN))
    .filter((x) => Number.isFinite(x))
    .reduce((a, b) => Math.max(a, b), -Infinity);

  return {
    local_date: date,
    water_ml: sum('water'),
    sleep_min: sleep.length === 0 ? null : sleepMinutes(sleep),
    sleep_quality: sleep.length === 0 ? null : quality,
    wake_time: Number.isFinite(wakeMs) ? new Date(wakeMs).toISOString() : null,
    steps: sum('steps'),
    active_kcal: sum('active_energy'),
    resting_hr: hr.length === 0 ? null : Math.round(hr.reduce((a, s) => a + s.value, 0) / hr.length),
    weight_kg: weights[0] ? Math.round(weights[0].value * 10) / 10 : null,
    sources,
  };
}

/** Summaries for every date present in the samples, oldest first. */
export function summarizeHealthDays(samples: readonly HealthSample[], priority: SourcePriority = {}): HealthDaySummary[] {
  const dates = [...new Set(samples.map((s) => s.local_date))].sort(compareDates);
  return dates.map((d) => summarizeHealthDay(d, samples, priority));
}

/** A full `daily_summaries` row (minus `user_id` / `updated_at`). */
export interface DailySummaryRow extends Omit<HealthDaySummary, 'sources'> {
  kcal_in: number | null;
  protein_g: number | null;
  carb_g: number | null;
  fat_g: number | null;
  sugar_g: number | null;
  kcal_target: number | null;
  weight_trend_kg: number | null;
  is_free_day: boolean;
}

/** Combines health samples, meal items and context into one `daily_summaries` row. */
export function buildDailySummary(input: {
  localDate: LocalDate;
  healthSamples: readonly HealthSample[];
  /** `meal_items` of that day (kcal etc. already multiplied by quantity). */
  mealItems: readonly NutrientLike[];
  kcalTarget: number | null;
  weightTrendKg: number | null;
  isFreeDay: boolean;
  sourcePriority?: SourcePriority;
}): DailySummaryRow {
  const { sources: _sources, ...health } = summarizeHealthDay(input.localDate, input.healthSamples, input.sourcePriority);
  const hasMeals = input.mealItems.length > 0;
  const n = sumNutrients(input.mealItems);
  return {
    ...health,
    kcal_in: hasMeals ? n.kcal : null,
    protein_g: hasMeals ? n.protein_g : null,
    carb_g: hasMeals ? n.carb_g : null,
    fat_g: hasMeals ? n.fat_g : null,
    sugar_g: hasMeals ? n.sugar_g : null,
    kcal_target: input.kcalTarget,
    weight_trend_kg: input.weightTrendKg,
    is_free_day: input.isFreeDay,
  };
}
