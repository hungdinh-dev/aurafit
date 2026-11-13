import { workout } from '@aurafit/core';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Legend } from '@/features/recovery/components/Legend';
import { MuscleMap, type MuscleMapValue, type MuscleMapView } from '@/features/recovery/components/MuscleMap';
import { VOLUME_COLORS, useRecovery, useWeeklyVolume } from '@/features/recovery/useRecovery';
import { useCatalogNames } from '@/features/workout/catalog';
import { PushedHeader } from '@/features/workout/components/common';
import { useWorkoutFormat } from '@/features/workout/useFormat';
import { Card, Screen, SegmentedControl, Text, spacing } from '@/ui';

type Mode = 'volume' | 'recovery';
const VOLUME_BANDS: readonly workout.VolumeMapBand[] = ['low', 'moderate', 'high', 'very_high'];
const RECOVERY_BANDS: readonly workout.RecoveryBand[] = ['heavy', 'moderate', 'light', 'ready'];
/** Top of the volume colour scale (sets/week) used for the tile percentage. */
const VOLUME_SCALE_MAX = 24;

/** Bản đồ cơ – MuscleMap mockup: weekly volume or recovery per head (WRK-12). */
export default function MuscleMapScreen() {
  const { t } = useTranslation('workout');
  const names = useCatalogNames();
  const fmt = useWorkoutFormat();
  const [mode, setMode] = useState<Mode>('volume');
  const [view, setView] = useState<MuscleMapView>('front');
  const [selected, setSelected] = useState<workout.MuscleHeadCode>('chest_upper');
  const recovery = useRecovery();
  const { volume } = useWeeklyVolume();

  const values: Partial<Record<workout.MuscleHeadCode, MuscleMapValue>> = {};
  for (const code of workout.MUSCLE_HEAD_CODES) {
    if (mode === 'volume') {
      const sets = volume.byHead[code];
      values[code] = {
        percent: Math.min(100, (sets / VOLUME_SCALE_MAX) * 100),
        color: VOLUME_COLORS[workout.volumeMapBand(sets)],
      };
    } else {
      const h = recovery.heads[code];
      values[code] = { percent: h.recoveryPct, color: workout.RECOVERY_COLORS[h.band] };
    }
  }

  const selSets = volume.byHead[selected];
  const selHead = recovery.heads[selected];
  const chip =
    mode === 'volume'
      ? t('map.chipVolume', { level: t(`map.volumeBand.${workout.volumeMapBand(selSets)}`), sets: fmt.num(selSets, 1) })
      : t('map.chipRecovery', { level: t(`recovery.band.${selHead.band}`), pct: Math.round(selHead.recoveryPct) });
  const summary = workout.volumeSummary(volume);

  return (
    <Screen title={t('map.title')}>
      <PushedHeader />
      <SegmentedControl
        options={[
          { value: 'volume', label: t('map.mode.volume') },
          { value: 'recovery', label: t('map.mode.recovery') },
        ]}
        value={mode}
        onChange={setMode}
      />
      <SegmentedControl
        accessibilityLabel={t('recovery.view')}
        options={[
          { value: 'front', label: t('recovery.front') },
          { value: 'back', label: t('recovery.back') },
        ]}
        value={view}
        onChange={setView}
      />
      <Card level="nested" padding={12} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: values[selected]?.color }} />
        <Text variant="subheadline" weight="600" style={{ flex: 1 }}>
          {names.headFull(selected)}
        </Text>
        <Text variant="footnote" color="secondary">
          {chip}
        </Text>
      </Card>
      <MuscleMap
        view={view}
        values={values}
        selected={selected}
        onPressHead={setSelected}
        valueLabel={(code, v) =>
          mode === 'volume' ? fmt.num(volume.byHead[code], 1) : v ? `${Math.round(v.percent)}%` : '–'
        }
      />
      <Legend
        items={
          mode === 'volume'
            ? VOLUME_BANDS.map((b) => ({
                key: b,
                color: VOLUME_COLORS[b],
                label: `${t(`map.volumeBand.${b}`)} ${t(`map.volumeRange.${b}`)}`,
              }))
            : RECOVERY_BANDS.map((b) => ({
                key: b,
                color: workout.RECOVERY_COLORS[b],
                label: `${t(`recovery.band.${b}`)} ${t(`recovery.bandRange.${b}`)}`,
              }))
        }
      />
      <Text variant="footnote" color="secondary">
        {t('map.summary', {
          total: summary.totalSets,
          high: names.headFull(summary.highest.head),
          highSets: fmt.num(summary.highest.sets, 1),
          low: names.headFull(summary.lowest.head),
          lowSets: fmt.num(summary.lowest.sets, 1),
        })}
      </Text>
      <Text variant="caption" color="tertiary">
        {t('map.placeholder')}
      </Text>
    </Screen>
  );
}
