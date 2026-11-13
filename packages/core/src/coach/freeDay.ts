/**
 * NUT-09 free-day accounting as seen by the coach (gamification.md §7). The nutrition maths
 * (quote, weekly compensation) lives in `nutrition`; here we only decide whether a requested
 * free day is valid (quota / shield) or over the allowance (`excess` → penalty).
 */
import { weekStart } from './localDate';
import { rulesFor } from './rules';
import type { DayRecord, FreeDayKind, Strictness } from './types';

/** What the user asked for today (`free_days.kind`, or nothing). */
export type FreeDayRequest = 'none' | 'quota' | 'shield';

export interface FreeDayResolution {
  kind: FreeDayKind;
  consumesShield: boolean;
  /** Quota days used this week including today. */
  quotaUsed: number;
  allowance: number;
}

/** Weekly allowance: `coach_settings.free_days_per_week` (0–3) or the strictness default. */
export function freeDayAllowance(strictness: Strictness, freeDaysPerWeek?: number | null): number {
  const v = freeDaysPerWeek ?? rulesFor(strictness).defaultFreeDaysPerWeek;
  return Math.min(3, Math.max(0, Math.round(v)));
}

/** Quota free days already used in the Monday-based week of `localDate` (before that day). */
export function quotaUsedThisWeek(history: readonly DayRecord[], localDate: string): number {
  const start = weekStart(localDate);
  return history.filter((r) => r.localDate >= start && r.localDate < localDate && r.freeDay === 'quota').length;
}

export function resolveFreeDay(input: {
  request: FreeDayRequest;
  quotaUsedBefore: number;
  allowance: number;
  shieldsAvailable: number;
}): FreeDayResolution {
  const { request, quotaUsedBefore, allowance } = input;
  if (request === 'none') return { kind: 'none', consumesShield: false, quotaUsed: quotaUsedBefore, allowance };
  if (request === 'quota' && quotaUsedBefore < allowance) {
    return { kind: 'quota', consumesShield: false, quotaUsed: quotaUsedBefore + 1, allowance };
  }
  // Shield explicitly requested (or quota exhausted but the user chose to convert): needs a shield.
  if (request === 'shield' && input.shieldsAvailable > 0) {
    return { kind: 'shield', consumesShield: true, quotaUsed: quotaUsedBefore, allowance };
  }
  return { kind: 'excess', consumesShield: false, quotaUsed: quotaUsedBefore, allowance };
}
