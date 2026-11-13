import {
  CANONICAL_UNIT,
  DEFAULT_SOURCE_PRIORITY,
  dedupeBySourceId,
  isDeviceSource,
  pickSource,
  sampleLocalDate,
  selectPreferredSamples,
  sourceRank,
  toCanonicalValue,
  type HealthSample,
} from './samples';

const s = (p: Partial<HealthSample> & Pick<HealthSample, 'type' | 'value' | 'source'>): HealthSample => ({
  unit: CANONICAL_UNIT[p.type],
  start_at: '2026-11-13T01:00:00Z',
  local_date: '2026-11-13',
  ...p,
});

describe('sources', () => {
  it('device beats manual by default', () => {
    expect(DEFAULT_SOURCE_PRIORITY[0]).toBe('apple_health');
    expect(isDeviceSource('apple_health')).toBe(true);
    expect(isDeviceSource('manual')).toBe(false);
    expect(pickSource('steps', [{ source: 'manual' }, { source: 'apple_health' }])).toBe('apple_health');
    expect(pickSource('steps', [])).toBeNull();
  });

  it('the user can prefer manual for a metric', () => {
    expect(pickSource('water', [{ source: 'apple_health' }, { source: 'manual' }], { water: ['manual', 'apple_health'] })).toBe(
      'manual',
    );
  });

  it('unlisted device sources rank just above manual', () => {
    const p = { steps: ['apple_health', 'manual'] as const };
    expect(sourceRank('steps', 'garmin', p)).toBe(0.5);
    expect(pickSource('steps', [{ source: 'manual' }, { source: 'garmin' }], p)).toBe('garmin');
    expect(pickSource('steps', [{ source: 'apple_health' }, { source: 'garmin' }], p)).toBe('apple_health');
  });
});

describe('dedupeBySourceId', () => {
  it('drops re-imported rows but keeps rows without source_id', () => {
    const rows = [
      s({ type: 'sleep_session', value: 420, source: 'apple_health', source_id: 'hk-1' }),
      s({ type: 'sleep_session', value: 420, source: 'apple_health', source_id: 'hk-1' }),
      s({ type: 'sleep_session', value: 400, source: 'garmin', source_id: 'hk-1' }),
      s({ type: 'water', value: 250, source: 'manual' }),
      s({ type: 'water', value: 250, source: 'manual' }),
    ];
    expect(dedupeBySourceId(rows)).toHaveLength(4);
  });
});

describe('selectPreferredSamples', () => {
  it('keeps one source per metric per day – Apple Watch + manual never double count', () => {
    const rows = [
      s({ type: 'steps', value: 3000, source: 'apple_health', source_id: 'a' }),
      s({ type: 'steps', value: 4000, source: 'apple_health', source_id: 'b' }),
      s({ type: 'steps', value: 5000, source: 'manual' }),
      s({ type: 'steps', value: 6000, source: 'manual', local_date: '2026-11-12' }),
      s({ type: 'water', value: 250, source: 'manual' }),
    ];
    const kept = selectPreferredSamples(rows);
    expect(kept.map((r) => [r.type, r.local_date, r.value])).toEqual([
      ['steps', '2026-11-13', 3000],
      ['steps', '2026-11-13', 4000],
      ['steps', '2026-11-12', 6000],
      ['water', '2026-11-13', 250],
    ]);
  });
});

describe('sampleLocalDate', () => {
  it('sleep counts for the wake-up day, other metrics for their start', () => {
    const sleep = { type: 'sleep_session' as const, start_at: '2026-11-13T16:00:00Z', end_at: '2026-11-13T23:30:00Z' };
    expect(sampleLocalDate(sleep)).toBe('2026-11-14'); // wakes 06:30 on the 14th (VN)
    expect(sampleLocalDate({ type: 'steps', start_at: '2026-11-13T16:00:00Z' })).toBe('2026-11-13'); // 23:00 VN
  });
});

describe('toCanonicalValue', () => {
  it('converts adapter units', () => {
    expect(toCanonicalValue('weight', 150, 'lb')).toBeCloseTo(68.04, 2);
    expect(toCanonicalValue('water', 1.5, 'L')).toBe(1500);
    expect(toCanonicalValue('active_energy', 418.4, 'kJ')).toBeCloseTo(100, 6);
    expect(toCanonicalValue('sleep_session', 7.5, 'h')).toBe(450);
    expect(toCanonicalValue('steps', 10, 'count')).toBe(10);
  });

  it('rejects unknown or mismatched units', () => {
    expect(() => toCanonicalValue('water', 1, 'kg')).toThrow(RangeError);
    expect(() => toCanonicalValue('weight', 1, 'stone')).toThrow(RangeError);
  });
});
