import { buildDailySummary, summarizeHealthDay, summarizeHealthDays, unionMinutes } from './dailySummary';
import { CANONICAL_UNIT, type HealthSample } from './samples';

const D = '2026-11-14';
const s = (p: Partial<HealthSample> & Pick<HealthSample, 'type' | 'value' | 'source'>): HealthSample => ({
  unit: CANONICAL_UNIT[p.type],
  start_at: '2026-11-14T01:00:00Z',
  local_date: D,
  ...p,
});

const samples: HealthSample[] = [
  // Steps: Apple Health (re-imported once) + a manual entry → only Apple Health counts
  s({ type: 'steps', value: 3000, source: 'apple_health', source_id: 's1' }),
  s({ type: 'steps', value: 4500, source: 'apple_health', source_id: 's2' }),
  s({ type: 'steps', value: 3000, source: 'apple_health', source_id: 's1' }),
  s({ type: 'steps', value: 9000, source: 'manual' }),
  // Water: manual only
  s({ type: 'water', value: 250, source: 'manual' }),
  s({ type: 'water', value: 500, source: 'manual' }),
  // Sleep: two overlapping watch sessions 23:00–03:00 and 02:30–06:30 (VN) + manual entry with a rating
  s({ type: 'sleep_session', value: 240, source: 'apple_health', source_id: 'z1', start_at: '2026-11-13T16:00:00Z', end_at: '2026-11-13T20:00:00Z' }),
  s({ type: 'sleep_session', value: 240, source: 'apple_health', source_id: 'z2', start_at: '2026-11-13T19:30:00Z', end_at: '2026-11-13T23:30:00Z' }),
  s({ type: 'sleep_session', value: 480, source: 'manual', start_at: '2026-11-13T15:30:00Z', end_at: '2026-11-13T23:30:00Z', metadata: { quality: 4 } }),
  // Weight: morning and evening → first one
  s({ type: 'weight', value: 70.44, source: 'manual', start_at: '2026-11-14T00:00:00Z' }),
  s({ type: 'weight', value: 71.2, source: 'manual', start_at: '2026-11-14T13:00:00Z' }),
  // Resting HR
  s({ type: 'resting_hr', value: 58, source: 'apple_health', source_id: 'h1' }),
  s({ type: 'resting_hr', value: 61, source: 'apple_health', source_id: 'h2' }),
  // Another day
  s({ type: 'water', value: 1000, source: 'manual', local_date: '2026-11-13' }),
];

describe('unionMinutes', () => {
  it('merges overlapping and nested intervals', () => {
    const m = 60_000;
    expect(unionMinutes([{ start: 0, end: 60 * m }, { start: 30 * m, end: 90 * m }, { start: 40 * m, end: 50 * m }])).toBe(90);
    expect(unionMinutes([{ start: 0, end: 10 * m }, { start: 20 * m, end: 30 * m }])).toBe(20);
    expect(unionMinutes([])).toBe(0);
  });
});

describe('summarizeHealthDay (HLT-05/06)', () => {
  const day = summarizeHealthDay(D, samples);

  it('applies dedupe + source priority', () => {
    expect(day.steps).toBe(7500);
    expect(day.sources.steps).toBe('apple_health');
    expect(day.water_ml).toBe(750);
    expect(day.sources.water).toBe('manual');
  });

  it('sleep: union of device sessions, manual rating as fallback quality, wake time', () => {
    expect(day.sleep_min).toBe(450);
    expect(day.sources.sleep_session).toBe('apple_health');
    expect(day.sleep_quality).toBe(4);
    expect(day.wake_time).toBe('2026-11-13T23:30:00.000Z');
  });

  it('weight = first weigh-in (1 decimal), resting HR = mean, missing metrics = null', () => {
    expect(day.weight_kg).toBe(70.4);
    expect(day.resting_hr).toBe(60);
    expect(day.active_kcal).toBeNull();
  });

  it('user preference can switch a metric to manual', () => {
    expect(summarizeHealthDay(D, samples, { steps: ['manual', 'apple_health'] }).steps).toBe(9000);
  });

  it('empty day', () => {
    expect(summarizeHealthDay('2026-01-01', samples)).toEqual({
      local_date: '2026-01-01',
      water_ml: null,
      sleep_min: null,
      sleep_quality: null,
      wake_time: null,
      steps: null,
      active_kcal: null,
      resting_hr: null,
      weight_kg: null,
      sources: {},
    });
  });

  it('sleep samples without an interval use their value', () => {
    const d = summarizeHealthDay(D, [s({ type: 'sleep_session', value: 400, source: 'manual' })]);
    expect(d.sleep_min).toBe(400);
    expect(d.sleep_quality).toBeNull();
  });
});

describe('summarizeHealthDays', () => {
  it('one summary per date, oldest first', () => {
    const days = summarizeHealthDays(samples);
    expect(days.map((d) => [d.local_date, d.water_ml])).toEqual([
      ['2026-11-13', 1000],
      [D, 750],
    ]);
  });
});

describe('buildDailySummary', () => {
  it('combines health, meals and context into a daily_summaries row', () => {
    const row = buildDailySummary({
      localDate: D,
      healthSamples: samples,
      mealItems: [
        { kcal: 500, protein_g: 30, carb_g: 50, fat_g: 20, sugar_g: 5 },
        { kcal: 300, protein_g: 20.5, carb_g: 30, fat_g: 10, sugar_g: 12, sodium_mg: 900 },
      ],
      kcalTarget: 2160,
      weightTrendKg: 70.83,
      isFreeDay: false,
    });
    expect(row).toMatchObject({
      local_date: D,
      kcal_in: 800,
      protein_g: 50.5,
      carb_g: 80,
      fat_g: 30,
      sugar_g: 17,
      kcal_target: 2160,
      weight_trend_kg: 70.83,
      is_free_day: false,
      steps: 7500,
      water_ml: 750,
    });
    expect(row).not.toHaveProperty('sources');
  });

  it('no meals → nutrition columns null', () => {
    const row = buildDailySummary({ localDate: D, healthSamples: [], mealItems: [], kcalTarget: null, weightTrendKg: null, isFreeDay: true });
    expect(row.kcal_in).toBeNull();
    expect(row.protein_g).toBeNull();
    expect(row.is_free_day).toBe(true);
  });
});
