/**
 * Weekly adaptive TDEE (HLT-03, lifestyle.md §2, nutrition.md §1.6).
 *
 * Every Sunday: if the last 14 days have ≥ 4 weigh-ins and ≥ 10 days with food logged,
 *   observed TDEE = average logged intake − (trend change kg × 7,700) / days
 * and the TDEE moves toward it by at most ±150 kcal. Not enough data → keep it unchanged
 * (the app reminds the user to weigh / log more).
 *
 * Additions where the docs are silent:
 * - Changes smaller than 50 kcal are ignored (stability; lifestyle.md wants targets that
 *   do not jump around).
 * - When a BMR is supplied the result stays within 1.1–2.5 × BMR (FAO/WHO/UNU 2004 energy
 *   report: sustainable physical activity levels ≈ 1.4–2.4; 1.1 leaves room for adaptive
 *   thermogenesis).
 * - Unlogged days are excluded from the intake average (missing ≠ zero).
 */
import { addDays, compareDates, diffDays, isSunday, type LocalDate } from '../time';
import { trendOn, weightTrend, type WeighIn } from './weightTrend';

export const ADAPTIVE_WINDOW_DAYS = 14;
export const MIN_WEIGH_INS = 4;
export const MIN_LOGGED_DAYS = 10;
export const MAX_TDEE_CHANGE_KCAL = 150;
export const TDEE_DEADBAND_KCAL = 50;
export const KCAL_PER_KG_BODY = 7700;
const MIN_SPAN_DAYS = 7;
const TDEE_BOUNDS_BMR = { min: 1.1, max: 2.5 } as const;

export interface AdaptiveTdeeInput {
  /** Review date (normally Sunday). Window = the 14 days ending on it. */
  asOf: LocalDate;
  currentTdeeKcal: number;
  /** Full weigh-in history (needed to warm up the trend). */
  weighIns: readonly WeighIn[];
  /** Daily intake; `null` / 0 = not logged. */
  intake: readonly { date: LocalDate; kcal: number | null }[];
  bmrKcal?: number | null;
  windowDays?: number;
  maxChangeKcal?: number;
  deadbandKcal?: number;
}

export type AdaptiveTdeeStatus = 'adjusted' | 'unchanged' | 'insufficient_data';

export type AdaptiveTdeeReason =
  | 'too_few_weigh_ins'
  | 'too_few_logged_days'
  | 'insufficient_span'
  | 'within_tolerance'
  | 'clamped'
  | 'bounded';

/** Stored in `nutrition_targets.explanation` with `reason = 'weekly_adjust'`. */
export interface AdaptiveTdeeExplanation {
  windowStart: LocalDate;
  windowEnd: LocalDate;
  weighIns: number;
  loggedDays: number;
  avgIntakeKcal: number | null;
  trendStartKg: number | null;
  trendEndKg: number | null;
  trendChangeKg: number | null;
  spanDays: number | null;
}

export interface AdaptiveTdeeResult {
  status: AdaptiveTdeeStatus;
  previousTdeeKcal: number;
  newTdeeKcal: number;
  deltaKcal: number;
  observedTdeeKcal: number | null;
  reasons: AdaptiveTdeeReason[];
  explanation: AdaptiveTdeeExplanation;
}

/** True on the weekly review day (Sunday). */
export const isAdaptiveReviewDay = isSunday;

export function adaptTdee(input: AdaptiveTdeeInput): AdaptiveTdeeResult {
  const current = Math.round(input.currentTdeeKcal);
  if (!Number.isFinite(current) || current <= 0) throw new RangeError('tdee_must_be_positive');
  const windowDays = input.windowDays ?? ADAPTIVE_WINDOW_DAYS;
  const windowEnd = input.asOf;
  const windowStart = addDays(windowEnd, -(windowDays - 1));
  const inWindow = (d: LocalDate): boolean => compareDates(d, windowStart) >= 0 && compareDates(d, windowEnd) <= 0;

  const weighInDates = new Set(
    input.weighIns.filter((w) => inWindow(w.date) && Number.isFinite(w.weightKg) && w.weightKg > 0).map((w) => w.date),
  );
  const loggedByDate = new Map<LocalDate, number>();
  for (const d of input.intake) {
    if (inWindow(d.date) && d.kcal != null && Number.isFinite(d.kcal) && d.kcal > 0) loggedByDate.set(d.date, d.kcal);
  }
  const loggedDays = loggedByDate.size;
  const avgIntake = loggedDays > 0 ? [...loggedByDate.values()].reduce((a, b) => a + b, 0) / loggedDays : null;

  const explanation: AdaptiveTdeeExplanation = {
    windowStart,
    windowEnd,
    weighIns: weighInDates.size,
    loggedDays,
    avgIntakeKcal: avgIntake === null ? null : Math.round(avgIntake),
    trendStartKg: null,
    trendEndKg: null,
    trendChangeKg: null,
    spanDays: null,
  };
  const unchanged = (status: AdaptiveTdeeStatus, reasons: AdaptiveTdeeReason[], observed: number | null = null): AdaptiveTdeeResult => ({
    status,
    previousTdeeKcal: current,
    newTdeeKcal: current,
    deltaKcal: 0,
    observedTdeeKcal: observed,
    reasons,
    explanation,
  });

  const reasons: AdaptiveTdeeReason[] = [];
  if (weighInDates.size < MIN_WEIGH_INS) reasons.push('too_few_weigh_ins');
  if (loggedDays < MIN_LOGGED_DAYS) reasons.push('too_few_logged_days');
  if (reasons.length > 0 || avgIntake === null) return unchanged('insufficient_data', reasons);

  const trend = weightTrend(input.weighIns.filter((w) => compareDates(w.date, windowEnd) <= 0), { until: windowEnd });
  const end = trendOn(trend, windowEnd);
  let start = trendOn(trend, addDays(windowStart, -1));
  let span = windowDays;
  if (start === null) {
    const firstInWindow = trend.find((p) => inWindow(p.date));
    if (firstInWindow) {
      start = firstInWindow.trendKg;
      span = diffDays(firstInWindow.date, windowEnd);
    }
  }
  if (start === null || end === null || span < MIN_SPAN_DAYS) return unchanged('insufficient_data', ['insufficient_span']);

  const change = Math.round((end - start) * 100) / 100;
  explanation.trendStartKg = start;
  explanation.trendEndKg = end;
  explanation.trendChangeKg = change;
  explanation.spanDays = span;

  const observed = Math.round(avgIntake - (change * KCAL_PER_KG_BODY) / span);
  const diff = observed - current;
  if (Math.abs(diff) < (input.deadbandKcal ?? TDEE_DEADBAND_KCAL)) return unchanged('unchanged', ['within_tolerance'], observed);

  const maxChange = input.maxChangeKcal ?? MAX_TDEE_CHANGE_KCAL;
  let next = current + Math.max(-maxChange, Math.min(maxChange, diff));
  if (Math.abs(diff) > maxChange) reasons.push('clamped');
  if (input.bmrKcal != null && input.bmrKcal > 0) {
    const lo = Math.round(input.bmrKcal * TDEE_BOUNDS_BMR.min);
    const hi = Math.round(input.bmrKcal * TDEE_BOUNDS_BMR.max);
    const bounded = Math.max(lo, Math.min(hi, next));
    if (bounded !== next) reasons.push('bounded');
    next = bounded;
  }
  next = Math.round(next);
  return {
    status: next === current ? 'unchanged' : 'adjusted',
    previousTdeeKcal: current,
    newTdeeKcal: next,
    deltaKcal: next - current,
    observedTdeeKcal: observed,
    reasons,
    explanation,
  };
}
