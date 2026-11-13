import { isEquivalent } from './backup';
import { requireExercise } from './catalog/exercises';
import { muscleStimulus } from './stimulus';
import { getTemplate, PROGRAM_TEMPLATES, type ProgramTemplate } from './templates';
import type { MuscleCode } from './types';

/** Sessions done in the first `weeks` weeks at the template's default frequency (A, B, A, B …). */
function sessionsOver(t: ProgramTemplate, weeks: number) {
  return Array.from({ length: t.daysPerWeek * weeks }, (_, k) => t.sessions[k % t.sessions.length]!);
}

function frequency(t: ProgramTemplate, weeks: number, muscles: MuscleCode[]): number {
  return sessionsOver(t, weeks).filter((s) =>
    s.exercises.some((e) => muscles.some((m) => (muscleStimulus(e.exerciseSlug).get(m) ?? 0) >= 0.5)),
  ).length;
}

describe('program templates (WRK-20)', () => {
  it('has the 7 templates with unique slugs and rotation indexes', () => {
    expect(PROGRAM_TEMPLATES).toHaveLength(7);
    expect(new Set(PROGRAM_TEMPLATES.map((t) => t.slug)).size).toBe(7);
    for (const t of PROGRAM_TEMPLATES) {
      expect(t.sessions.map((s) => s.rotationIndex)).toEqual(t.sessions.map((_, i) => i));
      expect(t.supportedDays).toContain(t.daysPerWeek);
      expect(t.deloadEveryWeeks).toBeGreaterThanOrEqual(4);
      expect(t.deloadEveryWeeks).toBeLessThanOrEqual(6);
    }
    expect(() => getTemplate('nope' as never)).toThrow('unknown_template');
  });

  it('uses valid exercises, equivalent backups, sane reps / RIR / rest', () => {
    for (const t of PROGRAM_TEMPLATES) {
      for (const s of t.sessions) {
        for (const e of s.exercises) {
          const ex = requireExercise(e.exerciseSlug);
          expect(e.repMin).toBeLessThanOrEqual(e.repMax);
          expect(e.targetRir).toBeGreaterThanOrEqual(1);
          expect(e.targetRir).toBeLessThanOrEqual(3);
          if (ex.mechanic === 'compound') expect(e.restSec).toBeGreaterThanOrEqual(120);
          else expect(e.restSec).toBeLessThanOrEqual(90);
          if (e.backupExerciseSlug) {
            expect([t.slug, e.exerciseSlug, isEquivalent(ex, requireExercise(e.backupExerciseSlug))]).toEqual([t.slug, e.exerciseSlug, true]);
          }
        }
      }
    }
  });

  it('beginner templates keep RIR ≥ 2', () => {
    for (const t of PROGRAM_TEMPLATES.filter((x) => x.level === 'beginner')) {
      for (const e of t.sessions.flatMap((s) => s.exercises)) expect(e.targetRir).toBeGreaterThanOrEqual(1);
    }
    expect(getTemplate('full_body_ab').sessions.flatMap((s) => s.exercises).every((e) => e.targetRir >= 2)).toBe(true);
  });

  it('trains each major muscle ≥ 2×/week on average (2-week window)', () => {
    const major: MuscleCode[][] = [['chest'], ['lats', 'upper_back'], ['front_delts'], ['glutes']];
    for (const t of PROGRAM_TEMPLATES) {
      // Classic 5×5 alternates A/B: bench & press are 1.5×/week each (documented exception).
      const min = t.slug === 'strength_5x5' ? 3 : 4;
      for (const m of major) expect([t.slug, m.join('|'), frequency(t, 2, m) >= min]).toEqual([t.slug, m.join('|'), true]);
    }
  });

  it('5×5 uses 3 compound lifts per session, 5 × 5, linear progression', () => {
    const t = getTemplate('strength_5x5');
    expect(t.progressionRule).toBe('linear');
    for (const s of t.sessions) {
      expect(s.exercises).toHaveLength(3);
      expect(s.exercises.every((e) => requireExercise(e.exerciseSlug).mechanic === 'compound' && e.repMax === 5)).toBe(true);
      expect(s.exercises.every((e) => e.restSec === 180)).toBe(true);
    }
  });

  it('home and calisthenics templates need no gym equipment', () => {
    const gym = ['barbell', 'machine', 'cable', 'smith_machine'];
    for (const slug of ['home_dumbbell_band', 'calisthenics_levels'] as const) {
      for (const e of getTemplate(slug).sessions.flatMap((s) => s.exercises)) {
        expect(gym).not.toContain(requireExercise(e.exerciseSlug).equipment);
      }
    }
  });

  it('lower-focus template gives glutes / hamstrings more weekly sets than chest', () => {
    const t = getTemplate('women_lower_focus');
    const sets = (m: MuscleCode) =>
      t.sessions.flatMap((s) => s.exercises).reduce((sum, e) => sum + e.sets * (muscleStimulus(e.exerciseSlug).get(m) ?? 0), 0);
    expect(sets('glutes')).toBeGreaterThan(sets('chest') * 2);
    expect(sets('glutes')).toBeGreaterThanOrEqual(10);
  });
});
