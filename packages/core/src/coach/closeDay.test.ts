import { closeDay, createInitialCoachState, isCelebration, type CloseDayInput, type CoachEvent, type CoachState } from './closeDay';
import type { DayScoreData } from './dailyScore';
import { addDays } from './localDate';
import { sumLedger } from './shields';
import { perfectDay } from './testData';
import type { ShieldLedgerEntry, Strictness } from './types';

const standard = { strictness: 'standard' as Strictness, freeDaysPerWeek: 1 };
const types = (events: CoachEvent[]) => events.map((e) => e.type);

function run(state: CoachState, inputs: CloseDayInput[]) {
  const ledger: ShieldLedgerEntry[] = [];
  const results = inputs.map((input) => {
    const r = closeDay(state, input);
    state = r.state;
    ledger.push(...r.ledger);
    return r;
  });
  return { state, results, ledger };
}

describe('M4 scenario – one week of sample data (standard strictness)', () => {
  // Mon 2026-11-09 … Sun 2026-11-15; workouts Mon / Wed / Fri.
  const mon = '2026-11-09';
  const gym = perfectDay({ workout: true });
  const rest = perfectDay();
  const week: { data: DayScoreData; extra?: Partial<CloseDayInput> }[] = [
    { data: gym }, // Mon 100 ⭐
    { data: { ...rest, water: { ml: 1500, targetMl: 2500 }, nutrition: { ...rest.nutrition!, proteinG: 100 } } }, // Tue 89 ✅
    { data: gym }, // Wed 100 ⭐
    { data: { ...rest, nutrition: null, sleep: { ...rest.sleep!, sleepMin: 300 }, water: { ml: 1000, targetMl: 2500 }, tasks: { scheduled: 2, completed: 0 } } }, // Thu 40 ⚠️
    { data: gym }, // Fri 100 ⭐
    {
      data: { ...rest, nutrition: { ...rest.nutrition!, kcalIn: 3200, sugarG: 40 }, water: { ml: 2000, targetMl: 2500 }, tasks: { scheduled: 2, completed: 1 } },
      extra: { freeDayRequest: 'quota' },
    }, // Sat valid free day 93 ✅
    {
      data: { ...rest, nutrition: { ...rest.nutrition!, kcalIn: 3000, sugarG: 80 } },
      extra: { freeDayRequest: 'quota' },
    }, // Sun 2nd free day > allowance → 82 − 5 = 77 ✅
  ];
  const inputs: CloseDayInput[] = week.map((d, i) => ({
    localDate: addDays(mon, i),
    settings: standard,
    score: d.data,
    weekPlan: { scheduledWorkouts: 3, hasActiveTasks: true },
    ...d.extra,
  }));
  const init = createInitialCoachState(mon);
  const { state, results, ledger } = run(init.state, inputs);

  it('scores each day', () => {
    expect(results.map((r) => r.score.total)).toEqual([100, 89, 100, 40, 100, 93, 77]);
    expect(results.map((r) => r.score.result)).toEqual(['excellent', 'pass', 'excellent', 'fail', 'excellent', 'pass', 'pass']);
    expect(results[5]!.record.freeDay).toBe('quota');
    expect(results[6]!.record.freeDay).toBe('excess');
    expect(results[6]!.score.penaltyPts).toBe(5);
  });

  it('keeps the streak through Thursday with the starter shield', () => {
    expect(results.map((r) => r.state.streak)).toEqual([1, 2, 3, 3, 4, 5, 6]);
    expect(types(results[3]!.events)).toEqual(expect.arrayContaining(['shield_used', 'streak_protected']));
    expect(state).toMatchObject({ streak: 6, bestStreak: 6, lastStreakLostDate: null });
  });

  it('turns ⭐ days and the boss win into fragments and shields', () => {
    expect(results.map((r) => [r.state.shields, r.state.shieldFragments])).toEqual([
      [1, 1],
      [1, 1],
      [1, 2],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 1],
    ]);
    expect(sumLedger([...init.ledger, ...ledger])).toEqual({ shields: state.shields, fragments: state.shieldFragments });
    expect(ledger.map((l) => l.reason)).toEqual(['excellent_day', 'excellent_day', 'protect_streak', 'excellent_day', 'boss_reward']);
  });

  it('runs the weekly boss: Sugar Demon falls on Saturday (5/7 days under the sugar limit)', () => {
    expect(results[0]!.events).toContainEqual({ type: 'boss_spawned', bossCode: 'sugar_demon', weekStart: mon, hp: 5 });
    expect(results.map((r) => r.state.boss?.hits)).toEqual([1, 2, 3, 3, 4, 5, 5]);
    expect(results[5]!.events).toContainEqual({ type: 'boss_defeated', bossCode: 'sugar_demon' });
    expect(state.boss?.wonAt).toBe('2026-11-14');
    expect(state.bossWins).toBe(1);
    expect(state.badges).toEqual(expect.arrayContaining(['first_excellent_day', 'boss_slayer', 'boss_sugar_demon']));
  });

  it('accumulates XP (never decreasing) and levels up on Friday', () => {
    expect(results.map((r) => r.xpGained)).toEqual([100, 89, 100, 40, 100, 93, 77]);
    expect(state.xp).toBe(599);
    expect(results.map((r) => r.state.level)).toEqual([1, 1, 1, 1, 2, 2, 2]);
    expect(results[4]!.events).toContainEqual({ type: 'level_up', level: 2 });
  });

  it('computes hard stats, Aura and no perfect week (Thursday failed)', () => {
    const stats = results[6]!.stats;
    expect(stats.training).toBe(100);
    expect(stats.diet_discipline!).toBeGreaterThan(60);
    expect(stats.diet_discipline!).toBeLessThan(75);
    expect(state.auraScore).toBeGreaterThan(0);
    expect(types(results[6]!.events)).not.toContain('perfect_week');
    expect(state.mood).toBe('neutral');
    expect(state.history).toHaveLength(7);
  });

  it('marks celebration events', () => {
    const celebrations = results.flatMap((r) => r.events.filter(isCelebration).map((e) => e.type));
    // Day 1 lifts Aura from the initial gray tier.
    expect(celebrations).toEqual(['excellent_day', 'aura_tier_up', 'excellent_day', 'excellent_day', 'level_up', 'boss_defeated']);
  });

  it('is deterministic', () => {
    expect(run(init.state, inputs).state).toEqual(state);
  });
});

describe('closeDay edge cases', () => {
  const start = '2026-11-09';
  const fresh = () => createInitialCoachState(start).state;
  const input = (localDate: string, score: DayScoreData = perfectDay(), extra: Partial<CloseDayInput> = {}): CloseDayInput => ({
    localDate,
    settings: standard,
    score,
    ...extra,
  });
  const failDay: DayScoreData = { ...perfectDay(), nutrition: null, sleep: null };

  it('refuses to close the same day twice', () => {
    const r = closeDay(fresh(), input(start));
    expect(() => closeDay(r.state, input(start))).toThrow('day_already_closed');
  });

  it('hardcore loses the streak unless a shield is armed; mood is sad the next day', () => {
    let s = closeDay(fresh(), { ...input(start), settings: { strictness: 'hardcore' } }).state;
    const lost = closeDay(s, { ...input('2026-11-10', failDay), settings: { strictness: 'hardcore' } });
    expect(lost.state).toMatchObject({ streak: 0, shields: 1, lastStreakLostDate: '2026-11-10', mood: 'sad' });
    expect(lost.events).toContainEqual({ type: 'streak_lost', previousStreak: 1 });
    s = closeDay(fresh(), { ...input(start), settings: { strictness: 'hardcore' } }).state;
    const armed = closeDay(s, { ...input('2026-11-10', failDay), settings: { strictness: 'hardcore' }, shieldArmed: true });
    expect(armed.state).toMatchObject({ streak: 1, shields: 0 });
  });

  it('spends a shield to turn an over-allowance day into a valid free day', () => {
    const r = closeDay(fresh(), input(start, { ...perfectDay(), nutrition: { ...perfectDay().nutrition!, kcalIn: 3500 } }, { freeDayRequest: 'shield' }));
    expect(r.record.freeDay).toBe('shield');
    expect(r.state.shields).toBe(0);
    expect(r.ledger[0]).toMatchObject({ reason: 'free_day', deltaShields: -1 });
    expect(r.score.total).toBe(100);
  });

  it('gifts shields on the first closed day of a new month (gentle: 2)', () => {
    const s = { ...fresh(), lastClosedDate: '2026-11-30', shields: 0 };
    const r = closeDay(s, { ...input('2026-12-01'), settings: { strictness: 'gentle' } });
    expect(r.events).toContainEqual({ type: 'monthly_gift', shields: 2 });
    expect(r.state.lastMonthlyGift).toBe('2026-12');
  });

  it('detects a perfect week, streak milestone and adds quest XP', () => {
    let s = fresh();
    let last = closeDay(s, input(start));
    for (let i = 1; i < 7; i++) {
      s = last.state;
      last = closeDay(s, {
        ...input(addDays(start, i)),
        quests: i === 6 ? [{ code: 'hit_water_target', stat: 'water', xpReward: 10, params: {} }] : [],
      });
    }
    expect(types(last.events)).toEqual(expect.arrayContaining(['perfect_week', 'streak_milestone', 'quest_completed', 'badge_earned']));
    expect(last.xpGained).toBe(111); // 100 × 1.01 (7-day streak) + 10
    expect(last.state.badges).toEqual(expect.arrayContaining(['streak_7', 'perfect_week']));
  });

  it('spawns next week’s boss from last week’s weakest habit', () => {
    let s = fresh();
    for (let i = 0; i < 7; i++) {
      s = closeDay(s, input(addDays(start, i), { ...perfectDay(), water: { ml: 500, targetMl: 2500 } })).state;
    }
    const monday = closeDay(s, input('2026-11-16'));
    expect(monday.events).toContainEqual(expect.objectContaining({ type: 'boss_spawned', bossCode: 'drought', weekStart: '2026-11-16' }));
  });

  it('forwards workout celebrations and the R12 under-eating nudge', () => {
    const low: DayScoreData = { ...perfectDay(), nutrition: { ...perfectDay().nutrition!, kcalIn: 1200 } };
    const d1 = closeDay(fresh(), input(start, low));
    const d2 = closeDay(d1.state, input('2026-11-10', low, { newPrs: 2, calisthenicsLevelUps: 1, weightMilestone: true }));
    expect(types(d2.events)).toEqual(expect.arrayContaining(['below_floor_two_days', 'new_pr', 'calisthenics_level_up', 'weight_milestone']));
    expect(d2.state.badges).toEqual(expect.arrayContaining(['first_pr', 'calisthenics_level_up', 'weight_milestone']));
  });
});
