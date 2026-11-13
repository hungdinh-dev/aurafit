/**
 * Canonical health samples (D-019, lifestyle.md §1, docs/04-database/03-health.md) and
 * multi-source de-duplication (HLT-05 / HLT-06).
 *
 * Rules from the docs:
 * - Re-imports never duplicate: unique (`source`, `source_id`) when `source_id` is set.
 * - Same metric, same day from several sources: device > manual (user can change).
 *   Priority is applied at aggregation time; raw rows are never deleted.
 * Implementation: per (type, local_date) exactly ONE source is used – values from different
 * sources are never added together, so Apple Watch + manual cannot double count.
 */
import { localDate, DEFAULT_TIME_ZONE, type Instant } from '../time';
import type { LocalDate } from '../time';

export type HealthMetric = 'weight' | 'water' | 'sleep_session' | 'steps' | 'active_energy' | 'resting_hr';
export type HealthUnit = 'kg' | 'ml' | 'min' | 'count' | 'kcal' | 'bpm';
/** `health_samples.source` (garmin / google_fit reserved for later adapters). */
export type HealthSource = 'manual' | 'apple_health' | 'garmin' | 'google_fit';

export const CANONICAL_UNIT: Readonly<Record<HealthMetric, HealthUnit>> = {
  weight: 'kg',
  water: 'ml',
  sleep_session: 'min',
  steps: 'count',
  active_energy: 'kcal',
  resting_hr: 'bpm',
};

/** Default order: devices before manual entry (docs: "thiết bị > nhập tay"). */
export const DEFAULT_SOURCE_PRIORITY: readonly HealthSource[] = ['apple_health', 'garmin', 'google_fit', 'manual'];

/** Per-metric override of the source order (user setting). */
export type SourcePriority = Partial<Record<HealthMetric, readonly HealthSource[]>>;

/** A `health_samples` row (timestamps are UTC ISO strings). */
export interface HealthSample {
  id?: string;
  type: HealthMetric;
  value: number;
  unit: HealthUnit;
  start_at: string;
  end_at?: string | null;
  local_date: LocalDate;
  source: HealthSource;
  source_id?: string | null;
  /** e.g. `{ quality: 1–5 }` for sleep, stages, device name… */
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export function isDeviceSource(source: HealthSource): boolean {
  return source !== 'manual';
}

/**
 * `local_date` for a new sample: sleep counts for the day you wake up (end time), every
 * other metric for its start time.
 */
export function sampleLocalDate(
  sample: { type: HealthMetric; start_at: Instant; end_at?: Instant | null },
  timeZone: string = DEFAULT_TIME_ZONE,
): LocalDate {
  const at = sample.type === 'sleep_session' && sample.end_at != null ? sample.end_at : sample.start_at;
  return localDate(at, timeZone);
}

const UNIT_FACTORS: Readonly<Record<string, { unit: HealthUnit; factor: number }>> = {
  kg: { unit: 'kg', factor: 1 },
  g: { unit: 'kg', factor: 0.001 },
  lb: { unit: 'kg', factor: 0.45359237 },
  ml: { unit: 'ml', factor: 1 },
  l: { unit: 'ml', factor: 1000 },
  fl_oz: { unit: 'ml', factor: 29.5735295625 },
  min: { unit: 'min', factor: 1 },
  s: { unit: 'min', factor: 1 / 60 },
  h: { unit: 'min', factor: 60 },
  count: { unit: 'count', factor: 1 },
  kcal: { unit: 'kcal', factor: 1 },
  kj: { unit: 'kcal', factor: 1 / 4.184 },
  bpm: { unit: 'bpm', factor: 1 },
};

/**
 * Converts an adapter value into the metric's canonical unit (kg, ml, min, count, kcal,
 * bpm). Throws `RangeError` for an unknown unit or one that does not fit the metric.
 */
export function toCanonicalValue(metric: HealthMetric, value: number, unit: string): number {
  const f = UNIT_FACTORS[unit.toLowerCase()];
  if (!f || f.unit !== CANONICAL_UNIT[metric]) throw new RangeError(`unsupported_unit:${metric}:${unit}`);
  return value * f.factor;
}

/** Drops repeated imports: keeps the first row per (`source`, `source_id`). Rows without `source_id` are kept. */
export function dedupeBySourceId<T extends HealthSample>(samples: readonly T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const s of samples) {
    if (s.source_id) {
      const key = `${s.source}\u0000${s.source_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(s);
  }
  return out;
}

/** Rank of a source for a metric (lower wins). Unlisted device sources rank just above `manual`. */
export function sourceRank(metric: HealthMetric, source: HealthSource, priority: SourcePriority = {}): number {
  const order = priority[metric] ?? DEFAULT_SOURCE_PRIORITY;
  const i = order.indexOf(source);
  if (i >= 0) return i;
  const manualIdx = order.indexOf('manual');
  if (isDeviceSource(source) && manualIdx >= 0) return manualIdx - 0.5;
  return order.length;
}

/** The single source to use for one metric on one day, or `null` when there are no samples. */
export function pickSource(
  metric: HealthMetric,
  samples: readonly Pick<HealthSample, 'source'>[],
  priority: SourcePriority = {},
): HealthSource | null {
  let best: HealthSource | null = null;
  let bestRank = Infinity;
  for (const s of samples) {
    const r = sourceRank(metric, s.source, priority);
    if (r < bestRank) {
      best = s.source;
      bestRank = r;
    }
  }
  return best;
}

/**
 * De-duplicates by `source_id`, then keeps, for every (type, local_date), only the samples
 * of the preferred source. Input order is preserved.
 */
export function selectPreferredSamples<T extends HealthSample>(
  samples: readonly T[],
  priority: SourcePriority = {},
): T[] {
  const unique = dedupeBySourceId(samples);
  const groups = new Map<string, T[]>();
  for (const s of unique) {
    const key = `${s.type}\u0000${s.local_date}`;
    const g = groups.get(key);
    if (g) g.push(s);
    else groups.set(key, [s]);
  }
  const chosen = new Map<string, HealthSource | null>();
  for (const [key, g] of groups) chosen.set(key, pickSource(g[0]!.type, g, priority));
  return unique.filter((s) => chosen.get(`${s.type}\u0000${s.local_date}`) === s.source);
}
