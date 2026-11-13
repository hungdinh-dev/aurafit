import { workout } from '@aurafit/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Legend } from '@/features/recovery/components/Legend';
import { ZONE_COLORS, useWeeklyVolume } from '@/features/recovery/useRecovery';
import { useCatalogNames } from '@/features/workout/catalog';
import { ErrorCard, LoadingCard, PushedHeader } from '@/features/workout/components/common';
import { formatShortDate } from '@/features/workout/format';
import { useWorkoutFormat } from '@/features/workout/useFormat';
import { Card, MIN_TOUCH, Screen, Text, haptics, radii, spacing, useTheme } from '@/ui';

const ZONES: readonly workout.VolumeZone[] = ['below_stimulus', 'effective', 'overload_risk'];
/** Bar scale (sets/week) – matches the mockup axis 0–30. */
const SCALE_MAX = 30;

/** Khối lượng tuần – VolumeZones mockup: effective sets per muscle vs 10–20 zones (WRK-13). */
export default function VolumeZonesScreen() {
  const { t } = useTranslation('workout');
  const { colors } = useTheme();
  const names = useCatalogNames();
  const fmt = useWorkoutFormat();
  const { volume, range, isLoading, isError, refetch } = useWeeklyVolume();
  const rows = workout.assessWeek(volume);
  const [selected, setSelected] = useState<workout.MuscleCode>('chest');
  const sel = rows.find((r) => r.muscle === selected) ?? rows[0]!;
  const tipColor = sel.zone === 'effective' ? 'tint' : sel.zone === 'overload_risk' ? 'warning' : ZONE_COLORS.below_stimulus;

  return (
    <Screen
      title={t('volume.title')}
      eyebrow={t('volume.subtitle', {
        range: `${formatShortDate(range.from, fmt.language)} – ${formatShortDate(range.to, fmt.language)}`,
      })}>
      <PushedHeader />
      {isLoading ? <LoadingCard /> : null}
      {isError ? <ErrorCard onRetry={refetch} /> : null}
      <Legend items={ZONES.map((z) => ({ key: z, color: ZONE_COLORS[z], label: t(`volume.zone.${z}`) }))} />

      <Card style={{ gap: spacing.xs }}>
        {rows.map((r) => {
          const name = names.muscle(r.muscle);
          const isSel = r.muscle === selected;
          return (
            <Pressable
              key={r.muscle}
              accessibilityRole="button"
              accessibilityState={{ selected: isSel }}
              accessibilityLabel={t('volume.rowA11y', { name, sets: fmt.num(r.sets, 1), zone: t(`volume.zone.${r.zone}`) })}
              onPress={() => {
                haptics.selection();
                setSelected(r.muscle);
              }}
              style={[styles.row, { backgroundColor: isSel ? colors.surfaceNested : 'transparent' }]}>
              <Text variant="footnote" style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <View style={[styles.track, { backgroundColor: colors.fill }]}>
                <View
                  style={[
                    styles.zone,
                    {
                      left: `${(r.target.setsMin / SCALE_MAX) * 100}%`,
                      width: `${((r.target.setsMax - r.target.setsMin) / SCALE_MAX) * 100}%`,
                      borderColor: colors.separator,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    { width: `${Math.min(100, (r.sets / SCALE_MAX) * 100)}%`, backgroundColor: ZONE_COLORS[r.zone] },
                  ]}
                />
              </View>
              <Text variant="footnote" weight="600" style={styles.value}>
                {fmt.num(r.sets, 1)}
              </Text>
            </Pressable>
          );
        })}
        <View style={styles.axis}>
          {[0, 10, 20, 30].map((n) => (
            <Text key={n} variant="caption" color="tertiary">
              {n}
            </Text>
          ))}
        </View>
      </Card>

      <Card level="nested">
        <Text variant="footnote" color={tipColor}>
          {t(`volume.tip.${sel.recommendation}`, {
            name: names.muscle(sel.muscle),
            sets: fmt.num(sel.sets, 1),
            max: sel.target.setsMax,
          })}
        </Text>
      </Card>
      <Text variant="caption" color="tertiary">
        {t('volume.source')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH, borderRadius: radii.tile, paddingHorizontal: spacing.xs },
  name: { width: 84 },
  track: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  zone: { position: 'absolute', top: 0, bottom: 0, borderLeftWidth: 1, borderRightWidth: 1 },
  bar: { height: 10, borderRadius: 5 },
  value: { width: 36, textAlign: 'right' },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 92, marginRight: 44 },
});
