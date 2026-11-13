import { addDays, datesBetween } from '../time';
import { MAX_TDEE_CHANGE_KCAL, adaptTdee, isAdaptiveReviewDay, type AdaptiveTdeeInput } from './adaptiveTdee';

const asOf = '2026-11-15'; // Sunday; window 2026-11-02 … 2026-11-15
const windowDates = datesBetween('2026-11-02', asOf);
const history = datesBetween('2026-10-01', '2026-11-01').map((date) => ({ date, weightKg: 80 }));
const flatWindow = windowDates.map((date) => ({ date, weightKg: 80 }));
const intakeOf = (kcal: number, days = windowDates) => days.map((date) => ({ date, kcal }));

const base: AdaptiveTdeeInput = {
  asOf,
  currentTdeeKcal: 2400,
  weighIns: [...history, ...flatWindow],
  intake: intakeOf(2300),
};

describe('adaptTdee (HLT-03)', () => {
  it('Sunday is the review day', () => {
    expect(isAdaptiveReviewDay(asOf)).toBe(true);
    expect(isAdaptiveReviewDay(addDays(asOf, -1))).toBe(false);
  });

  it('stable weight → TDEE moves to the average intake', () => {
    const r = adaptTdee(base);
    expect(r).toMatchObject({ status: 'adjusted', previousTdeeKcal: 2400, newTdeeKcal: 2300, deltaKcal: -100, observedTdeeKcal: 2300, reasons: [] });
    expect(r.explanation).toMatchObject({ weighIns: 14, loggedDays: 14, avgIntakeKcal: 2300, trendChangeKg: 0, spanDays: 14 });
  });

  it('never moves more than ±150 kcal per week', () => {
    const r = adaptTdee({ ...base, intake: intakeOf(2000) });
    expect(MAX_TDEE_CHANGE_KCAL).toBe(150);
    expect(r.newTdeeKcal).toBe(2250);
    expect(r.reasons).toEqual(['clamped']);
  });

  it('ignores changes under 50 kcal', () => {
    const r = adaptTdee({ ...base, intake: intakeOf(2370) });
    expect(r.status).toBe('unchanged');
    expect(r.newTdeeKcal).toBe(2400);
    expect(r.reasons).toEqual(['within_tolerance']);
    expect(r.observedTdeeKcal).toBe(2370);
  });

  it('uses the trend change: losing weight on 2,000 kcal means TDEE is higher', () => {
    // Trend 80 → 80 − (1 − 0.9^14) = 79.23 → −0.77 kg in 14 days → observed ≈ 2000 + 0.77×7700/14 ≈ 2424
    const r = adaptTdee({
      ...base,
      currentTdeeKcal: 2200,
      weighIns: [...history, ...windowDates.map((date) => ({ date, weightKg: 79 }))],
      intake: intakeOf(2000),
    });
    expect(r.explanation).toMatchObject({ trendStartKg: 80, trendEndKg: 79.23, trendChangeKg: -0.77, spanDays: 14 });
    expect(r.observedTdeeKcal).toBeGreaterThanOrEqual(2423);
    expect(r.observedTdeeKcal).toBeLessThanOrEqual(2424);
    expect(r.newTdeeKcal).toBe(2350);
  });

  it('insufficient data keeps the TDEE and says why', () => {
    const r = adaptTdee({
      ...base,
      weighIns: [...history, ...flatWindow.slice(0, 3)],
      intake: intakeOf(2000, windowDates.slice(0, 9)),
    });
    expect(r.status).toBe('insufficient_data');
    expect(r.newTdeeKcal).toBe(2400);
    expect(r.reasons).toEqual(['too_few_weigh_ins', 'too_few_logged_days']);
  });

  it('unlogged / zero days are not counted as eating nothing', () => {
    const intake = [
      ...intakeOf(2300, windowDates.slice(2)),
      { date: windowDates[0]!, kcal: 0 },
      { date: windowDates[1]!, kcal: null },
    ];
    const r = adaptTdee({ ...base, intake });
    expect(r.explanation.loggedDays).toBe(12);
    expect(r.explanation.avgIntakeKcal).toBe(2300);
  });

  it('history that starts inside the window: needs ≥ 7 days of span', () => {
    const short = adaptTdee({ ...base, weighIns: windowDates.slice(10).map((date) => ({ date, weightKg: 80 })) });
    expect(short.status).toBe('insufficient_data');
    expect(short.reasons).toEqual(['insufficient_span']);
    const ok = adaptTdee({ ...base, weighIns: windowDates.slice(3).map((date) => ({ date, weightKg: 80 })) });
    expect(ok.status).toBe('adjusted');
    expect(ok.explanation.spanDays).toBe(10);
  });

  it('stays within 1.1–2.5 × BMR when a BMR is given', () => {
    const r = adaptTdee({ ...base, currentTdeeKcal: 1700, intake: intakeOf(1400), bmrKcal: 1500 });
    expect(r.newTdeeKcal).toBe(1650);
    expect(r.reasons).toEqual(['clamped', 'bounded']);
  });

  it('ignores weigh-ins after the review date', () => {
    const r = adaptTdee({ ...base, weighIns: [...base.weighIns, { date: '2026-11-20', weightKg: 60 }] });
    expect(r.explanation.trendEndKg).toBe(80);
  });

  it('rejects a non-positive TDEE', () => {
    expect(() => adaptTdee({ ...base, currentTdeeKcal: 0 })).toThrow(RangeError);
  });
});
