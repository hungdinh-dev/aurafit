import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, GlassSurface, ProgressBar, Text, spacing, useTheme } from '@/ui';

import { REST_STEP_SEC, adjustRest, skipRest, useRestRemaining } from '../restTimer';
import { useWorkoutStore } from '../store';
import { formatClock } from '../format';
import { useWorkoutFormat } from '../useFormat';

/** Floating rest countdown (WRK-16): ±15 s, skip; a local notification fires at zero. */
export function RestTimerCard() {
  const { t } = useTranslation('workout');
  const { colors } = useTheme();
  const fmt = useWorkoutFormat();
  const remaining = useRestRemaining();
  const rest = useWorkoutStore((s) => s.rest);
  const next = useWorkoutStore((s) => (s.rest ? s.active?.exercises[s.rest.exerciseIndex] : undefined));
  if (remaining === null || !rest) return null;
  const nextSet = next?.sets[rest.setIndex];
  const label = next && nextSet
    ? t('session.restLabel', {
        n: rest.setIndex + 1,
        kg: fmt.kg(nextSet.loadKg),
        reps: `${next.repMin}–${next.repMax}`,
      })
    : t('session.restLabelDone');
  return (
    <GlassSurface style={{ borderRadius: 26, padding: spacing.lg, gap: spacing.sm }}>
      <View className="flex-row items-center" style={{ gap: spacing.md }}>
        <Text
          variant="metricLarge"
          color={remaining === 0 ? 'tint' : 'label'}
          accessibilityRole="timer"
          accessibilityLiveRegion="polite">
          {formatClock(remaining)}
        </Text>
        <Text variant="footnote" color="secondary" style={{ flex: 1 }} numberOfLines={2}>
          {label}
        </Text>
      </View>
      <ProgressBar
        progress={rest.durationSec > 0 ? 1 - remaining / rest.durationSec : 1}
        color={colors.tint}
        accessibilityLabel={label}
      />
      <View className="flex-row" style={{ gap: spacing.sm }}>
        <Button
          title={`−${REST_STEP_SEC}`}
          accessibilityLabel={t('session.restMinus')}
          variant="gray"
          size="small"
          onPress={() => void adjustRest(-REST_STEP_SEC)}
        />
        <Button
          title={`+${REST_STEP_SEC}`}
          accessibilityLabel={t('session.restPlus')}
          variant="gray"
          size="small"
          onPress={() => void adjustRest(REST_STEP_SEC)}
        />
        <View style={{ flex: 1 }} />
        <Button title={t('session.skip')} variant="tinted" size="small" onPress={() => void skipRest()} />
      </View>
    </GlassSurface>
  );
}
