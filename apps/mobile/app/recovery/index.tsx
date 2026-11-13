import { workout } from '@aurafit/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Legend } from '@/features/recovery/components/Legend';
import { MuscleMap, type MuscleMapValue, type MuscleMapView } from '@/features/recovery/components/MuscleMap';
import { useRecovery } from '@/features/recovery/useRecovery';
import { useCanSync } from '@/features/workout/api';
import { useCatalogNames } from '@/features/workout/catalog';
import { ErrorCard, LoadingCard, PreviewNote, PushedHeader } from '@/features/workout/components/common';
import { useWorkoutFormat } from '@/features/workout/useFormat';
import { GroupedList, ListRow, Screen, SegmentedControl, Text, useTheme } from '@/ui';

const BANDS: readonly workout.RecoveryBand[] = ['heavy', 'moderate', 'light', 'ready'];

/** Phục hồi – Recovery mockup: front/back map, ready groups, most fatigued muscles (WRK-10). */
export default function RecoveryScreen() {
  const { t } = useTranslation('workout');
  const { colors } = useTheme();
  const names = useCatalogNames();
  const fmt = useWorkoutFormat();
  const canSync = useCanSync();
  const [view, setView] = useState<MuscleMapView>('front');
  const recovery = useRecovery();

  const values: Partial<Record<workout.MuscleHeadCode, MuscleMapValue>> = {};
  for (const code of workout.MUSCLE_HEAD_CODES) {
    const h = recovery.heads[code];
    values[code] = { percent: h.recoveryPct, color: workout.RECOVERY_COLORS[h.band] };
  }
  const tired = recovery.mostFatigued.filter((m) => m.band !== 'ready').slice(0, 5);
  const ready = recovery.readyGroups.map((g) => names.group(g));

  return (
    <Screen
      title={t('recovery.title')}
      eyebrow={ready.length ? t('recovery.readyToday', { groups: ready.join(' · ') }) : t('recovery.noneReady')}>
      <PushedHeader />
      {!canSync ? <PreviewNote /> : null}
      {recovery.isLoading ? <LoadingCard /> : null}
      {recovery.isError ? <ErrorCard onRetry={recovery.refetch} /> : null}

      <SegmentedControl
        accessibilityLabel={t('recovery.view')}
        options={[
          { value: 'front', label: t('recovery.front') },
          { value: 'back', label: t('recovery.back') },
        ]}
        value={view}
        onChange={setView}
      />
      <MuscleMap
        view={view}
        values={values}
        headAccessibilityLabel={(code, v) =>
          t('recovery.headA11y', {
            name: names.headFull(code),
            pct: Math.round(v?.percent ?? 100),
            band: t(`recovery.band.${recovery.heads[code].band}`),
          })
        }
        onPressHead={(code) =>
          router.push({ pathname: '/recovery/[muscle]', params: { muscle: workout.muscleOfHead(code), head: code } })
        }
      />
      <Legend
        items={BANDS.map((b) => ({
          key: b,
          color: workout.RECOVERY_COLORS[b],
          label: `${t(`recovery.band.${b}`)} ${t(`recovery.bandRange.${b}`)}`,
        }))}
      />
      <Text variant="footnote" color="secondary">
        {t('recovery.hint')}
      </Text>

      <GroupedList header={t('recovery.mostTired')} footer={tired.length ? undefined : t('recovery.allReady')}>
        {tired.map((m) => (
          <ListRow
            key={m.muscle}
            title={names.muscle(m.muscle)}
            subtitle={t('recovery.remaining', { hours: fmt.num(m.hoursUntilReady, 0) })}
            value={t('recovery.pct', { value: Math.round(m.recoveryPct) })}
            icon="circle.fill"
            iconColor={workout.RECOVERY_COLORS[m.band]}
            onPress={() => router.push({ pathname: '/recovery/[muscle]', params: { muscle: m.muscle } })}
          />
        ))}
      </GroupedList>

      <GroupedList>
        <ListRow
          icon="figure.arms.open"
          iconColor={colors.icon.indigo}
          title={t('recovery.map')}
          onPress={() => router.push('/recovery/map')}
        />
        <ListRow
          icon="chart.bar.fill"
          iconColor={colors.icon.teal}
          title={t('recovery.volumeZones')}
          onPress={() => router.push('/recovery/volume')}
        />
      </GroupedList>

      <Text variant="caption" color="tertiary">
        {t('recovery.disclaimer')}
      </Text>
    </Screen>
  );
}
