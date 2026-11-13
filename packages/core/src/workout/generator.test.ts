import { requireExercise } from './catalog/exercises';
import {
  applyProgression,
  chooseTemplate,
  deloadExercise,
  equipmentKindOf,
  estimateSessionMinutes,
  fitToDuration,
  generateProgram,
} from './generator';
import { loadSpecFor } from './plates';
import type { PerformedSet } from './progression';
import { planToday } from './schedule';
import type { EquipmentCode, GymInventory } from './types';

const GYM: EquipmentCode[] = ['barbell', 'dumbbell', 'cable', 'machine', 'smith_machine', 'bodyweight', 'pullup_bar', 'band', 'kettlebell'];

describe('template choice (WRK-03 split by days)', () => {
  it('follows 2–3 full body · 4 upper/lower · 5–6 PPL and equipment profiles', () => {
    expect(chooseTemplate({ daysPerWeek: 2, availableEquipment: GYM })).toBe('full_body_ab');
    expect(chooseTemplate({ daysPerWeek: 3, availableEquipment: GYM })).toBe('full_body_ab');
    expect(chooseTemplate({ daysPerWeek: 4, availableEquipment: GYM })).toBe('upper_lower');
    expect(chooseTemplate({ daysPerWeek: 4, availableEquipment: GYM, priorityGroups: ['glutes'] })).toBe('women_lower_focus');
    expect(chooseTemplate({ daysPerWeek: 5, availableEquipment: GYM })).toBe('push_pull_legs');
    expect(chooseTemplate({ daysPerWeek: 3, availableEquipment: ['dumbbell', 'band'] })).toBe('home_dumbbell_band');
    expect(chooseTemplate({ daysPerWeek: 3, availableEquipment: ['bodyweight', 'pullup_bar'] })).toBe('calisthenics_levels');
    expect(equipmentKindOf(['kettlebell'])).toBe('home');
  });
});

describe('generateProgram', () => {
  const program = generateProgram({ goal: 'gain_muscle', level: 'beginner', daysPerWeek: 3, availableEquipment: GYM });

  it('builds an 8-week block with weekly sessions on default weekdays', () => {
    expect(program).toMatchObject({ templateSlug: 'full_body_ab', split: 'full_body', totalWeeks: 8, scheduleMode: 'weekday', progressionRule: 'double' });
    expect(program.weeks).toHaveLength(8);
    expect(program.weeks[0]!.sessions.map((s) => s.dayOfWeek)).toEqual([1, 3, 5]);
    // A / B alternate across weeks: A B A | B A B.
    expect(program.weeks[0]!.sessions.map((s) => s.code)).toEqual(['A', 'B', 'A']);
    expect(program.weeks[1]!.sessions.map((s) => s.code)).toEqual(['B', 'A', 'B']);
    expect(program.replaced).toEqual([]);
  });

  it('schedules a deload (half the sets, RIR + 2) every N weeks', () => {
    const deloads = program.weeks.filter((w) => w.isDeload).map((w) => w.weekNo);
    expect(deloads).toEqual([6]);
    const normal = program.weeks[0]!.sessions[0]!.exercises[0]!;
    const light = program.weeks[5]!.sessions[1]!.exercises[0]!;
    expect(light.exerciseSlug).toBe(normal.exerciseSlug);
    expect(light.sets).toBe(Math.ceil(normal.sets / 2));
    expect(deloadExercise({ ...normal, targetRir: 3 }).targetRir).toBe(4);
  });

  it('adjusts volume to level and priority groups', () => {
    const beginnerUL = generateProgram({ goal: 'maintain', level: 'beginner', daysPerWeek: 4, availableEquipment: GYM, templateSlug: 'upper_lower', sessionMinutes: 120 });
    const advancedUL = generateProgram({ goal: 'maintain', level: 'advanced', daysPerWeek: 4, availableEquipment: GYM, templateSlug: 'upper_lower', sessionMinutes: 120, priorityGroups: ['biceps'] });
    const bench = (p: typeof beginnerUL) => p.weeks[0]!.sessions[0]!.exercises.find((e) => e.exerciseSlug === 'barbell_bench_press')!;
    const curl = (p: typeof beginnerUL) => p.weeks[0]!.sessions[0]!.exercises.find((e) => e.exerciseSlug === 'ez_bar_curl')!;
    expect(bench(beginnerUL).sets).toBe(3);
    expect(bench(advancedUL).sets).toBe(5);
    expect(curl(beginnerUL).sets).toBe(2);
    expect(curl(advancedUL).sets).toBe(3);
  });

  it('adapts to a home equipment profile and supports rotation mode', () => {
    const p = generateProgram({ goal: 'lose_fat', level: 'intermediate', daysPerWeek: 4, availableEquipment: ['dumbbell', 'band', 'pullup_bar'], templateSlug: 'upper_lower', scheduleMode: 'rotation', totalWeeks: 20 });
    expect(p.totalWeeks).toBe(12);
    expect(p.replaced.length).toBeGreaterThan(0);
    for (const e of p.weeks[0]!.sessions.flatMap((s) => s.exercises)) {
      expect(['dumbbell', 'band', 'pullup_bar', 'bodyweight']).toContain(requireExercise(e.exerciseSlug).equipment);
    }
    expect(p.weeks[0]!.sessions.every((s) => s.dayOfWeek === null)).toBe(true);
  });

  it('fits sessions to the available time by marking extras', () => {
    const p = generateProgram({ goal: 'gain_muscle', level: 'intermediate', daysPerWeek: 4, availableEquipment: GYM, sessionMinutes: 45 });
    const upper = p.weeks[0]!.sessions[0]!.exercises;
    expect(upper.some((e) => e.isExtra)).toBe(true);
    expect(estimateSessionMinutes(upper)).toBeLessThanOrEqual(45);
    expect(upper.filter((e) => !e.isExtra).length).toBeGreaterThanOrEqual(4);
    expect(upper.filter((e) => e.isExtra).every((e) => requireExercise(e.exerciseSlug).mechanic === 'isolation')).toBe(true);
    expect(fitToDuration(upper, 500).some((e) => e.isExtra)).toBe(true); // already-extra stay extra
  });
});

describe('M5 scenario – next week progression is correct', () => {
  const inventory: GymInventory = {
    bars: [{ type: 'olympic', kg: 20 }],
    plates_kg: [20, 10, 5, 2.5, 1.25],
    dumbbells_kg: [6, 8, 10, 12],
    machines: { leg_press: { step_kg: 10, min_kg: 20 } },
  };
  const spec = (slug: string) => loadSpecFor(requireExercise(slug), inventory);

  it('turns week-1 session A results into week-2 targets', () => {
    const program = generateProgram({ goal: 'gain_muscle', level: 'beginner', daysPerWeek: 3, availableEquipment: GYM });
    const sessionA = program.weeks[0]!.sessions[0]!.exercises.map((e) => ({
      ...e,
      targetLoadKg: ({ leg_press: 100, barbell_bench_press: 60, lat_pulldown: 45, romanian_deadlift: 60, dumbbell_lateral_raise: 8 } as Record<string, number>)[e.exerciseSlug] ?? null,
    }));
    const done = (load: number | null, ...reps: number[]): PerformedSet[] => reps.map((r) => ({ loadKg: load, reps: r }));
    const performance: Record<string, PerformedSet[]> = {
      leg_press: done(100, 12, 12, 12), // top of 8–12 → +1 machine step (10 kg)
      barbell_bench_press: [{ loadKg: 40, reps: 10, isWarmup: true }, ...done(60, 10, 10, 10)], // top of 6–10 → +2.5
      lat_pulldown: done(45, 12, 11, 10), // in range → add reps, same load
      romanian_deadlift: done(60, 6, 7, 8), // mostly below 8 → −10 % → 55
      dumbbell_lateral_raise: done(8, 20, 20), // top of 12–20 → next dumbbell 10
      crunch: done(null, 20, 18), // bodyweight, not at top for every set → add reps
    };
    const next = applyProgression(sessionA, performance, { rule: program.progressionRule, loadSpecFor: spec });
    const load = (slug: string) => next.exercises.find((e) => e.exerciseSlug === slug)?.targetLoadKg;
    expect(load('leg_press')).toBe(110);
    expect(load('barbell_bench_press')).toBe(62.5);
    expect(load('lat_pulldown')).toBe(45);
    expect(load('romanian_deadlift')).toBe(55);
    expect(load('dumbbell_lateral_raise')).toBe(10);
    expect(next.decisions.crunch).toMatchObject({ action: 'add_reps', repTarget: 19 });
    expect(next.decisions.lat_pulldown).toMatchObject({ action: 'add_reps', repTarget: 11 });
    // Sets × reps stay as planned.
    expect(next.exercises.map((e) => [e.sets, e.repMin, e.repMax])).toEqual(sessionA.map((e) => [e.sets, e.repMin, e.repMax]));
  });

  it('levels up calisthenics and keeps rotation after a missed day', () => {
    const p = generateProgram({ goal: 'maintain', level: 'beginner', daysPerWeek: 3, availableEquipment: ['bodyweight', 'pullup_bar'], scheduleMode: 'rotation' });
    const a = p.weeks[0]!.sessions[0]!.exercises;
    const next = applyProgression(a, { push_up: [12, 12, 12].map((reps) => ({ loadKg: null, reps })) }, { rule: p.progressionRule, loadSpecFor: spec });
    expect(next.exercises[0]).toMatchObject({ exerciseSlug: 'diamond_push_up', backupExerciseSlug: 'push_up', targetLoadKg: null });
    // Week 2: A done Mon, Wed missed → Thu still session B (index 1).
    expect(planToday({ mode: 'rotation', today: '2026-11-19', nextRotationIndex: 1, daysPerWeek: 3, lastCompletedDate: '2026-11-16', completedThisWeek: 1 }).sessionIndex).toBe(1);
  });
});
