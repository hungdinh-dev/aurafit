/**
 * Free day ("ngày tự do") quote and allowance – NUT-09, nutrition.md §7, gamification §1a/§7.
 *
 * Quote before enabling: "≈ +1,100 kcal → về đích muộn ~2 ngày", i.e.
 *   delay days ≈ extra kcal ÷ daily deficit.
 * Compensate mode: the other remaining days of the week drop ≤ 10 %/day (not below the
 * floor) so the goal date holds; whatever does not fit still delays the goal.
 */
import { compareDates, datesBetween, maxDate, weekRange, type LocalDate } from '../time';
import type { GoalType, Strictness } from './types';
import { MAX_DAILY_REDUCTION_SHARE, perDayReductionCap, spreadReduction } from './weeklyBudget';

/** 0–3 free days per week (D-035). */
export const MAX_FREE_DAYS_PER_WEEK = 3;

/** Default free days per week by strictness (gamification §1a). */
export const DEFAULT_FREE_DAYS_BY_STRICTNESS: Readonly<Record<Strictness, number>> = {
  gentle: 2,
  standard: 1,
  hardcore: 0,
};

/** Score penalty for each free day beyond the allowance (gamification §1a). */
export const OVER_QUOTA_PENALTY_BY_STRICTNESS: Readonly<Record<Strictness, number>> = {
  gentle: 0,
  standard: -5,
  hardcore: -10,
};

/**
 * Default expected extra of a free day when the user has no history: 50 % of the daily
 * target. Docs are silent on the estimate; 50 % reproduces the docs' example
 * (+1,100 kcal on a ~2,200 kcal target).
 */
export const DEFAULT_FREE_DAY_EXTRA_SHARE = 0.5;

/** Number of recent free days averaged for the personal estimate. */
const HISTORY_WINDOW = 4;

/**
 * Expected extra kcal of a free day: mean of the user's last (up to 4) free-day excesses
 * when available, otherwise 50 % of the target. Rounded to 10 kcal.
 */
export function estimateFreeDayExtraKcal(input: { dailyTargetKcal: number; pastExtrasKcal?: readonly number[] }): number {
  const past = (input.pastExtrasKcal ?? []).filter((x) => Number.isFinite(x) && x > 0).slice(-HISTORY_WINDOW);
  const raw =
    past.length > 0
      ? past.reduce((a, b) => a + b, 0) / past.length
      : input.dailyTargetKcal * DEFAULT_FREE_DAY_EXTRA_SHARE;
  return Math.round(raw / 10) * 10;
}

/**
 * Days the goal moves for `extraKcal` eaten on top of the target, given the target's daily
 * deficit (negative `dailyDeltaKcal`). Only meaningful for fat loss: returns `null` for
 * maintain / muscle gain (no deficit to divide by; we never present a surplus as "arriving
 * earlier"). One decimal.
 */
export function goalShiftDays(extraKcal: number, dailyDeltaKcal: number, goal: GoalType): number | null {
  if (goal !== 'lose_fat' || !(dailyDeltaKcal < 0)) return null;
  return Math.round((Math.max(0, extraKcal) / -dailyDeltaKcal) * 10) / 10;
}

export interface FreeDayQuoteInput {
  /** Candidate free day. */
  date: LocalDate;
  /** User's current local date. */
  today: LocalDate;
  goal: GoalType;
  dailyTargetKcal: number;
  /** Effective target − TDEE (negative = deficit), e.g. `explanation.effectiveDailyDeltaKcal`. */
  dailyDeltaKcal: number;
  floorKcal: number;
  /** Override for the expected extra; otherwise `estimateFreeDayExtraKcal`. */
  expectedExtraKcal?: number | null;
  pastExtrasKcal?: readonly number[];
  /** Other free days already set this week (excluded from compensation). */
  otherFreeDates?: readonly LocalDate[];
  maxDailyReductionShare?: number;
}

export interface FreeDayQuote {
  extraKcal: number;
  /** Goal delay without compensation (`null` when not a fat-loss goal). */
  delayDays: number | null;
  compensation: {
    /** Remaining days of the week that can absorb the extra. */
    days: number;
    perDayReductionKcal: number;
    coveredKcal: number;
    uncoveredKcal: number;
    /** Goal delay that remains after compensating. */
    delayDays: number | null;
  };
}

/** Builds the pre-enable quote for both modes (UI shows the one matching `free_day_mode`). */
export function quoteFreeDay(input: FreeDayQuoteInput): FreeDayQuote {
  const extra =
    input.expectedExtraKcal != null
      ? Math.max(0, Math.round(input.expectedExtraKcal))
      : estimateFreeDayExtraKcal({ dailyTargetKcal: input.dailyTargetKcal, pastExtrasKcal: input.pastExtrasKcal });

  const { start, end } = weekRange(input.date);
  const excluded = new Set<LocalDate>([input.date, ...(input.otherFreeDates ?? [])]);
  const from = maxDate(input.today, start);
  const days = compareDates(from, end) <= 0 ? datesBetween(from, end).filter((d) => !excluded.has(d)) : [];

  const cap = perDayReductionCap(input.dailyTargetKcal, input.floorKcal, input.maxDailyReductionShare ?? MAX_DAILY_REDUCTION_SHARE);
  const spread = spreadReduction(extra, days.length, cap);

  return {
    extraKcal: extra,
    delayDays: goalShiftDays(extra, input.dailyDeltaKcal, input.goal),
    compensation: {
      days: days.length,
      perDayReductionKcal: spread.perDayKcal,
      coveredKcal: spread.coveredKcal,
      uncoveredKcal: spread.uncoveredKcal,
      delayDays: goalShiftDays(spread.uncoveredKcal, input.dailyDeltaKcal, input.goal),
    },
  };
}

export interface FreeDayAllowance {
  /** `quota` = inside the weekly allowance; `over_quota` = beyond it. */
  kind: 'quota' | 'over_quota';
  /** Allowance left *after* this day (never negative). */
  remainingAfter: number;
  /** Extra score points (≤ 0) for an over-quota day; 0 within quota. */
  penaltyPts: number;
  /** Over-quota days can be turned into a valid free day with a shield (`free_days.kind = 'shield'`). */
  shieldEligible: boolean;
}

/**
 * Whether one more free day this week is within the allowance (0–3/week) and, if not, the
 * penalty for the user's strictness.
 */
export function checkFreeDayAllowance(input: {
  freeDaysPerWeek: number;
  /** Quota free days already used or scheduled this week (excluding this one). */
  usedThisWeek: number;
  strictness: Strictness;
}): FreeDayAllowance {
  const allowance = Math.min(MAX_FREE_DAYS_PER_WEEK, Math.max(0, Math.floor(input.freeDaysPerWeek)));
  const used = Math.max(0, Math.floor(input.usedThisWeek));
  const within = used < allowance;
  return {
    kind: within ? 'quota' : 'over_quota',
    remainingAfter: within ? allowance - used - 1 : 0,
    penaltyPts: within ? 0 : OVER_QUOTA_PENALTY_BY_STRICTNESS[input.strictness],
    shieldEligible: !within,
  };
}
