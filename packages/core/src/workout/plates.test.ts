import { requireExercise } from './catalog/exercises';
import {
  achievableLoads,
  calculatePlates,
  DEFAULT_PLATES_KG,
  loadSpecFor,
  roundLoad,
  roundToMachineStep,
  stepLoad,
} from './plates';

const olympic = { barKg: 20, platesKg: DEFAULT_PLATES_KG };

describe('calculatePlates', () => {
  it('loads an exact weight greedily, heaviest first', () => {
    const r = calculatePlates(100, olympic);
    expect(r.perSide).toEqual([25, 15]);
    expect(r).toMatchObject({ achievedKg: 100, exact: true, deltaKg: 0 });
  });

  it('returns the nearest achievable weight (ties go lighter)', () => {
    const r = calculatePlates(101, olympic);
    expect(r.achievedKg).toBe(100);
    expect(r.exact).toBe(false);
    expect(r.deltaKg).toBe(-1);
    expect(calculatePlates(101.25, olympic).achievedKg).toBe(100);
    expect(calculatePlates(103.75, olympic).achievedKg).toBe(102.5);
  });

  it('respects limited plate counts', () => {
    const r = calculatePlates(120, { barKg: 20, platesKg: [20, 10, 5], plateCounts: { '20': 2, '10': 2, '5': 2 } });
    expect(r.perSide).toEqual([20, 10, 5]);
    expect(r.achievedKg).toBe(90);
  });

  it('handles targets at or below the bar', () => {
    expect(calculatePlates(15, olympic)).toMatchObject({ perSide: [], achievedKg: 20, exact: false });
    expect(calculatePlates(20, olympic)).toMatchObject({ perSide: [], achievedKg: 20, exact: true });
  });

  it('works with a 10 kg EZ bar and small plates', () => {
    const r = calculatePlates(27.5, { barKg: 10, platesKg: [5, 2.5, 1.25] });
    expect(r.perSide).toEqual([5, 2.5, 1.25]);
    expect(r.achievedKg).toBe(27.5);
  });
});

describe('load rounding', () => {
  it('rounds to machine steps', () => {
    expect(roundToMachineStep(47, { stepKg: 5 })).toBe(45);
    expect(roundToMachineStep(47, { stepKg: 5 }, 'up')).toBe(50);
    expect(roundToMachineStep(3, { stepKg: 5, minKg: 5 })).toBe(5);
    expect(roundToMachineStep(200, { stepKg: 5, maxKg: 100 })).toBe(100);
    expect(roundToMachineStep(51, { stepKg: 4.5, minKg: 4.5 })).toBe(49.5);
  });

  it('rounds to available dumbbells', () => {
    const spec = { kind: 'fixed' as const, availableKg: [10, 12.5, 15, 20] };
    expect(roundLoad(17, spec)).toBe(15);
    expect(roundLoad(18, spec)).toBe(20);
    expect(roundLoad(17, spec, 'up')).toBe(20);
    expect(roundLoad(5, spec, 'down')).toBe(10);
  });

  it('steps up / down to the next real load', () => {
    const plates = { kind: 'plates' as const, ...olympic };
    expect(stepLoad(60, plates, 1)).toBe(62.5);
    expect(stepLoad(60, plates, 1, 2)).toBe(65);
    expect(stepLoad(60, plates, -1)).toBe(57.5);
    expect(stepLoad(12, { kind: 'fixed', availableKg: [10, 12, 14] }, 1)).toBe(14);
    expect(stepLoad(10, { kind: 'bodyweight' }, 1)).toBeNull();
  });

  it('lists achievable loads', () => {
    expect(achievableLoads({ kind: 'stack', stepKg: 5, minKg: 5, maxKg: 20 }, 100)).toEqual([5, 10, 15, 20]);
    expect(achievableLoads({ kind: 'plates', barKg: 20, platesKg: [10] }, 45)).toEqual([20, 40]);
    expect(achievableLoads({ kind: 'bodyweight' }, 100)).toEqual([]);
  });
});

describe('loadSpecFor', () => {
  it('uses inventory machine steps when configured', () => {
    const spec = loadSpecFor(requireExercise('leg_press'), { machines: { leg_press: { step_kg: 10, min_kg: 20 } } });
    expect(spec).toEqual({ kind: 'stack', stepKg: 10, minKg: 20, maxKg: undefined });
  });

  it('falls back to sensible defaults', () => {
    expect(loadSpecFor(requireExercise('barbell_bench_press'))).toMatchObject({ kind: 'plates', barKg: 20 });
    expect(loadSpecFor(requireExercise('ez_bar_curl'), { bars: [{ type: 'ez', kg: 8 }] })).toMatchObject({ barKg: 8 });
    expect(loadSpecFor(requireExercise('dumbbell_curl')).kind).toBe('fixed');
    expect(loadSpecFor(requireExercise('lat_pulldown'))).toEqual({ kind: 'stack', stepKg: 5 });
    expect(loadSpecFor(requireExercise('pull_up'))).toEqual({ kind: 'bodyweight' });
  });
});
