/**
 * Weekly kcal budget (NUT-11, nutrition.md §7, signature-features §3).
 *
 * - The week (Monday → Sunday) has a budget of 7 × daily target.
 * - Eating over target on a closed day creates a "debt" that the remaining days of the week
 *   repay: each remaining day is lowered by at most 10 % of the target and never below the
 *   safety floor.
 * - Eating under target never creates credit ("không cộng dồn thành quỹ"): the running
 *   balance is clamped at 0, so a later under-target day may repay existing debt but an
 *   early one cannot be banked.
 * - Free days: in `compensate` mode their excess (or, before they happen, their quoted extra
 *   `free_days.quoted_extra_kcal`) is spread over the other remaining days; in
 *   `no_compensate` mode it is not, and is reported for the goal-date shift instead.
 * - Debt that cannot be repaid within the caps is reported as `uncoveredKcal`.
 *
 * Assumption (docs silent): ordinary over-eating is always compensated (NUT-11 applies to
 * every user); `free_day_mode` only decides about free days. Unlogged closed days count as
 * exactly on target.
 */
import { addDays, compareDates, datesBetween, maxDate, weekRange, type LocalDate } from '../time';
import type { FreeDayMode } from './types';

/** Max reduction per remaining day: 10 % of the daily target (nutrition.md §7). */
export const MAX_DAILY_REDUCTION_SHARE = 0.1;

export interface BudgetDayInput {
  date: LocalDate;
  /** Total kcal eaten that day; `null` = nothing logged. Only used for days before `today`. */
  intakeKcal: number | null;
  isFreeDay?: boolean;
  /** Expected extra kcal of a free day that has not been closed yet. */
  quotedExtraKcal?: number | null;
}

export interface WeeklyBudgetInput {
  /** The user's current local date. Days before it are closed. */
  today: LocalDate;
  dailyTargetKcal: number;
  floorKcal: number;
  freeDayMode: FreeDayMode;
  /** Any days of the current week (others are ignored). */
  days: readonly BudgetDayInput[];
  maxDailyReductionShare?: number;
}

export interface BudgetDayTarget {
  date: LocalDate;
  targetKcal: number;
  reductionKcal: number;
  isFreeDay: boolean;
}

export interface WeeklyBudgetResult {
  weekStart: LocalDate;
  weekEnd: LocalDate;
  weeklyBudgetKcal: number;
  /** Logged intake on closed days of this week. */
  consumedKcal: number;
  /** Debt from closed days after the no-credit rule. */
  overageKcal: number;
  /** Quoted extra of upcoming free days that this week will compensate. */
  plannedFreeDayExtraKcal: number;
  toCompensateKcal: number;
  perDayCapKcal: number;
  /** Targets from today to Sunday. */
  days: BudgetDayTarget[];
  /** Part of `toCompensateKcal` the remaining days cannot absorb. */
  uncoveredKcal: number;
  /** Free-day excess deliberately not compensated (`no_compensate`) – shifts the goal date. */
  freeDayExcessKcal: number;
}

/** Per-day cap: min(10 % of target, target − floor), never negative. */
export function perDayReductionCap(dailyTargetKcal: number, floorKcal: number, share = MAX_DAILY_REDUCTION_SHARE): number {
  return Math.max(0, Math.min(Math.round(dailyTargetKcal * share), dailyTargetKcal - floorKcal));
}

/**
 * Spreads `amountKcal` evenly over `days` days, each at most `capKcal`, rounded up to
 * 10 kcal (but never above the cap).
 */
export function spreadReduction(amountKcal: number, days: number, capKcal: number): {
  perDayKcal: number;
  coveredKcal: number;
  uncoveredKcal: number;
} {
  if (amountKcal <= 0) return { perDayKcal: 0, coveredKcal: 0, uncoveredKcal: 0 };
  if (days <= 0 || capKcal <= 0) return { perDayKcal: 0, coveredKcal: 0, uncoveredKcal: Math.round(amountKcal) };
  const perDay = Math.min(capKcal, Math.ceil(amountKcal / days / 10) * 10);
  const covered = Math.min(amountKcal, perDay * days);
  return { perDayKcal: perDay, coveredKcal: Math.round(covered), uncoveredKcal: Math.round(amountKcal - covered) };
}

export function computeWeeklyBudget(input: WeeklyBudgetInput): WeeklyBudgetResult {
  const base = input.dailyTargetKcal;
  if (!Number.isFinite(base) || base <= 0) throw new RangeError('daily_target_must_be_positive');
  const { start, end } = weekRange(input.today);
  const byDate = new Map<LocalDate, BudgetDayInput>();
  for (const d of input.days) {
    if (compareDates(d.date, start) >= 0 && compareDates(d.date, end) <= 0) byDate.set(d.date, d);
  }

  let debt = 0;
  let consumed = 0;
  let freeDayExcess = 0;
  for (const date of datesBetween(start, addDays(input.today, -1))) {
    const day = byDate.get(date);
    if (!day || day.intakeKcal == null || !Number.isFinite(day.intakeKcal)) continue;
    consumed += day.intakeKcal;
    const diff = day.intakeKcal - base;
    if (day.isFreeDay && input.freeDayMode === 'no_compensate') {
      freeDayExcess += Math.max(0, diff);
      continue;
    }
    debt = Math.max(0, debt + diff);
  }

  let planned = 0;
  const remaining = datesBetween(maxDate(input.today, start), end);
  const reductionDates: LocalDate[] = [];
  for (const date of remaining) {
    const day = byDate.get(date);
    if (day?.isFreeDay) {
      const quoted = Math.max(0, day.quotedExtraKcal ?? 0);
      if (input.freeDayMode === 'compensate') planned += quoted;
      else freeDayExcess += quoted;
    } else {
      reductionDates.push(date);
    }
  }

  const cap = perDayReductionCap(base, input.floorKcal, input.maxDailyReductionShare);
  const toCompensate = Math.round(debt + planned);
  const spread = spreadReduction(toCompensate, reductionDates.length, cap);
  const reductionSet = new Set(reductionDates);

  return {
    weekStart: start,
    weekEnd: end,
    weeklyBudgetKcal: base * 7,
    consumedKcal: Math.round(consumed),
    overageKcal: Math.round(debt),
    plannedFreeDayExtraKcal: Math.round(planned),
    toCompensateKcal: toCompensate,
    perDayCapKcal: cap,
    days: remaining.map((date) => {
      const reduce = reductionSet.has(date) ? spread.perDayKcal : 0;
      return { date, targetKcal: base - reduce, reductionKcal: reduce, isFreeDay: !reductionSet.has(date) };
    }),
    uncoveredKcal: spread.uncoveredKcal,
    freeDayExcessKcal: Math.round(freeDayExcess),
  };
}
