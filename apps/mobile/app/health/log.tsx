import { health, time } from '@aurafit/core';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { BackHeader } from '@/features/coach/components/BackHeader';
import { localToday } from '@/features/coach/lib/clock';
import { useFormat } from '@/features/coach/lib/format';
import { useLogSleep, useLogWeight, useSleepFor, useWeighIns } from '@/features/health/api';
import { TrendSparkline } from '@/features/health/components/TrendSparkline';
import { parseExplanation, useCurrentTargets } from '@/features/nutrition/api';
import { useAuth } from '@/lib/auth';
import {
  Button,
  Card,
  GlassButton,
  GroupedList,
  ListRow,
  Screen,
  Stepper,
  Symbol,
  Text,
  haptics,
  spacing,
  useTheme,
  MIN_TOUCH,
} from '@/ui';

const SLEEP_STEP = 15;

/** Sức khoẻ: cân nặng + xu hướng (HLT-02), giấc ngủ (HLT-04), TDEE hằng tuần (HLT-03). */
export default function HealthLogScreen() {
  const { t } = useTranslation(['health', 'common']);
  const router = useRouter();
  const { colors } = useTheme();
  const f = useFormat();
  const { user } = useAuth();
  const today = localToday();
  const weighIns = useWeighIns(90);
  const logWeight = useLogWeight();
  const sleep = useSleepFor(today);
  const logSleep = useLogSleep();
  const targets = useCurrentTargets();

  const trend = useMemo(() => health.weightTrend(weighIns.data ?? [], { until: today }), [weighIns.data, today]);
  const lastTrend = trend.at(-1)?.trendKg ?? null;
  const rate = trend.length > 0 ? health.trendRateKgPerWeek(trend, today) : null;
  const lastWeight = weighIns.data?.at(-1)?.weightKg ?? null;

  const [weight, setWeight] = useState<number | null>(null);
  const weightValue = weight ?? lastWeight ?? 65;

  const existingBed = sleep.data?.bedAt ? time.localMinutesOfDay(sleep.data.bedAt) : null;
  const existingWake = sleep.data?.wakeAt ? time.localMinutesOfDay(sleep.data.wakeAt) : null;
  const [bed, setBed] = useState<number | null>(null);
  const [wake, setWake] = useState<number | null>(null);
  const [quality, setQuality] = useState<number | null>(null);
  const bedMin = bed ?? existingBed ?? 23 * 60;
  const wakeMin = wake ?? existingWake ?? 6 * 60 + 30;
  const qualityValue = quality ?? sleep.data?.quality ?? null;
  const duration = f.hm(health.sleepDurationFromClock(bedMin, wakeMin));

  const history = targets.data?.history ?? [];
  const weekly = history.find((r) => r.reason === 'weekly_adjust') ?? null;
  const weeklyExp = parseExplanation(weekly?.explanation);
  const current = targets.data?.current ?? null;
  const [showHow, setShowHow] = useState(false);

  const wrap = (v: number) => ((v % 1440) + 1440) % 1440;
  const last30 = trend.slice(-30);

  return (
    <>
      <BackHeader />
      <Screen
        title={t('health:log.title')}
        headerRight={
          <GlassButton
            symbol="heart.fill"
            label={t('health:log.appleHealth')}
            color={colors.icon.pink}
            accessibilityLabel={t('health:log.appleHealth')}
            onPress={() => router.push('/health/apple-health')}
          />
        }>
        {!user ? (
          <Text variant="footnote" color="secondary">
            {t('health:log.preview')}
          </Text>
        ) : null}

        <Card style={{ gap: spacing.md }}>
          <View style={styles.between}>
            <Text variant="headline">{t('health:log.weightTitle')}</Text>
            <Text variant="caption" color="secondary">
              {t('health:log.weightReminder')}
            </Text>
          </View>
          <View style={styles.center}>
            <Stepper
              value={weightValue}
              onChange={setWeight}
              min={25}
              max={350}
              step={0.1}
              format={(v) => t('health:log.weightValue', { value: f.num(v, 1) })}
              accessibilityLabel={t('health:log.weightA11y')}
              decrementLabel={t('common:actions.decrease')}
              incrementLabel={t('common:actions.increase')}
            />
          </View>
          {lastTrend != null ? (
            <>
              <TrendSparkline points={last30} accessibilityLabel={t('health:log.trendChartA11y')} />
              <Text variant="footnote" color="secondary">
                {rate != null
                  ? t('health:log.trend', { trend: f.num(lastTrend, 1), rate: (rate > 0 ? '+' : rate < 0 ? '−' : '') + f.num(Math.abs(rate), 2) })
                  : t('health:log.trendNoRate', { trend: f.num(lastTrend, 1) })}
              </Text>
            </>
          ) : (
            <Text variant="footnote" color="secondary">
              {t('health:log.noWeight')}
            </Text>
          )}
          <Text variant="caption" color="tertiary">
            {t('health:log.trendHint')}
          </Text>
          <Button
            title={logWeight.isSuccess && weight == null ? t('health:log.weightSaved') : t('health:log.saveWeight')}
            loading={logWeight.isPending}
            disabled={!user}
            onPress={() =>
              logWeight.mutate(weightValue, {
                onSuccess: () => {
                  haptics.success();
                  setWeight(null);
                },
                onError: () => haptics.error(),
              })
            }
          />
        </Card>

        <View style={{ gap: 6 }}>
          <Text variant="footnote" color="secondary" style={styles.caption}>
            {t('health:log.sleepTitle')}
          </Text>
          <GroupedList footer={t('health:log.duration', duration)}>
            <ListRow
              icon="bed.double.fill"
              iconColor={colors.icon.indigo}
              title={t('health:log.bedtime')}
              trailing={
                <Stepper
                  value={bedMin}
                  onChange={(v) => setBed(wrap(v))}
                  step={SLEEP_STEP}
                  format={(v) => time.formatTimeOfDay(v)}
                  accessibilityLabel={t('health:log.bedtime')}
                  decrementLabel={t('health:log.earlier')}
                  incrementLabel={t('health:log.later')}
                />
              }
            />
            <ListRow
              icon="sunrise.fill"
              iconColor={colors.icon.orange}
              title={t('health:log.wake')}
              trailing={
                <Stepper
                  value={wakeMin}
                  onChange={(v) => setWake(wrap(v))}
                  step={SLEEP_STEP}
                  format={(v) => time.formatTimeOfDay(v)}
                  accessibilityLabel={t('health:log.wake')}
                  decrementLabel={t('health:log.earlier')}
                  incrementLabel={t('health:log.later')}
                />
              }
            />
            <ListRow
              title={t('health:log.quality')}
              trailing={
                <View style={styles.stars} accessibilityRole="radiogroup" accessibilityLabel={t('health:log.quality')}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable
                      key={n}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: qualityValue === n }}
                      accessibilityLabel={t('health:log.star', { count: n })}
                      hitSlop={4}
                      onPress={() => {
                        haptics.selection();
                        setQuality(n);
                      }}
                      style={styles.star}>
                      <Symbol
                        name={qualityValue != null && n <= qualityValue ? 'star.fill' : 'star'}
                        size={22}
                        color={qualityValue != null && n <= qualityValue ? colors.streak : colors.tertiaryLabel}
                      />
                    </Pressable>
                  ))}
                </View>
              }
            />
          </GroupedList>
          <Button
            title={t('health:log.saveSleep')}
            variant="tinted"
            loading={logSleep.isPending}
            disabled={!user}
            onPress={() =>
              logSleep.mutate(
                { day: today, bedMin, wakeMin, quality: qualityValue },
                { onSuccess: () => haptics.success(), onError: () => haptics.error() },
              )
            }
          />
          {logSleep.isSuccess ? (
            <Text variant="footnote" color="tint" align="center">
              {t('health:log.sleepSaved')}
            </Text>
          ) : null}
          {logSleep.isError || logWeight.isError ? (
            <Text variant="footnote" color="destructive">
              {t('health:log.saveError')}
            </Text>
          ) : null}
        </View>

        <Card style={{ gap: spacing.sm }}>
          {weekly && weeklyExp.previousTdeeKcal != null && weeklyExp.newTdeeKcal != null ? (
            <>
              <Text variant="footnote" color="secondary">
                {t('health:log.tdeeDate', { date: f.dayMonth(weekly.effective_from) })}
              </Text>
              <Text variant="title">
                {t('health:log.tdeeChange', { from: f.num(weeklyExp.previousTdeeKcal), to: f.num(weeklyExp.newTdeeKcal) })}
              </Text>
              <Text variant="subheadline" color="secondary">
                {t('health:log.tdeeTarget', { kcal: f.num(weekly.kcal) })}
              </Text>
              <Button
                title={showHow ? t('health:log.tdeeHide') : t('health:log.tdeeHow')}
                variant="plain"
                size="small"
                onPress={() => setShowHow((v) => !v)}
              />
              {showHow ? (
                <Text variant="footnote" color="secondary">
                  {t('health:log.tdeeDetail', {
                    intake: f.num(weeklyExp.avgIntakeKcal ?? null),
                    change: f.num(weeklyExp.trendChangeKg ?? null, 2),
                  })}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <Text variant="footnote" color="secondary">
                {t('health:log.tdeeTitle')}
              </Text>
              {current?.tdee_kcal ? (
                <Text variant="headline">
                  {t('health:log.tdeeCurrent', { tdee: f.num(current.tdee_kcal), kcal: f.num(current.kcal) })}
                </Text>
              ) : null}
              <Text variant="subheadline" color="secondary">
                {t('health:log.tdeeEmpty', { weighIns: health.MIN_WEIGH_INS, days: health.MIN_LOGGED_DAYS })}
              </Text>
            </>
          )}
        </Card>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' },
  center: { alignItems: 'center' },
  caption: { paddingHorizontal: spacing.lg },
  stars: { flexDirection: 'row', gap: 2 },
  star: { minWidth: 30, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
});
