import { workout } from '@aurafit/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { EQUIPMENT_CODES } from '@/features/workout/api';
import { useCatalogNames } from '@/features/workout/catalog';
import { EmptyCard, PushedHeader } from '@/features/workout/components/common';
import { MUSCLE_GROUPS, countBy, filterExercises, type LibraryMode } from '@/features/workout/library';
import { draftForExercise } from '@/features/workout/sessionLogic';
import { useWorkoutStore } from '@/features/workout/store';
import { GroupedList, ListRow, MIN_TOUCH, Screen, SegmentedControl, Text, TextField, haptics, radii, spacing, useTheme } from '@/ui';

/** Thư viện bài tập – Library mockup: 9 groups × 9 equipment, search (WRK-01 / WRK-09). */
export default function LibraryScreen() {
  const { pick } = useLocalSearchParams<{ pick?: string }>();
  const { t } = useTranslation('workout');
  const { colors } = useTheme();
  const names = useCatalogNames();
  const [mode, setMode] = useState<LibraryMode>('group');
  const [group, setGroup] = useState<workout.MuscleGroupCode>('chest');
  const [equipment, setEquipment] = useState<workout.EquipmentCode>('dumbbell');
  const [query, setQuery] = useState('');
  const active = useWorkoutStore((s) => s.active);
  const counts = useMemo(() => countBy(mode), [mode]);
  const list = useMemo(
    () => filterExercises({ mode, group, equipment, query }, names.exercise),
    [mode, group, equipment, query, names]
  );
  const keys: readonly string[] = mode === 'group' ? MUSCLE_GROUPS : EQUIPMENT_CODES;
  const selected = mode === 'group' ? group : equipment;
  const title = query
    ? t('library.search')
    : mode === 'group'
      ? names.group(group)
      : names.equipment(equipment);

  const open = (slug: string) => {
    if (pick && active) {
      haptics.success();
      const state = useWorkoutStore.getState();
      state.setExercises((l) => [...l, draftForExercise(slug, active.inventory)]);
      state.setCurrent(active.exercises.length);
      router.back();
      return;
    }
    router.push({ pathname: '/exercises/[slug]', params: { slug } });
  };

  return (
    <Screen title={t('library.title')}>
      <PushedHeader />
      <TextField
        value={query}
        onChangeText={setQuery}
        placeholder={t('library.search')}
        accessibilityLabel={t('library.search')}
        autoCorrect={false}
        clearButtonMode="while-editing"
        returnKeyType="search"
      />
      <SegmentedControl
        options={[
          { value: 'group', label: t('library.byGroup') },
          { value: 'equipment', label: t('library.byEquipment') },
        ]}
        value={mode}
        onChange={setMode}
      />
      <View style={styles.grid}>
        {keys.map((k) => {
          const on = k === selected && !query;
          const label =
            mode === 'group' ? names.group(k as workout.MuscleGroupCode) : names.equipment(k as workout.EquipmentCode);
          return (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${label}, ${t('library.count', { count: counts[k] ?? 0 })}`}
              onPress={() => {
                haptics.selection();
                setQuery('');
                if (mode === 'group') setGroup(k as workout.MuscleGroupCode);
                else setEquipment(k as workout.EquipmentCode);
              }}
              style={[styles.tile, { backgroundColor: on ? colors.tint : colors.surface }]}>
              <Text variant="subheadline" weight="600" color={on ? 'onTint' : 'label'} numberOfLines={1}>
                {label}
              </Text>
              <Text variant="caption" color={on ? 'onTint' : 'secondary'}>
                {t('library.count', { count: counts[k] ?? 0 })}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {list.length === 0 ? (
        <EmptyCard symbol="magnifyingglass" body={t('library.empty')} />
      ) : (
        <GroupedList header={`${title} · ${t('library.count', { count: list.length })}`}>
          {list.map((e) => (
            <ListRow
              key={e.slug}
              title={names.exercise(e.slug)}
              subtitle={mode === 'group' && !query ? names.equipment(e.equipment) : names.group(e.groupCode)}
              icon={pick ? 'plus' : 'play.rectangle.fill'}
              iconColor={pick ? colors.icon.mint : colors.icon.gray}
              onPress={() => open(e.slug)}
            />
          ))}
        </GroupedList>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '31.5%',
    minHeight: MIN_TOUCH + 12,
    borderRadius: radii.inner,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    gap: 2,
  },
});
