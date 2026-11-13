import { bestEstimatedOneRm, brzycki, detectPersonalRecords, epley, estimateOneRm, loadForReps } from './oneRm';
import type { SetLog } from './types';

const set = (loadKg: number, reps: number, extra: Partial<SetLog> = {}): SetLog => ({
  exerciseSlug: 'barbell_bench_press',
  loadKg,
  reps,
  completedAt: '2026-11-12T10:00:00Z',
  ...extra,
});

describe('1RM formulas', () => {
  it('computes Epley and Brzycki', () => {
    expect(epley(100, 5)).toBeCloseTo(116.67, 2);
    expect(brzycki(100, 5)).toBeCloseTo(112.5, 2);
    expect(epley(100, 1)).toBe(100);
  });

  it('only estimates from 1–10 reps (WRK-07)', () => {
    expect(estimateOneRm(100, 10)).toBeCloseTo(133.33, 2);
    expect(estimateOneRm(100, 11)).toBeNull();
    expect(estimateOneRm(100, 0)).toBeNull();
    expect(estimateOneRm(0, 5)).toBeNull();
    expect(estimateOneRm(100, 5, 'brzycki')).toBe(112.5);
    expect(estimateOneRm(100, 5, 'average')).toBeCloseTo(114.58, 2);
  });

  it('inverts Epley with RIR', () => {
    expect(loadForReps(120, 5, 1)).toBeCloseTo(100, 5);
    expect(loadForReps(120, 1, 0)).toBe(120);
  });
});

describe('bestEstimatedOneRm', () => {
  it('ignores warm-ups and high-rep sets', () => {
    const best = bestEstimatedOneRm([set(60, 10, { isWarmup: true }), set(80, 12), set(90, 5), set(85, 8)]);
    expect(best?.oneRmKg).toBeCloseTo(107.67, 2);
    expect(best?.set.loadKg).toBe(85);
  });

  it('adds bodyweight + belt for weighted pull-ups', () => {
    const best = bestEstimatedOneRm([set(0, 5, { exerciseSlug: 'pull_up', loadKg: null, addedLoadKg: 10 })], { bodyweightKg: 70 });
    expect(best?.oneRmKg).toBeCloseTo(93.33, 2);
  });

  it('returns null when nothing is eligible', () => {
    expect(bestEstimatedOneRm([set(50, 15)])).toBeNull();
  });
});

describe('detectPersonalRecords', () => {
  it('reports beaten records only', () => {
    const hits = detectPersonalRecords([set(90, 5), set(80, 9)], { max_load: 90, est_1rm: 100, max_reps: 12 });
    expect(hits.map((h) => h.kind)).toEqual(['est_1rm']);
    expect(hits[0]?.value).toBe(105);
    expect(hits[0]?.previous).toBe(100);
  });

  it('does not celebrate a first-ever value unless asked', () => {
    expect(detectPersonalRecords([set(50, 5)], {})).toEqual([]);
    expect(detectPersonalRecords([set(50, 5)], {}, { countFirstAsPr: true }).length).toBe(3);
  });

  it('tracks max time for holds', () => {
    const hits = detectPersonalRecords(
      [{ exerciseSlug: 'plank', loadKg: null, reps: null, durationSec: 75, completedAt: '2026-11-12T10:00:00Z' }],
      { max_time: 60 },
    );
    expect(hits).toEqual([expect.objectContaining({ kind: 'max_time', value: 75 })]);
  });
});
