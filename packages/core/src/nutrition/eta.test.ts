import { MAX_ETA_DAYS, projectGoalDate, type EtaInput } from './eta';

const base: EtaInput = {
  fromDate: '2026-11-13',
  currentWeightKg: 70,
  targetWeightKg: 65,
  observedKgPerWeek: -0.5,
  plannedKgPerWeek: -0.5,
};

describe('projectGoalDate ("Về đích ngày…")', () => {
  it('uses the observed trend rate', () => {
    // 5 kg ÷ 0.5 kg/week = 10 weeks = 70 days → 2027-01-22
    expect(projectGoalDate(base)).toEqual({
      status: 'on_track',
      date: '2027-01-22',
      days: 70,
      rateKgPerWeek: -0.5,
      rateSource: 'observed',
      remainingKg: -5,
    });
  });

  it('falls back to the planned pace without trend data', () => {
    // 5 / 0.75 × 7 = 46.7 → 47 days → 2026-12-30
    const r = projectGoalDate({ ...base, observedKgPerWeek: null, plannedKgPerWeek: -0.75 });
    expect(r).toMatchObject({ status: 'on_track', days: 47, date: '2026-12-30', rateSource: 'planned' });
  });

  it('adds extra delay days (e.g. uncompensated free days)', () => {
    expect(projectGoalDate({ ...base, extraDelayDays: 2 }).days).toBe(72);
  });

  it('works for muscle gain', () => {
    const r = projectGoalDate({ ...base, currentWeightKg: 60, targetWeightKg: 65, observedKgPerWeek: 0.25, plannedKgPerWeek: 0.25 });
    expect(r).toMatchObject({ status: 'on_track', days: 140 });
  });

  it('reached when within 0.1 kg or past the target in the goal direction', () => {
    expect(projectGoalDate({ ...base, currentWeightKg: 65.05 }).status).toBe('reached');
    expect(projectGoalDate({ ...base, currentWeightKg: 64 }).status).toBe('reached');
    expect(projectGoalDate({ ...base, currentWeightKg: 66, targetWeightKg: 65, plannedKgPerWeek: 0.25 }).status).toBe('reached');
  });

  it('wrong direction / stalled / no target', () => {
    expect(projectGoalDate({ ...base, observedKgPerWeek: 0.2 }).status).toBe('wrong_direction');
    expect(projectGoalDate({ ...base, observedKgPerWeek: -0.01 }).status).toBe('stalled');
    expect(projectGoalDate({ ...base, targetWeightKg: null }).status).toBe('no_target');
  });

  it('projections beyond 3 years are stalled', () => {
    const r = projectGoalDate({ ...base, currentWeightKg: 120, targetWeightKg: 70, observedKgPerWeek: -0.06 });
    expect(MAX_ETA_DAYS).toBe(1095);
    expect(r.status).toBe('stalled');
  });
});
