import type { health } from '@aurafit/core';

/**
 * Health data sources (HLT-05). The app reads samples from a source and stores them in
 * `health_samples` (source + source_id dedupe, device data ranked above manual entries –
 * `health.selectPreferredSamples`). Today only the manual source exists; the Apple Health
 * adapter is a stub until a HealthKit library is added to the dev build.
 */

/** Data types the user can allow reading (AppleHealth screen toggles). */
export type HealthReadType = 'sleep' | 'steps' | 'active_energy' | 'weight' | 'resting_hr';

export const HEALTH_READ_TYPES: readonly HealthReadType[] = ['sleep', 'steps', 'active_energy', 'weight', 'resting_hr'];

/** Canonical metric stored for each read type. */
export const READ_TYPE_METRIC: Record<HealthReadType, health.HealthMetric> = {
  sleep: 'sleep_session',
  steps: 'steps',
  active_energy: 'active_energy',
  weight: 'weight',
  resting_hr: 'resting_hr',
};

/** A sample ready to insert into `health_samples` (canonical units). */
export interface SourceSample {
  metric: health.HealthMetric;
  value: number;
  unit: health.HealthUnit;
  startAt: string;
  endAt: string | null;
  /** Stable id from the source (dedupe). */
  sourceId: string | null;
}

export type PermissionResult = 'granted' | 'denied' | 'unavailable';

export interface HealthSourceAdapter {
  readonly id: health.HealthSource;
  /** False when the native module is not part of this build / platform. */
  isAvailable(): boolean;
  requestPermissions(types: readonly HealthReadType[]): Promise<PermissionResult>;
  /** Samples in [from, to) for one type. */
  readSamples(type: HealthReadType, from: Date, to: Date): Promise<SourceSample[]>;
}

/** Manual entry: the user types values in the app, nothing to read or authorise. */
export const manualSource: HealthSourceAdapter = {
  id: 'manual',
  isAvailable: () => true,
  requestPermissions: async () => 'granted',
  readSamples: async () => [],
};

/**
 * Apple Health adapter – TODO: implement with a HealthKit library (e.g. a config-plugin
 * module, needs a new dev build + NSHealthShareUsageDescription). Until then it reports
 * `unavailable` so the UI can explain it.
 */
export const appleHealthSource: HealthSourceAdapter = {
  id: 'apple_health',
  isAvailable: () => false,
  requestPermissions: async () => 'unavailable',
  readSamples: async () => [],
};

export const healthSources: readonly HealthSourceAdapter[] = [appleHealthSource, manualSource];
