import { computeReadiness } from './readiness';

describe('computeReadiness (WRK-06)', () => {
  const good = {
    sleepMin: 480,
    sleepTargetMin: 480,
    sleepQuality: 5,
    kcalYesterday: 2200,
    kcalTargetYesterday: 2200,
    proteinYesterdayG: 140,
    proteinTargetG: 140,
    hardSetsLast3Days: 20,
    baselineHardSets3Days: 25,
    restingHr: 55,
    restingHrBaseline: 57,
    plannedMusclesRecoveryPct: 95,
  };

  it('scores a well-rested, well-fed day as high → try PR', () => {
    const r = computeReadiness(good);
    expect(r).toMatchObject({ score: 100, band: 'high', recommendation: 'try_pr', setDelta: 0 });
    expect(r.factors).toHaveLength(7);
    expect(r.factors.every((f) => f.impact === 'positive')).toBe(true);
  });

  it('suggests a lighter session after short sleep and heavy training', () => {
    const r = computeReadiness({ ...good, sleepMin: 300, sleepQuality: 2, hardSetsLast3Days: 50, restingHr: 66, plannedMusclesRecoveryPct: 40 });
    expect(r.band).toBe('low');
    expect(r.recommendation).toBe('lighter_session');
    expect(r.setDelta).toBe(-1);
    expect(r.factors[0]?.impact).toBe('negative');
  });

  it('renormalises over available factors and explains them', () => {
    const r = computeReadiness({ sleepMin: 432, sleepTargetMin: 480 });
    expect(r.score).toBe(75);
    expect(r.band).toBe('normal');
    expect(r.factors).toEqual([{ code: 'sleep_duration', score: 75, weight: 1, impact: 'neutral' }]);
  });

  it('returns a null score without data', () => {
    expect(computeReadiness({})).toMatchObject({ score: null, recommendation: 'as_planned', factors: [] });
  });

  it('does not penalise a calorie surplus', () => {
    const r = computeReadiness({ kcalYesterday: 3000, kcalTargetYesterday: 2200 });
    expect(r.score).toBe(100);
  });
});
