/**
 * Calendar arithmetic on local-date strings (`YYYY-MM-DD`) and time-of-day values.
 *
 * A `LocalDate` is a plain calendar date with no time zone attached (matches the
 * Postgres `date` columns such as `local_date`, `effective_from`). All arithmetic is
 * done on a UTC-midnight `Date` internally, so it is DST-safe and independent of the
 * machine's time zone.
 */

/** Calendar date string `YYYY-MM-DD`. */
export type LocalDate = string;

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface DateRange {
  /** Inclusive start. */
  start: LocalDate;
  /** Inclusive end. */
  end: LocalDate;
}

const MS_PER_DAY = 86_400_000;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

export const MINUTES_PER_DAY = 1440;

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

/** True when `value` is a real calendar date in `YYYY-MM-DD` form (rejects 2026-02-30). */
export function isValidLocalDate(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1) return false;
  return d <= daysInMonth(y, mo);
}

/** Number of days in a month (`month` is 1–12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Parses a local date to its UTC-midnight epoch milliseconds. Throws on invalid input. */
export function toEpochDay(date: LocalDate): number {
  if (!isValidLocalDate(date)) throw new RangeError(`invalid_local_date:${date}`);
  const m = DATE_RE.exec(date)!;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_PER_DAY;
}

/** Inverse of `toEpochDay`. */
export function fromEpochDay(epochDay: number): LocalDate {
  const d = new Date(epochDay * MS_PER_DAY);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Builds a local date from parts (`month` 1–12). */
export function makeLocalDate(year: number, month: number, day: number): LocalDate {
  const value = `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
  if (!isValidLocalDate(value)) throw new RangeError(`invalid_local_date:${value}`);
  return value;
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromEpochDay(toEpochDay(date) + Math.trunc(days));
}

export function addWeeks(date: LocalDate, weeks: number): LocalDate {
  return addDays(date, Math.trunc(weeks) * 7);
}

/** `b − a` in whole days (positive when `b` is later). */
export function diffDays(a: LocalDate, b: LocalDate): number {
  return toEpochDay(b) - toEpochDay(a);
}

/** −1, 0 or 1 – usable as an `Array.prototype.sort` comparator. */
export function compareDates(a: LocalDate, b: LocalDate): -1 | 0 | 1 {
  const d = toEpochDay(a) - toEpochDay(b);
  return d < 0 ? -1 : d > 0 ? 1 : 0;
}

export function minDate(a: LocalDate, b: LocalDate): LocalDate {
  return compareDates(a, b) <= 0 ? a : b;
}

export function maxDate(a: LocalDate, b: LocalDate): LocalDate {
  return compareDates(a, b) >= 0 ? a : b;
}

/** ISO weekday of a date: 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: LocalDate): IsoWeekday {
  const js = new Date(toEpochDay(date) * MS_PER_DAY).getUTCDay(); // 0 = Sunday
  return (js === 0 ? 7 : js) as IsoWeekday;
}

/** Sunday is the weekly review day (HLT-03 "Mỗi Chủ nhật"). */
export function isSunday(date: LocalDate): boolean {
  return isoWeekday(date) === 7;
}

/** Monday of the week containing `date` (weeks start on Monday). */
export function startOfWeek(date: LocalDate): LocalDate {
  return addDays(date, 1 - isoWeekday(date));
}

/** Sunday of the week containing `date`. */
export function endOfWeek(date: LocalDate): LocalDate {
  return addDays(startOfWeek(date), 6);
}

/** Monday–Sunday range containing `date`. */
export function weekRange(date: LocalDate): DateRange {
  const start = startOfWeek(date);
  return { start, end: addDays(start, 6) };
}

/** The 7 dates (Monday → Sunday) of the week containing `date`. */
export function weekDates(date: LocalDate): LocalDate[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** First … last day of the month containing `date`. */
export function monthRange(date: LocalDate): DateRange {
  const epoch = toEpochDay(date);
  const d = new Date(epoch * MS_PER_DAY);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return { start: makeLocalDate(y, m, 1), end: makeLocalDate(y, m, daysInMonth(y, m)) };
}

/** Every date from `start` to `end`, both inclusive. Empty when `end < start`. */
export function datesBetween(start: LocalDate, end: LocalDate): LocalDate[] {
  const a = toEpochDay(start);
  const b = toEpochDay(end);
  const out: LocalDate[] = [];
  for (let e = a; e <= b; e++) out.push(fromEpochDay(e));
  return out;
}

export function isWithin(date: LocalDate, range: DateRange): boolean {
  return compareDates(date, range.start) >= 0 && compareDates(date, range.end) <= 0;
}

/** Completed years between `birthDate` and `onDate` (profiles store `birth_date`, not age). */
export function ageOn(birthDate: LocalDate, onDate: LocalDate): number {
  toEpochDay(birthDate); // validates
  toEpochDay(onDate);
  const [by, bm, bd] = birthDate.split('-').map(Number) as [number, number, number];
  const [oy, om, od] = onDate.split('-').map(Number) as [number, number, number];
  let age = oy - by;
  if (om < bm || (om === bm && od < bd)) age -= 1;
  return age;
}

/**
 * Parses a time of day (`HH:mm` or Postgres `time` `HH:mm:ss`) to minutes after midnight.
 * Throws on invalid input.
 */
export function parseTimeOfDay(value: string): number {
  const m = TIME_RE.exec(value);
  if (!m) throw new RangeError(`invalid_time_of_day:${value}`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  const s = m[3] === undefined ? 0 : Number(m[3]);
  if (h > 23 || min > 59 || s > 59) throw new RangeError(`invalid_time_of_day:${value}`);
  return h * 60 + min;
}

/** Formats minutes after midnight as `HH:mm` (wraps around 24 h, handles negatives). */
export function formatTimeOfDay(minutes: number): string {
  const m = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

/**
 * Signed shortest distance in minutes from `from` to `to` on a 24 h clock
 * (e.g. 23:50 → 00:10 = +20, 00:10 → 23:50 = −20). Result in (−720, 720].
 */
export function clockDiffMinutes(from: number, to: number): number {
  let d = (((to - from) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  if (d > MINUTES_PER_DAY / 2) d -= MINUTES_PER_DAY;
  return d;
}
