import { workout } from '@aurafit/core';
import { useMemo } from 'react';

import { useLanguage, type Language } from '@/i18n';
import { en, vi } from '@/i18n/resources';

/**
 * Localised names of the workout catalog (exercises, groups, muscles, heads, equipment, templates).
 * Generated into `i18n/<lang>/workout.json → catalog` from the seed (CSV + catalog.mjs), so names
 * work without a network round-trip and in preview mode. Unknown codes fall back to the code.
 */
type Catalog = typeof vi.workout.catalog;

function pick<T extends Record<string, unknown>>(dict: T, key: string): T[keyof T] | undefined {
  return (dict as Record<string, T[keyof T]>)[key];
}

export function catalogNames(language: Language) {
  const c: Catalog = language === 'en' ? en.workout.catalog : vi.workout.catalog;
  return {
    exercise: (slug: string): string => (pick(c.exercise, slug) as string | undefined) ?? slug,
    group: (code: workout.MuscleGroupCode): string => c.group[code],
    muscle: (code: workout.MuscleCode): string => c.muscle[code],
    head: (code: workout.MuscleHeadCode): string => c.head[code],
    /** Head name prefixed with its muscle when the head alone is ambiguous ("Tay trước – đầu dài"). */
    headFull: (code: workout.MuscleHeadCode): string => {
      const muscle = workout.muscleOfHead(code);
      const heads = workout.MUSCLE_HEADS_BY_MUSCLE[muscle];
      if (heads.length === 1) return c.muscle[muscle];
      const head = c.head[code];
      return head.toLowerCase().includes(c.muscle[muscle].toLowerCase()) ? head : `${c.muscle[muscle]} – ${head}`;
    },
    equipment: (code: workout.EquipmentCode): string => c.equipment[code],
    templateName: (slug: workout.TemplateSlug): string => c.template[slug].name,
    templateDescription: (slug: workout.TemplateSlug): string => c.template[slug].description,
    templateSession: (slug: workout.TemplateSlug, rotationIndex: number): string =>
      (pick(c.template[slug].sessions, String(rotationIndex)) as string | undefined) ??
      String.fromCharCode(65 + rotationIndex),
  };
}

export type CatalogNames = ReturnType<typeof catalogNames>;

/** Catalog names in the current language (re-renders on language change). */
export function useCatalogNames(): CatalogNames {
  const [language] = useLanguage();
  return useMemo(() => catalogNames(language), [language]);
}
