import { nutrition } from '@aurafit/core';
import { useMemo } from 'react';

import { parseExplanation, useCurrentTargets, useMealsForDay, type NutritionTargetRow } from './api';

export type DayNutrition = {
  targets: NutritionTargetRow | null;
  consumed: nutrition.Nutrients;
  /** target − consumed (negative = over); null without targets. */
  remaining: nutrition.Nutrients | null;
  mealsLogged: number;
  floorKcal: number | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

/** Targets + meals of a day combined with core arithmetic (NUT-01 / NUT-08). */
export function useDayNutrition(day: string): DayNutrition & { meals: ReturnType<typeof useMealsForDay>['data'] } {
  const targets = useCurrentTargets();
  const meals = useMealsForDay(day);
  const current = targets.data?.current ?? null;

  const consumed = useMemo(
    () => nutrition.sumNutrients((meals.data ?? []).flatMap((m) => m.meal_items)),
    [meals.data],
  );
  const remaining = useMemo(
    () => (current ? nutrition.remainingNutrients(current, consumed) : null),
    [current, consumed],
  );

  return {
    targets: current,
    consumed,
    remaining,
    meals: meals.data,
    mealsLogged: meals.data?.length ?? 0,
    floorKcal: parseExplanation(current?.explanation).floorKcal ?? null,
    isLoading: targets.isLoading || meals.isLoading,
    isError: targets.isError || meals.isError,
    refetch: () => {
      void targets.refetch();
      void meals.refetch();
    },
  };
}
