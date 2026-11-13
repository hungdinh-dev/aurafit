import {
  computeHeadRecovery,
  computeMuscleRecovery,
  explainHead,
  mostFatigued,
  readyGroups,
  recoveryBand,
  recoveryHoursMultiplier,
  setIntensity,
} from './recovery';
import type { SetLog } from './types';

const T0 = '2026-11-12T10:00:00.000Z';
const at = (minutes: number): string => new Date(Date.parse(T0) + minutes * 60_000).toISOString();
const hoursAfter = (h: number): string => new Date(Date.parse(T0) + h * 3_600_000).toISOString();

// "Thứ Năm 12/11 · Đẩy ngực dốc lên · 4 set 50 kg × 8–10 → ngực trên +44" (TONG_HOP WRK-11).
const incline: SetLog[] = [10, 10, 10, 8].map((reps, i) => ({
  exerciseSlug: 'incline_barbell_bench_press',
  sessionId: 's1',
  loadKg: 50,
  reps,
  completedAt: at(i * 3),
}));
const opts = { repMaxBySlug: { incline_barbell_bench_press: 10 } };

describe('set intensity', () => {
  it('is 1.0 at the top of the range or RPE ≥ 8, 0.7 otherwise, 0 for warm-ups', () => {
    expect(setIntensity({ exerciseSlug: 'barbell_bench_press', loadKg: 60, reps: 10, completedAt: T0 }, 10)).toBe(1);
    expect(setIntensity({ exerciseSlug: 'barbell_bench_press', loadKg: 60, reps: 8, rpe: 8, completedAt: T0 }, 10)).toBe(1);
    expect(setIntensity({ exerciseSlug: 'barbell_bench_press', loadKg: 60, reps: 8, completedAt: T0 }, 10)).toBe(0.7);
    expect(setIntensity({ exerciseSlug: 'barbell_bench_press', loadKg: 40, reps: 10, isWarmup: true, completedAt: T0 })).toBe(0);
  });
});

describe('computeHeadRecovery (WRK-10/11)', () => {
  it('reproduces the doc example: upper chest +44, lower chest barely touched', () => {
    const now = at(10);
    const heads = computeHeadRecovery(incline, now, opts);
    expect(heads.chest_upper.fatigue).toBeCloseTo(44.4, 0);
    expect(heads.chest_middle.fatigue).toBeCloseTo(26.6, 0);
    expect(heads.chest_lower.fatigue).toBeCloseTo(8.9, 0);
    expect(heads.chest_upper.band).toBe('moderate');
    expect(heads.chest_lower.band).toBe('ready');
    expect(heads.chest_upper.lastTrainedAt).toBe(at(9));
    expect(heads.rectus_femoris.fatigue).toBe(0);
  });

  it('decays to ≤ 20 % of the initial fatigue after base recovery hours (72 h for chest)', () => {
    const heads = computeHeadRecovery(incline, hoursAfter(72 + 0.15), opts);
    expect(heads.chest_upper.fatigue).toBeCloseTo(44.4 * 0.2, 0);
    expect(heads.chest_upper.band).toBe('ready');
    expect(heads.chest_upper.readyAt).toBeNull();
  });

  it('reports time until ready', () => {
    const heads = computeHeadRecovery(incline, hoursAfter(24), opts);
    expect(heads.chest_upper.band).toBe('light');
    expect(heads.chest_upper.hoursUntilReady).toBeGreaterThan(11);
    expect(heads.chest_upper.hoursUntilReady).toBeLessThan(12.5);
    expect(heads.chest_upper.readyAt).not.toBeNull();
  });

  it('caps fatigue at 100 and ignores sets older than 7 days or in the future', () => {
    const many: SetLog[] = Array.from({ length: 12 }, (_, i) => ({
      exerciseSlug: 'barbell_bench_press',
      loadKg: 60,
      reps: 12,
      completedAt: at(i),
    }));
    expect(computeHeadRecovery(many, at(12)).chest_middle.fatigue).toBe(100);
    expect(computeHeadRecovery(many, hoursAfter(24 * 8)).chest_middle.fatigue).toBe(0);
    expect(computeHeadRecovery(many, hoursAfter(-1)).chest_middle.fatigue).toBe(0);
  });

  it('slows recovery after short sleep and speeds it with protein', () => {
    expect(recoveryHoursMultiplier({ sleptBelowTarget: true })).toBeCloseTo(1.15);
    expect(recoveryHoursMultiplier({ sleptBelowTarget: true, proteinMetYesterday: true, beginnerFirst4Weeks: true })).toBeCloseTo(1.1385);
    const base = computeHeadRecovery(incline, hoursAfter(24), opts).chest_upper.fatigue;
    const tired = computeHeadRecovery(incline, hoursAfter(24), { ...opts, modifiers: { sleptBelowTarget: true } }).chest_upper.fatigue;
    const fed = computeHeadRecovery(incline, hoursAfter(24), { ...opts, modifiers: { proteinMetYesterday: true } }).chest_upper.fatigue;
    expect(tired).toBeGreaterThan(base);
    expect(fed).toBeLessThan(base);
  });
});

describe('muscle roll-up, bands and suggestions', () => {
  it('colours a region by its most fatigued head', () => {
    const muscles = computeMuscleRecovery(computeHeadRecovery(incline, at(10), opts));
    expect(muscles.chest.worstHead).toBe('chest_upper');
    expect(muscles.chest.band).toBe('moderate');
    expect(mostFatigued(muscles)[0]?.muscle).toBe('chest');
    const ready = readyGroups(muscles);
    expect(ready).toContain('legs');
    expect(ready).not.toContain('chest');
  });

  it('maps recovery % to the 4 bands', () => {
    expect(recoveryBand(39)).toBe('heavy');
    expect(recoveryBand(40)).toBe('moderate');
    expect(recoveryBand(65)).toBe('light');
    expect(recoveryBand(80)).toBe('ready');
  });
});

describe('explainHead ("Vì sao?")', () => {
  it('groups contributions per session and exercise with added and remaining fatigue', () => {
    const flat: SetLog[] = [0, 1].map((i) => ({
      exerciseSlug: 'barbell_bench_press',
      sessionId: 's0',
      loadKg: 70,
      reps: 8,
      completedAt: new Date(Date.parse(T0) - 48 * 3_600_000 + i * 60_000).toISOString(),
    }));
    const why = explainHead('chest_upper', [...flat, ...incline], at(10), opts);
    expect(why).toHaveLength(2);
    expect(why[0]).toMatchObject({ exerciseSlug: 'incline_barbell_bench_press', sets: 4, addedFatigue: 44, minLoadKg: 50, maxLoadKg: 50, minReps: 8, maxReps: 10 });
    expect(why[1]).toMatchObject({ exerciseSlug: 'barbell_bench_press', sets: 2, addedFatigue: 8 });
    expect(why[1]!.remainingFatigue).toBeLessThan(why[1]!.addedFatigue);
    expect(explainHead('rectus_femoris', incline, at(10))).toEqual([]);
  });
});
