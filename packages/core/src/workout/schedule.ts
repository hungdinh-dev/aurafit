/**
 * WRK-15 – weekly vs rotation (A → B → C) scheduling. In rotation mode a missed day does not
 * skip a session: the next session stays the same until it is done (EXT-05; training each
 * muscle ≥ 2×/week beats 1×, Schoenfeld 2016 [12]).
 */
import { diffDays, isoWeekday, weekStart } from '../coach/localDate';
import type { ScheduleMode } from './types';

/** Default training weekdays (1 = Mon … 7 = Sun), spread to leave rest days between sessions. */
export const DEFAULT_WEEKDAYS: Readonly<Record<number, readonly number[]>> = {
  1: [3],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
  7: [1, 2, 3, 4, 5, 6, 7],
};

export function defaultWeekdays(daysPerWeek: number): number[] {
  const days = DEFAULT_WEEKDAYS[Math.min(7, Math.max(1, Math.round(daysPerWeek)))];
  return [...(days ?? [])];
}

/** Index of the session after `completedIndex` (wraps A → B → C → A). */
export function nextRotationIndex(completedIndex: number, sessionCount: number): number {
  if (sessionCount <= 0) throw new Error('no_sessions');
  return (((completedIndex + 1) % sessionCount) + sessionCount) % sessionCount;
}

/** Upcoming session indexes in rotation order, starting at `startIndex`. */
export function rotationSequence(startIndex: number, count: number, sessionCount: number): number[] {
  return Array.from({ length: count }, (_, i) => (startIndex + i) % sessionCount);
}

export interface WeekdaySession {
  index: number;
  /** 1 = Monday … 7 = Sunday. */
  dayOfWeek: number;
}

export type TodayPlanInput =
  | { mode: Extract<ScheduleMode, 'weekday'>; today: string; sessions: readonly WeekdaySession[] }
  | {
      mode: Extract<ScheduleMode, 'rotation'>;
      today: string;
      nextRotationIndex: number;
      daysPerWeek: number;
      lastCompletedDate: string | null;
      /** Sessions completed since Monday of `today`'s week. */
      completedThisWeek: number;
    };

export interface TodayPlan {
  /** Session index to train today, or `null` (rest day / nothing due). */
  sessionIndex: number | null;
  /** True when today counts as a scheduled training day (daily score: training pillar). */
  isScheduledDay: boolean;
}

/**
 * Rotation: a session is "due" when the weekly target is not yet met and either enough rest has
 * passed since the last session (⌊7 / days⌋ days) or the remaining days of the week are needed
 * to reach the target. Users may still train on a non-due day.
 */
export function isRotationSessionDue(input: {
  today: string;
  daysPerWeek: number;
  lastCompletedDate: string | null;
  completedThisWeek: number;
}): boolean {
  const remainingTarget = input.daysPerWeek - input.completedThisWeek;
  if (remainingTarget <= 0) return false;
  if (input.lastCompletedDate === input.today) return false;
  const daysLeftInclToday = 8 - isoWeekday(input.today);
  if (daysLeftInclToday <= remainingTarget) return true;
  if (input.lastCompletedDate === null) return true;
  const gap = Math.max(1, Math.floor(7 / input.daysPerWeek));
  return diffDays(input.lastCompletedDate, input.today) >= gap;
}

export function planToday(input: TodayPlanInput): TodayPlan {
  if (input.mode === 'weekday') {
    const dow = isoWeekday(input.today);
    const s = input.sessions.find((x) => x.dayOfWeek === dow);
    return { sessionIndex: s ? s.index : null, isScheduledDay: s !== undefined };
  }
  const due = isRotationSessionDue(input);
  return { sessionIndex: due ? input.nextRotationIndex : null, isScheduledDay: due };
}

/**
 * Rotation pointer after a completed session. Completing a different session than the
 * suggested one (manual pick) continues the rotation from the completed one.
 */
export function advanceRotation(completedIndex: number, sessionCount: number): number {
  return nextRotationIndex(completedIndex, sessionCount);
}

/** Count of sessions completed in the Monday-based week of `today`. */
export function completedInWeek(completedDates: readonly string[], today: string): number {
  const start = weekStart(today);
  return completedDates.filter((d) => d >= start && d <= today).length;
}
