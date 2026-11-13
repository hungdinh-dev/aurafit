import { computeDailyScore, normalizeBedtime, resultFor, roundPreservingSum } from './dailyScore';
import { perfectDay } from './testData';

describe('computeDailyScore (COA-01)', () => {
  it('gives 100 for a perfect day and fills the breakdown', () => {
    const s = computeDailyScore({ ...perfectDay({ workout: true }), strictness: 'standard', freeDay: 'none' });
    expect(s.total).toBe(100);
    expect(s.pillars).toEqual({ nutrition: 40, sleep: 20, training: 15, water: 10, tasks: 10, weight: 5 });
    expect(s.result).toBe('excellent');
    expect(s.criteria).toMatchObject({ kcalInRange: true, proteinMet: true, sleepMet: true, wakeOnTime: true, bedtimeOk: true, workoutsCompleted: 1 });
  });

  it('gives full training points on a scheduled rest day and partial on a missed session', () => {
    const rest = computeDailyScore({ ...perfectDay(), strictness: 'standard', freeDay: 'none' });
    expect(rest.pillars.training).toBe(15);
    const missed = computeDailyScore({ ...perfectDay(), workout: { scheduledSessions: 1, completedSessions: 0 }, strictness: 'standard', freeDay: 'none' });
    expect(missed.pillars.training).toBe(0);
    expect(missed.total).toBe(85);
    expect(missed.result).toBe('pass');
  });

  it('applies the kcal tolerance of each strictness level', () => {
    const day = { ...perfectDay(), nutrition: { ...perfectDay().nutrition!, kcalIn: 2180 } }; // +9 %
    expect(computeDailyScore({ ...day, strictness: 'gentle', freeDay: 'none' }).criteria.kcalInRange).toBe(true);
    expect(computeDailyScore({ ...day, strictness: 'standard', freeDay: 'none' }).criteria.kcalInRange).toBe(true);
    expect(computeDailyScore({ ...day, strictness: 'hardcore', freeDay: 'none' }).criteria.kcalInRange).toBe(false);
  });

  it('never rewards eating below the safety floor (R12)', () => {
    const day = { ...perfectDay(), nutrition: { ...perfectDay().nutrition!, kcalIn: 1450, kcalTarget: 1550, kcalFloor: 1500 } };
    const s = computeDailyScore({ ...day, strictness: 'gentle', freeDay: 'none' });
    expect(s.criteria.belowFloor).toBe(true);
    expect(s.detail.nutrition.kcal).toBe(0);
  });

  it('redistributes the tasks pillar when no task is active', () => {
    const day = { ...perfectDay(), tasks: { scheduled: 0, completed: 0 }, water: { ml: 1250, targetMl: 2500 } };
    const s = computeDailyScore({ ...day, strictness: 'standard', freeDay: 'none' });
    expect(s.tasksRedistributed).toBe(true);
    expect(s.pillars.tasks).toBe(0);
    expect(s.total).toBe(94); // (40 + 20 + 15 + 5 + 5) × 100 / 90 = 94.4
    const sum = Object.values(s.pillars).reduce((a, b) => a + b, 0);
    expect(sum).toBe(s.total);
    expect(computeDailyScore({ ...perfectDay(), tasks: { scheduled: 0, completed: 0 }, strictness: 'standard', freeDay: 'none' }).total).toBe(100);
  });

  it('auto-passes kcal & sugar on a valid free day but still needs logging', () => {
    const binge = { ...perfectDay(), nutrition: { ...perfectDay().nutrition!, kcalIn: 3300, sugarG: 120, loggedFullDay: false } };
    const free = computeDailyScore({ ...binge, strictness: 'standard', freeDay: 'quota' });
    expect(free.detail.nutrition).toEqual({ logged: 0, kcal: 15, protein: 7, sugar: 3 });
    expect(free.isFreeDay).toBe(true);
    const normal = computeDailyScore({ ...binge, strictness: 'standard', freeDay: 'none' });
    expect(normal.detail.nutrition).toEqual({ logged: 0, kcal: 0, protein: 7, sugar: 0 });
  });

  it('applies the excess free-day penalty by strictness (0 / −5 / −10)', () => {
    const day = perfectDay();
    expect(computeDailyScore({ ...day, strictness: 'gentle', freeDay: 'excess' }).penaltyPts).toBe(0);
    expect(computeDailyScore({ ...day, strictness: 'standard', freeDay: 'excess' }).total).toBe(95);
    expect(computeDailyScore({ ...day, strictness: 'hardcore', freeDay: 'excess' }).total).toBe(90);
  });

  it('scores sleep, water and weight proportionally / by rule', () => {
    const day = {
      ...perfectDay(),
      sleep: { sleepMin: 360, targetMin: 480, wakeTimeMin: 450, wakeTargetMin: 390, bedtimeMin: 30 },
      water: { ml: 1000, targetMl: 2500 },
      weight: { weighInDue: true, weighed: false },
    };
    const s = computeDailyScore({ ...day, strictness: 'standard', freeDay: 'none' });
    expect(s.pillars.sleep).toBe(9);
    expect(s.pillars.water).toBe(4);
    expect(s.pillars.weight).toBe(0);
    expect(s.criteria).toMatchObject({ wakeOnTime: false, bedtimeOk: false, weighed: false });
    expect(computeDailyScore({ ...perfectDay(), sleep: null, water: null, nutrition: null, strictness: 'standard', freeDay: 'none' }).total).toBe(30);
  });
});

describe('helpers', () => {
  it('maps totals to results per strictness', () => {
    expect(resultFor(95, 'standard')).toBe('excellent');
    expect(resultFor(70, 'standard')).toBe('pass');
    expect(resultFor(69, 'standard')).toBe('fail');
    expect(resultFor(60, 'gentle')).toBe('pass');
    expect(resultFor(79, 'hardcore')).toBe('fail');
  });

  it('rounds pillars without losing a point', () => {
    const r = roundPreservingSum({ nutrition: 33.4, sleep: 16.6, training: 15, water: 4.5, tasks: 0, weight: 5.5 });
    expect(Object.values(r).reduce((a, b) => a + b, 0)).toBe(75);
  });

  it('normalises bedtimes after midnight', () => {
    expect(normalizeBedtime(30)).toBe(1470);
    expect(normalizeBedtime(1380)).toBe(1380);
  });
});
