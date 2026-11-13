/**
 * Trend weight (HLT-02, D-020, lifestyle.md §2). Scale weight swings ±1–2 kg a day, so the
 * app shows and uses a smoothed trend: an exponentially weighted moving average
 * ("trung bình trượt có trọng số"). Smoothing factor 0.1 per weigh-in as in John Walker's
 * "The Hacker's Diet" (also used by Libra / Happy Scale):
 *   trend_today = trend_prev + 0.1 × (weight_today − trend_prev)
 * Days without a weigh-in carry the trend forward unchanged.
 */
import { addDays, compareDates, datesBetween, diffDays, type LocalDate } from '../time';

export const TREND_SMOOTHING = 0.1;

export interface WeighIn {
  date: LocalDate;
  weightKg: number;
}

export interface TrendPoint {
  date: LocalDate;
  /** Weight measured that day (mean if several), `null` on carried-forward days. */
  weightKg: number | null;
  /** Trend weight, 2 decimals (`daily_summaries.weight_trend_kg` is numeric(5,2)). */
  trendKg: number;
}

export interface WeightTrendOptions {
  alpha?: number;
  /** Extend the series (carrying the trend) up to this date. */
  until?: LocalDate;
  /** Emit a point for every day (default) or only for weigh-in days. */
  fillGaps?: boolean;
}

const round2 = (x: number): number => Math.round(x * 100) / 100;

/** Mean weight per date, sorted, invalid values dropped. */
export function dailyWeights(weighIns: readonly WeighIn[]): WeighIn[] {
  const acc = new Map<LocalDate, { sum: number; n: number }>();
  for (const w of weighIns) {
    if (!Number.isFinite(w.weightKg) || w.weightKg <= 0) continue;
    const a = acc.get(w.date) ?? { sum: 0, n: 0 };
    a.sum += w.weightKg;
    a.n += 1;
    acc.set(w.date, a);
  }
  return [...acc.entries()]
    .map(([date, a]) => ({ date, weightKg: a.sum / a.n }))
    .sort((x, y) => compareDates(x.date, y.date));
}

/** EMA trend series starting at the first weigh-in. Empty input → empty series. */
export function weightTrend(weighIns: readonly WeighIn[], options: WeightTrendOptions = {}): TrendPoint[] {
  const alpha = options.alpha ?? TREND_SMOOTHING;
  if (!(alpha > 0 && alpha <= 1)) throw new RangeError('alpha_out_of_range');
  const days = dailyWeights(weighIns);
  const first = days[0];
  if (!first) return [];
  const last = days[days.length - 1]!;
  const end = options.until && compareDates(options.until, last.date) > 0 ? options.until : last.date;
  const byDate = new Map(days.map((d) => [d.date, d.weightKg]));

  const out: TrendPoint[] = [];
  let trend = first.weightKg;
  for (const date of datesBetween(first.date, end)) {
    const w = byDate.get(date);
    if (w !== undefined) {
      if (date !== first.date) trend += alpha * (w - trend);
      out.push({ date, weightKg: Math.round(w * 10) / 10, trendKg: round2(trend) });
    } else if (options.fillGaps !== false) {
      out.push({ date, weightKg: null, trendKg: round2(trend) });
    }
  }
  return out;
}

/** Trend on `date` (last point at or before it), `null` if the series starts later. */
export function trendOn(points: readonly TrendPoint[], date: LocalDate): number | null {
  let found: number | null = null;
  for (const p of points) {
    if (compareDates(p.date, date) <= 0) found = p.trendKg;
    else break;
  }
  return found;
}

/**
 * Observed rate (kg/week, signed) over the last `windowDays` (default 28 – "tốc độ 4 tuần
 * gần nhất"): least-squares slope of the trend on weigh-in days. Needs ≥ `minPoints`
 * weigh-ins spanning ≥ `minSpanDays`, else `null`.
 */
export function trendRateKgPerWeek(
  points: readonly TrendPoint[],
  asOf: LocalDate,
  options: { windowDays?: number; minPoints?: number; minSpanDays?: number } = {},
): number | null {
  const windowDays = options.windowDays ?? 28;
  const from = addDays(asOf, -(windowDays - 1));
  const pts = points.filter(
    (p) => p.weightKg !== null && compareDates(p.date, from) >= 0 && compareDates(p.date, asOf) <= 0,
  );
  if (pts.length < (options.minPoints ?? 4)) return null;
  const xs = pts.map((p) => diffDays(from, p.date));
  const span = xs[xs.length - 1]! - xs[0]!;
  if (span < (options.minSpanDays ?? 14)) return null;
  const n = pts.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = pts.reduce((a, p) => a + p.trendKg, 0) / n;
  let num = 0;
  let den = 0;
  pts.forEach((p, i) => {
    const dx = xs[i]! - mx;
    num += dx * (p.trendKg - my);
    den += dx * dx;
  });
  return den === 0 ? null : Math.round((num / den) * 7 * 1000) / 1000;
}
