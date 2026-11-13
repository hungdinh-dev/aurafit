import { evaluateBadges } from './badges';
import { applyBossDay, bossHp, pickBoss, previousWeekRecords, spawnWeeklyBoss } from './boss';
import { activeMoods, deriveMood } from './mood';
import { evaluateQuests, generateDailyQuests, hashString, isQuestCompleted, type Quest } from './quests';
import {
  auraScore,
  auraTierFor,
  bodyProgressScore,
  computeHardStats,
  lapseDaysUntilTierDrop,
  strengthScore,
  weakestStats,
} from './stats';
import { record } from './testData';
import { addDays } from './localDate';
import type { HardStats } from './types';

const days = (start: string, n: number, f: (i: number, date: string) => ReturnType<typeof record>) =>
  Array.from({ length: n }, (_, i) => f(i, addDays(start, i)));

describe('hard stats & Aura (COA-03)', () => {
  const perfect = days('2026-10-15', 30, (_, d) => record(d, { workoutsScheduled: 1, workoutsCompleted: 1 }, { strengthTrendPct: 4, bodyProgressScore: 90 }));

  it('computes every stat from the 30-day window', () => {
    const s = computeHardStats(perfect, '2026-11-13', 'standard');
    expect(s).toEqual({
      diet_discipline: 100,
      protein: 100,
      sleep: 100,
      water: 100,
      training: 100,
      strength: 70,
      body_progress: 90,
      self_growth: 100,
    });
    expect(auraScore(s)).toBe(96);
    expect(auraTierFor(96)).toBe('red');
  });

  it('counts valid free days as on-plan and weighs recent days more', () => {
    const h = days('2026-11-04', 10, (i, d) => (i >= 8 ? record(d, { kcalInRange: false }) : record(d, { kcalInRange: false }, { freeDay: i === 0 ? 'quota' : 'none' })));
    const recentMiss = [...days('2026-11-04', 8, (_, d) => record(d)), ...days('2026-11-12', 2, (_, d) => record(d, { kcalInRange: false }))];
    const oldMiss = [...days('2026-11-04', 2, (_, d) => record(d, { kcalInRange: false })), ...days('2026-11-06', 8, (_, d) => record(d))];
    expect(computeHardStats(h, '2026-11-13', 'standard').diet_discipline).toBeGreaterThan(0);
    expect(computeHardStats(recentMiss, '2026-11-13', 'standard').diet_discipline!).toBeLessThan(computeHardStats(oldMiss, '2026-11-13', 'standard').diet_discipline!);
    // Hardcore forgets the past faster → recent lapses hurt more.
    expect(computeHardStats(recentMiss, '2026-11-13', 'hardcore').diet_discipline!).toBeLessThan(computeHardStats(recentMiss, '2026-11-13', 'gentle').diet_discipline!);
  });

  it('returns null for stats without data', () => {
    const s = computeHardStats([record('2026-11-13', { tasksScheduled: 0, tasksCompleted: 0 })], '2026-11-13', 'standard');
    expect(s).toMatchObject({ training: null, strength: null, body_progress: null, self_growth: null, water: 100 });
    expect(computeHardStats([], '2026-11-13', 'standard').protein).toBeNull();
    expect(auraScore(computeHardStats([], '2026-11-13', 'standard'))).toBe(0);
  });

  it('maps strength and body progress', () => {
    expect(strengthScore(0)).toBe(50);
    expect(strengthScore(-20)).toBe(0);
    expect(bodyProgressScore(-0.5, -0.5)).toBe(100);
    expect(bodyProgressScore(-0.25, -0.5)).toBe(50);
    expect(bodyProgressScore(-1, -0.5)).toBe(0);
    expect(bodyProgressScore(0.2, -0.5)).toBe(0);
    expect(bodyProgressScore(0.1, 0)).toBe(80);
  });

  it('maps tiers and warns before a tier drop', () => {
    expect(['gray', 'green', 'blue', 'purple', 'gold', 'red'].map((_, i) => auraTierFor([10, 45, 60, 75, 85, 95][i]!))).toEqual(['gray', 'green', 'blue', 'purple', 'gold', 'red']);
    const n = lapseDaysUntilTierDrop(perfect, '2026-11-13', 'standard');
    expect(n).toBeGreaterThanOrEqual(1);
    const slow = lapseDaysUntilTierDrop(perfect, '2026-11-13', 'gentle')!;
    const fast = lapseDaysUntilTierDrop(perfect, '2026-11-13', 'hardcore')!;
    expect(fast).toBeLessThanOrEqual(slow);
    expect(lapseDaysUntilTierDrop([], '2026-11-13', 'standard')).toBeNull();
  });
});

describe('coach quests (COA-04)', () => {
  const stats: HardStats = { diet_discipline: 80, protein: 40, sleep: 55, water: 65, training: 90, strength: null, body_progress: 75, self_growth: null };

  it('targets the weakest stats (1–3 quests, deterministic)', () => {
    expect(weakestStats(stats).map((s) => s.code).slice(0, 3)).toEqual(['protein', 'sleep', 'water']);
    const ctx = { localDate: '2026-11-13', stats, workoutScheduledToday: false, tasksScheduledToday: false, weighInDueToday: false };
    const q = generateDailyQuests(ctx);
    expect(q.map((x) => x.stat)).toEqual(['protein', 'sleep', 'water']);
    expect(q.every((x) => x.xpReward >= 10 && x.xpReward <= 30)).toBe(true);
    expect(generateDailyQuests(ctx)).toEqual(q);
    expect(hashString('abc')).toBe(hashString('abc'));
  });

  it('gives a single quest when nothing is weak, and a default for new users', () => {
    const strong: HardStats = { ...stats, protein: 95, sleep: 90, water: 90 };
    expect(generateDailyQuests({ localDate: '2026-11-13', stats: strong, workoutScheduledToday: true, tasksScheduledToday: true, weighInDueToday: false })).toHaveLength(1);
    const empty: HardStats = { diet_discipline: null, protein: null, sleep: null, water: null, training: null, strength: null, body_progress: null, self_growth: null };
    expect(generateDailyQuests({ localDate: '2026-11-13', stats: empty, workoutScheduledToday: false, tasksScheduledToday: false, weighInDueToday: false })[0]?.code).toBe('log_all_meals');
  });

  it('only proposes workout quests on training days', () => {
    const s: HardStats = { ...stats, training: 10 };
    const rest = generateDailyQuests({ localDate: '2026-11-13', stats: s, workoutScheduledToday: false, tasksScheduledToday: false, weighInDueToday: false });
    expect(rest[0]?.code).toBe('walk_8000_steps');
    const gym = generateDailyQuests({ localDate: '2026-11-13', stats: s, workoutScheduledToday: true, tasksScheduledToday: false, weighInDueToday: false });
    expect(gym[0]?.code).toBe('complete_workout');
  });

  it('evaluates completion from facts', () => {
    const q = (code: Quest['code'], params: Record<string, number> = {}): Quest => ({ code, stat: 'sleep', xpReward: 20, params });
    expect(isQuestCompleted(q('sleep_before_2330', { bedtimeMin: 1410 }), { bedtimeMin: 1400 })).toBe(true);
    expect(isQuestCompleted(q('sleep_before_2330', { bedtimeMin: 1410 }), { bedtimeMin: 20 })).toBe(false);
    expect(isQuestCompleted(q('water_before_10', { ml: 500 }), { waterMlBefore10: 500 })).toBe(true);
    expect(isQuestCompleted(q('protein_breakfast_30g', { proteinG: 30 }), {})).toBe(false);
    expect(isQuestCompleted(q('complete_all_tasks'), { tasksCompleted: 2, tasksScheduled: 2 })).toBe(true);
    expect(evaluateQuests([q('weigh_in'), q('walk_8000_steps', { steps: 8000 })], { weighed: true, steps: 5000 }).map((r) => r.xp)).toEqual([20, 0]);
  });
});

describe('weekly boss (COA-05)', () => {
  const lastWeek = days('2026-11-02', 7, (i, d) => record(d, { sugarMet: i < 6, bedtimeOk: i < 2, waterMet: true }));

  it('picks the weakest habit of last week', () => {
    expect(pickBoss(lastWeek, { scheduledWorkouts: 3, hasActiveTasks: true })).toBe('night_owl');
    expect(pickBoss([], { scheduledWorkouts: 0, hasActiveTasks: false })).toBe('sugar_demon');
    const lazy = days('2026-11-02', 7, (i, d) => record(d, { workoutsScheduled: i % 2, workoutsCompleted: 0 }));
    expect(pickBoss(lazy, { scheduledWorkouts: 3, hasActiveTasks: false })).toBe('sloth');
  });

  it('spawns on the week start with an HP bar and takes hits until defeated', () => {
    const history = [...lastWeek];
    let battle = spawnWeeklyBoss({ localDate: '2026-11-11', history, plan: { scheduledWorkouts: 3, hasActiveTasks: false } });
    expect(battle).toMatchObject({ weekStart: '2026-11-09', bossCode: 'night_owl', hitsRequired: 5, hits: 0, wonAt: null });
    expect(previousWeekRecords(history, '2026-11-09')).toHaveLength(7);
    let defeatedOn: string | null = null;
    for (let i = 0; i < 7; i++) {
      const r = applyBossDay(battle, record(addDays('2026-11-09', i), { bedtimeOk: i !== 1 }));
      battle = r.battle;
      if (r.defeated) defeatedOn = r.battle.wonAt;
    }
    expect(defeatedOn).toBe('2026-11-14');
    expect(bossHp(battle)).toBe(0);
    expect(battle.reward).toEqual({ shieldFragments: 1, accessoryCode: 'accessory_night_owl', badgeCode: 'boss_night_owl' });
    // Days outside the week do nothing.
    const fresh = spawnWeeklyBoss({ localDate: '2026-11-11', history, plan: { scheduledWorkouts: 3, hasActiveTasks: false } });
    expect(applyBossDay(fresh, record('2026-11-16')).damage).toBe(0);
  });

  it('sloth needs every scheduled workout', () => {
    const lazy = days('2026-11-02', 7, (_, d) => record(d, { workoutsScheduled: 1, workoutsCompleted: 0 }));
    const b = spawnWeeklyBoss({ localDate: '2026-11-09', history: lazy, plan: { scheduledWorkouts: 4, hasActiveTasks: false } });
    expect(b).toMatchObject({ bossCode: 'sloth', hitsRequired: 4 });
    expect(applyBossDay(b, record('2026-11-09', { workoutsScheduled: 1, workoutsCompleted: 1 })).damage).toBe(1);
  });
});

describe('mood (COA-06)', () => {
  const base = { today: '2026-11-13', localTimeMin: 9 * 60, streak: 0 };
  it('derives moods from today’s data', () => {
    expect(deriveMood(base)).toBe('neutral');
    expect(deriveMood({ ...base, scoreSoFar: 92 })).toBe('radiant');
    expect(deriveMood({ ...base, lastNightSleepMin: 330 })).toBe('sleepy');
    expect(deriveMood({ ...base, localTimeMin: 15 * 60, waterMl: 800, waterTargetMl: 2500, mealsLoggedToday: 2 })).toBe('thirsty');
    expect(deriveMood({ ...base, localTimeMin: 11 * 60, mealsLoggedToday: 0 })).toBe('hungry');
    expect(deriveMood({ ...base, streak: 7 })).toBe('fired_up');
    expect(deriveMood({ ...base, streakLostOn: '2026-11-12', streak: 0 })).toBe('sad');
    expect(deriveMood({ ...base, streakLostOn: '2026-11-11', streak: 1 })).toBe('neutral');
  });

  it('lists all active moods by priority', () => {
    expect(activeMoods({ ...base, localTimeMin: 16 * 60, mealsLoggedToday: 0, waterMl: 0, waterTargetMl: 2000, lastNightSleepMin: 300, streak: 9 })).toEqual([
      'hungry',
      'thirsty',
      'sleepy',
      'fired_up',
    ]);
  });
});

describe('badges (COA-08)', () => {
  const ctx = {
    streak: 7,
    level: 5,
    auraTier: 'gold' as const,
    excellentToday: true,
    perfectWeek: true,
    bossDefeated: 'sugar_demon' as const,
    bossWins: 1,
    newPrs: 1,
    calisthenicsLevelUps: 0,
    weightMilestone: false,
    shields: 3,
  };
  it('awards each badge once', () => {
    const first = evaluateBadges(ctx, []);
    expect(first).toEqual(
      expect.arrayContaining(['first_excellent_day', 'streak_7', 'perfect_week', 'boss_slayer', 'boss_sugar_demon', 'level_5', 'aura_gold', 'first_pr', 'full_shields']),
    );
    expect(first).not.toContain('aura_red');
    expect(first).not.toContain('streak_30');
    expect(evaluateBadges(ctx, first)).toEqual([]);
  });
});
