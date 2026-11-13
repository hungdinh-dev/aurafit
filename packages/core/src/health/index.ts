/**
 * Health logic (HLT-01 → HLT-06): canonical samples + multi-source dedupe, daily summaries,
 * trend weight, weekly adaptive TDEE, sleep evaluation, water target and smart reminders.
 * Pure functions, no I/O.
 */
export * from './samples';
export * from './dailySummary';
export * from './weightTrend';
export * from './adaptiveTdee';
export * from './sleep';
export * from './water';
