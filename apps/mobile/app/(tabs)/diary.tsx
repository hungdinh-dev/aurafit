import { nutrition, time } from '@aurafit/core';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { CAPTURE_BUTTON_CLEARANCE } from '@/features/capture/CaptureButton';
import { useCoachSettings } from '@/features/coach/api';
import { localToday } from '@/features/coach/lib/clock';
import { useFormat } from '@/features/coach/lib/format';
import { asMealSlot } from '@/features/nutrition/analysis';
import { useDeleteMeal, useFreeDays, weekOf, type MealWithItems } from '@/features/nutrition/api';
import { useDayNutrition } from '@/features/nutrition/useDayNutrition';
import { useAuth } from '@/lib/auth';
import { Card, GroupedList, ListRow, ProgressBar, Screen, Text, haptics, spacing, useTheme, MIN_TOUCH } from '@/ui';

/** Nhật ký (NUT-08, NUT-09): week strip, day total, meals, free-day entry. */
export default function DiaryScreen() {
  const { t } = useTranslation(['nutrition', 'common']);
  const router = useRouter();
  const { colors } = useTheme();
  const f = useFormat();
  const { user } = useAuth();
  const today = localToday();
  const [selected, setSelected] = useState(today);
  const week = weekOf(selected);
  const day = useDayNutrition(selected);
  const settings = useCoachSettings();
  const freeDays = useFreeDays(week.start, week.end);
  const del = useDeleteMeal();

  const target = day.targets?.kcal ?? null;
  const eaten = day.consumed.kcal;
  const left = target != null ? target - eaten : null;
  const allowance = settings.data?.free_days_per_week ?? 1;
  const usedFree = (freeDays.data ?? []).length;
  const todayIsFree = (freeDays.data ?? []).some((d) => d.local_date === today);
  const quoteKcal = target ? nutrition.estimateFreeDayExtraKcal({ dailyTargetKcal: target }) : null;
  const future = time.compareDates(selected, today) > 0;

  const confirmDelete = (meal: MealWithItems) =>
    Alert.alert(t('nutrition:diary.deleteTitle'), t('nutrition:diary.deleteBody'), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      {
        text: t('common:actions.delete'),
        style: 'destructive',
        onPress: () => {
          haptics.warning();
          del.mutate(meal.id);
        },
      },
    ]);

  return (
    <Screen title={t('nutrition:diary.title')} bottomInset={CAPTURE_BUTTON_CLEARANCE}>
      <View style={styles.week} accessibilityRole="tablist">
        {week.dates.map((date) => {
          const on = date === selected;
          const isFuture = time.compareDates(date, today) > 0;
          const weekday = t(`nutrition:weekdays.${time.isoWeekday(date)}`);
          const dayNum = Number(date.slice(8, 10));
          return (
            <Pressable
              key={date}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t('nutrition:diary.dayA11y', { weekday, day: dayNum })}
              onPress={() => {
                haptics.selection();
                setSelected(date);
              }}
              style={[styles.day, on ? { backgroundColor: colors.tint } : null]}>
              <Text variant="caption" color={on ? 'onTint' : 'secondary'}>
                {weekday}
              </Text>
              <Text variant="headline" color={on ? 'onTint' : isFuture ? 'tertiary' : 'label'}>
                {dayNum}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={{ gap: spacing.sm }}>
        <View style={styles.summary}>
          <Text variant="headline">
            {target != null
              ? t('nutrition:diary.summary', { eaten: f.num(eaten), target: f.num(target) })
              : t('nutrition:diary.eatenOnly', { eaten: f.num(eaten) })}
          </Text>
          {left != null ? (
            <Text variant="subheadline" color={left < 0 ? 'warning' : 'tint'} weight="600">
              {left < 0 ? t('nutrition:diary.over', { kcal: f.num(-left) }) : t('nutrition:diary.left', { kcal: f.num(left) })}
            </Text>
          ) : null}
        </View>
        <ProgressBar
          progress={target ? eaten / target : 0}
          color={left != null && left < 0 ? colors.warning : colors.tint}
          height={6}
          accessibilityLabel={t('nutrition:diary.summary', { eaten: f.num(eaten), target: f.num(target ?? 0) })}
        />
      </Card>

      <GroupedList
        header={t('nutrition:diary.meals')}
        footer={
          future
            ? t('nutrition:diary.future')
            : !day.isLoading && (day.meals ?? []).length === 0
              ? t('nutrition:diary.empty')
              : undefined
        }>
        {(day.meals ?? []).map((meal) => {
          const kcal = meal.meal_items.reduce((s, i) => s + i.kcal, 0);
          const names = meal.meal_items.map((i) => i.name).join(', ') || t(`nutrition:meals.${asMealSlot(meal.meal_slot)}`);
          return (
            <MealRow
              key={meal.id}
              title={names}
              subtitle={t('nutrition:diary.mealMeta', {
                time: f.clock(meal.eaten_at),
                source: t(`nutrition:sources.${sourceKey(meal.source)}`),
              })}
              value={t('nutrition:kcalValue', { kcal: f.num(kcal) })}
              onLongPress={user ? () => confirmDelete(meal) : undefined}
              deleteLabel={t('common:actions.delete')}
            />
          );
        })}
        {!future && user ? (
          <ListRow
            icon="plus"
            iconColor={colors.icon.mint}
            title={t('nutrition:diary.addMeal')}
            onPress={() => router.push('/food/add')}
          />
        ) : null}
      </GroupedList>

      <GroupedList>
        <ListRow
          icon="party.popper.fill"
          iconColor={colors.icon.pink}
          title={t('nutrition:diary.freeDay')}
          subtitle={
            todayIsFree
              ? t('nutrition:diary.freeDayToday')
              : quoteKcal
                ? t('nutrition:diary.freeDayHint', { kcal: f.num(quoteKcal) })
                : undefined
          }
          value={t('nutrition:diary.freeDayUsed', { used: usedFree, allowance })}
          onPress={() => router.push('/diary/free-day')}
        />
      </GroupedList>
    </Screen>
  );
}

function sourceKey(source: string): 'photo' | 'text' | 'library' | 'recent' | 'barcode' {
  return source === 'photo' || source === 'text' || source === 'recent' || source === 'barcode' ? source : 'library';
}

function MealRow({
  title,
  subtitle,
  value,
  onLongPress,
  deleteLabel,
}: {
  title: string;
  subtitle: string;
  value: string;
  onLongPress?: () => void;
  deleteLabel: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="text"
      accessibilityLabel={[title, subtitle, value].join(', ')}
      accessibilityActions={onLongPress ? [{ name: 'delete', label: deleteLabel }] : undefined}
      onAccessibilityAction={() => onLongPress?.()}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.mealRow, { backgroundColor: pressed && onLongPress ? colors.surfaceNested : 'transparent' }]}>
      <View style={styles.mealTexts}>
        <Text variant="body" numberOfLines={2}>
          {title}
        </Text>
        <Text variant="footnote" color="secondary">
          {subtitle}
        </Text>
      </View>
      <Text variant="headline">{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 44, minHeight: 58, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 2 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: MIN_TOUCH + 16,
  },
  mealTexts: { flex: 1, gap: 2 },
});
