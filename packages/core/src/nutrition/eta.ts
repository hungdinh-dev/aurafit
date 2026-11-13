/**
 * "Về đích ngày…" – projected goal date (signature-features §2, PRG-04).
 * From the trend weight and the last ~4 weeks' rate: "Với nhịp hiện tại, bạn chạm 65 kg vào
 * khoảng 14/03". Falls back to the planned pace while there is not enough trend data.
 */
import { addDays, type LocalDate } from '../time';

/** Below this |rate| progress is considered stalled (docs silent; ≈ 0.2 kg/month). */
export const MIN_RATE_KG_PER_WEEK = 0.05;
/** Projections further than 3 years out are reported as stalled. */
export const MAX_ETA_DAYS = 3 * 365;
/** Within this distance of the target the goal counts as reached. */
export const GOAL_TOLERANCE_KG = 0.1;

export type EtaStatus = 'reached' | 'on_track' | 'wrong_direction' | 'stalled' | 'no_target';

export interface EtaInput {
  /** Date the projection starts from (user's today). */
  fromDate: LocalDate;
  /** Current trend weight (`daily_summaries.weight_trend_kg`). */
  currentWeightKg: number;
  /** `goals.target_weight_kg`; `null` → `no_target`. */
  targetWeightKg: number | null;
  /** Observed trend rate (kg/week, signed), e.g. `health.trendRateKgPerWeek`; `null` if unknown. */
  observedKgPerWeek?: number | null;
  /** Planned rate from the pace (kg/week, signed). */
  plannedKgPerWeek: number;
  /** Extra days to add (e.g. uncompensated free days). */
  extraDelayDays?: number;
}

export interface EtaResult {
  status: EtaStatus;
  /** Projected date when `on_track`. */
  date: LocalDate | null;
  days: number | null;
  rateKgPerWeek: number;
  rateSource: 'observed' | 'planned';
  remainingKg: number | null;
}

export function projectGoalDate(input: EtaInput): EtaResult {
  const useObserved = input.observedKgPerWeek != null && Number.isFinite(input.observedKgPerWeek);
  const rate = useObserved ? (input.observedKgPerWeek as number) : input.plannedKgPerWeek;
  const base = { rateKgPerWeek: rate, rateSource: useObserved ? ('observed' as const) : ('planned' as const) };

  if (input.targetWeightKg == null || !Number.isFinite(input.targetWeightKg)) {
    return { ...base, status: 'no_target', date: null, days: null, remainingKg: null };
  }
  const remaining = Math.round((input.targetWeightKg - input.currentWeightKg) * 100) / 100;
  const reached =
    Math.abs(remaining) <= GOAL_TOLERANCE_KG ||
    (input.plannedKgPerWeek < 0 && remaining > 0) || // losing and already below target
    (input.plannedKgPerWeek > 0 && remaining < 0); // gaining and already above target
  if (reached) return { ...base, status: 'reached', date: null, days: 0, remainingKg: remaining };

  if (Math.abs(rate) < MIN_RATE_KG_PER_WEEK) {
    return { ...base, status: 'stalled', date: null, days: null, remainingKg: remaining };
  }
  if (Math.sign(rate) !== Math.sign(remaining)) {
    return { ...base, status: 'wrong_direction', date: null, days: null, remainingKg: remaining };
  }
  const days = Math.ceil((remaining / rate) * 7 + Math.max(0, input.extraDelayDays ?? 0));
  if (days > MAX_ETA_DAYS) return { ...base, status: 'stalled', date: null, days: null, remainingKg: remaining };
  return { ...base, status: 'on_track', date: addDays(input.fromDate, days), days, remainingKg: remaining };
}
