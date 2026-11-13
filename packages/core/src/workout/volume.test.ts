import type { SetLog } from './types';
import { assessVolume, assessWeek, isEffectiveSet, startingWeeklySets, volumeMapBand, volumeSummary, weeklyVolume } from './volume';

const bench = (n: number, extra: Partial<SetLog> = {}): SetLog[] =>
  Array.from({ length: n }, (_, i) => ({
    exerciseSlug: 'barbell_bench_press',
    loadKg: 60,
    reps: 8,
    completedAt: `2026-11-1${i % 5}T10:00:00Z`,
    ...extra,
  }));

describe('weeklyVolume (WRK-13)', () => {
  it('counts primary as 1 set and secondary as 0.5 set', () => {
    const v = weeklyVolume(bench(10));
    expect(v.effectiveSets).toBe(10);
    expect(v.byMuscle.chest).toBe(10);
    expect(v.byMuscle.front_delts).toBe(5);
    expect(v.byMuscle.triceps).toBe(5);
    expect(v.byMuscle.quads).toBe(0);
    expect(v.byHead.chest_middle).toBe(10);
    expect(v.byHead.chest_upper).toBe(5);
    expect(v.byHead.triceps_long).toBe(5);
  });

  it('skips warm-ups, sets far from failure, right-side duplicates and other weeks', () => {
    expect(isEffectiveSet(bench(1, { rir: 5 })[0]!)).toBe(false);
    expect(isEffectiveSet(bench(1, { rpe: 6 })[0]!)).toBe(true);
    const v = weeklyVolume(
      [...bench(2, { isWarmup: true }), ...bench(2, { rir: 5 }), ...bench(1, { side: 'right' }), ...bench(3)],
      { fromIso: '2026-11-09T00:00:00Z', toIso: '2026-11-16T00:00:00Z' },
    );
    expect(v.byMuscle.chest).toBe(3);
    expect(weeklyVolume(bench(3), { fromIso: '2026-11-11T00:00:00Z', toIso: '2026-11-12T00:00:00Z' }).byMuscle.chest).toBe(1);
  });
});

describe('zones & recommendations', () => {
  it('classifies weekly sets per muscle', () => {
    expect(assessVolume('chest', 6)).toMatchObject({ zone: 'below_stimulus', recommendation: 'add_sets' });
    expect(assessVolume('chest', 10)).toMatchObject({ zone: 'effective', recommendation: 'maintain' });
    expect(assessVolume('chest', 20).zone).toBe('effective');
    expect(assessVolume('chest', 22)).toMatchObject({ zone: 'overload_risk', recommendation: 'monitor_recovery' });
    expect(assessVolume('chest', 26)).toMatchObject({ zone: 'overload_risk', recommendation: 'reduce_sets' });
    expect(assessVolume('chest', 8, { setsMin: 6 }).zone).toBe('effective');
  });

  it('assesses a whole week and gives starting goals by level', () => {
    const all = assessWeek(weeklyVolume(bench(10)));
    expect(all).toHaveLength(18);
    expect(all.find((a) => a.muscle === 'chest')?.zone).toBe('effective');
    expect(startingWeeklySets('beginner')).toBe(10);
    expect(startingWeeklySets('intermediate')).toBe(14);
    expect(startingWeeklySets('advanced')).toBe(18);
  });

  it('maps head sets to the WRK-12 colour bands and summarises', () => {
    expect([5, 6, 11, 12, 17, 18].map(volumeMapBand)).toEqual(['low', 'moderate', 'moderate', 'high', 'high', 'very_high']);
    const s = volumeSummary(weeklyVolume(bench(10)));
    expect(s.totalSets).toBe(10);
    expect(s.highest).toEqual({ head: 'chest_middle', sets: 10 });
    expect(s.lowest.sets).toBe(0);
  });
});
