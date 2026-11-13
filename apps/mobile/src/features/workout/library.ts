/** Exercise library filtering (WRK-01 / WRK-09): 9 muscle groups × 9 equipment types + search. */
import { workout } from '@aurafit/core';

export const MUSCLE_GROUPS: readonly workout.MuscleGroupCode[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'glutes',
  'legs',
];

export type LibraryMode = 'group' | 'equipment';

/** Lower-case, accent-free text for Vietnamese-friendly search ("day nguc" finds "Đẩy ngực"). */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export interface LibraryFilter {
  mode: LibraryMode;
  group: workout.MuscleGroupCode;
  equipment: workout.EquipmentCode;
  query: string;
}

/** Exercises matching the filter. A search query searches the whole library (names in both languages + slug). */
export function filterExercises(
  filter: LibraryFilter,
  nameOf: (slug: string) => string,
  catalog: readonly workout.Exercise[] = workout.EXERCISES
): workout.Exercise[] {
  const q = normalizeSearch(filter.query);
  if (q) {
    return catalog.filter((e) => normalizeSearch(`${nameOf(e.slug)} ${e.slug.replace(/_/g, ' ')}`).includes(q));
  }
  return catalog.filter((e) => (filter.mode === 'group' ? e.groupCode === filter.group : e.equipment === filter.equipment));
}

export function countBy(mode: LibraryMode, catalog: readonly workout.Exercise[] = workout.EXERCISES): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of catalog) {
    const key = mode === 'group' ? e.groupCode : e.equipment;
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}
