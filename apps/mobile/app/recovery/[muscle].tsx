import { workout } from '@aurafit/core';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { MuscleMap, type MuscleMapValue } from '@/features/recovery/components/MuscleMap';
import { useRecovery } from '@/features/recovery/useRecovery';
import { useCatalogNames } from '@/features/workout/catalog';
import { EmptyCard, PushedHeader } from '@/features/workout/components/common';
import { formatDateTime } from '@/features/workout/format';
import { useWorkoutFormat } from '@/features/workout/useFormat';
import { Card, GroupedList, ListRow, ProgressRing, Screen, Text, spacing } from '@/ui';

const isMuscle = (v: unknown): v is workout.MuscleCode =>
  typeof v === 'string' && (workout.MUSCLE_CODES as readonly string[]).includes(v);

/** Chi tiết phục hồi – RecoveryDetail mockup: heads of one muscle + "Vì sao?" history (WRK-11). */
export default function RecoveryDetailScreen() {
  const params = useLocalSearchParams<{ muscle: string; head?: string }>();
  const { t } = useTranslation('workout');
  const names = useCatalogNames();
  const fmt = useWorkoutFormat();
  const recovery = useRecovery();
  const muscle = isMuscle(params.muscle) ? params.muscle : null;
  const heads = muscle ? workout.MUSCLE_HEADS_BY_MUSCLE[muscle] : [];
  const initial =
    heads.find((h) => h === params.head) ??
    (muscle ? recovery.muscles[muscle].worstHead : undefined) ??
    heads[0] ??
    null;
  const [selected, setSelected] = useState<workout.MuscleHeadCode | null>(initial);

  const reasons = useMemo(
    () => (selected ? workout.explainHead(selected, recovery.sets, recovery.nowIso).slice(0, 5) : []),
    [selected, recovery.sets, recovery.nowIso]
  );

  if (!muscle || !selected) {
    return (
      <Screen title={t('recovery.title')}>
        <PushedHeader />
        <EmptyCard symbol="questionmark.circle" body={t('state.error')} />
      </Screen>
    );
  }

  const region = recovery.muscles[muscle];
  const head = recovery.heads[selected];
  const values: Partial<Record<workout.MuscleHeadCode, MuscleMapValue>> = {};
  for (const h of heads) {
    values[h] = { percent: recovery.heads[h].recoveryPct, color: workout.RECOVERY_COLORS[recovery.heads[h].band] };
  }
  const headName = heads.length > 1 ? names.head(selected) : names.muscle(muscle);

  return (
    <Screen title={names.muscle(muscle)}>
      <PushedHeader />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <ProgressRing
          progress={region.recoveryPct / 100}
          size={88}
          color={workout.RECOVERY_COLORS[region.band]}
          accessibilityLabel={t('recovery.pct', { value: Math.round(region.recoveryPct) })}>
          <Text variant="metric">{t('recovery.pct', { value: Math.round(region.recoveryPct) })}</Text>
        </ProgressRing>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="headline">{t(`recovery.band.${region.band}`)}</Text>
          <Text variant="footnote" color="secondary">
            {region.hoursUntilReady > 0
              ? t('recovery.detailEta', { hours: fmt.num(region.hoursUntilReady, 0) })
              : t('recovery.detailReady')}
          </Text>
        </View>
      </Card>

      <MuscleMap
        view={workout.MUSCLES[muscle].view === 'back' ? 'back' : 'front'}
        muscles={[muscle]}
        values={values}
        selected={selected}
        onPressHead={setSelected}
      />

      <GroupedList>
        {heads.map((h) => {
          const r = recovery.heads[h];
          return (
            <ListRow
              key={h}
              title={heads.length > 1 ? names.head(h) : names.muscle(muscle)}
              subtitle={r.hoursUntilReady > 0 ? t('recovery.remaining', { hours: fmt.num(r.hoursUntilReady, 0) }) : t('recovery.readyNow')}
              value={t('recovery.pct', { value: Math.round(r.recoveryPct) })}
              icon={h === selected ? 'largecircle.fill.circle' : 'circle.fill'}
              iconColor={workout.RECOVERY_COLORS[r.band]}
              onPress={() => setSelected(h)}
            />
          );
        })}
      </GroupedList>

      <GroupedList
        header={t('recovery.why', { name: headName.toLowerCase() })}
        footer={reasons.length ? undefined : t('recovery.whyEmpty')}>
        {reasons.map((r) => {
          const load =
            r.minLoadKg === null
              ? t('session.bodyweight')
              : r.minLoadKg === r.maxLoadKg
                ? fmt.kg(r.minLoadKg)
                : `${fmt.num(r.minLoadKg)}–${fmt.kg(r.maxLoadKg)}`;
          const reps = r.minReps === null ? '' : r.minReps === r.maxReps ? ` × ${r.minReps}` : ` × ${r.minReps}–${r.maxReps}`;
          return (
            <ListRow
              key={`${r.sessionId ?? r.firstSetAt}-${r.exerciseSlug}`}
              title={names.exercise(r.exerciseSlug)}
              subtitle={`${formatDateTime(r.firstSetAt, fmt.language)} · ${t('recovery.whyRow', { sets: r.sets, load: load + reps })}`}
              value={t('recovery.added', { value: r.addedFatigue })}
            />
          );
        })}
      </GroupedList>

      <Card level="nested">
        <Text variant="footnote" color="secondary">
          {t(`recovery.tips.${head.band}`)}
        </Text>
      </Card>
    </Screen>
  );
}
