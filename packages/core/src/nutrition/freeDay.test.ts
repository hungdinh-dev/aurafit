import {
  DEFAULT_FREE_DAYS_BY_STRICTNESS,
  MAX_FREE_DAYS_PER_WEEK,
  checkFreeDayAllowance,
  estimateFreeDayExtraKcal,
  goalShiftDays,
  quoteFreeDay,
  type FreeDayQuoteInput,
} from './freeDay';

const base: FreeDayQuoteInput = {
  date: '2026-11-14', // Saturday
  today: '2026-11-09', // Monday
  goal: 'lose_fat',
  dailyTargetKcal: 2200,
  dailyDeltaKcal: -550,
  floorKcal: 1500,
};

describe('estimateFreeDayExtraKcal', () => {
  it('defaults to 50 % of the target (docs example: +1,100 on 2,200)', () => {
    expect(estimateFreeDayExtraKcal({ dailyTargetKcal: 2200 })).toBe(1100);
  });

  it('uses the mean of the last 4 positive past extras', () => {
    expect(estimateFreeDayExtraKcal({ dailyTargetKcal: 2200, pastExtrasKcal: [800, 1200] })).toBe(1000);
    expect(estimateFreeDayExtraKcal({ dailyTargetKcal: 2200, pastExtrasKcal: [5000, 400, 600, 800, 1000] })).toBe(700);
    expect(estimateFreeDayExtraKcal({ dailyTargetKcal: 2200, pastExtrasKcal: [-100, 0] })).toBe(1100);
  });
});

describe('goalShiftDays', () => {
  it('extra ÷ daily deficit, fat loss only', () => {
    expect(goalShiftDays(1100, -550, 'lose_fat')).toBe(2);
    expect(goalShiftDays(440, -550, 'lose_fat')).toBe(0.8);
    expect(goalShiftDays(-50, -550, 'lose_fat')).toBe(0);
    expect(goalShiftDays(1100, 0, 'maintain')).toBeNull();
    expect(goalShiftDays(1100, 275, 'gain_muscle')).toBeNull();
    expect(goalShiftDays(1100, 0, 'lose_fat')).toBeNull(); // floor ate the whole deficit
  });
});

describe('quoteFreeDay (NUT-09)', () => {
  it('reproduces the docs example: +1,100 kcal → ~2 days, or −190/day over the other 6 days', () => {
    const q = quoteFreeDay(base);
    expect(q.extraKcal).toBe(1100);
    expect(q.delayDays).toBe(2);
    expect(q.compensation).toEqual({ days: 6, perDayReductionKcal: 190, coveredKcal: 1100, uncoveredKcal: 0, delayDays: 0 });
  });

  it('late in the week the 10 % cap leaves part uncompensated', () => {
    // today Thu → Thu, Fri, Sun = 3 days; cap 220 → 660 covered, 440 left → 0.8 days
    const q = quoteFreeDay({ ...base, today: '2026-11-12' });
    expect(q.compensation).toEqual({ days: 3, perDayReductionKcal: 220, coveredKcal: 660, uncoveredKcal: 440, delayDays: 0.8 });
  });

  it('a free day on Sunday evening has nothing left to compensate', () => {
    const q = quoteFreeDay({ ...base, date: '2026-11-15', today: '2026-11-15' });
    expect(q.compensation.days).toBe(0);
    expect(q.compensation.uncoveredKcal).toBe(1100);
    expect(q.compensation.delayDays).toBe(2);
  });

  it('excludes other free days and respects the floor', () => {
    const q = quoteFreeDay({ ...base, otherFreeDates: ['2026-11-15'], floorKcal: 2150 });
    expect(q.compensation.days).toBe(5);
    expect(q.compensation.perDayReductionKcal).toBe(50);
  });

  it('honours an explicit expected extra and non-loss goals', () => {
    const q = quoteFreeDay({ ...base, expectedExtraKcal: 550.4, goal: 'maintain', dailyDeltaKcal: 0 });
    expect(q.extraKcal).toBe(550);
    expect(q.delayDays).toBeNull();
    expect(q.compensation.delayDays).toBeNull();
  });
});

describe('checkFreeDayAllowance', () => {
  it('defaults and limits per gamification §1a / D-035', () => {
    expect(DEFAULT_FREE_DAYS_BY_STRICTNESS).toEqual({ gentle: 2, standard: 1, hardcore: 0 });
    expect(MAX_FREE_DAYS_PER_WEEK).toBe(3);
  });

  it('within quota → no penalty', () => {
    expect(checkFreeDayAllowance({ freeDaysPerWeek: 2, usedThisWeek: 1, strictness: 'standard' })).toEqual({
      kind: 'quota',
      remainingAfter: 0,
      penaltyPts: 0,
      shieldEligible: false,
    });
  });

  it('beyond quota → penalty by strictness, shield can convert it', () => {
    expect(checkFreeDayAllowance({ freeDaysPerWeek: 2, usedThisWeek: 2, strictness: 'standard' })).toEqual({
      kind: 'over_quota',
      remainingAfter: 0,
      penaltyPts: -5,
      shieldEligible: true,
    });
    expect(checkFreeDayAllowance({ freeDaysPerWeek: 0, usedThisWeek: 0, strictness: 'hardcore' }).penaltyPts).toBe(-10);
    expect(checkFreeDayAllowance({ freeDaysPerWeek: 1, usedThisWeek: 1, strictness: 'gentle' }).penaltyPts).toBe(0);
  });

  it('clamps the setting to 0–3', () => {
    expect(checkFreeDayAllowance({ freeDaysPerWeek: 5, usedThisWeek: 3, strictness: 'standard' }).kind).toBe('over_quota');
    expect(checkFreeDayAllowance({ freeDaysPerWeek: 5, usedThisWeek: 0, strictness: 'standard' }).remainingAfter).toBe(2);
    expect(checkFreeDayAllowance({ freeDaysPerWeek: -1, usedThisWeek: 0, strictness: 'standard' }).kind).toBe('over_quota');
  });
});
