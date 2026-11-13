import {
  CLOSE_DAY_HOUR,
  DEFAULT_TIME_ZONE,
  closeDayInstant,
  currentWeek,
  isDayClosed,
  isValidTimeZone,
  latestClosedDate,
  localDate,
  localDayBounds,
  localMinutesOfDay,
  openDates,
  timeZoneOffsetMinutes,
  toDate,
  toUtcIso,
  zonedParts,
  zonedTimeToUtc,
} from './timezone';

const VN = 'Asia/Ho_Chi_Minh'; // UTC+7, no DST

describe('defaults', () => {
  it('defaults to Vietnam time and closes the day at 03:00', () => {
    expect(DEFAULT_TIME_ZONE).toBe(VN);
    expect(CLOSE_DAY_HOUR).toBe(3);
  });
});

describe('toDate / toUtcIso', () => {
  it('accepts Date, epoch ms and ISO strings', () => {
    expect(toUtcIso('2026-11-13T10:00:00+07:00')).toBe('2026-11-13T03:00:00.000Z');
    expect(toUtcIso(0)).toBe('1970-01-01T00:00:00.000Z');
    expect(toDate(new Date(5)).getTime()).toBe(5);
  });

  it('throws on invalid instants', () => {
    expect(() => toDate('not a date')).toThrow(RangeError);
  });
});

describe('isValidTimeZone', () => {
  it('recognises IANA zones', () => {
    expect(isValidTimeZone(VN)).toBe(true);
    expect(isValidTimeZone('Europe/Berlin')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });
});

describe('localDate (store UTC, compute user date)', () => {
  it('uses Asia/Ho_Chi_Minh by default', () => {
    // 17:30Z = 00:30 next day in Vietnam
    expect(localDate('2026-11-13T17:30:00Z')).toBe('2026-11-14');
    expect(localDate('2026-11-13T16:59:59Z')).toBe('2026-11-13');
  });

  it('respects other zones', () => {
    expect(localDate('2026-11-13T17:30:00Z', 'America/Los_Angeles')).toBe('2026-11-13');
    expect(localDate('2026-11-13T23:30:00Z', 'Asia/Tokyo')).toBe('2026-11-14');
  });

  it('supports an optional shifted day start', () => {
    // 01:30 local with dayStartHour 3 still belongs to the previous day
    expect(localDate('2026-11-13T18:30:00Z', VN, { dayStartHour: 3 })).toBe('2026-11-13');
    expect(localDate('2026-11-13T20:30:00Z', VN, { dayStartHour: 3 })).toBe('2026-11-14');
  });

  it('zonedParts / localMinutesOfDay', () => {
    const p = zonedParts('2026-11-13T17:30:45Z', VN);
    expect(p).toMatchObject({ year: 2026, month: 11, day: 14, hour: 0, minute: 30, second: 45 });
    expect(p.minutesOfDay).toBe(30);
    expect(localMinutesOfDay('2026-11-13T00:00:00Z', VN)).toBe(7 * 60);
  });
});

describe('offsets and wall-clock conversion', () => {
  it('offset for fixed and DST zones', () => {
    expect(timeZoneOffsetMinutes('2026-11-13T00:00:00Z', VN)).toBe(420);
    expect(timeZoneOffsetMinutes('2026-01-15T12:00:00Z', 'Europe/Berlin')).toBe(60);
    expect(timeZoneOffsetMinutes('2026-07-15T12:00:00Z', 'Europe/Berlin')).toBe(120);
    expect(timeZoneOffsetMinutes('2026-07-15T12:00:00Z', 'UTC')).toBe(0);
  });

  it('zonedTimeToUtc converts local wall time to UTC', () => {
    expect(zonedTimeToUtc('2026-11-14', '03:00', VN).toISOString()).toBe('2026-11-13T20:00:00.000Z');
    expect(zonedTimeToUtc('2026-11-14', 0, VN).toISOString()).toBe('2026-11-13T17:00:00.000Z');
    expect(zonedTimeToUtc('2026-07-15', '09:00', 'Europe/Berlin').toISOString()).toBe(
      '2026-07-15T07:00:00.000Z',
    );
    expect(zonedTimeToUtc('2026-01-15', '09:00', 'Europe/Berlin').toISOString()).toBe(
      '2026-01-15T08:00:00.000Z',
    );
  });

  it('handles the DST gap by landing after it', () => {
    // 2026-03-29 02:30 does not exist in Berlin (clocks jump 02:00 → 03:00)
    const t = zonedTimeToUtc('2026-03-29', '02:30', 'Europe/Berlin');
    expect(localDate(t, 'Europe/Berlin')).toBe('2026-03-29');
    expect(t.toISOString()).toBe('2026-03-29T01:30:00.000Z'); // = 03:30 CEST
  });

  it('localDayBounds gives a 24h [start, end) window', () => {
    const b = localDayBounds('2026-11-13', VN);
    expect(b.startUtc.toISOString()).toBe('2026-11-12T17:00:00.000Z');
    expect(b.endUtc.toISOString()).toBe('2026-11-13T17:00:00.000Z');
    // DST day in Berlin is 23h long
    const dst = localDayBounds('2026-03-29', 'Europe/Berlin');
    expect(dst.endUtc.getTime() - dst.startUtc.getTime()).toBe(23 * 3_600_000);
  });

  it('rejects invalid wall-clock inputs', () => {
    expect(() => zonedTimeToUtc('2026-02-30', '03:00', VN)).toThrow(RangeError);
    expect(() => zonedTimeToUtc('2026-02-10', '25:00', VN)).toThrow(RangeError);
  });
});

describe('day close at 03:00 local', () => {
  it('closeDayInstant is 03:00 the next morning', () => {
    expect(closeDayInstant('2026-11-13', VN).toISOString()).toBe('2026-11-13T20:00:00.000Z');
  });

  it('isDayClosed flips exactly at 03:00', () => {
    expect(isDayClosed('2026-11-13', '2026-11-13T19:59:59Z', VN)).toBe(false); // 02:59:59
    expect(isDayClosed('2026-11-13', '2026-11-13T20:00:00Z', VN)).toBe(true); // 03:00
  });

  it('latestClosedDate / openDates around the boundary', () => {
    const beforeClose = '2026-11-13T19:00:00Z'; // 14 Nov 02:00 local
    expect(latestClosedDate(beforeClose, VN)).toBe('2026-11-12');
    expect(openDates(beforeClose, VN)).toEqual(['2026-11-13', '2026-11-14']);

    const afterClose = '2026-11-13T21:00:00Z'; // 14 Nov 04:00 local
    expect(latestClosedDate(afterClose, VN)).toBe('2026-11-13');
    expect(openDates(afterClose, VN)).toEqual(['2026-11-14']);
  });

  it('currentWeek uses the local date', () => {
    // Sunday 23:30Z = Monday 06:30 in Vietnam → next week
    expect(currentWeek('2026-11-15T23:30:00Z', VN)).toEqual({ start: '2026-11-16', end: '2026-11-22' });
    expect(currentWeek('2026-11-15T23:30:00Z', 'UTC')).toEqual({ start: '2026-11-09', end: '2026-11-15' });
  });
});
