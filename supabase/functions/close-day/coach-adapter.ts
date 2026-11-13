// The single integration point between close-day and `@aurafit/core` coach.
//   DB rows (load.ts) ──buildCoachState / buildCloseDayInput──▶ coach.closeDay(state, input)
//   CloseDayResult ──toPayload──▶ public.apply_close_day(p)
// Core is the only scoring engine; this file only maps field names and units.
import { coach, nutrition, time } from '@aurafit/core';
import { addDays, minutesOfDay } from '../_shared/time.ts';
import type { CloseDayPayload, LoadedDay } from './types.ts';

type CoachState = coach.CoachState;
type CloseDayInput = coach.CloseDayInput;
type CloseDayResult = coach.CloseDayResult;
type DayRecord = coach.DayRecord;

const RESULTS = new Set<string>(['excellent', 'pass', 'fail']);
const FREE_DAY_KINDS = new Set<string>(['none', 'quota', 'shield', 'excess']);
const AURA_TIERS = new Set<string>(coach.AURA_TIER_ORDER);
const MOODS = new Set<string>(['radiant', 'sleepy', 'thirsty', 'hungry', 'fired_up', 'sad', 'neutral']);

function asObject(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** daily_scores row → core DayRecord (stored verbatim in breakdown.record by toPayload). */
function toRecord(row: LoadedDay['coach']['scores'][number]): DayRecord {
  const stored = asObject(asObject(row.breakdown).record);
  if (typeof stored.localDate === 'string' && typeof stored.criteria === 'object' && stored.criteria !== null) {
    return stored as unknown as DayRecord;
  }
  // Rows written without a record (should not happen): conservative reconstruction.
  return {
    localDate: row.local_date,
    total: row.total,
    result: (RESULTS.has(row.result) ? row.result : 'fail') as DayRecord['result'],
    freeDay: row.is_free_day ? 'quota' : 'none',
    shieldUsed: row.shield_used,
    criteria: {
      loggedFullDay: false, kcalInRange: false, proteinMet: false, sugarMet: false, belowFloor: false,
      sleepMet: false, wakeOnTime: null, bedtimeOk: null, waterMet: false, workoutsScheduled: 0,
      workoutsCompleted: 0, tasksScheduled: 0, tasksCompleted: 0, weighed: null,
    },
    strengthTrendPct: null,
    bodyProgressScore: null,
  };
}

/**
 * Rebuilds core CoachState from coach_state + boss_battles + user_badges + daily_scores history.
 * Returns the starter ledger too when the user has no coach_state row yet.
 */
export function buildCoachState(day: LoadedDay): { state: CoachState; ledger: coach.ShieldLedgerEntry[] } {
  const row = day.coach.state;
  if (!row) {
    const init = coach.createInitialCoachState(day.localDate);
    return { state: { ...init.state, history: day.coach.scores.map(toRecord), badges: day.coach.badges }, ledger: init.ledger };
  }
  const b = day.coach.boss;
  const reward = asObject(b?.reward);
  const boss: coach.BossBattle | null = b
    ? {
      weekStart: b.week_start,
      bossCode: b.boss_code as coach.BossCode,
      hitsRequired: b.hits_required,
      hits: b.hits,
      wonAt: typeof reward.won_on === 'string' ? reward.won_on : b.won_at ? b.week_start : null,
      reward: {
        shieldFragments: typeof reward.shieldFragments === 'number' ? reward.shieldFragments : 1,
        accessoryCode: typeof reward.accessoryCode === 'string' ? reward.accessoryCode : `accessory_${b.boss_code}`,
        badgeCode: typeof reward.badgeCode === 'string' ? reward.badgeCode : `boss_${b.boss_code}`,
      },
    }
    : null;
  return {
    state: {
      xp: row.xp,
      level: row.level,
      streak: row.streak,
      bestStreak: row.best_streak,
      shields: row.shields,
      shieldFragments: row.shield_fragments,
      auraScore: row.aura_score,
      auraTier: (AURA_TIERS.has(row.aura_tier) ? row.aura_tier : 'gray') as coach.AuraTier,
      mood: (MOODS.has(row.mood) ? row.mood : 'neutral') as coach.Mood,
      lastClosedDate: row.last_closed_date,
      lastStreakLostDate: row.last_streak_lost_date,
      lastMonthlyGift: row.last_monthly_gift,
      bossWins: row.boss_wins,
      boss,
      badges: day.coach.badges,
      history: day.coach.scores.map(toRecord),
    },
    ledger: [],
  };
}

/** Safety floor (NUT-01): max(BMR, 1200 ♀ / 1500 ♂) when the body profile is complete. */
function kcalFloor(day: LoadedDay): number | null {
  const weightKg = day.weight.trendKg ?? day.weight.kg;
  const { sex, birthDate, heightCm } = day.profile;
  if (!birthDate || !heightCm || !weightKg) return nutrition.safetyFloorKcal(0, sex);
  const ageYears = time.ageOn(birthDate, day.localDate);
  if (nutrition.validateBodyProfile({ sex, ageYears, heightCm, weightKg }).length > 0) return nutrition.safetyFloorKcal(0, sex);
  return nutrition.safetyFloorKcal(nutrition.bmr({ sex, ageYears, heightCm, weightKg }), sex);
}

const toMin = (t: string | null): number | null => (t === null ? null : minutesOfDay(t));

/** "Logged the full day" = at least two meals with items (launch-plan metric: ≥ 2 meals/day). */
export const MIN_MEALS_FOR_FULL_DAY = 2;

export function buildCloseDayInput(day: LoadedDay): CloseDayInput {
  const t = day.target;
  return {
    localDate: day.localDate,
    settings: { strictness: day.settings.strictness, freeDaysPerWeek: day.settings.freeDaysPerWeek },
    score: {
      nutrition: {
        loggedFullDay: day.intake.mealsLogged >= MIN_MEALS_FOR_FULL_DAY,
        kcalIn: day.intake.kcal,
        kcalTarget: t?.kcal ?? 0,
        kcalFloor: kcalFloor(day),
        proteinG: day.intake.protein_g,
        proteinTargetG: t?.protein_g ?? 0,
        sugarG: day.intake.sugar_g,
        // No target → no sugar limit to meet.
        sugarLimitG: t?.sugar_g ?? -1,
      },
      sleep: day.sleep.minutes === null ? null : {
        sleepMin: day.sleep.minutes,
        targetMin: day.sleep.targetMin,
        wakeTimeMin: toMin(day.sleep.wakeTime),
        wakeTargetMin: toMin(day.sleep.usualWakeTime),
        bedtimeMin: toMin(day.sleep.bedtime),
      },
      workout: { scheduledSessions: day.training.scheduled, completedSessions: day.training.completed },
      water: { ml: day.water.ml, targetMl: day.water.targetMl },
      tasks: { scheduled: day.tasks.scheduled, completed: day.tasks.completed },
      weight: { weighInDue: day.weight.weighRequired, weighed: day.weight.kg !== null },
    },
    freeDayRequest: day.freeDayRequest,
    quests: day.quests.map((q) => ({
      code: q.code as coach.QuestCode,
      stat: (q.stat ?? 'diet_discipline') as coach.StatCode,
      xpReward: q.xp_reward,
      params: Object.fromEntries(
        Object.entries(asObject(q.params)).filter((e): e is [string, number] => typeof e[1] === 'number'),
      ),
    })),
    questFacts: {
      breakfastProteinG: day.intake.breakfastProteinG,
      waterMlBefore10: day.water.mlBefore10,
      steps: day.activity.steps,
    },
    weekPlan: { scheduledWorkouts: day.training.scheduledThisWeek, hasActiveTasks: day.tasks.active > 0 },
    newPrs: day.prs.newPrs,
    calisthenicsLevelUps: day.prs.calisthenicsLevelUps,
  };
}

export function toPayload(day: LoadedDay, prev: CoachState, initLedger: coach.ShieldLedgerEntry[], r: CloseDayResult): CloseDayPayload {
  const s = r.state;
  const nextDate = addDays(day.localDate, 1);
  const nextQuests = coach.generateDailyQuests({
    localDate: nextDate,
    stats: r.stats,
    workoutScheduledToday: day.tomorrow.workoutScheduled,
    tasksScheduledToday: day.tomorrow.tasksScheduled,
    weighInDueToday: day.tomorrow.weighInDue,
  });
  const free = r.record.freeDay;
  return {
    user_id: day.userId,
    local_date: day.localDate,
    summary: { ...day.summary, is_free_day: r.score.isFreeDay },
    score: {
      nutrition_pts: r.score.pillars.nutrition,
      sleep_pts: r.score.pillars.sleep,
      training_pts: r.score.pillars.training,
      water_pts: r.score.pillars.water,
      tasks_pts: r.score.pillars.tasks,
      weight_pts: r.score.pillars.weight,
      penalty_pts: r.score.penaltyPts,
      total: r.score.total,
      result: r.score.result,
      strictness: r.score.strictness,
      is_free_day: r.score.isFreeDay,
      shield_used: r.record.shieldUsed,
      breakdown: {
        engine: 'core',
        record: r.record,
        detail: r.score.detail,
        tasks_redistributed: r.score.tasksRedistributed,
        free_day: FREE_DAY_KINDS.has(free) ? free : 'none',
        xp_gained: r.xpGained,
        quests: r.questResults.map((q) => ({ code: q.quest.code, completed: q.completed, xp: q.xp })),
        events: r.events,
      },
    },
    state: {
      xp: s.xp,
      level: s.level,
      streak: s.streak,
      best_streak: s.bestStreak,
      shields: s.shields,
      shield_fragments: s.shieldFragments,
      aura_score: s.auraScore,
      aura_tier: s.auraTier,
      mood: s.mood,
      last_streak_lost_date: s.lastStreakLostDate,
      last_monthly_gift: s.lastMonthlyGift,
      boss_wins: s.bossWins,
    },
    ledger: [...initLedger, ...r.ledger].map((e) => ({
      delta_shields: e.deltaShields,
      delta_fragments: e.deltaFragments,
      reason: e.reason,
      local_date: e.localDate,
    })),
    badges: s.badges.filter((b) => !prev.badges.includes(b)),
    stats: (Object.entries(r.stats) as Array<[string, number | null]>)
      .filter((e): e is [string, number] => e[1] !== null)
      .map(([stat, value]) => ({ stat, value: Math.round(value * 100) / 100 })),
    quests_completed: r.questResults.filter((q) => q.completed).map((q) => q.quest.code),
    quests_next: nextQuests.map((q) => ({
      local_date: nextDate, code: q.code, stat: q.stat, params: q.params, xp_reward: q.xpReward,
    })),
    boss: s.boss
      ? {
        week_start: s.boss.weekStart,
        boss_code: s.boss.bossCode,
        hits_required: s.boss.hitsRequired,
        hits: s.boss.hits,
        won_on: s.boss.wonAt,
        reward: { ...s.boss.reward, won_on: s.boss.wonAt },
      }
      : null,
  };
}

/** Runs core for one loaded day. Throws `day_already_closed:<date>` like core does. */
export function closeLoadedDay(day: LoadedDay): CloseDayPayload {
  const { state, ledger } = buildCoachState(day);
  const result = coach.closeDay(state, buildCloseDayInput(day));
  return toPayload(day, state, ledger, result);
}

export const ENGINE_NAME = 'core';
