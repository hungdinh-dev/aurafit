import { computeWeeklyBudget, perDayReductionCap, spreadReduction, type WeeklyBudgetInput } from './weeklyBudget';

// Week of Mon 2026-11-09 … Sun 2026-11-15. Target 2000, floor 1500 → cap min(200, 500) = 200.
const base: Omit<WeeklyBudgetInput, 'today' | 'days'> = {
  dailyTargetKcal: 2000,
  floorKcal: 1500,
  freeDayMode: 'compensate',
};

describe('helpers', () => {
  it('perDayReductionCap = min(10 % target, target − floor)', () => {
    expect(perDayReductionCap(2000, 1500)).toBe(200);
    expect(perDayReductionCap(1600, 1550)).toBe(50);
    expect(perDayReductionCap(1500, 1500)).toBe(0);
    expect(perDayReductionCap(1400, 1500)).toBe(0);
  });

  it('spreadReduction rounds up to 10 kcal within the cap', () => {
    expect(spreadReduction(300, 4, 200)).toEqual({ perDayKcal: 80, coveredKcal: 300, uncoveredKcal: 0 });
    expect(spreadReduction(2000, 3, 200)).toEqual({ perDayKcal: 200, coveredKcal: 600, uncoveredKcal: 1400 });
    expect(spreadReduction(0, 3, 200)).toEqual({ perDayKcal: 0, coveredKcal: 0, uncoveredKcal: 0 });
    expect(spreadReduction(500, 0, 200)).toEqual({ perDayKcal: 0, coveredKcal: 0, uncoveredKcal: 500 });
    expect(spreadReduction(500, 3, 0)).toEqual({ perDayKcal: 0, coveredKcal: 0, uncoveredKcal: 500 });
  });
});

describe('computeWeeklyBudget (NUT-11)', () => {
  it('spreads an overage over the remaining days', () => {
    // Mon +500, Tue −200 (repays), Wed not logged → debt 300 over Thu–Sun (4 days) → −80/day
    const r = computeWeeklyBudget({
      ...base,
      today: '2026-11-12',
      days: [
        { date: '2026-11-09', intakeKcal: 2500 },
        { date: '2026-11-10', intakeKcal: 1800 },
        { date: '2026-11-11', intakeKcal: null },
      ],
    });
    expect(r.weekStart).toBe('2026-11-09');
    expect(r.weekEnd).toBe('2026-11-15');
    expect(r.weeklyBudgetKcal).toBe(14000);
    expect(r.consumedKcal).toBe(4300);
    expect(r.overageKcal).toBe(300);
    expect(r.days.map((d) => d.targetKcal)).toEqual([1920, 1920, 1920, 1920]);
    expect(r.uncoveredKcal).toBe(0);
  });

  it('under-eating is never banked as credit', () => {
    // Mon −500 (no credit), Tue +600 → debt 600 over Wed–Sun (5) → −120/day
    const r = computeWeeklyBudget({
      ...base,
      today: '2026-11-11',
      days: [
        { date: '2026-11-09', intakeKcal: 1500 },
        { date: '2026-11-10', intakeKcal: 2600 },
      ],
    });
    expect(r.overageKcal).toBe(600);
    expect(r.days.every((d) => d.targetKcal === 1880)).toBe(true);
  });

  it('caps the reduction at 10 %/day and reports what is left', () => {
    const r = computeWeeklyBudget({ ...base, today: '2026-11-13', days: [{ date: '2026-11-09', intakeKcal: 4000 }] });
    expect(r.perDayCapKcal).toBe(200);
    expect(r.days.map((d) => d.targetKcal)).toEqual([1800, 1800, 1800]);
    expect(r.uncoveredKcal).toBe(1400);
  });

  it('never goes below the safety floor', () => {
    const r = computeWeeklyBudget({
      ...base,
      dailyTargetKcal: 1600,
      floorKcal: 1550,
      today: '2026-11-10',
      days: [{ date: '2026-11-09', intakeKcal: 3000 }],
    });
    expect(r.days.every((d) => d.targetKcal === 1550)).toBe(true);
    expect(r.uncoveredKcal).toBe(1400 - 6 * 50);
  });

  it('no adjustment on Monday or when everything is on target', () => {
    const r = computeWeeklyBudget({ ...base, today: '2026-11-09', days: [] });
    expect(r.days).toHaveLength(7);
    expect(r.days.every((d) => d.targetKcal === 2000 && d.reductionKcal === 0)).toBe(true);
    expect(r.toCompensateKcal).toBe(0);
  });

  it('ignores days outside the current week', () => {
    const r = computeWeeklyBudget({ ...base, today: '2026-11-10', days: [{ date: '2026-11-08', intakeKcal: 5000 }] });
    expect(r.overageKcal).toBe(0);
  });

  it('compensate mode pre-spreads a planned free day over the other days', () => {
    // Sat quoted +1000; Mon–Fri + Sun = 6 days → ceil(166.7 → 170)
    const r = computeWeeklyBudget({
      ...base,
      today: '2026-11-09',
      days: [{ date: '2026-11-14', intakeKcal: null, isFreeDay: true, quotedExtraKcal: 1000 }],
    });
    expect(r.plannedFreeDayExtraKcal).toBe(1000);
    const sat = r.days.find((d) => d.date === '2026-11-14')!;
    expect(sat).toEqual({ date: '2026-11-14', targetKcal: 2000, reductionKcal: 0, isFreeDay: true });
    expect(r.days.filter((d) => !d.isFreeDay).every((d) => d.targetKcal === 1830)).toBe(true);
    expect(r.uncoveredKcal).toBe(0);
  });

  it('no_compensate mode keeps targets and reports the free-day excess', () => {
    const r = computeWeeklyBudget({
      ...base,
      freeDayMode: 'no_compensate',
      today: '2026-11-11',
      days: [
        { date: '2026-11-09', intakeKcal: 3100, isFreeDay: true },
        { date: '2026-11-14', intakeKcal: null, isFreeDay: true, quotedExtraKcal: 900 },
      ],
    });
    expect(r.overageKcal).toBe(0);
    expect(r.freeDayExcessKcal).toBe(1100 + 900);
    expect(r.days.every((d) => d.targetKcal === 2000)).toBe(true);
  });

  it('compensate mode treats a closed free day excess as debt', () => {
    const r = computeWeeklyBudget({
      ...base,
      today: '2026-11-10',
      days: [{ date: '2026-11-09', intakeKcal: 3000, isFreeDay: true }],
    });
    expect(r.overageKcal).toBe(1000);
    expect(r.days.every((d) => d.targetKcal === 1830)).toBe(true);
  });

  it('rejects a non-positive target', () => {
    expect(() => computeWeeklyBudget({ ...base, dailyTargetKcal: 0, today: '2026-11-10', days: [] })).toThrow(RangeError);
  });
});
