import { coach, nutrition, time } from '@aurafit/core';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useCoachSettings, useUpdateCoachSettings } from '@/features/coach/api';
import { BackHeader } from '@/features/coach/components/BackHeader';
import { asStrictness } from '@/features/coach/insights';
import { localToday } from '@/features/coach/lib/clock';
import { useFormat } from '@/features/coach/lib/format';
import {
  parseExplanation,
  useCurrentTargets,
  useFreeDays,
  useIntakeByDay,
  useToggleFreeDay,
  weekOf,
} from '@/features/nutrition/api';
import { useAuth } from '@/lib/auth';
import { Button, Card, GroupedList, ListRow, Screen, SegmentedControl, Text, haptics, spacing, useTheme } from '@/ui';

const CHART_H = 92;

/** Ngày tự do & ngân sách tuần (NUT-09 quote, NUT-11 weekly budget). */
export default function FreeDayScreen() {
  const { t } = useTranslation(['nutrition', 'common']);
  const { colors } = useTheme();
  const f = useFormat();
  const { user } = useAuth();
  const today = localToday();
  const week = weekOf(today);
  const targets = useCurrentTargets();
  const intake = useIntakeByDay(week.start, week.end);
  const freeDays = useFreeDays(week.start, week.end);
  const settings = useCoachSettings();
  const updateSettings = useUpdateCoachSettings();
  const toggle = useToggleFreeDay();

  const target = targets.data?.current ?? null;
  const exp = parseExplanation(target?.explanation);
  const mode: nutrition.FreeDayMode = settings.data?.free_day_mode === 'no_compensate' ? 'no_compensate' : 'compensate';
  const strictness = asStrictness(settings.data?.strictness);
  const allowance = settings.data?.free_days_per_week ?? coach.rulesFor(strictness).defaultFreeDaysPerWeek;
  const free = freeDays.data ?? [];
  const todayFree = free.some((d) => d.local_date === today);
  const otherFree = free.filter((d) => d.local_date !== today).map((d) => d.local_date);

  if (!target) {
    return (
      <>
        <BackHeader />
        <Screen title={t('nutrition:freeDay.title')}>
          {targets.isLoading ? null : (
            <Text variant="body" color="secondary">
              {t('nutrition:freeDay.noTargets')}
            </Text>
          )}
        </Screen>
      </>
    );
  }

  const floor = exp.floorKcal ?? Math.round(target.kcal * 0.8);
  const budget = nutrition.computeWeeklyBudget({
    today,
    dailyTargetKcal: target.kcal,
    floorKcal: floor,
    freeDayMode: mode,
    days: week.dates.map((date) => ({
      date,
      intakeKcal: intake.data?.[date] ?? null,
      isFreeDay: free.some((d) => d.local_date === date),
      quotedExtraKcal: free.find((d) => d.local_date === date)?.quoted_extra_kcal ?? null,
    })),
  });
  const used = Object.values(intake.data ?? {}).reduce((s, v) => s + v, 0);
  const leftWeek = Math.max(0, budget.weeklyBudgetKcal - used);
  const daysAfterToday = time.diffDays(today, week.end);

  const quote = nutrition.quoteFreeDay({
    date: today,
    today,
    goal: (exp.goal as nutrition.GoalType | undefined) ?? 'lose_fat',
    dailyTargetKcal: target.kcal,
    dailyDeltaKcal: exp.effectiveDailyDeltaKcal ?? 0,
    floorKcal: floor,
    otherFreeDates: otherFree,
  });
  const allowanceCheck = nutrition.checkFreeDayAllowance({ freeDaysPerWeek: allowance, usedThisWeek: otherFree.length, strictness });

  const quoteLines: string[] = [];
  if (mode === 'compensate') {
    quoteLines.push(
      quote.compensation.days > 0
        ? t('nutrition:freeDay.quoteCompensate', {
            count: quote.compensation.days,
            kcal: f.num(quote.compensation.perDayReductionKcal),
            target: f.num(target.kcal - quote.compensation.perDayReductionKcal),
          })
        : t('nutrition:freeDay.quoteNoDays'),
    );
    const delay = quote.compensation.delayDays;
    quoteLines.push(delay && delay > 0 ? t('nutrition:freeDay.quoteDelay', { days: f.num(delay, 1) }) : t('nutrition:freeDay.quoteKeep'));
  } else {
    quoteLines.push(t('nutrition:freeDay.quoteNoCompensate'));
    if (quote.delayDays && quote.delayDays > 0) quoteLines.push(t('nutrition:freeDay.quoteDelay', { days: f.num(quote.delayDays, 1) }));
  }

  const maxBar = Math.max(target.kcal * 1.2, ...week.dates.map((d) => intake.data?.[d] ?? 0));

  return (
    <>
      <BackHeader />
      <Screen title={t('nutrition:freeDay.title')}>
        <Card style={{ gap: spacing.md }}>
          <Text variant="footnote" color="secondary">
            {t('nutrition:freeDay.budget')}
          </Text>
          <Text variant="title">
            {t('nutrition:freeDay.budgetValue', { used: f.num(used), total: f.num(budget.weeklyBudgetKcal) })}
          </Text>
          <View accessible accessibilityLabel={t('nutrition:freeDay.chartA11y')} style={[styles.chart, { height: CHART_H + 20 }]}>
            {week.dates.map((date) => {
              const v = intake.data?.[date] ?? 0;
              const h = v === 0 ? 4 : Math.max(4, Math.round((v / maxBar) * CHART_H));
              const isToday = date === today;
              const over = v > target.kcal * 1.1;
              return (
                <View key={date} style={styles.barCol}>
                  <View style={{ height: CHART_H, justifyContent: 'flex-end' }}>
                    <View
                      style={{
                        height: h,
                        width: 22,
                        borderRadius: 6,
                        backgroundColor: isToday ? colors.tint : v === 0 ? colors.surfaceNested : over ? colors.data.fat : colors.fillSelected,
                      }}
                    />
                  </View>
                  <Text variant="caption" color={isToday ? 'tint' : 'secondary'}>
                    {t(`nutrition:weekdays.${time.isoWeekday(date)}`)}
                  </Text>
                </View>
              );
            })}
          </View>
          <Text variant="footnote" color="secondary">
            {t('nutrition:freeDay.budgetLeft', { kcal: f.num(leftWeek), count: daysAfterToday })}
          </Text>
        </Card>

        <GroupedList>
          <ListRow title={t('nutrition:freeDay.usedThisWeek')} value={`${free.length}/${allowance}`} />
        </GroupedList>

        <View style={{ gap: 6 }}>
          <Text variant="footnote" color="secondary" style={styles.caption}>
            {t('nutrition:freeDay.mode')}
          </Text>
          <SegmentedControl
            accessibilityLabel={t('nutrition:freeDay.mode')}
            value={mode}
            onChange={(v) => {
              if (user) updateSettings.mutate({ free_day_mode: v });
            }}
            options={[
              { value: 'compensate', label: t('nutrition:freeDay.modeCompensate') },
              { value: 'no_compensate', label: t('nutrition:freeDay.modeNoCompensate') },
            ]}
          />
        </View>

        <Card style={{ gap: spacing.sm }}>
          <Text variant="footnote" color="secondary">
            {t('nutrition:freeDay.quoteTitle')}
          </Text>
          <Text variant="title" color="tint">
            {t('nutrition:freeDay.quoteKcal', { kcal: f.num(quote.extraKcal) })}
          </Text>
          {quoteLines.map((l) => (
            <Text key={l} variant="subheadline">
              {l}
            </Text>
          ))}
        </Card>

        <Text variant="footnote" color="secondary">
          {t('nutrition:freeDay.note')}
        </Text>
        {!todayFree && allowanceCheck.kind === 'over_quota' ? (
          <Text variant="footnote" color="warning">
            {t('nutrition:freeDay.overQuota', { pts: Math.abs(allowanceCheck.penaltyPts) })}
          </Text>
        ) : null}
        {todayFree ? (
          <Text variant="subheadline" color="tint">
            {t('nutrition:freeDay.enabled')}
          </Text>
        ) : null}
        {toggle.isError || updateSettings.isError ? (
          <Text variant="footnote" color="destructive">
            {t('nutrition:freeDay.error')}
          </Text>
        ) : null}
        <Button
          title={todayFree ? t('nutrition:freeDay.disable') : t('nutrition:freeDay.enable')}
          variant={todayFree ? 'gray' : 'filled'}
          loading={toggle.isPending}
          disabled={!user}
          onPress={() =>
            toggle.mutate(
              { date: today, enable: !todayFree, quotedExtraKcal: quote.extraKcal },
              { onSuccess: () => haptics.success(), onError: () => haptics.error() },
            )
          }
        />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barCol: { alignItems: 'center', gap: spacing.xs },
  caption: { paddingHorizontal: spacing.lg },
});
