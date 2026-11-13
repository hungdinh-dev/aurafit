/**
 * Minimal local-date helpers for plain `YYYY-MM-DD` strings (no time zone involved – the
 * caller already converted to the user's local date). Shared by `coach` and `workout`.
 */
const RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

/** Days since 1970-01-01 for a local date string. Throws on malformed input. */
export function toDayNumber(date: string): number {
  const m = RE.exec(date);
  if (!m) throw new Error(`invalid_local_date:${date}`);
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const back = new Date(ms);
  if (back.getUTCDate() !== Number(m[3])) throw new Error(`invalid_local_date:${date}`);
  return Math.round(ms / DAY_MS);
}

export function fromDayNumber(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromDayNumber(toDayNumber(date) + days);
}

/** `b − a` in days. */
export function diffDays(a: string, b: string): number {
  return toDayNumber(b) - toDayNumber(a);
}

/** ISO weekday: 1 = Monday … 7 = Sunday (same as `task_definitions.days_of_week`). */
export function isoWeekday(date: string): number {
  const dow = new Date(toDayNumber(date) * DAY_MS).getUTCDay();
  return dow === 0 ? 7 : dow;
}

/** Monday of the week containing `date`. */
export function weekStart(date: string): string {
  return addDays(date, 1 - isoWeekday(date));
}

/** `YYYY-MM`. */
export function monthKey(date: string): string {
  toDayNumber(date);
  return date.slice(0, 7);
}
