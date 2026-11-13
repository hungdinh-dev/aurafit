import { addDays } from '../time';
import { TREND_SMOOTHING, dailyWeights, trendOn, trendRateKgPerWeek, weightTrend } from './weightTrend';

describe('dailyWeights', () => {
  it('averages same-day weigh-ins, drops invalid values, sorts', () => {
    expect(
      dailyWeights([
        { date: '2026-11-02', weightKg: 79 },
        { date: '2026-11-01', weightKg: 80 },
        { date: '2026-11-01', weightKg: 81 },
        { date: '2026-11-03', weightKg: Number.NaN },
        { date: '2026-11-03', weightKg: 0 },
      ]),
    ).toEqual([
      { date: '2026-11-01', weightKg: 80.5 },
      { date: '2026-11-02', weightKg: 79 },
    ]);
  });
});

describe('weightTrend (EMA, α = 0.1)', () => {
  const weighIns = [
    { date: '2026-11-01', weightKg: 80 },
    { date: '2026-11-02', weightKg: 79 },
    { date: '2026-11-04', weightKg: 78 },
  ];

  it('smooths and carries the trend across gaps', () => {
    expect(TREND_SMOOTHING).toBe(0.1);
    // d1 80 · d2 80 + 0.1(79 − 80) = 79.9 · d3 carry · d4 79.9 + 0.1(78 − 79.9) = 79.71
    expect(weightTrend(weighIns)).toEqual([
      { date: '2026-11-01', weightKg: 80, trendKg: 80 },
      { date: '2026-11-02', weightKg: 79, trendKg: 79.9 },
      { date: '2026-11-03', weightKg: null, trendKg: 79.9 },
      { date: '2026-11-04', weightKg: 78, trendKg: 79.71 },
    ]);
  });

  it('a single outlier moves the trend only 10 %', () => {
    const t = weightTrend([
      { date: '2026-11-01', weightKg: 70 },
      { date: '2026-11-02', weightKg: 72 }, // +2 kg water/salt swing
    ]);
    expect(t[1]!.trendKg).toBe(70.2);
  });

  it('extends to `until`, can skip gap days, rejects bad alpha, handles empty input', () => {
    expect(weightTrend(weighIns, { until: '2026-11-06' })).toHaveLength(6);
    expect(weightTrend(weighIns, { fillGaps: false }).map((p) => p.date)).toEqual(['2026-11-01', '2026-11-02', '2026-11-04']);
    expect(() => weightTrend(weighIns, { alpha: 0 })).toThrow(RangeError);
    expect(weightTrend([])).toEqual([]);
  });

  it('trendOn returns the last value at or before a date', () => {
    const t = weightTrend(weighIns, { fillGaps: false });
    expect(trendOn(t, '2026-10-31')).toBeNull();
    expect(trendOn(t, '2026-11-03')).toBe(79.9);
    expect(trendOn(t, '2026-12-01')).toBe(79.71);
  });
});

describe('trendRateKgPerWeek', () => {
  // Steady loss of 0.1 kg/day for 60 days → ≈ −0.7 kg/week once the EMA has warmed up
  const start = '2026-09-01';
  const linear = Array.from({ length: 60 }, (_, i) => ({ date: addDays(start, i), weightKg: 80 - 0.1 * i }));
  const asOf = addDays(start, 59);

  it('recovers the slope over the last 4 weeks', () => {
    const rate = trendRateKgPerWeek(weightTrend(linear), asOf);
    expect(rate).not.toBeNull();
    expect(rate!).toBeCloseTo(-0.7, 1);
  });

  it('flat weight → 0', () => {
    const flat = linear.map((w) => ({ ...w, weightKg: 70 }));
    expect(trendRateKgPerWeek(weightTrend(flat), asOf)).toBe(0);
  });

  it('null with too few weigh-ins or too short a span', () => {
    const few = linear.filter((_, i) => i === 40 || i === 50 || i === 59);
    expect(trendRateKgPerWeek(weightTrend(few), asOf)).toBeNull();
    const short = linear.slice(50);
    expect(trendRateKgPerWeek(weightTrend(short), asOf)).toBeNull();
  });
});
