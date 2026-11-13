// Loads the raw facts of one user-day for close-day (service role, RLS bypassed).
// No scoring here: coach-adapter.ts maps these facts to core `CloseDayInput`.
import type { Db } from '../_shared/supabase.ts';
import {
  addDays, daysBetween, isoWeekday, localDateOf, localTimeOf, minutesOfDay, startOfIsoWeek, startOfLocalDay,
} from '../_shared/time.ts';
import type { CoachStateRow, LoadedDay, Strictness } from './types.ts';

const SLEEP_TARGET_MIN = 8 * 60; // no per-user sleep goal column yet (core default in tests: 480)
const DEVICE_SOURCES = new Set(['apple_health', 'garmin', 'google_fit']);
const TREND_ALPHA = 0.1; // = core health TREND_SMOOTHING
const DEFAULT_WEIGHT_KG = 70;
/** core HISTORY_DAYS = 37 → the 36 days before the closed day. */
const HISTORY_DAYS_BEFORE = 36;

function rows<T>(res: { data: T[] | null; error: unknown }): T[] {
  if (res.error) throw res.error;
  return res.data ?? [];
}

function one<T>(res: { data: T | null; error: unknown }): T | null {
  if (res.error) throw res.error;
  return res.data;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

interface Sample {
  type: string;
  value: number;
  start_at: string;
  end_at: string | null;
  source: string;
  metadata: unknown;
}

/** Device data wins over manual entries of the same type (03-health.md). */
function preferred(samples: Sample[], type: string): Sample[] {
  const ofType = samples.filter((s) => s.type === type);
  const device = ofType.filter((s) => DEVICE_SOURCES.has(s.source));
  return device.length > 0 ? device : ofType;
}

const sum = (xs: Sample[]) => xs.reduce((a, s) => a + Number(s.value), 0);

export async function loadDay(admin: Db, userId: string, localDate: string, timezone: string): Promise<LoadedDay> {
  const weekday = isoWeekday(localDate);
  const tomorrowWeekday = isoWeekday(addDays(localDate, 1));
  const weekStart = startOfIsoWeek(localDate);
  const dayStart = startOfLocalDay(localDate, timezone).toISOString();
  const dayEnd = startOfLocalDay(addDays(localDate, 1), timezone).toISOString();

  const [
    settingsRes, profileRes, stateRes, targetRes, mealsRes, samplesRes, recentRes, freeDayRes, programRes,
    workoutsRes, taskDefsRes, taskLogsRes, questsRes, scoresRes, bossRes, badgesRes, prsRes,
  ] = await Promise.all([
    admin.from('coach_settings').select('strictness, free_days_per_week').eq('user_id', userId).maybeSingle(),
    admin.from('profiles').select('sex, birth_date, height_cm').eq('user_id', userId).maybeSingle(),
    admin.from('coach_state').select('*').eq('user_id', userId).maybeSingle(),
    admin.from('nutrition_targets').select('kcal, protein_g, sugar_g').eq('user_id', userId)
      .lte('effective_from', localDate).order('effective_from', { ascending: false })
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('meal_entries').select('id, meal_slot, meal_items(kcal, protein_g, carb_g, fat_g, sugar_g)')
      .eq('user_id', userId).eq('local_date', localDate),
    admin.from('health_samples').select('type, value, start_at, end_at, source, metadata')
      .eq('user_id', userId).eq('local_date', localDate),
    admin.from('daily_summaries').select('local_date, weight_kg, weight_trend_kg, wake_time')
      .eq('user_id', userId).lt('local_date', localDate).gte('local_date', addDays(localDate, -14))
      .order('local_date', { ascending: false }),
    admin.from('free_days').select('kind').eq('user_id', userId).eq('local_date', localDate).maybeSingle(),
    admin.from('programs').select('id, schedule_mode, started_on, days_per_week').eq('user_id', userId)
      .eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    admin.from('workout_sessions').select('id').eq('user_id', userId).eq('local_date', localDate).eq('status', 'completed'),
    admin.from('task_definitions').select('id, days_of_week, created_at').eq('user_id', userId).eq('is_active', true),
    admin.from('task_logs').select('task_id, is_completed').eq('user_id', userId).eq('local_date', localDate),
    admin.from('quests').select('code, stat, xp_reward, params').eq('user_id', userId).eq('local_date', localDate),
    admin.from('daily_scores').select('local_date, total, result, is_free_day, shield_used, breakdown')
      .eq('user_id', userId).lt('local_date', localDate).gte('local_date', addDays(localDate, -HISTORY_DAYS_BEFORE))
      .order('local_date', { ascending: true }),
    admin.from('boss_battles').select('week_start, boss_code, hits_required, hits, won_at, reward')
      .eq('user_id', userId).lte('week_start', localDate).order('week_start', { ascending: false }).limit(1).maybeSingle(),
    admin.from('user_badges').select('badge_code').eq('user_id', userId),
    admin.from('personal_records').select('kind').eq('user_id', userId)
      .gte('achieved_at', dayStart).lt('achieved_at', dayEnd),
  ]);

  // ---- nutrition
  const meals = rows(mealsRes);
  const items = meals.flatMap((m) => m.meal_items);
  const breakfast = meals.filter((m) => m.meal_slot === 'breakfast').flatMap((m) => m.meal_items);
  const intake = {
    kcal: Math.round(items.reduce((a, i) => a + Number(i.kcal), 0)),
    protein_g: round1(items.reduce((a, i) => a + Number(i.protein_g), 0)),
    carb_g: round1(items.reduce((a, i) => a + Number(i.carb_g), 0)),
    fat_g: round1(items.reduce((a, i) => a + Number(i.fat_g), 0)),
    sugar_g: round1(items.reduce((a, i) => a + Number(i.sugar_g), 0)),
    mealsLogged: meals.filter((m) => m.meal_items.length > 0).length,
    breakfastProteinG: breakfast.length ? round1(breakfast.reduce((a, i) => a + Number(i.protein_g), 0)) : null,
  };
  const t = one(targetRes);

  // ---- health
  const hs = rows(samplesRes) as Sample[];
  const waterSamples = hs.filter((s) => s.type === 'water');
  const waterMl = Math.round(sum(waterSamples));
  const waterBefore10 = Math.round(sum(waterSamples.filter((s) => localTimeOf(new Date(s.start_at), timezone) < '10:00')));
  const sleepSessions = preferred(hs, 'sleep_session');
  const sleepMin = sleepSessions.length ? Math.round(sum(sleepSessions)) : null;
  const lastWake = sleepSessions.map((s) => s.end_at).filter((e): e is string => e !== null).sort().at(-1);
  const firstBed = sleepSessions.map((s) => s.start_at).sort()[0];
  const quality = sleepSessions
    .map((s) => Number((s.metadata as Record<string, unknown> | null)?.quality))
    .find((q) => Number.isInteger(q) && q >= 1 && q <= 5) ?? null;
  const steps = preferred(hs, 'steps');
  const active = preferred(hs, 'active_energy');
  const hr = preferred(hs, 'resting_hr');
  const weights = preferred(hs, 'weight').sort((a, b) => a.start_at.localeCompare(b.start_at));
  const weightKg = weights.length ? round1(Number(weights[weights.length - 1]!.value)) : null;

  const recent = rows(recentRes);
  const prevTrend = recent.find((r) => r.weight_trend_kg !== null)?.weight_trend_kg ?? null;
  const trendKg = weightKg === null
    ? prevTrend
    : prevTrend === null ? weightKg : round2(prevTrend + TREND_ALPHA * (weightKg - prevTrend));
  const d1 = recent.find((r) => r.local_date === addDays(localDate, -1));
  const d2 = recent.find((r) => r.local_date === addDays(localDate, -2));
  // ≥ 3 weigh-ins per week (lifestyle.md §2): due when the two previous closed days had none.
  const weighRequired = d1 !== undefined && d2 !== undefined && d1.weight_kg === null && d2.weight_kg === null;
  const wakeMinutes = recent.slice(0, 7).map((r) => r.wake_time).filter((w): w is string => w !== null).map(minutesOfDay);
  const avgWake = wakeMinutes.length ? Math.round(wakeMinutes.reduce((a, b) => a + b, 0) / wakeMinutes.length) : null;
  const usualWake = avgWake === null
    ? null
    : `${String(Math.floor(avgWake / 60)).padStart(2, '0')}:${String(avgWake % 60).padStart(2, '0')}`;

  // ---- training
  const prog = one(programRes);
  const completed = rows(workoutsRes).length;
  let scheduled = 0;
  let scheduledThisWeek = 0;
  let workoutTomorrow = false;
  if (prog && prog.started_on <= localDate) {
    if (prog.schedule_mode === 'weekday') {
      const sessions = rows(await admin.from('planned_sessions').select('week_no, day_of_week').eq('program_id', prog.id));
      const week = Math.floor(daysBetween(prog.started_on, localDate) / 7) + 1;
      const hasWeek = sessions.some((s) => s.week_no === week);
      const inWeek = sessions.filter((s) => (hasWeek ? s.week_no === week : s.week_no === 1));
      scheduled = inWeek.filter((s) => s.day_of_week === weekday).length;
      scheduledThisWeek = inWeek.filter((s) => s.day_of_week !== null).length;
      workoutTomorrow = inWeek.some((s) => s.day_of_week === tomorrowWeekday);
    } else {
      // Rotation (WRK-15): no fixed weekdays – a trained day counts as scheduled + done.
      scheduled = completed;
      scheduledThisWeek = prog.days_per_week;
    }
  }

  // ---- tasks
  const defs = rows(taskDefsRes);
  const scheduledTasks = defs.filter((d) =>
    d.days_of_week.includes(weekday) && localDateOf(new Date(d.created_at), timezone) <= localDate);
  const ids = new Set(scheduledTasks.map((d) => d.id));
  const tasksDone = rows(taskLogsRes).filter((l) => l.is_completed && ids.has(l.task_id)).length;

  // ---- other
  const settings = one(settingsRes);
  const profile = one(profileRes);
  const freeDay = one(freeDayRes);
  const prs = rows(prsRes);
  const weightRef = trendKg ?? weightKg ?? DEFAULT_WEIGHT_KG;
  const waterTarget = Math.round((35 * weightRef + (scheduled > 0 || completed > 0 ? 500 : 0)) / 50) * 50;
  const stateRow = one(stateRes);

  return {
    userId,
    localDate,
    timezone,
    settings: {
      strictness: (settings?.strictness ?? 'standard') as Strictness,
      freeDaysPerWeek: settings?.free_days_per_week ?? null,
    },
    profile: {
      sex: profile?.sex === 'male' || profile?.sex === 'female' ? profile.sex : null,
      birthDate: profile?.birth_date ?? null,
      heightCm: profile?.height_cm === null || profile?.height_cm === undefined ? null : Number(profile.height_cm),
    },
    target: t ? { kcal: t.kcal, protein_g: t.protein_g, sugar_g: t.sugar_g } : null,
    intake,
    water: { ml: waterMl, targetMl: waterTarget, mlBefore10: waterBefore10 },
    sleep: {
      minutes: sleepMin,
      quality,
      targetMin: SLEEP_TARGET_MIN,
      wakeTime: lastWake ? localTimeOf(new Date(lastWake), timezone) : null,
      usualWakeTime: usualWake,
      bedtime: firstBed ? localTimeOf(new Date(firstBed), timezone) : null,
    },
    training: { scheduled, completed, scheduledThisWeek },
    tasks: { scheduled: scheduledTasks.length, completed: tasksDone, active: defs.length },
    weight: { kg: weightKg, trendKg, weighRequired },
    activity: {
      steps: steps.length ? Math.round(sum(steps)) : null,
      activeKcal: active.length ? Math.round(sum(active)) : null,
      restingHr: hr.length ? Math.round(sum(hr) / hr.length) : null,
    },
    freeDayRequest: freeDay?.kind === 'quota' || freeDay?.kind === 'shield' ? freeDay.kind : 'none',
    prs: {
      newPrs: prs.filter((p) => p.kind !== 'progression_level').length,
      calisthenicsLevelUps: prs.filter((p) => p.kind === 'progression_level').length,
    },
    quests: rows(questsRes),
    tomorrow: {
      workoutScheduled: workoutTomorrow,
      tasksScheduled: defs.some((d) => d.days_of_week.includes(tomorrowWeekday)),
      weighInDue: d1 !== undefined && d1.weight_kg === null && weightKg === null,
    },
    coach: {
      state: stateRow
        ? ({
          ...stateRow,
          xp: Number(stateRow.xp),
          aura_score: Number(stateRow.aura_score),
        } as CoachStateRow)
        : null,
      scores: rows(scoresRes),
      boss: one(bossRes),
      badges: rows(badgesRes).map((b) => b.badge_code),
    },
    summary: {
      kcal_in: intake.kcal,
      protein_g: intake.protein_g,
      carb_g: intake.carb_g,
      fat_g: intake.fat_g,
      sugar_g: intake.sugar_g,
      kcal_target: t?.kcal ?? null,
      water_ml: waterMl,
      sleep_min: sleepMin,
      sleep_quality: quality,
      wake_time: lastWake ? localTimeOf(new Date(lastWake), timezone) : null,
      steps: steps.length ? Math.round(sum(steps)) : null,
      active_kcal: active.length ? Math.round(sum(active)) : null,
      resting_hr: hr.length ? Math.round(sum(hr) / hr.length) : null,
      weight_kg: weightKg,
      weight_trend_kg: trendKg,
      is_free_day: freeDay !== null,
    },
  };
}
