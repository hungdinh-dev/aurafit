// Timezone helpers (no dependencies). Dates are 'YYYY-MM-DD' strings in the
// user's timezone; instants are Date objects (UTC).
// TODO: switch to `@aurafit/core` time helpers once packages/core/src/time lands.

const formatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

function zonedParts(instant: Date, timeZone: string) {
  const parts: Record<string, string> = {};
  for (const p of partsFormatter(timeZone).formatToParts(instant)) parts[p.type] = p.value;
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

function ymd(localDate: string): [number, number, number] {
  const [y, m, d] = localDate.split('-').map(Number);
  return [y ?? 1970, m ?? 1, d ?? 1];
}

/** Local calendar date of an instant in a timezone. */
export function localDateOf(instant: Date, timeZone: string): string {
  const p = zonedParts(instant, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Local wall-clock 'HH:MM' of an instant. */
export function localTimeOf(instant: Date, timeZone: string): string {
  const p = zonedParts(instant, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Offset (ms) of the timezone at an instant: local − UTC. */
function offsetMs(instant: Date, timeZone: string): number {
  const p = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** UTC instant of local midnight at the start of `localDate`. */
export function startOfLocalDay(localDate: string, timeZone: string): Date {
  const [y, m, d] = ymd(localDate);
  const guess = Date.UTC(y, m - 1, d);
  let ts = guess - offsetMs(new Date(guess), timeZone);
  ts = guess - offsetMs(new Date(ts), timeZone); // DST correction
  return new Date(ts);
}

export function addDays(localDate: string, days: number): string {
  const [y, m, d] = ymd(localDate);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(localDate: string): number {
  const [y, m, d] = ymd(localDate);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dow === 0 ? 7 : dow;
}

export function startOfIsoWeek(localDate: string): string {
  return addDays(localDate, 1 - isoWeekday(localDate));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** 'HH:MM[:SS]' → minutes after midnight. */
export function minutesOfDay(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
