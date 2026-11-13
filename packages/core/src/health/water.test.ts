import {
  MIN_REMINDER_INTERVAL_MIN,
  waterReminderSchedule,
  waterTargetMl,
  type WaterReminderInput,
} from './water';

describe('waterTargetMl (HLT-01)', () => {
  it('≈ 35 ml/kg, +500 ml on training days', () => {
    expect(waterTargetMl({ weightKg: 70 })).toBe(2450);
    expect(waterTargetMl({ weightKg: 70, isTrainingDay: true })).toBe(2950);
    expect(waterTargetMl({ weightKg: 63 })).toBe(2200); // 2205 → nearest 50
  });

  it('clamps extreme weights to 1.5–4.0 L', () => {
    expect(waterTargetMl({ weightKg: 30 })).toBe(1500);
    expect(waterTargetMl({ weightKg: 150 })).toBe(4000);
  });

  it('user override replaces the base', () => {
    expect(waterTargetMl({ weightKg: 70, overrideMl: 3000 })).toBe(3000);
    expect(waterTargetMl({ weightKg: 70, overrideMl: 3000, isTrainingDay: true })).toBe(3500);
  });

  it('needs a weight without override', () => {
    expect(() => waterTargetMl({ weightKg: 0 })).toThrow(RangeError);
  });
});

describe('waterReminderSchedule (smart reminders)', () => {
  // Awake 07:00–23:00 → reminders until 22:00 (1320)
  const base: WaterReminderInput = {
    nowMin: 720, // 12:00
    wakeMin: '07:00',
    bedMin: '23:00',
    consumedMl: 500,
    targetMl: 2400,
    strictness: 'standard',
  };

  it('behind pace → spacing from the remaining glasses', () => {
    // expected 2400 × 300/900 = 800 → 300 behind; 1900 ml = 8 glasses over 600 min → every 75 min
    const r = waterReminderSchedule(base);
    expect(r).toMatchObject({ status: 'scheduled', expectedByNowMl: 800, behindMl: 300, intervalMin: 75 });
    expect(r.times).toEqual([795, 870, 945, 1020, 1095, 1170, 1245, 1320]);
  });

  it('far behind → denser, but never under 45 min', () => {
    const r = waterReminderSchedule({ ...base, nowMin: 1080, consumedMl: 0 });
    expect(r.intervalMin).toBe(MIN_REMINDER_INTERVAL_MIN);
    expect(r.times).toEqual([1125, 1170, 1215, 1260, 1305]);
  });

  it('ahead of pace → strictness sets the max spacing; only as many as glasses left', () => {
    const ahead = { ...base, consumedMl: 2000 };
    expect(waterReminderSchedule(ahead).times).toEqual([840, 960]);
    expect(waterReminderSchedule({ ...ahead, strictness: 'hardcore' }).times).toEqual([810, 900]);
    expect(waterReminderSchedule({ ...ahead, strictness: 'gentle' }).times).toEqual([870, 1020]);
  });

  it('stops when the target is reached', () => {
    expect(waterReminderSchedule({ ...base, consumedMl: 2400 })).toMatchObject({ status: 'done', times: [] });
  });

  it('never reminds in the last hour before bed or after it', () => {
    expect(waterReminderSchedule({ ...base, nowMin: 1350 })).toMatchObject({ status: 'outside_window', times: [] });
  });

  it('before waking up the plan starts at wake time', () => {
    const r = waterReminderSchedule({ ...base, nowMin: 300, consumedMl: 0 });
    expect(r.expectedByNowMl).toBe(0);
    expect(r.intervalMin).toBe(90);
    expect(r.times[0]).toBe(510);
    expect(r.times).toHaveLength(10);
  });

  it('skips blocked windows (work hours, quiet hours)', () => {
    const r = waterReminderSchedule({ ...base, blocked: [{ start: '13:00', end: '17:00' }] });
    expect(r.times).toEqual([1020, 1095, 1170, 1245, 1320]);
  });

  it('handles bed time after midnight and quiet hours that wrap midnight', () => {
    const late = { ...base, wakeMin: '08:00', bedMin: '02:00', nowMin: 1320, consumedMl: 2000 };
    // window ends 01:00 (1500); quiet 00:00–07:00 blocks the 01:00 slot
    expect(waterReminderSchedule({ ...late, blocked: [{ start: '00:00', end: '07:00' }] }).times).toEqual([1410]);
    expect(waterReminderSchedule(late).times).toEqual([1410, 1500]);
    // 00:10 is still "tonight" (before the 01:00 cut-off); 01:10 is past it
    expect(waterReminderSchedule({ ...late, nowMin: 10 })).toMatchObject({ status: 'scheduled', times: [1495] });
    expect(waterReminderSchedule({ ...late, nowMin: 70 }).status).toBe('outside_window');
  });
});
