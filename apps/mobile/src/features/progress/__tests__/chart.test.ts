import { buildBars, heatLevel, heatmapWeeks, weeklyReview } from '../chart';

describe('buildBars', () => {
  it('averages non-empty values and flags bars > 10 % over target', () => {
    const chart = buildBars(
      [
        { key: 'a', label: '1', value: 2000 },
        { key: 'b', label: '2', value: null },
        { key: 'c', label: '3', value: 2500 },
      ],
      2150
    );
    expect(chart.avg).toBe(2250);
    expect(chart.bars[1]!.ratio).toBe(0);
    expect(chart.bars[2]!.over).toBe(true);
    expect(chart.bars[0]!.over).toBe(false);
    expect(chart.targetRatio).toBeGreaterThan(0);
    expect(chart.targetRatio).toBeLessThan(1);
  });

  it('handles an empty series', () => {
    const chart = buildBars([]);
    expect(chart.avg).toBeNull();
    expect(chart.targetRatio).toBeNull();
  });
});

describe('heatmap', () => {
  it('maps scores to 5 steps', () => {
    expect([null, 0, 40, 65, 80, 95].map(heatLevel)).toEqual([0, 0, 1, 2, 3, 4]);
  });

  it('builds Monday-first weeks ending with the current week; future days are empty', () => {
    const weeks = heatmapWeeks(new Map([['2026-11-12', 92]]), '2026-11-13', 3);
    expect(weeks).toHaveLength(3);
    const last = weeks[2]!;
    expect(last[0]!.date).toBe('2026-11-09');
    expect(last[3]).toMatchObject({ date: '2026-11-12', score: 92, level: 4 });
    expect(last[6]!.score).toBeNull();
  });
});

describe('weeklyReview', () => {
  it('summarises the scored days of a week', () => {
    const review = weeklyReview(
      [
        { localDate: '2026-11-09', total: 70, result: 'pass' },
        { localDate: '2026-11-10', total: 96, result: 'excellent' },
        { localDate: '2026-11-11', total: 40, result: 'fail' },
        { localDate: '2026-11-02', total: 10, result: 'fail' },
      ],
      '2026-11-09'
    );
    expect(review).toMatchObject({ avg: 69, passed: 2, days: 3 });
    expect(review?.best.localDate).toBe('2026-11-10');
  });

  it('returns null for an empty week', () => {
    expect(weeklyReview([], '2026-11-09')).toBeNull();
  });
});
