/**
 * WRK-18 – plate calculator, machine-step rounding and "achievable load" helpers shared by
 * progression and autoregulation. Every suggested load is rounded to something that exists
 * in the user's gym (workout.md, "tạ gợi ý luôn làm tròn theo bước có thật").
 */
import type { Exercise, GymInventory } from './types';

export type RoundMode = 'nearest' | 'down' | 'up';

/** How load can change for an exercise in a given gym. */
export type LoadSpec =
  | {
      kind: 'plates';
      barKg: number;
      platesKg: readonly number[];
      /** Number of plates available per size (both sides together). Omitted = unlimited. */
      plateCounts?: Readonly<Record<string, number>>;
    }
  | { kind: 'stack'; stepKg: number; minKg?: number; maxKg?: number }
  | { kind: 'fixed'; availableKg: readonly number[] }
  | { kind: 'bodyweight' };

export const DEFAULT_OLYMPIC_BAR_KG = 20;
export const DEFAULT_PLATES_KG: readonly number[] = [25, 20, 15, 10, 5, 2.5, 1.25];
/** workout.md: machines usually 5 kg; dumbbells 1–2 kg (we default to a 2 kg rack 2–50 kg). */
export const DEFAULT_MACHINE_STEP_KG = 5;
export const DEFAULT_DUMBBELLS_KG: readonly number[] = Array.from({ length: 25 }, (_, i) => (i + 1) * 2);
/** Common competition-style kettlebell sizes. */
export const DEFAULT_KETTLEBELLS_KG: readonly number[] = [4, 6, 8, 12, 16, 20, 24, 28, 32];

const toG = (kg: number): number => Math.round(kg * 1000);
const toKg = (g: number): number => Math.round(g) / 1000;
export const round2 = (n: number): number => Math.round(n * 100) / 100;

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export interface PlateLoadout {
  /** Plates for ONE side, heaviest first. */
  perSide: number[];
  achievedKg: number;
  targetKg: number;
  exact: boolean;
  /** achieved − target. */
  deltaKg: number;
}

interface PlateSetup {
  barKg: number;
  platesKg: readonly number[];
  plateCounts?: Readonly<Record<string, number>>;
}

/** Per-side totals (grams) reachable with the available plates, up to `maxSideG`. */
function reachablePerSide(setup: PlateSetup, maxSideG: number): { unit: number; reachable: Uint8Array } {
  const plates = [...new Set(setup.platesKg.filter((p) => p > 0))].sort((a, b) => b - a);
  const grams = plates.map(toG);
  const unit = grams.reduce((acc, g) => gcd(acc, g), 0) || 1;
  const maxUnits = Math.max(0, Math.floor(maxSideG / unit));
  const reachable = new Uint8Array(maxUnits + 1);
  reachable[0] = 1;
  plates.forEach((plate, i) => {
    const w = (grams[i] as number) / unit;
    const count = setup.plateCounts?.[String(plate)];
    const pairs = count === undefined ? Math.floor(maxUnits / w) : Math.floor(count / 2);
    for (let k = 0; k < pairs; k++) {
      for (let s = maxUnits; s >= w; s--) {
        if (!reachable[s] && reachable[s - w]) reachable[s] = 1;
      }
    }
  });
  return { unit, reachable };
}

/** Greedy composition of an exact per-side total; falls back to a bounded DFS. */
function composeSide(sideG: number, setup: PlateSetup): number[] | null {
  const plates = [...new Set(setup.platesKg.filter((p) => p > 0))].sort((a, b) => b - a);
  const left = new Map(
    plates.map((p) => {
      const count = setup.plateCounts?.[String(p)];
      return [p, count === undefined ? Number.POSITIVE_INFINITY : Math.floor(count / 2)] as const;
    }),
  );
  const dfs = (rest: number, from: number): number[] | null => {
    if (rest === 0) return [];
    for (let i = from; i < plates.length; i++) {
      const p = plates[i] as number;
      const g = toG(p);
      const n = left.get(p) ?? 0;
      if (g <= rest && n > 0) {
        left.set(p, n - 1);
        const sub = dfs(rest - g, i);
        left.set(p, n);
        if (sub) return [p, ...sub];
      }
    }
    return null;
  };
  return dfs(sideG, 0);
}

/**
 * Plates per side for a barbell / EZ / Smith target. Picks the nearest achievable total
 * (ties → lighter, the safer choice) and loads it heaviest-first (greedy).
 */
export function calculatePlates(targetKg: number, setup: PlateSetup): PlateLoadout {
  const barG = toG(setup.barKg);
  const targetG = toG(targetKg);
  if (targetG <= barG) {
    return { perSide: [], achievedKg: setup.barKg, targetKg, exact: targetG === barG, deltaKg: round2(setup.barKg - targetKg) };
  }
  const largest = Math.max(0, ...setup.platesKg);
  const sideTargetG = (targetG - barG) / 2;
  const { unit, reachable } = reachablePerSide(setup, sideTargetG + toG(largest));
  let best = 0;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let s = 0; s < reachable.length; s++) {
    if (!reachable[s]) continue;
    const diff = Math.abs(s * unit - sideTargetG);
    if (diff < bestDiff - 1e-9) {
      best = s;
      bestDiff = diff;
    }
  }
  const sideG = best * unit;
  const perSide = composeSide(sideG, setup) ?? [];
  const achievedKg = toKg(barG + 2 * sideG);
  return { perSide, achievedKg, targetKg, exact: Math.abs(achievedKg - targetKg) < 1e-9, deltaKg: round2(achievedKg - targetKg) };
}

/** All loads achievable with a spec up to `maxKg` (ascending). Empty for bodyweight. */
export function achievableLoads(spec: LoadSpec, maxKg: number): number[] {
  switch (spec.kind) {
    case 'bodyweight':
      return [];
    case 'fixed':
      return [...new Set(spec.availableKg)].filter((w) => w <= maxKg).sort((a, b) => a - b);
    case 'stack': {
      const min = spec.minKg ?? spec.stepKg;
      const max = Math.min(maxKg, spec.maxKg ?? maxKg);
      const out: number[] = [];
      for (let w = min; w <= max + 1e-9; w = round2(w + spec.stepKg)) out.push(round2(w));
      return out;
    }
    case 'plates': {
      const barG = toG(spec.barKg);
      const maxSideG = Math.max(0, (toG(maxKg) - barG) / 2);
      const { unit, reachable } = reachablePerSide(spec, maxSideG);
      const out: number[] = [];
      for (let s = 0; s < reachable.length; s++) if (reachable[s]) out.push(toKg(barG + 2 * s * unit));
      return out;
    }
  }
}

/** Round a target load to an achievable one. Returns `null` for bodyweight specs. */
export function roundLoad(targetKg: number, spec: LoadSpec, mode: RoundMode = 'nearest'): number | null {
  if (spec.kind === 'bodyweight') return null;
  const loads = achievableLoads(spec, Math.max(targetKg, 0) * 1.5 + 50);
  if (loads.length === 0) return null;
  const below = [...loads].reverse().find((w) => w <= targetKg + 1e-9);
  const above = loads.find((w) => w >= targetKg - 1e-9);
  if (mode === 'down') return below ?? (loads[0] as number);
  if (mode === 'up') return above ?? (loads[loads.length - 1] as number);
  if (below === undefined) return above ?? null;
  if (above === undefined) return below;
  return targetKg - below <= above - targetKg ? below : above;
}

/** Machine / cable stack rounding (WRK-18). */
export function roundToMachineStep(
  targetKg: number,
  machine: { stepKg: number; minKg?: number; maxKg?: number },
  mode: RoundMode = 'nearest',
): number {
  return roundLoad(targetKg, { kind: 'stack', ...machine }, mode) as number;
}

/** Next achievable load `steps` positions above (+1) or below (−1) the current load. */
export function stepLoad(currentKg: number, spec: LoadSpec, direction: 1 | -1, steps = 1): number | null {
  if (spec.kind === 'bodyweight') return null;
  const loads = achievableLoads(spec, currentKg * 1.5 + 50);
  if (loads.length === 0) return null;
  if (direction === 1) {
    const higher = loads.filter((w) => w > currentKg + 1e-9);
    return higher[Math.min(steps, higher.length) - 1] ?? (loads[loads.length - 1] as number);
  }
  const lower = loads.filter((w) => w < currentKg - 1e-9).reverse();
  return lower[Math.min(steps, lower.length) - 1] ?? (loads[0] as number);
}

/** Build the load spec of an exercise from the gym inventory (defaults when not configured). */
export function loadSpecFor(exercise: Exercise, inventory?: GymInventory): LoadSpec {
  const machine = inventory?.machines?.[exercise.slug];
  if (machine) return { kind: 'stack', stepKg: machine.step_kg, minKg: machine.min_kg, maxKg: machine.max_kg };
  const plates = inventory?.plates_kg?.length ? inventory.plates_kg : DEFAULT_PLATES_KG;
  const bar = (type: string, fallback: number): number =>
    inventory?.bars?.find((b) => b.type === type)?.kg ?? fallback;
  switch (exercise.equipment) {
    case 'barbell': {
      const isEz = exercise.slug.startsWith('ez_');
      const barKg = isEz ? bar('ez', 10) : bar('olympic', inventory?.bars?.[0]?.kg ?? DEFAULT_OLYMPIC_BAR_KG);
      return { kind: 'plates', barKg, platesKg: plates, plateCounts: inventory?.plate_counts };
    }
    case 'smith_machine':
      return { kind: 'plates', barKg: bar('smith', 15), platesKg: plates, plateCounts: inventory?.plate_counts };
    case 'dumbbell':
      return { kind: 'fixed', availableKg: inventory?.dumbbells_kg?.length ? inventory.dumbbells_kg : DEFAULT_DUMBBELLS_KG };
    case 'kettlebell':
      return { kind: 'fixed', availableKg: inventory?.kettlebells_kg?.length ? inventory.kettlebells_kg : DEFAULT_KETTLEBELLS_KG };
    case 'machine':
    case 'cable':
      return { kind: 'stack', stepKg: exercise.loadStepKg ?? DEFAULT_MACHINE_STEP_KG };
    default:
      return { kind: 'bodyweight' };
  }
}
