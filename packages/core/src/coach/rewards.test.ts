import { freeDayAllowance, quotaUsedThisWeek, resolveFreeDay } from './freeDay';
import { addDays, diffDays, isoWeekday, monthKey, toDayNumber, weekStart } from './localDate';
import { addFragments, consumeShield, grantShields, sumLedger } from './shields';
import { applyDayToStreak } from './streak';
import { record } from './testData';
import { dailyXp, levelForXp, levelProgress, streakBonusPct, totalXpForLevel, xpToNextLevel } from './xp';

describe('localDate', () => {
  it('does calendar maths on YYYY-MM-DD', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(diffDays('2026-11-09', '2026-11-15')).toBe(6);
    expect(isoWeekday('2026-11-09')).toBe(1);
    expect(isoWeekday('2026-11-15')).toBe(7);
    expect(weekStart('2026-11-15')).toBe('2026-11-09');
    expect(monthKey('2026-11-15')).toBe('2026-11');
    expect(() => toDayNumber('2026-02-30')).toThrow('invalid_local_date');
    expect(() => toDayNumber('13/11/2026')).toThrow('invalid_local_date');
  });
});

describe('free days (NUT-09 accounting)', () => {
  it('uses the setting or the strictness default (clamped 0–3)', () => {
    expect(freeDayAllowance('gentle')).toBe(2);
    expect(freeDayAllowance('standard')).toBe(1);
    expect(freeDayAllowance('hardcore')).toBe(0);
    expect(freeDayAllowance('hardcore', 3)).toBe(3);
    expect(freeDayAllowance('standard', 7)).toBe(3);
  });

  it('counts quota days earlier in the same week', () => {
    const history = [record('2026-11-08', {}, { freeDay: 'quota' }), record('2026-11-10', {}, { freeDay: 'quota' }), record('2026-11-11', {}, { freeDay: 'shield' })];
    expect(quotaUsedThisWeek(history, '2026-11-12')).toBe(1);
  });

  it('resolves quota → shield → excess', () => {
    expect(resolveFreeDay({ request: 'quota', quotaUsedBefore: 0, allowance: 1, shieldsAvailable: 0 })).toMatchObject({ kind: 'quota', quotaUsed: 1 });
    expect(resolveFreeDay({ request: 'quota', quotaUsedBefore: 1, allowance: 1, shieldsAvailable: 2 })).toMatchObject({ kind: 'excess', consumesShield: false });
    expect(resolveFreeDay({ request: 'shield', quotaUsedBefore: 1, allowance: 1, shieldsAvailable: 1 })).toMatchObject({ kind: 'shield', consumesShield: true });
    expect(resolveFreeDay({ request: 'shield', quotaUsedBefore: 1, allowance: 1, shieldsAvailable: 0 }).kind).toBe('excess');
    expect(resolveFreeDay({ request: 'none', quotaUsedBefore: 0, allowance: 1, shieldsAvailable: 0 }).kind).toBe('none');
  });
});

describe('shields (COA-02)', () => {
  it('turns 3 fragments into a shield and keeps the ledger consistent', () => {
    const start = { shields: 1, fragments: 0 };
    const r = addFragments(start, 4, 'excellent_day', '2026-11-12');
    expect(r.wallet).toEqual({ shields: 2, fragments: 1 });
    expect(r.shieldsGained).toBe(1);
    const sum = sumLedger([{ deltaShields: 1, deltaFragments: 0, reason: 'starter', localDate: '2026-11-01' }, ...r.ledger]);
    expect(sum).toEqual(r.wallet);
  });

  it('caps at 3 shields and drops overflow fragments', () => {
    const r = addFragments({ shields: 3, fragments: 2 }, 1, 'boss_reward', '2026-11-12');
    expect(r.wallet).toEqual({ shields: 3, fragments: 2 });
    expect(r.fragmentsWasted).toBe(1);
    expect(grantShields({ shields: 2, fragments: 0 }, 2, 'monthly_gift', '2026-12-01')).toMatchObject({ wallet: { shields: 3 }, shieldsGained: 1 });
    expect(grantShields({ shields: 3, fragments: 0 }, 1, 'monthly_gift', '2026-12-01').ledger).toEqual([]);
  });

  it('consumes a shield when available', () => {
    expect(consumeShield({ shields: 1, fragments: 2 }, 'protect_streak', '2026-11-12')).toEqual({
      wallet: { shields: 0, fragments: 2 },
      entry: { deltaShields: -1, deltaFragments: 0, reason: 'protect_streak', localDate: '2026-11-12' },
    });
    expect(consumeShield({ shields: 0, fragments: 2 }, 'free_day', '2026-11-12')).toBeNull();
  });
});

describe('streak (COA-02)', () => {
  const auto = { available: 1, autoShield: true };
  it('extends on pass / excellent and reports milestones', () => {
    expect(applyDayToStreak({ streak: 6, bestStreak: 6 }, 'pass', auto)).toMatchObject({ streak: 7, bestStreak: 7, outcome: 'extended', milestones: [7] });
  });

  it('is protected by a shield (auto) or lost', () => {
    expect(applyDayToStreak({ streak: 12, bestStreak: 20 }, 'fail', auto)).toMatchObject({ streak: 12, outcome: 'protected', shieldUsed: true });
    expect(applyDayToStreak({ streak: 12, bestStreak: 20 }, 'fail', { available: 0, autoShield: true })).toMatchObject({ streak: 0, bestStreak: 20, outcome: 'lost' });
  });

  it('hardcore needs the user to arm the shield', () => {
    expect(applyDayToStreak({ streak: 5, bestStreak: 5 }, 'fail', { available: 2, autoShield: false }).outcome).toBe('lost');
    expect(applyDayToStreak({ streak: 5, bestStreak: 5 }, 'fail', { available: 2, autoShield: false, armedByUser: true }).outcome).toBe('protected');
  });

  it('does not waste a shield on a zero streak', () => {
    expect(applyDayToStreak({ streak: 0, bestStreak: 3 }, 'fail', auto)).toMatchObject({ outcome: 'none', shieldUsed: false });
  });
});

describe('XP & level (COA-03)', () => {
  it('adds +1 % per 7 streak days up to +20 %', () => {
    expect(streakBonusPct(6)).toBe(0);
    expect(streakBonusPct(14)).toBe(2);
    expect(streakBonusPct(400)).toBe(20);
    expect(dailyXp(90, 70, 20)).toBe(119);
    expect(dailyXp(100, 0)).toBe(100);
  });

  it('needs a bit more XP for each level', () => {
    expect(xpToNextLevel(1)).toBe(400);
    expect(xpToNextLevel(2)).toBe(432);
    expect(totalXpForLevel(3)).toBe(832);
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(399)).toBe(1);
    expect(levelForXp(400)).toBe(2);
    expect(levelProgress(900)).toEqual({ level: 3, xpIntoLevel: 68, xpForNextLevel: 467 });
  });
});
