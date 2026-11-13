import { time } from '@aurafit/core';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useDailyScores, useSeries } from '@/features/progress/api';
import { buildBars, heatmapWeeks, weeklyReview, type Metric, type Range } from '@/features/progress/chart';
import { BarChart } from '@/features/progress/components/BarChart';
import { todayLocal, useCanSync } from '@/features/workout/api';
import { ErrorCard, LoadingCard, PreviewNote, PushedHeader } from '@/features/workout/components/common';
import { formatNumber, formatShortDate, localeOf } from '@/features/workout/format';
import { useLanguage } from '@/i18n';
import { Card, Chip, Screen, SegmentedControl, Text, spacing, useTheme } from '@/ui';

const RANGES: readonly Range[] = ['day', 'week', 'month', 'year'];
const METRICS: readonly Metric[] = ['kcal', 'protein', 'water', 'sleep', 'weight'];
const HEAT_WEEKS = 18;
/** Heatmap steps 1–4 as mint opacity over the theme fill (step 0 = empty fill). */
const HEAT_ALPHA = [0, 0.25, 0.45, 0.7, 1] as const;

/** Tiến độ – Progress mockup: day/week/month/year bars, daily score heatmap, weekly review (PRG-02/03/04). */
export default function ProgressScreen() {
  const { t } = useTranslation('progress');
  const { colors } = useTheme();
  const [language] = useLanguage();
  const canSync = useCanSync();
  const today = todayLocal();
  const [range, setRange] = useState<Range>('day');
  const [metric, setMetric] = useState<Metric>('kcal');
  const series = useSeries(range, metric, today);
  const heatFrom = time.addDays(time.startOfWeek(today), -7 * (HEAT_WEEKS - 1));
  const scores = useDailyScores(time.addDays(heatFrom, -7));

  const chart = useMemo(() => {
    const points = series.data ?? [];
    const label = (key: string) => {
      const d = new Date(`${key}T00:00:00`);
      const loc = localeOf(language);
      if (range === 'day') return String(d.getDate());
      if (range === 'week') return new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'numeric' }).format(d);
      if (range === 'month') return new Intl.DateTimeFormat(loc, { month: 'short' }).format(d);
      return String(d.getFullYear());
    };
    const targets = points.map((p) => p.target).filter((v): v is number => v !== null);
    const target = metric === 'kcal' && targets.length ? targets.reduce((a, b) => a + b, 0) / targets.length : null;
    return buildBars(points.map((p) => ({ key: p.key, label: label(p.key), value: p.value })), target);
  }, [series.data, range, metric, language]);

  const heat = useMemo(() => {
    const map = new Map((scores.data ?? []).map((r) => [r.localDate, r.total]));
    return heatmapWeeks(map, today, HEAT_WEEKS);
  }, [scores.data, today]);
  const heatValues = heat.flat().flatMap((c) => (c.score === null ? [] : [c.score]));
  const heatAvg = heatValues.length ? Math.round(heatValues.reduce((a, b) => a + b, 0) / heatValues.length) : null;

  const thisWeek = time.startOfWeek(today);
  const review = weeklyReview(scores.data ?? [], thisWeek) ?? weeklyReview(scores.data ?? [], time.addDays(thisWeek, -7));
  const reviewWeek = review && review.best.localDate < thisWeek ? time.addDays(thisWeek, -7) : thisWeek;
  const prev = weeklyReview(scores.data ?? [], time.addDays(reviewWeek, -7));
  const avgText = chart.avg === null ? '—' : formatNumber(chart.avg, language, metric === 'weight' ? 1 : 0);

  return (
    <Screen title={t('screenTitle')}>
      <PushedHeader />
      {!canSync ? <PreviewNote text={t('signInNeeded')} /> : null}
      <SegmentedControl
        accessibilityLabel={t('rangeA11y')}
        options={RANGES.map((r) => ({ value: r, label: t(`range.${r}`) }))}
        value={range}
        onChange={setRange}
      />
      <View className="flex-row flex-wrap" style={{ gap: spacing.sm }} accessibilityLabel={t('metricA11y')}>
        {METRICS.map((m) => (
          <Chip key={m} label={t(`metric.${m}`)} selected={metric === m} onPress={() => setMetric(m)} />
        ))}
      </View>

      {series.isLoading ? <LoadingCard /> : null}
      {series.isError ? <ErrorCard message={t('error')} onRetry={() => void series.refetch()} /> : null}

      <Card style={{ gap: spacing.md }}>
        <View className="flex-row items-end justify-between">
          <Text variant="footnote" color="secondary">
            {t(`avgLabel.${metric}`)}
          </Text>
          <Text variant="metric">{avgText}</Text>
        </View>
        <BarChart
          chart={chart}
          accessibilityLabel={t('chartA11y', { metric: t(`metric.${metric}`), range: t(`range.${range}`), avg: avgText })}
        />
        {chart.targetRatio !== null && chart.max ? (
          <Text variant="caption" color="secondary">
            {t('targetNote', { target: formatNumber((chart.targetRatio ?? 0) * chart.max, language, 0) })}
          </Text>
        ) : chart.avg === null && !series.isLoading ? (
          <Text variant="caption" color="secondary">
            {t('empty')}
          </Text>
        ) : null}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <View className="flex-row items-center justify-between">
          <Text variant="headline">{t('heatmap', { weeks: HEAT_WEEKS })}</Text>
          <Text variant="footnote" color="secondary">
            {t('heatmapAvg', { value: heatAvg ?? '—' })}
          </Text>
        </View>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={t('heatmapA11y', { weeks: HEAT_WEEKS, value: heatAvg ?? '—' })}
          style={styles.heat}>
          {heat.map((week, w) => (
            <View key={w} style={styles.heatCol}>
              {week.map((c) => (
                <View
                  key={c.date}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: c.level === 0 ? colors.fill : colors.tint,
                      opacity: c.level === 0 ? 1 : HEAT_ALPHA[c.level],
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
        <View className="flex-row items-center justify-end" style={{ gap: spacing.xs }}>
          <Text variant="caption" color="secondary">
            {t('heatmapLess')}
          </Text>
          {HEAT_ALPHA.map((a, i) => (
            <View key={i} style={[styles.cell, { backgroundColor: i === 0 ? colors.fill : colors.tint, opacity: i === 0 ? 1 : a }]} />
          ))}
          <Text variant="caption" color="secondary">
            {t('heatmapMore')}
          </Text>
        </View>
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <Text variant="headline">
          {t('review', {
            range: `${formatShortDate(reviewWeek, language)} – ${formatShortDate(time.addDays(reviewWeek, 6), language)}`,
          })}
        </Text>
        {scores.isLoading ? null : review ? (
          <>
            <Text variant="subheadline">
              {t('reviewBody', {
                avg: review.avg,
                passed: review.passed,
                days: review.days,
                best: new Intl.DateTimeFormat(localeOf(language), { weekday: 'long' }).format(
                  new Date(`${review.best.localDate}T00:00:00`)
                ),
                bestScore: review.best.total,
              })}
            </Text>
            {prev ? (
              <Text variant="footnote" color="secondary">
                {t('reviewDelta', { delta: `${review.avg - prev.avg >= 0 ? '+' : ''}${review.avg - prev.avg}` })}
              </Text>
            ) : null}
          </>
        ) : (
          <Text variant="footnote" color="secondary">
            {t('reviewEmpty')}
          </Text>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heat: { flexDirection: 'row', justifyContent: 'space-between' },
  heatCol: { gap: 3 },
  cell: { width: 13, height: 13, borderRadius: 3 },
});
