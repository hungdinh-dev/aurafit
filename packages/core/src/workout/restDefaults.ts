/**
 * WRK-16 – default rest by exercise type: compound 120–180 s (default 150), isolation 60–90 s
 * (default 75). Longer rests help strength & hypertrophy on multi-joint lifts
 * (Schoenfeld et al. 2016; Grgic et al. 2018 – feature-backlog.md [15][16]).
 */
import type { Mechanic } from './types';
import { DEFAULT_REST_SEC } from './catalog/exercises';

export interface RestRecommendation {
  restSec: number;
  minSec: number;
  maxSec: number;
}

export const REST_RANGES: Readonly<Record<Mechanic, { minSec: number; maxSec: number }>> = {
  compound: { minSec: 120, maxSec: 180 },
  isolation: { minSec: 60, maxSec: 90 },
};

/**
 * Default rest for an exercise. Heavy compound work (≤ 6 reps, e.g. 5×5) gets the top of the
 * range (180 s), because strength sets benefit most from ≥ 3 min (Grgic 2018).
 * A user override (`exercises` per-user edit / `planned_exercises.rest_sec`) always wins.
 */
export function defaultRest(
  mechanic: Mechanic,
  opts: { repMax?: number; userOverrideSec?: number | null } = {},
): RestRecommendation {
  const range = REST_RANGES[mechanic];
  if (opts.userOverrideSec != null && opts.userOverrideSec > 0) {
    return { restSec: Math.round(opts.userOverrideSec), ...range };
  }
  const heavy = mechanic === 'compound' && opts.repMax !== undefined && opts.repMax <= 6;
  return { restSec: heavy ? range.maxSec : DEFAULT_REST_SEC[mechanic], ...range };
}
