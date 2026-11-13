import { time } from '@aurafit/core';

import { deviceTimeZone } from '@/lib/locale';

/** The user's local calendar date ("YYYY-MM-DD") right now – the value stored in `local_date`. */
export function localToday(now: Date = new Date(), timeZone: string = deviceTimeZone()): string {
  return time.localDate(now, timeZone);
}

/** Minutes after local midnight right now. */
export function localNowMin(now: Date = new Date(), timeZone: string = deviceTimeZone()): number {
  return time.localMinutesOfDay(now, timeZone);
}

/** Postgres `time` ("22:30:00") → "22:30"; null/invalid → null. */
export function shortTime(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return time.formatTimeOfDay(time.parseTimeOfDay(value));
  } catch {
    return null;
  }
}

/** Minutes after midnight for a Postgres `time`, or `fallback` when missing/invalid. */
export function timeToMin(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback;
  try {
    return time.parseTimeOfDay(value);
  } catch {
    return fallback;
  }
}
