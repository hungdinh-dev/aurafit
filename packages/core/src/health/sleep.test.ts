import {
  averageSleepQuality,
  evaluateSleep,
  manualSleepSession,
  recommendedSleepRange,
  sleepDurationFromClock,
  sleepDurationMin,
  sleepLocalDate,
  wakeConsistency,
  type SleepGoal,
} from './sleep';

describe('recommendedSleepRange (NSF 2015)', () => {
  it('by age', () => {
    expect(recommendedSleepRange(30)).toEqual({ minMin: 420, maxMin: 540 });
    expect(recommendedSleepRange(16)).toEqual({ minMin: 480, maxMin: 600 });
    expect(recommendedSleepRange(70)).toEqual({ minMin: 420, maxMin: 480 });
    expect(recommendedSleepRange(10)).toEqual({ minMin: 540, maxMin: 660 });
  });
});

describe('durations', () => {
  it('from instants', () => {
    expect(sleepDurationMin('2026-11-13T16:00:00Z', '2026-11-13T23:30:00Z')).toBe(450);
    expect(() => sleepDurationMin('2026-11-13T23:30:00Z', '2026-11-13T16:00:00Z')).toThrow(RangeError);
  });

  it('from clock times across midnight', () => {
    expect(sleepDurationFromClock('23:30', '07:00')).toBe(450);
    expect(sleepDurationFromClock('01:00', '08:00')).toBe(420);
    expect(sleepDurationFromClock(420, 420)).toBe(0);
  });

  it('counts for the wake-up date in the user zone', () => {
    expect(sleepLocalDate('2026-11-13T23:30:00Z')).toBe('2026-11-14');
  });
});

describe('manualSleepSession (HLT-04)', () => {
  it('bed time before midnight belongs to the previous evening', () => {
    expect(manualSleepSession({ wakeDate: '2026-11-14', bedTime: '23:30', wakeTime: '06:30' })).toEqual({
      start_at: '2026-11-13T16:30:00.000Z',
      end_at: '2026-11-13T23:30:00.000Z',
      local_date: '2026-11-14',
      durationMin: 420,
    });
  });

  it('bed time after midnight is the same date', () => {
    const r = manualSleepSession({ wakeDate: '2026-11-14', bedTime: '00:30', wakeTime: '07:00' });
    expect(r.start_at).toBe('2026-11-13T17:30:00.000Z');
    expect(r.durationMin).toBe(390);
  });
});

describe('evaluateSleep (12 + 8 points)', () => {
  const goal: SleepGoal = { minDurationMin: 420, maxDurationMin: 540, targetWakeMin: 390 };

  it('full points', () => {
    expect(evaluateSleep({ durationMin: 450, wakeMinutesOfDay: 400, goal })).toEqual({
      durationMet: true,
      durationStatus: 'ok',
      wakeDeviationMin: 10,
      wakeOnTime: true,
      points: { duration: 12, wake: 8, total: 20 },
      score: 100,
    });
  });

  it('short night and late wake', () => {
    const r = evaluateSleep({ durationMin: 400, wakeMinutesOfDay: 440, goal });
    expect(r).toMatchObject({ durationStatus: 'short', wakeDeviationMin: 50, wakeOnTime: false, score: 0 });
  });

  it('long sleep still meets the duration; exactly 30 min off is on time', () => {
    const r = evaluateSleep({ durationMin: 600, wakeMinutesOfDay: 420, goal });
    expect(r.durationStatus).toBe('long');
    expect(r.points).toEqual({ duration: 12, wake: 8, total: 20 });
  });

  it('wake target around midnight and missing data', () => {
    const nightOwl = { ...goal, targetWakeMin: 10 };
    expect(evaluateSleep({ durationMin: 420, wakeMinutesOfDay: 1430, goal: nightOwl }).wakeDeviationMin).toBe(-20);
    const none = evaluateSleep({ durationMin: null, wakeMinutesOfDay: null, goal });
    expect(none).toMatchObject({ durationMet: false, wakeDeviationMin: null, wakeOnTime: false, score: 0 });
    expect(evaluateSleep({ durationMin: 450, wakeMinutesOfDay: 400, goal: { ...goal, toleranceMin: 5 } }).wakeOnTime).toBe(false);
  });
});

describe('wakeConsistency (7 days)', () => {
  it('mean, SD and on-time rate', () => {
    expect(wakeConsistency([390, 400, 380, 410, 370], 390)).toEqual({ nights: 5, meanWakeMin: 390, sdMin: 14, onTimeRate: 1 });
    expect(wakeConsistency([390, 450], 390).onTimeRate).toBe(0.5);
  });

  it('handles wake times around midnight', () => {
    expect(wakeConsistency([1430, 10])).toEqual({ nights: 2, meanWakeMin: 0, sdMin: 10, onTimeRate: null });
  });

  it('no nights', () => {
    expect(wakeConsistency([])).toEqual({ nights: 0, meanWakeMin: null, sdMin: null, onTimeRate: null });
  });
});

describe('averageSleepQuality', () => {
  it('averages valid 1–5 ratings only', () => {
    expect(averageSleepQuality([4, 5, null, 0, 6, undefined])).toBe(4.5);
    expect(averageSleepQuality([])).toBeNull();
  });
});
