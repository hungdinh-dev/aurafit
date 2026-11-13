import { nutrition, time } from '@aurafit/core';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { localNowMin, localToday } from '@/features/coach/lib/clock';
import { useFormat } from '@/features/coach/lib/format';
import { MEAL_SLOTS, asMealSlot, slotForTime, type MealSlot } from '@/features/nutrition/analysis';
import {
  useLogSavedFood,
  useRecentMeals,
  useRepeatMeal,
  useSavedFoods,
  type MealWithItems,
  type SavedFood,
} from '@/features/nutrition/api';
import { suggestionName, useSuggestion } from '@/features/nutrition/components/WhatToEat';
import { pickMealPhoto, useMealDraft } from '@/features/nutrition/draft';
import { useDayNutrition } from '@/features/nutrition/useDayNutrition';
import { useAuth } from '@/lib/auth';
import {
  GlassButton,
  GroupedList,
  ListRow,
  SegmentedControl,
  SheetContent,
  Symbol,
  Text,
  TextField,
  haptics,
  spacing,
  useTheme,
  MIN_TOUCH,
  type SFSymbol,
} from '@/ui';

/** Thêm món (sheet – NUT-02/04/05/06/07/10). */
export default function AddFoodSheet() {
  const { t } = useTranslation(['nutrition', 'common', 'today']);
  const router = useRouter();
  const { colors } = useTheme();
  const f = useFormat();
  const { user } = useAuth();
  const [slot, setSlot] = useState<MealSlot>(() => slotForTime(localNowMin()));
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const today = localToday();
  const saved = useSavedFoods();
  const recent = useRecentMeals();
  const day = useDayNutrition(today);
  const logSaved = useLogSavedFood();
  const repeat = useRepeatMeal();
  const setPendingPhoto = useMealDraft((s) => s.setPendingPhoto);
  const { best } = useSuggestion({ remaining: day.remaining, foods: saved.data, slot });

  const q = query.trim().toLowerCase();
  const foods = useMemo(
    () => (saved.data ?? []).filter((food) => !q || food.name.toLowerCase().includes(q)),
    [saved.data, q],
  );
  const recentMeals = useMemo(
    () =>
      (recent.data ?? []).filter(
        (m) => m.meal_items.length > 0 && (!q || m.meal_items.some((i) => i.name.toLowerCase().includes(q))),
      ),
    [recent.data, q],
  );
  const lastSameSlot = (recent.data ?? []).find((m) => m.meal_slot === slot && m.local_date !== today);

  const done = (mealSlot: MealSlot) => {
    haptics.success();
    setMessage(t('nutrition:add.logged', { meal: t(`nutrition:mealsLower.${mealSlot}`) }));
    router.back();
  };
  const fail = () => {
    haptics.error();
    setMessage(t('common:errors.generic'));
  };

  const logFood = (food: SavedFood, portion: number) =>
    logSaved.mutate({ food, portion, slot }, { onSuccess: () => done(slot), onError: fail });

  const choosePortion = (food: SavedFood) => {
    const options = nutrition.PORTION_MULTIPLIERS.map((p) => `×${f.num(p, 1)}`);
    const title = t('nutrition:add.portionTitle', { name: food.name });
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title, options: [...options, t('common:actions.cancel')], cancelButtonIndex: options.length },
        (i) => {
          const p = nutrition.PORTION_MULTIPLIERS[i];
          if (p !== undefined) logFood(food, p);
        },
      );
    } else {
      Alert.alert(title, undefined, [
        ...nutrition.PORTION_MULTIPLIERS.slice(0, 2).map((p) => ({ text: `×${f.num(p, 1)}`, onPress: () => logFood(food, p) })),
        { text: t('common:actions.cancel'), style: 'cancel' as const },
      ]);
    }
  };

  const repeatMeal = (meal: MealWithItems) =>
    repeat.mutate({ meal, slot }, { onSuccess: () => done(slot), onError: fail });

  const takePhoto = async (from: 'camera' | 'library') => {
    const res = await pickMealPhoto(from);
    if (!res) return;
    if ('error' in res) {
      setMessage(t('nutrition:add.cameraPermission'));
      return;
    }
    setPendingPhoto({ uri: res.uri, slot });
    router.replace('/food/confirm');
  };

  const mealKcal = (m: MealWithItems) => m.meal_items.reduce((s, i) => s + i.kcal, 0);
  const whenLabel = (m: MealWithItems) =>
    m.local_date === time.addDays(today, -1) ? t('nutrition:add.yesterday') : t('nutrition:add.earlier');

  const busy = logSaved.isPending || repeat.isPending;

  return (
    <SheetContent
      title={t('nutrition:add.title')}
      headerRight={
        <GlassButton symbol="xmark" size={36} accessibilityLabel={t('common:actions.close')} onPress={() => router.back()} />
      }>
      <SegmentedControl
        accessibilityLabel={t('nutrition:add.slot')}
        value={slot}
        onChange={(v) => setSlot(asMealSlot(v))}
        options={MEAL_SLOTS.map((s) => ({ value: s, label: t(`nutrition:slotsShort.${s}`), accessibilityLabel: t(`nutrition:meals.${s}`) }))}
      />

      <View style={styles.actions}>
        <ActionTile symbol="camera.fill" label={t('nutrition:add.photo')} prominent onPress={() => void takePhoto('camera')} />
        <ActionTile symbol="photo.on.rectangle" label={t('nutrition:add.library')} onPress={() => void takePhoto('library')} />
        <ActionTile symbol="text.bubble.fill" label={t('nutrition:add.describe')} onPress={() => router.replace({ pathname: '/food/text', params: { slot } })} />
        <ActionTile symbol="barcode.viewfinder" label={t('nutrition:add.barcode')} onPress={() => router.replace({ pathname: '/food/barcode', params: { slot } })} />
      </View>

      {!user ? (
        <Text variant="footnote" color="secondary">
          {t('nutrition:add.previewOnly')}
        </Text>
      ) : null}
      {message ? (
        <Text variant="footnote" color="secondary" accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}

      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder={t('nutrition:add.search')}
        accessibilityLabel={t('nutrition:add.search')}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />

      {best && !q ? (
        <GroupedList header={t('today:whatToEat')}>
          <ListRow
            icon="sparkles"
            iconColor={colors.icon.mint}
            title={suggestionName(best, saved.data ?? [], (p) => `×${f.num(p, 1)}`)}
            subtitle={t('today:suggest.summary', { kcal: f.num(best.totals.kcal), protein: f.num(best.totals.protein_g) })}
            disabled={busy}
            onPress={() => {
              const first = best.parts[0];
              const food = (saved.data ?? []).find((x) => x.id === first?.foodId);
              if (food && first && best.parts.length === 1) logFood(food, first.portion);
              else if (food) choosePortion(food);
            }}
            trailing={<Symbol name="plus.circle.fill" size={26} color="tint" />}
          />
        </GroupedList>
      ) : null}

      {lastSameSlot && !q ? (
        <GroupedList>
          <ListRow
            icon="arrow.clockwise"
            iconColor={colors.icon.gray}
            title={t('nutrition:add.repeat', {
              meal: t(`nutrition:mealsLower.${asMealSlot(lastSameSlot.meal_slot)}`),
              when: whenLabel(lastSameSlot),
              kcal: f.num(mealKcal(lastSameSlot)),
            })}
            accessibilityHint={t('nutrition:add.repeatA11y')}
            disabled={busy}
            onPress={() => repeatMeal(lastSameSlot)}
            trailing={<Symbol name="plus.circle.fill" size={26} color="tint" />}
          />
        </GroupedList>
      ) : null}

      <GroupedList header={t('nutrition:add.myFoods')} footer={foods.length === 0 ? (q ? t('nutrition:add.noResults') : t('nutrition:add.libraryEmpty')) : undefined}>
        {foods.slice(0, 12).map((food) => (
          <ListRow
            key={food.id}
            title={food.name}
            subtitle={
              food.kind === 'combo'
                ? t('nutrition:add.comboMeta', { kcal: f.num(food.kcal), count: food.saved_food_items.length })
                : t('nutrition:add.foodMeta', { kcal: f.num(food.kcal), protein: f.num(food.protein_g) })
            }
            accessibilityLabel={t('nutrition:add.logA11y', { name: food.name })}
            disabled={busy}
            onPress={() => choosePortion(food)}
            trailing={<Symbol name="plus.circle.fill" size={26} color="tint" />}
          />
        ))}
      </GroupedList>

      {recentMeals.length > 0 ? (
        <GroupedList header={t('nutrition:add.recent')}>
          {recentMeals.slice(0, 6).map((m) => (
            <ListRow
              key={m.id}
              title={m.meal_items.map((i) => i.name).join(', ')}
              subtitle={`${t(`nutrition:meals.${asMealSlot(m.meal_slot)}`)} · ${f.dayMonth(m.local_date)}`}
              value={t('nutrition:kcalValue', { kcal: f.num(mealKcal(m)) })}
              accessibilityHint={t('nutrition:add.repeatA11y')}
              disabled={busy}
              onPress={() => repeatMeal(m)}
            />
          ))}
        </GroupedList>
      ) : null}
    </SheetContent>
  );
}

function ActionTile({
  symbol,
  label,
  onPress,
  prominent,
}: {
  symbol: SFSymbol;
  label: string;
  onPress: () => void;
  prominent?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptics.light();
        onPress();
      }}
      style={({ pressed }) => [styles.tile, { opacity: pressed ? 0.7 : 1 }]}>
      <View style={[styles.tileIcon, { backgroundColor: prominent ? colors.tint : colors.surfaceNested }]}>
        <Symbol name={symbol} size={22} color={prominent ? colors.onTint : colors.label} weight="semibold" />
      </View>
      <Text variant="caption" align="center" numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  tile: { flex: 1, alignItems: 'center', gap: spacing.xs + 2, minHeight: MIN_TOUCH },
  tileIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
