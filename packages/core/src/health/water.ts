/**
 * Water (HLT-01, lifestyle.md §4).
 * - Target ≈ 35 ml/kg, +≈500 ml on training days; user-adjustable.
 * - Smart reminders instead of a fixed 10–15 min: only while awake (wake time → 1 h before
 *   bed), spacing depends on how far behind today's pace the user is (behind → denser,
 *   never closer than 45 min), stop once the target is reached; coach strictness sets the
 *   density.
 * All clock values are minutes after local midnight of the wake day; values ≥ 1440 mean
 * "after midnight" (format with `time.formatTimeOfDay`).
 */
import { MINUTES_PER_DAY, parseTimeOfDay } from '../time';

import type { Strictness } from '../nutrition/types';

export type { Strictness };

export const WATER_ML_PER_KG = 35;
export const TRAINING_DAY_EXTRA_ML = 500;
/**
 * Clamp for the weight-based default (docs silent): keeps extreme weights sensible.
 * EFSA (2010) adequate total water intake is 2.0 L/day women, 2.5 L/day men, ~80 % from
 * drinks; 1.5–4.0 L of drinks covers that range without excess.
 */
export const WATER_TARGET_MIN_ML = 1500;
export const WATER_TARGET_MAX_ML = 4000;
/** 1-tap glass presets (250 / 500 ml). */
export const GLASS_PRESETS_ML = [250, 500] as const;

export const MIN_REMINDER_INTERVAL_MIN = 45;
/** Longest spacing when on/ahead of pace – "Mức huấn luyện viên quyết định độ dày nhắc". */
export const MAX_REMINDER_INTERVAL_BY_STRICTNESS: Readonly<Record<Strictness, number>> = {
  gentle: 150,
  standard: 120,
  hardcore: 90,
};
/** Reminders stop this long before bed time. */
export const STOP_BEFORE_BED_MIN = 60;

/**
 * Daily water target in ml. `overrideMl` (user setting) replaces the weight-based base;
 * the training-day extra is added on top in both cases.
 */
export function waterTargetMl(input: { weightKg: number; isTrainingDay?: boolean; overrideMl?: number | null }): number {
  let base: number;
  if (input.overrideMl != null && input.overrideMl > 0) {
    base = Math.round(input.overrideMl);
  } else {
    if (!Number.isFinite(input.weightKg) || input.weightKg <= 0) throw new RangeError('weight_must_be_positive');
    const raw = Math.round((input.weightKg * WATER_ML_PER_KG) / 50) * 50;
    base = Math.min(WATER_TARGET_MAX_ML, Math.max(WATER_TARGET_MIN_ML, raw));
  }
  return base + (input.isTrainingDay ? TRAINING_DAY_EXTRA_ML : 0);
}

/** A window without reminders (quiet hours, work hours – D-034). May wrap midnight. */
export interface BlockedWindow {
  start: number | string;
  end: number | string;
}

export interface WaterReminderInput {
  /** Current local time (minutes after midnight). */
  nowMin: number;
  wakeMin: number | string;
  bedMin: number | string;
  consumedMl: number;
  targetMl: number;
  strictness: Strictness;
  glassMl?: number;
  blocked?: readonly BlockedWindow[];
}

export interface WaterReminderPlan {
  status: 'done' | 'outside_window' | 'scheduled';
  expectedByNowMl: number;
  behindMl: number;
  intervalMin: number | null;
  /** Reminder times (minutes after midnight of the wake day; may be ≥ 1440). */
  times: number[];
}

const toMin = (v: number | string): number => (typeof v === 'string' ? parseTimeOfDay(v) : v);

function blockEnd(t: number, blocked: readonly { s: number; e: number }[]): number | null {
  const m = ((t % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  for (const b of blocked) {
    const inside = b.s <= b.e ? m >= b.s && m < b.e : m >= b.s || m < b.e;
    if (inside) return t + ((b.e - m + MINUTES_PER_DAY) % MINUTES_PER_DAY);
  }
  return null;
}

/** Plans the rest of today's water reminders. */
export function waterReminderSchedule(input: WaterReminderInput): WaterReminderPlan {
  const wake = toMin(input.wakeMin);
  let bed = toMin(input.bedMin);
  if (bed <= wake) bed += MINUTES_PER_DAY;
  const windowEnd = bed - STOP_BEFORE_BED_MIN;
  let now = input.nowMin;
  if (now < wake && now + MINUTES_PER_DAY <= bed) now += MINUTES_PER_DAY; // after midnight, before bed

  const target = Math.max(0, input.targetMl);
  const consumed = Math.max(0, input.consumedMl);
  const span = Math.max(1, windowEnd - wake);
  const expected = Math.round(target * Math.min(1, Math.max(0, (now - wake) / span)));
  const behind = Math.max(0, expected - consumed);
  const base = { expectedByNowMl: expected, behindMl: behind };

  if (consumed >= target) return { ...base, status: 'done', intervalMin: null, times: [] };
  if (now >= windowEnd || windowEnd <= wake) return { ...base, status: 'outside_window', intervalMin: null, times: [] };

  const start = Math.max(now, wake);
  const glass = input.glassMl && input.glassMl > 0 ? input.glassMl : GLASS_PRESETS_ML[0];
  const glasses = Math.ceil((target - consumed) / glass);
  const paceInterval = (windowEnd - start) / glasses;
  const maxInterval = MAX_REMINDER_INTERVAL_BY_STRICTNESS[input.strictness];
  const interval = Math.round(Math.min(maxInterval, Math.max(MIN_REMINDER_INTERVAL_MIN, paceInterval)) / 5) * 5;

  const blocked = (input.blocked ?? []).map((b) => ({ s: toMin(b.start), e: toMin(b.end) }));
  const times: number[] = [];
  let t = start + interval;
  while (t <= windowEnd && times.length < glasses) {
    const moved = blockEnd(t, blocked);
    if (moved !== null) {
      t = moved;
      continue;
    }
    times.push(t);
    t += interval;
  }
  if (times.length === 0) return { ...base, status: 'outside_window', intervalMin: interval, times };
  return { ...base, status: 'scheduled', intervalMin: interval, times };
}
