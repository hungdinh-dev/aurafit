/**
 * `closeDay(state, input)` – the pure reducer behind the `close-day` Edge Function (COA-01…08).
 * Order: monthly gift → weekly boss spawn → free-day resolution (may spend a shield) → score →
 * streak (may spend a shield) → ⭐ fragment → history → quests → boss hit → XP / level →
 * hard stats / Aura → perfect week → workout celebrations → badges → mood.
 * Deterministic: same state + input → same output. Days must be closed in increasing order.
 */
import { applyBossDay, bossHp, spawnWeeklyBoss, type BossBattle, type BossCode, type BossWeekPlan } from './boss';
import { evaluateBadges } from './badges';
import { computeDailyScore, type DailyScoreResult, type DayScoreData } from './dailyScore';
import { freeDayAllowance, quotaUsedThisWeek, resolveFreeDay, type FreeDayRequest } from './freeDay';
import { addDays, diffDays, isoWeekday, monthKey, weekStart } from './localDate';
import { deriveMood } from './mood';
import { evaluateQuests, type Quest, type QuestCode, type QuestFacts } from './quests';
import { rulesFor } from './rules';
import { addFragments, consumeShield, grantShields, STARTER_SHIELDS, type ShieldWallet } from './shields';
import { auraScore, auraTierFor, compareTiers, computeHardStats } from './stats';
import { applyDayToStreak } from './streak';
import { dailyXp, levelForXp } from './xp';
import type { AuraTier, DayRecord, HardStats, Mood, ShieldLedgerEntry, Strictness } from './types';

/** Days kept in `history` (30-day stats + previous week for boss / perfect week). */
export const HISTORY_DAYS = 37;

export interface CoachState {
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  shields: number;
  shieldFragments: number;
  auraScore: number;
  auraTier: AuraTier;
  mood: Mood;
  lastClosedDate: string | null;
  lastStreakLostDate: string | null;
  /** `YYYY-MM` of the last monthly shield gift. */
  lastMonthlyGift: string | null;
  bossWins: number;
  boss: BossBattle | null;
  badges: string[];
  /** Rolling closed-day history, oldest first (server rebuilds it from `daily_scores`). */
  history: DayRecord[];
}

export function createInitialCoachState(startDate: string): { state: CoachState; ledger: ShieldLedgerEntry[] } {
  return {
    state: {
      xp: 0,
      level: 1,
      streak: 0,
      bestStreak: 0,
      shields: STARTER_SHIELDS,
      shieldFragments: 0,
      auraScore: 0,
      auraTier: 'gray',
      mood: 'neutral',
      lastClosedDate: null,
      lastStreakLostDate: null,
      // The starter shield counts as this month's gift; monthly gifts start next month.
      lastMonthlyGift: monthKey(startDate),
      bossWins: 0,
      boss: null,
      badges: [],
      history: [],
    },
    ledger: [{ deltaShields: STARTER_SHIELDS, deltaFragments: 0, reason: 'starter', localDate: startDate }],
  };
}

export interface CloseDayInput {
  localDate: string;
  settings: { strictness: Strictness; freeDaysPerWeek?: number | null };
  score: DayScoreData;
  freeDayRequest?: FreeDayRequest;
  /** Hardcore: the user armed a shield for today (other levels use shields automatically). */
  shieldArmed?: boolean;
  quests?: readonly Quest[];
  questFacts?: QuestFacts;
  /** Needed when a new week's boss must be spawned. */
  weekPlan?: BossWeekPlan;
  strengthTrendPct?: number | null;
  bodyProgressScore?: number | null;
  newPrs?: number;
  calisthenicsLevelUps?: number;
  weightMilestone?: boolean;
}

export type CoachEvent =
  | { type: 'day_scored'; total: number; result: DailyScoreResult['result'] }
  | { type: 'excellent_day' }
  | { type: 'free_day_penalty'; penaltyPts: number }
  | { type: 'monthly_gift'; shields: number }
  | { type: 'shield_used'; purpose: 'protect_streak' | 'free_day' }
  | { type: 'shield_fragment_earned'; fragments: number; source: 'excellent_day' | 'boss_reward' }
  | { type: 'shield_earned'; shields: number; source: 'excellent_day' | 'boss_reward' }
  | { type: 'streak_extended'; streak: number }
  | { type: 'streak_protected'; streak: number }
  | { type: 'streak_lost'; previousStreak: number }
  | { type: 'streak_milestone'; streak: number }
  | { type: 'quest_completed'; code: QuestCode; xp: number }
  | { type: 'boss_spawned'; bossCode: BossCode; weekStart: string; hp: number }
  | { type: 'boss_hit'; bossCode: BossCode; damage: number; hp: number }
  | { type: 'boss_defeated'; bossCode: BossCode }
  | { type: 'xp_gained'; xp: number }
  | { type: 'level_up'; level: number }
  | { type: 'aura_tier_up'; tier: AuraTier; previousTier: AuraTier }
  | { type: 'aura_tier_down'; tier: AuraTier; previousTier: AuraTier }
  | { type: 'perfect_week'; weekStart: string }
  | { type: 'new_pr'; count: number }
  | { type: 'calisthenics_level_up'; count: number }
  | { type: 'weight_milestone' }
  | { type: 'badge_earned'; code: string }
  | { type: 'below_floor_two_days' };

/** Events that open the full-screen celebration (gamification.md §9). */
export const CELEBRATION_EVENT_TYPES: ReadonlySet<CoachEvent['type']> = new Set([
  'excellent_day',
  'level_up',
  'aura_tier_up',
  'streak_milestone',
  'new_pr',
  'calisthenics_level_up',
  'boss_defeated',
  'perfect_week',
  'weight_milestone',
]);

export function isCelebration(e: CoachEvent): boolean {
  return CELEBRATION_EVENT_TYPES.has(e.type);
}

export interface CloseDayResult {
  state: CoachState;
  score: DailyScoreResult;
  record: DayRecord;
  stats: HardStats;
  xpGained: number;
  questResults: { quest: Quest; completed: boolean; xp: number }[];
  ledger: ShieldLedgerEntry[];
  events: CoachEvent[];
}

export function closeDay(prev: CoachState, input: CloseDayInput): CloseDayResult {
  const date = input.localDate;
  if (prev.lastClosedDate !== null && diffDays(prev.lastClosedDate, date) <= 0) {
    throw new Error(`day_already_closed:${date}`);
  }
  const rules = rulesFor(input.settings.strictness);
  const events: CoachEvent[] = [];
  const ledger: ShieldLedgerEntry[] = [];
  let wallet: ShieldWallet = { shields: prev.shields, fragments: prev.shieldFragments };

  // 1. Monthly gift (first closed day of a new month).
  let lastMonthlyGift = prev.lastMonthlyGift;
  if (monthKey(date) !== lastMonthlyGift) {
    const g = grantShields(wallet, rules.monthlyShieldGift, 'monthly_gift', date);
    wallet = g.wallet;
    ledger.push(...g.ledger);
    lastMonthlyGift = monthKey(date);
    if (g.shieldsGained > 0) events.push({ type: 'monthly_gift', shields: g.shieldsGained });
  }

  // 2. Weekly boss.
  let boss = prev.boss;
  if (!boss || boss.weekStart !== weekStart(date)) {
    boss = spawnWeeklyBoss({
      localDate: date,
      history: prev.history,
      plan: input.weekPlan ?? { scheduledWorkouts: 0, hasActiveTasks: input.score.tasks.scheduled > 0 },
    });
    events.push({ type: 'boss_spawned', bossCode: boss.bossCode, weekStart: boss.weekStart, hp: bossHp(boss) });
  }

  // 3. Free day.
  const free = resolveFreeDay({
    request: input.freeDayRequest ?? 'none',
    quotaUsedBefore: quotaUsedThisWeek(prev.history, date),
    allowance: freeDayAllowance(input.settings.strictness, input.settings.freeDaysPerWeek),
    shieldsAvailable: wallet.shields,
  });
  if (free.consumesShield) {
    const c = consumeShield(wallet, 'free_day', date);
    if (c) {
      wallet = c.wallet;
      ledger.push(c.entry);
      events.push({ type: 'shield_used', purpose: 'free_day' });
    }
  }

  // 4. Score.
  const score = computeDailyScore({ ...input.score, strictness: input.settings.strictness, freeDay: free.kind });
  events.push({ type: 'day_scored', total: score.total, result: score.result });
  if (score.penaltyPts > 0) events.push({ type: 'free_day_penalty', penaltyPts: score.penaltyPts });

  // 5. Streak.
  const st = applyDayToStreak(prev, score.result, {
    available: wallet.shields,
    autoShield: rules.autoShield,
    armedByUser: input.shieldArmed,
  });
  let lastStreakLostDate = prev.lastStreakLostDate;
  if (st.shieldUsed) {
    const c = consumeShield(wallet, 'protect_streak', date);
    if (c) {
      wallet = c.wallet;
      ledger.push(c.entry);
    }
    events.push({ type: 'shield_used', purpose: 'protect_streak' }, { type: 'streak_protected', streak: st.streak });
  } else if (st.outcome === 'extended') {
    events.push({ type: 'streak_extended', streak: st.streak });
  } else if (st.outcome === 'lost') {
    lastStreakLostDate = date;
    events.push({ type: 'streak_lost', previousStreak: prev.streak });
  }
  for (const m of st.milestones) events.push({ type: 'streak_milestone', streak: m });

  // 6. ⭐ day → fragment.
  const rewardFragment = (source: 'excellent_day' | 'boss_reward'): void => {
    const f = addFragments(wallet, 1, source, date);
    wallet = f.wallet;
    ledger.push(...f.ledger);
    if (f.shieldsGained > 0) events.push({ type: 'shield_earned', shields: wallet.shields, source });
    else if (f.fragmentsWasted === 0) events.push({ type: 'shield_fragment_earned', fragments: wallet.fragments, source });
  };
  if (score.result === 'excellent') {
    events.push({ type: 'excellent_day' });
    rewardFragment('excellent_day');
  }

  // 7. History.
  const record: DayRecord = {
    localDate: date,
    total: score.total,
    result: score.result,
    freeDay: free.kind,
    shieldUsed: st.shieldUsed,
    criteria: score.criteria,
    strengthTrendPct: input.strengthTrendPct ?? null,
    bodyProgressScore: input.bodyProgressScore ?? null,
  };
  const history = [...prev.history, record].filter((r) => diffDays(r.localDate, date) < HISTORY_DAYS);

  // 8. Quests.
  const questResults = evaluateQuests(input.quests ?? [], {
    loggedFullDay: score.criteria.loggedFullDay,
    kcalInRange: score.criteria.kcalInRange,
    proteinMet: score.criteria.proteinMet,
    waterMet: score.criteria.waterMet,
    wakeOnTime: score.criteria.wakeOnTime,
    bedtimeMin: input.score.sleep?.bedtimeMin ?? null,
    workoutCompleted:
      score.criteria.workoutsScheduled > 0 && score.criteria.workoutsCompleted >= score.criteria.workoutsScheduled,
    weighed: score.criteria.weighed === true,
    tasksCompleted: score.criteria.tasksCompleted,
    tasksScheduled: score.criteria.tasksScheduled,
    ...input.questFacts,
  });
  const questXp = questResults.reduce((s, q) => s + q.xp, 0);
  for (const q of questResults) if (q.completed) events.push({ type: 'quest_completed', code: q.quest.code, xp: q.xp });

  // 9. Boss hit.
  let bossWins = prev.bossWins;
  let bossDefeated: BossCode | null = null;
  const hit = applyBossDay(boss, record);
  boss = hit.battle;
  if (hit.damage > 0) events.push({ type: 'boss_hit', bossCode: boss.bossCode, damage: hit.damage, hp: bossHp(boss) });
  if (hit.defeated) {
    bossWins += 1;
    bossDefeated = boss.bossCode;
    events.push({ type: 'boss_defeated', bossCode: boss.bossCode });
    for (let i = 0; i < boss.reward.shieldFragments; i++) rewardFragment('boss_reward');
  }

  // 10. XP / level (XP never decreases).
  const xpGained = dailyXp(score.total, st.streak, questXp);
  const xp = prev.xp + xpGained;
  const level = Math.max(prev.level, levelForXp(xp));
  events.push({ type: 'xp_gained', xp: xpGained });
  for (let l = prev.level + 1; l <= level; l++) events.push({ type: 'level_up', level: l });

  // 11. Hard stats & Aura.
  const stats = computeHardStats(history, date, input.settings.strictness);
  const aura = auraScore(stats);
  const auraTier = auraTierFor(aura);
  const cmp = compareTiers(auraTier, prev.auraTier);
  if (cmp > 0) events.push({ type: 'aura_tier_up', tier: auraTier, previousTier: prev.auraTier });
  if (cmp < 0) events.push({ type: 'aura_tier_down', tier: auraTier, previousTier: prev.auraTier });

  // 12. Perfect week (closed on Sunday, 7/7 days ≥ pass).
  let perfectWeek = false;
  if (isoWeekday(date) === 7) {
    const start = weekStart(date);
    const week = history.filter((r) => r.localDate >= start && r.localDate <= date);
    perfectWeek = week.length === 7 && week.every((r) => r.result !== 'fail');
    if (perfectWeek) events.push({ type: 'perfect_week', weekStart: start });
  }

  // 13. Workout / body celebrations.
  if ((input.newPrs ?? 0) > 0) events.push({ type: 'new_pr', count: input.newPrs as number });
  if ((input.calisthenicsLevelUps ?? 0) > 0) {
    events.push({ type: 'calisthenics_level_up', count: input.calisthenicsLevelUps as number });
  }
  if (input.weightMilestone) events.push({ type: 'weight_milestone' });

  // 14. Badges.
  const newBadges = evaluateBadges(
    {
      streak: st.streak,
      level,
      auraTier,
      excellentToday: score.result === 'excellent',
      perfectWeek,
      bossDefeated,
      bossWins,
      newPrs: input.newPrs ?? 0,
      calisthenicsLevelUps: input.calisthenicsLevelUps ?? 0,
      weightMilestone: input.weightMilestone ?? false,
      shields: wallet.shields,
    },
    prev.badges,
  );
  for (const code of newBadges) events.push({ type: 'badge_earned', code });

  // 15. R12: below the safety floor two days in a row → gentle nudge (all strictness levels).
  const yesterday = history.find((r) => r.localDate === addDays(date, -1));
  if (score.criteria.belowFloor && yesterday?.criteria.belowFloor) events.push({ type: 'below_floor_two_days' });

  // 16. Morning mood for the next day (the app refines it live during the day).
  const mood = deriveMood({ today: addDays(date, 1), localTimeMin: 3 * 60, streak: st.streak, streakLostOn: lastStreakLostDate });

  return {
    state: {
      xp,
      level,
      streak: st.streak,
      bestStreak: st.bestStreak,
      shields: wallet.shields,
      shieldFragments: wallet.fragments,
      auraScore: aura,
      auraTier,
      mood,
      lastClosedDate: date,
      lastStreakLostDate,
      lastMonthlyGift,
      bossWins,
      boss,
      badges: [...prev.badges, ...newBadges],
      history,
    },
    score,
    record,
    stats,
    xpGained,
    questResults,
    ledger,
    events,
  };
}
