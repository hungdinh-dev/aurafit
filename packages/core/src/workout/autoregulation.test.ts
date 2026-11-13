import { autoregulate } from './autoregulation';

const stack = { kind: 'stack' as const, stepKg: 5 };
const pulldown = { repMin: 8, repMax: 10, loadSpec: stack };

describe('autoregulate (WRK-05 / WRK-14)', () => {
  it('suggests more load when reps exceed the range (workout.md example 15–20 reps)', () => {
    const s = autoregulate({ ...pulldown, set: { loadKg: 50, reps: 15 } });
    expect(s).toMatchObject({ action: 'increase', suggestedLoadKg: 55, reason: 'reps_above_range', scope: 'next_set' });
  });

  it('suggests less load when reps fall below the range (5–6 reps)', () => {
    const s = autoregulate({ ...pulldown, set: { loadKg: 50, reps: 5 } });
    expect(s).toMatchObject({ action: 'decrease', suggestedLoadKg: 45, reason: 'reps_below_range' });
  });

  it('holds inside the range without RIR', () => {
    expect(autoregulate({ ...pulldown, set: { loadKg: 50, reps: 9 } })).toMatchObject({ action: 'hold', suggestedLoadKg: 50 });
  });

  it('uses RIR inside the range', () => {
    expect(autoregulate({ ...pulldown, set: { loadKg: 50, reps: 9, rir: 4 } })).toMatchObject({ action: 'increase', reason: 'rir_above_target', suggestedLoadKg: 55 });
    expect(autoregulate({ ...pulldown, set: { loadKg: 50, reps: 8, rpe: 10 } })).toMatchObject({ action: 'decrease', reason: 'rir_below_target', rir: 0 });
    expect(autoregulate({ ...pulldown, set: { loadKg: 50, reps: 9, rir: 3 } }).action).toBe('hold');
  });

  it('scales the jump with how far off the set was, rounded to real plates', () => {
    const s = autoregulate({
      repMin: 6,
      repMax: 10,
      targetRir: 2,
      loadSpec: { kind: 'plates', barKg: 20, platesKg: [20, 10, 5, 2.5, 1.25] },
      set: { loadKg: 60, reps: 16 },
    });
    expect(s.action).toBe('increase');
    expect(s.suggestedLoadKg).toBe(70);
    expect(s.estimatedOneRmKg).toBe(92);
  });

  it('marks the last set as a next-session hint', () => {
    expect(autoregulate({ ...pulldown, set: { loadKg: 50, reps: 12 }, isLastSet: true }).scope).toBe('next_session');
  });

  it('cannot express load for bodyweight moves', () => {
    const s = autoregulate({ repMin: 6, repMax: 10, loadSpec: { kind: 'bodyweight' }, set: { loadKg: null, reps: 15 } });
    expect(s).toMatchObject({ action: 'increase', suggestedLoadKg: null });
  });
});
