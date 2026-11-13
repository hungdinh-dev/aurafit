/**
 * Time-zone helpers built on `Intl.DateTimeFormat` only (no tz database bundled).
 *
 * Rules (docs/04-database, TONG_HOP §8): timestamps are stored in UTC; every row also
 * carries a `local_date` computed in the user's `profiles.timezone`
 * (default `Asia/Ho_Chi_Minh`). A day is the normal calendar day in that zone; it is
 * *closed* (scored, summaries finalised) at 03:00 the next morning (gamification §3,
 * COA-01), so late-night logging still counts for the previous day.
 */
import { addDays, makeLocalDate, weekRange, parseTimeOfDay, type LocalDate, type DateRange } from './dates';

export const DEFAULT_TIME_ZONE = 'Asia/Ho_Chi_Minh';

/** Local hour (next morning) at which a day is closed and scored – COA-01. */
export const CLOSE_DAY_HOUR = 3;

/** Anything that identifies an instant: `Date`, epoch ms, or an ISO-8601 string with offset/Z. */
export type Instant = Date | number | string;

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** Local calendar date `YYYY-MM-DD`. */
  date: LocalDate;
  /** Minutes after local midnight (0–1439). */
  minutesOfDay: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** Converts an `Instant` to a `Date`, throwing `RangeError` when it is not a valid instant. */
export function toDate(instant: Instant): Date {
  const d = instant instanceof Date ? new Date(instant.getTime()) : new Date(instant);
  if (Number.isNaN(d.getTime())) throw new RangeError(`invalid_instant:${String(instant)}`);
  return d;
}

/** UTC ISO string (what goes into `timestamptz` columns). */
export function toUtcIso(instant: Instant): string {
  return toDate(instant).toISOString();
}

/** True when the runtime's `Intl` knows this IANA zone name. */
export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Wall-clock parts of `instant` in `timeZone`. */
export function zonedParts(instant: Instant, timeZone: string = DEFAULT_TIME_ZONE): ZonedParts {
  const parts = formatter(timeZone).formatToParts(toDate(instant));
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const p = parts.find((x) => x.type === type);
    return p ? Number(p.value) : 0;
  };
  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour') % 24;
  const minute = get('minute');
  const second = get('second');
  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    date: makeLocalDate(year, month, day),
    minutesOfDay: hour * 60 + minute,
  };
}

export interface LocalDateOptions {
  /**
   * Local hour at which the user's day starts (default 0 = calendar midnight). The docs
   * use the calendar day for `local_date`; this exists for callers that deliberately
   * want a shifted boundary (e.g. treat 01:30 as "still last night").
   */
  dayStartHour?: number;
}

/** The user's local calendar date for an instant – the value stored in `local_date`. */
export function localDate(
  instant: Instant,
  timeZone: string = DEFAULT_TIME_ZONE,
  options: LocalDateOptions = {},
): LocalDate {
  const shiftMs = (options.dayStartHour ?? 0) * 3_600_000;
  return zonedParts(toDate(instant).getTime() - shiftMs, timeZone).date;
}

/** Minutes after local midnight (0–1439) for an instant. */
export function localMinutesOfDay(instant: Instant, timeZone: string = DEFAULT_TIME_ZONE): number {
  return zonedParts(instant, timeZone).minutesOfDay;
}

/** Offset of `timeZone` from UTC at `instant`, in minutes (Asia/Ho_Chi_Minh → +420). */
export function timeZoneOffsetMinutes(instant: Instant, timeZone: string = DEFAULT_TIME_ZONE): number {
  const d = toDate(instant);
  const p = zonedParts(d, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const truncated = Math.floor(d.getTime() / 1000) * 1000;
  return Math.round((asUtc - truncated) / 60_000);
}

/**
 * UTC instant of a local wall-clock time. `time` is minutes after midnight or `HH:mm`.
 * For a wall time skipped by a DST jump the result lands after the gap; for a repeated
 * wall time the first occurrence is used.
 */
export function zonedTimeToUtc(
  date: LocalDate,
  time: number | string,
  timeZone: string = DEFAULT_TIME_ZONE,
): Date {
  const minutes = typeof time === 'string' ? parseTimeOfDay(time) : time;
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  makeLocalDate(y, m, d); // validates
  const guess = Date.UTC(y, m - 1, d, 0, 0, 0) + minutes * 60_000;
  const off1 = timeZoneOffsetMinutes(guess, timeZone);
  let t = guess - off1 * 60_000;
  const off2 = timeZoneOffsetMinutes(t, timeZone);
  if (off2 !== off1) t = guess - off2 * 60_000;
  return new Date(t);
}

/** `[start, end)` of a local day in UTC. */
export function localDayBounds(
  date: LocalDate,
  timeZone: string = DEFAULT_TIME_ZONE,
): { startUtc: Date; endUtc: Date } {
  return {
    startUtc: zonedTimeToUtc(date, 0, timeZone),
    endUtc: zonedTimeToUtc(addDays(date, 1), 0, timeZone),
  };
}

/** UTC instant at which `date` is closed: 03:00 local on the following day. */
export function closeDayInstant(
  date: LocalDate,
  timeZone: string = DEFAULT_TIME_ZONE,
  closeHour: number = CLOSE_DAY_HOUR,
): Date {
  return zonedTimeToUtc(addDays(date, 1), closeHour * 60, timeZone);
}

/** True once `date` has passed its close time (no more score-affecting edits). */
export function isDayClosed(
  date: LocalDate,
  now: Instant,
  timeZone: string = DEFAULT_TIME_ZONE,
  closeHour: number = CLOSE_DAY_HOUR,
): boolean {
  return toDate(now).getTime() >= closeDayInstant(date, timeZone, closeHour).getTime();
}

/** Most recent local date that is already closed at `now` (what `close-day` should finalise). */
export function latestClosedDate(
  now: Instant,
  timeZone: string = DEFAULT_TIME_ZONE,
  closeHour: number = CLOSE_DAY_HOUR,
): LocalDate {
  const today = localDate(now, timeZone);
  const yesterday = addDays(today, -1);
  return isDayClosed(yesterday, now, timeZone, closeHour) ? yesterday : addDays(today, -2);
}

/**
 * Dates that still accept logs that count for scoring: always today, plus yesterday
 * between local midnight and 03:00. Oldest first.
 */
export function openDates(
  now: Instant,
  timeZone: string = DEFAULT_TIME_ZONE,
  closeHour: number = CLOSE_DAY_HOUR,
): LocalDate[] {
  const today = localDate(now, timeZone);
  const yesterday = addDays(today, -1);
  return isDayClosed(yesterday, now, timeZone, closeHour) ? [today] : [yesterday, today];
}

/** Monday–Sunday week containing the user's current local date. */
export function currentWeek(now: Instant, timeZone: string = DEFAULT_TIME_ZONE): DateRange {
  return weekRange(localDate(now, timeZone));
}
