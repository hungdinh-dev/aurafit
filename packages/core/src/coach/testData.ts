/** Test fixtures shared by coach tests (not exported from the module index). */
import type { DayScoreData } from './dailyScore';
import type { DayRecord, ScoreCriteria } from './types';

export function perfectDay(opts: { workout?: boolean } = {}): DayScoreData {
  return {
    nutrition: { loggedFullDay: true, kcalIn: 2000, kcalTarget: 2000, kcalFloor: 1500, proteinG: 140, proteinTargetG: 140, sugarG: 30, sugarLimitG: 50 },
    sleep: { sleepMin: 480, targetMin: 480, wakeTimeMin: 390, wakeTargetMin: 390, bedtimeMin: 23 * 60 },
    workout: { scheduledSessions: opts.workout ? 1 : 0, completedSessions: opts.workout ? 1 : 0 },
    water: { ml: 2500, targetMl: 2500 },
    tasks: { scheduled: 2, completed: 2 },
    weight: { weighInDue: false, weighed: false },
  };
}

export function criteria(overrides: Partial<ScoreCriteria> = {}): ScoreCriteria {
  return {
    loggedFullDay: true,
    kcalInRange: true,
    proteinMet: true,
    sugarMet: true,
    belowFloor: false,
    sleepMet: true,
    wakeOnTime: true,
    bedtimeOk: true,
    waterMet: true,
    workoutsScheduled: 0,
    workoutsCompleted: 0,
    tasksScheduled: 2,
    tasksCompleted: 2,
    weighed: null,
    ...overrides,
  };
}

export function record(localDate: string, overrides: Partial<ScoreCriteria> = {}, extra: Partial<DayRecord> = {}): DayRecord {
  return {
    localDate,
    total: 100,
    result: 'excellent',
    freeDay: 'none',
    shieldUsed: false,
    criteria: criteria(overrides),
    strengthTrendPct: null,
    bodyProgressScore: null,
    ...extra,
  };
}
