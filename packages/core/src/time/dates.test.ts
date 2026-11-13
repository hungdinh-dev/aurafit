import {
  addDays,
  addWeeks,
  ageOn,
  clockDiffMinutes,
  compareDates,
  datesBetween,
  daysInMonth,
  diffDays,
  endOfWeek,
  formatTimeOfDay,
  fromEpochDay,
  isSunday,
  isValidLocalDate,
  isWithin,
  isoWeekday,
  makeLocalDate,
  maxDate,
  minDate,
  monthRange,
  parseTimeOfDay,
  startOfWeek,
  toEpochDay,
  weekDates,
  weekRange,
} from './dates';

describe('local date validation', () => {
  it('accepts real dates and rejects malformed / impossible ones', () => {
    expect(isValidLocalDate('2026-11-13')).toBe(true);
    expect(isValidLocalDate('2028-02-29')).toBe(true); // leap year
    expect(isValidLocalDate('2026-02-29')).toBe(false);
    expect(isValidLocalDate('2026-13-01')).toBe(false);
    expect(isValidLocalDate('2026-1-01')).toBe(false);
    expect(isValidLocalDate('2026-11-13T00:00')).toBe(false);
    expect(isValidLocalDate('')).toBe(false);
  });

  it('daysInMonth handles February and 31-day months', () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 12)).toBe(31);
    expect(daysInMonth(2026, 11)).toBe(30);
  });

  it('makeLocalDate pads and validates', () => {
    expect(makeLocalDate(2026, 3, 7)).toBe('2026-03-07');
    expect(() => makeLocalDate(2026, 2, 30)).toThrow(RangeError);
  });

  it('toEpochDay / fromEpochDay round-trip and reject invalid input', () => {
    expect(toEpochDay('1970-01-01')).toBe(0);
    expect(fromEpochDay(toEpochDay('2026-11-13'))).toBe('2026-11-13');
    expect(() => toEpochDay('2026-02-30')).toThrow(RangeError);
  });
});

describe('date arithmetic', () => {
  it('adds days across month / year / leap boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-11-13', 0)).toBe('2026-11-13');
    expect(addWeeks('2026-11-13', 2)).toBe('2026-11-27');
  });

  it('diffDays is signed and spans DST-free UTC arithmetic', () => {
    expect(diffDays('2026-11-13', '2026-11-20')).toBe(7);
    expect(diffDays('2026-11-20', '2026-11-13')).toBe(-7);
    expect(diffDays('2026-03-28', '2026-03-30')).toBe(2); // EU DST weekend irrelevant
  });

  it('compare / min / max / isWithin', () => {
    expect(compareDates('2026-01-01', '2026-01-02')).toBe(-1);
    expect(compareDates('2026-01-02', '2026-01-02')).toBe(0);
    expect(compareDates('2026-01-03', '2026-01-02')).toBe(1);
    expect(['2026-01-03', '2025-12-31', '2026-01-01'].sort(compareDates)).toEqual([
      '2025-12-31',
      '2026-01-01',
      '2026-01-03',
    ]);
    expect(minDate('2026-01-03', '2026-01-01')).toBe('2026-01-01');
    expect(maxDate('2026-01-03', '2026-01-01')).toBe('2026-01-03');
    expect(isWithin('2026-11-13', { start: '2026-11-09', end: '2026-11-15' })).toBe(true);
    expect(isWithin('2026-11-16', { start: '2026-11-09', end: '2026-11-15' })).toBe(false);
  });

  it('datesBetween is inclusive and empty for reversed ranges', () => {
    expect(datesBetween('2026-11-29', '2026-12-02')).toEqual([
      '2026-11-29',
      '2026-11-30',
      '2026-12-01',
      '2026-12-02',
    ]);
    expect(datesBetween('2026-11-02', '2026-11-01')).toEqual([]);
  });
});

describe('weeks (Monday start)', () => {
  // 2026-11-13 is a Friday.
  it('isoWeekday / isSunday', () => {
    expect(isoWeekday('2026-11-13')).toBe(5);
    expect(isoWeekday('2026-11-09')).toBe(1);
    expect(isoWeekday('2026-11-15')).toBe(7);
    expect(isSunday('2026-11-15')).toBe(true);
    expect(isSunday('2026-11-14')).toBe(false);
  });

  it('startOfWeek / endOfWeek / weekRange', () => {
    expect(startOfWeek('2026-11-13')).toBe('2026-11-09');
    expect(startOfWeek('2026-11-09')).toBe('2026-11-09');
    expect(startOfWeek('2026-11-15')).toBe('2026-11-09'); // Sunday belongs to the week before
    expect(endOfWeek('2026-11-13')).toBe('2026-11-15');
    expect(weekRange('2027-01-01')).toEqual({ start: '2026-12-28', end: '2027-01-03' });
  });

  it('weekDates lists Monday → Sunday', () => {
    expect(weekDates('2026-11-13')).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ]);
  });

  it('monthRange', () => {
    expect(monthRange('2026-11-13')).toEqual({ start: '2026-11-01', end: '2026-11-30' });
    expect(monthRange('2028-02-10')).toEqual({ start: '2028-02-01', end: '2028-02-29' });
  });
});

describe('ageOn', () => {
  it('counts completed years', () => {
    expect(ageOn('2000-11-13', '2026-11-13')).toBe(26);
    expect(ageOn('2000-11-14', '2026-11-13')).toBe(25);
    expect(ageOn('2000-12-01', '2026-11-13')).toBe(25);
    expect(ageOn('2008-02-29', '2026-02-28')).toBe(17); // leap-day birthday
    expect(ageOn('2008-02-29', '2026-03-01')).toBe(18);
  });

  it('rejects invalid dates', () => {
    expect(() => ageOn('2000-02-30', '2026-01-01')).toThrow(RangeError);
  });
});

describe('time of day', () => {
  it('parses HH:mm and Postgres HH:mm:ss', () => {
    expect(parseTimeOfDay('07:30')).toBe(450);
    expect(parseTimeOfDay('7:05')).toBe(425);
    expect(parseTimeOfDay('23:59:59')).toBe(1439);
    expect(parseTimeOfDay('00:00')).toBe(0);
  });

  it('rejects invalid times', () => {
    expect(() => parseTimeOfDay('24:00')).toThrow(RangeError);
    expect(() => parseTimeOfDay('12:60')).toThrow(RangeError);
    expect(() => parseTimeOfDay('noon')).toThrow(RangeError);
  });

  it('formats and wraps', () => {
    expect(formatTimeOfDay(450)).toBe('07:30');
    expect(formatTimeOfDay(1440 + 30)).toBe('00:30');
    expect(formatTimeOfDay(-30)).toBe('23:30');
  });

  it('clockDiffMinutes takes the short way round midnight', () => {
    expect(clockDiffMinutes(parseTimeOfDay('23:50'), parseTimeOfDay('00:10'))).toBe(20);
    expect(clockDiffMinutes(parseTimeOfDay('00:10'), parseTimeOfDay('23:50'))).toBe(-20);
    expect(clockDiffMinutes(420, 450)).toBe(30);
    expect(clockDiffMinutes(450, 420)).toBe(-30);
    expect(clockDiffMinutes(0, 720)).toBe(720);
  });
});
