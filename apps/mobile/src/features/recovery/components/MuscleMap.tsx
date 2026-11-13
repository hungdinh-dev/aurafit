/**
 * MuscleMap – body map of the 37 muscle heads (WRK-10 / WRK-11 / WRK-12).
 *
 * PLACEHOLDER ART: the owner will replace the rendering with a real front/back body model.
 * Keep the props stable so screens don't change when the art does:
 *
 * - `view`          'front' | 'back' – which side of the body to draw. Muscles whose catalog view
 *                   is 'both' (side delts, forearms) appear on both sides.
 * - `values`        per-head `{ percent, color }`; percent is 0–100 (recovery % or a share of the
 *                   volume scale), color is the fill (data colour from the caller). Missing heads
 *                   are drawn neutral.
 * - `onPressHead`   called with the tapped head code (omit for a read-only map).
 * - `selected`      head to outline.
 * - `muscles`       optional subset of muscles to draw (e.g. one region on a detail screen).
 * - `valueLabel`    optional text inside a head tile (defaults to `${percent}%`).
 *
 * Current rendering: rows of tappable tiles ordered head-to-toe, one row per muscle and one tile
 * per head – accessible (44-pt targets, VoiceOver labels) and good enough until the art lands.
 */
import { workout } from '@aurafit/core';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useCatalogNames } from '@/features/workout/catalog';
import { MIN_TOUCH, Text, haptics, radii, spacing, useTheme } from '@/ui';

export type MuscleMapView = 'front' | 'back';

export interface MuscleMapValue {
  /** 0–100. */
  percent: number;
  color: string;
}

export interface MuscleMapProps {
  view: MuscleMapView;
  values: Partial<Record<workout.MuscleHeadCode, MuscleMapValue>>;
  onPressHead?: (code: workout.MuscleHeadCode) => void;
  selected?: workout.MuscleHeadCode | null;
  muscles?: readonly workout.MuscleCode[];
  valueLabel?: (code: workout.MuscleHeadCode, value: MuscleMapValue | undefined) => string;
  /** VoiceOver description of each head (defaults to "<name>: <percent> %"). */
  headAccessibilityLabel?: (code: workout.MuscleHeadCode, value: MuscleMapValue | undefined) => string;
}

/** Head-to-toe drawing order of the 18 regions. */
export const BODY_ORDER: readonly workout.MuscleCode[] = [
  'traps',
  'side_delts',
  'front_delts',
  'rear_delts',
  'chest',
  'lats',
  'upper_back',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'lower_back',
  'glutes',
  'quads',
  'adductors',
  'hamstrings',
  'calves',
];

/** Muscles drawn on a side of the body. */
export function musclesForView(view: MuscleMapView): workout.MuscleCode[] {
  return BODY_ORDER.filter((m) => {
    const v = workout.MUSCLES[m].view;
    return v === 'both' || v === view;
  });
}

export function MuscleMap({
  view,
  values,
  onPressHead,
  selected,
  muscles,
  valueLabel,
  headAccessibilityLabel,
}: MuscleMapProps) {
  const { colors } = useTheme();
  const names = useCatalogNames();
  const { t } = useTranslation('workout');
  const list = muscles ?? musclesForView(view);

  return (
    <View style={[styles.body, { backgroundColor: colors.surfaceNested }]}>
      {list.map((muscle) => (
        <View key={muscle} style={styles.row}>
          <Text variant="caption" color="secondary" numberOfLines={2} style={styles.label}>
            {names.muscle(muscle)}
          </Text>
          <View style={styles.tiles}>
            {workout.MUSCLE_HEADS_BY_MUSCLE[muscle].map((head) => {
              const value = values[head];
              const isSelected = selected === head;
              const label = valueLabel ? valueLabel(head, value) : value ? `${Math.round(value.percent)}%` : '–';
              const a11y =
                headAccessibilityLabel?.(head, value) ??
                t('recovery.pct', { value: value ? Math.round(value.percent) : 0 }) + ' · ' + names.headFull(head);
              return (
                <Pressable
                  key={head}
                  accessibilityRole={onPressHead ? 'button' : 'text'}
                  accessibilityLabel={a11y}
                  accessibilityState={{ selected: isSelected }}
                  disabled={!onPressHead}
                  onPress={() => {
                    haptics.selection();
                    onPressHead?.(head);
                  }}
                  style={({ pressed }) => [
                    styles.tile,
                    {
                      backgroundColor: value?.color ?? colors.fill,
                      borderColor: isSelected ? colors.label : 'transparent',
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}>
                  <Text variant="caption" weight="600" color="#FFFFFF" numberOfLines={1}>
                    {label}
                  </Text>
                  {workout.MUSCLE_HEADS_BY_MUSCLE[muscle].length > 1 ? (
                    <Text variant="caption" color="rgba(255,255,255,0.8)" numberOfLines={1} style={styles.headName}>
                      {names.head(head)}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { borderRadius: radii.inner, padding: spacing.md, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { width: 78 },
  tiles: { flex: 1, flexDirection: 'row', gap: spacing.xs },
  tile: {
    flex: 1,
    minHeight: MIN_TOUCH,
    borderRadius: radii.tile,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  headName: { fontSize: 9 },
});
