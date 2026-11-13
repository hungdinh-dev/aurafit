import { adaptToEquipment, findBackupExercises, pickBackup, swapExercise, type PlannedExercise } from './backup';

const planned = (slug: string, backup: string | null = null): PlannedExercise => ({
  exerciseSlug: slug,
  sortOrder: 1,
  sets: 3,
  repMin: 8,
  repMax: 12,
  targetRir: 2,
  restSec: 150,
  targetLoadKg: 60,
  backupExerciseSlug: backup,
  isExtra: false,
});

describe('backup exercises (WRK-17)', () => {
  it('ranks same muscle + pattern first', () => {
    const list = findBackupExercises('lat_pulldown');
    expect(list[0]?.slug).toMatch(/^(pull_up|chin_up)$/);
    expect(list.map((c) => c.slug)).not.toContain('lat_pulldown');
  });

  it('only offers available equipment (bodyweight always allowed)', () => {
    const list = findBackupExercises('barbell_bench_press', { availableEquipment: ['dumbbell'] });
    expect(list[0]?.slug).toBe('dumbbell_bench_press');
    expect(list.every((c) => !['barbell_bench_press', 'machine_chest_press', 'incline_barbell_bench_press'].includes(c.slug))).toBe(true);
    expect(pickBackup('leg_extension', { availableEquipment: ['bodyweight'] })).toBeNull();
  });

  it('swaps while keeping sets × reps × RIR', () => {
    const s = swapExercise(planned('leg_press', 'smith_machine_squat'), 'smith_machine_squat');
    expect(s).toMatchObject({ exerciseSlug: 'smith_machine_squat', sets: 3, repMin: 8, repMax: 12, targetRir: 2, targetLoadKg: null, backupExerciseSlug: 'leg_press' });
    expect(() => swapExercise(planned('leg_press'), 'unknown')).toThrow('unknown_exercise');
  });

  it('adapts a gym session to a home profile', () => {
    const r = adaptToEquipment(
      [planned('barbell_bench_press', 'dumbbell_bench_press'), planned('leg_extension'), planned('dumbbell_curl', 'cable_curl')],
      ['dumbbell', 'band'],
    );
    expect(r.replaced).toEqual([{ from: 'barbell_bench_press', to: 'dumbbell_bench_press' }, { from: 'leg_extension', to: expect.any(String) }]);
    expect(r.exercises.map((e) => e.sortOrder)).toEqual([1, 2, 3]);
    // The curl stays but its cable backup is replaced by an available one.
    expect(r.exercises[2]).toMatchObject({ exerciseSlug: 'dumbbell_curl' });
    expect(r.exercises[2]?.backupExerciseSlug).not.toBe('cable_curl');
  });

  it('drops exercises without any equivalent', () => {
    const r = adaptToEquipment([planned('cable_crunch')], ['barbell']);
    expect(r.exercises[0]?.exerciseSlug).not.toBe('cable_crunch');
    const none = adaptToEquipment([planned('hip_abduction_machine')], []);
    expect(none.exercises.length + none.dropped.length).toBe(1);
  });
});
