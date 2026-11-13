/**
 * Chart shaping for the Progress screen (PRG-02 / PRG-03 / PRG-04): bars, score heatmap and the
 * weekly review. Pure functions – values come from server summaries / daily_scores.
 */
import { time } from '@aurafit/core';

export type Metric = 'kcal' | 'protein' | 'water' | 'sleep' | 'weight';
export type Range = 'day' | 'week' | 'month' | 'year';

export interface BarInput {
  key: string;
  label: string;
  value: number | null;
}

export interface Bar extends BarInput {
  /** 0–1 height relative to the chart max. */
  ratio: number;
  /** More than 10 % over the target (drawn orange). */
  over: boolean;
}

export interface BarChart {
  bars: Bar[];
  avg: number | null;
  max: number;
  /** Target line as a 0–1 ratio, when a target exists. */
  targetRatio: number | null;
}

export const OVER_TARGET = 1.1;

export function buildBars(input: readonly BarInput[], target: number | null = null): BarChart {
  const values = input.map((b) => b.value).filter((v): v is number => v !== null && v > 0);
  const max = Math.max(1, ...values, target ?? 0) * 1.1;
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  return {
    bars: input.map((b) => ({
      ...b,
      ratio: b.value && b.value > 0 ? b.value / max : 0,
      over: target !== null && b.value !== null && b.value > target * OVER_TARGET,
    })),
    avg,
    max,
    targetRatio: target ? target / max : null,
  };
}

export interface HeatCell {
  date: string;
  /** null = no score (future / not closed). */
  score: number | null;
  /** 0–4 colour step. */
  level: number;
}

/** Score → 0–4 step (0 = none/low). */
export function heatLevel(score: number | null): number {
  if (score === null) return 0;
  if (score >= 90) return 4;
  if (score >= 75) return 3;
  if (score >= 60) return 2;
  if (score > 0) return 1;
  return 0;
}

/** `weeks` columns (Monday-first) ending with the week of `today`. */
export function heatmapWeeks(scores: ReadonlyMap<string, number>, today: string, weeks = 18): HeatCell[][] {
  const start = time.addDays(time.startOfWeek(today), -7 * (weeks - 1));
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = time.addDays(start, w * 7 + d);
      const score = date > today ? null : (scores.get(date) ?? null);
      return { date, score, level: heatLevel(score) };
    })
  );
}

export interface ScoreRow {
  localDate: string;
  total: number;
  result: string;
}

export interface WeeklyReview {
  avg: number;
  passed: number;
  days: number;
  best: ScoreRow;
}

/** Summary of the scored days in [weekStart, weekStart + 6]. */
export function weeklyReview(rows: readonly ScoreRow[], weekStart: string): WeeklyReview | null {
  const end = time.addDays(weekStart, 6);
  const week = rows.filter((r) => r.localDate >= weekStart && r.localDate <= end);
  if (week.length === 0) return null;
  const best = week.reduce((a, b) => (b.total > a.total ? b : a));
  return {
    avg: Math.round(week.reduce((s, r) => s + r.total, 0) / week.length),
    passed: week.filter((r) => r.result !== 'fail').length,
    days: week.length,
    best,
  };
}
