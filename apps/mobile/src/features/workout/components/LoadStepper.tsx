import { workout } from '@aurafit/core';
import { Pressable, StyleSheet, View } from 'react-native';

import { MIN_TOUCH, Symbol, Text, haptics, radii, spacing, useTheme } from '@/ui';

export interface LoadStepperProps {
  value: number;
  onChange: (next: number) => void;
  /** Load spec of the exercise in this gym – steps follow the real plates / stack / rack (WRK-18). */
  spec: workout.LoadSpec;
  format: (value: number) => string;
  accessibilityLabel: string;
  decrementLabel: string;
  incrementLabel: string;
}

/** −/+ load control that jumps between loads that really exist in the user's gym. */
export function LoadStepper({ value, onChange, spec, format, accessibilityLabel, decrementLabel, incrementLabel }: LoadStepperProps) {
  const { colors } = useTheme();
  const down = workout.stepLoad(value, spec, -1);
  const up = workout.stepLoad(value, spec, 1);
  const canDec = down !== null && down < value;
  const canInc = up !== null && up > value;
  const go = (next: number | null) => {
    if (next === null || next === value) return;
    haptics.selection();
    onChange(next);
  };
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: format(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => go(e.nativeEvent.actionName === 'increment' ? up : down)}>
      <Pressable
        accessibilityLabel={decrementLabel}
        disabled={!canDec}
        onPress={() => go(down)}
        style={({ pressed }) => [styles.btn, { backgroundColor: colors.fill, opacity: !canDec ? 0.35 : pressed ? 0.6 : 1 }]}>
        <Symbol name="minus" size={18} weight="semibold" />
      </Pressable>
      <Text variant="metricLarge" style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {format(value)}
      </Text>
      <Pressable
        accessibilityLabel={incrementLabel}
        disabled={!canInc}
        onPress={() => go(up)}
        style={({ pressed }) => [styles.btn, { backgroundColor: colors.fill, opacity: !canInc ? 0.35 : pressed ? 0.6 : 1 }]}>
        <Symbol name="plus" size={18} weight="semibold" />
      </Pressable>
    </View>
  );
}

/** Size of the next step up from `value` (shown as "bước 2,5 kg"). */
export function stepSize(value: number, spec: workout.LoadSpec): number | null {
  const up = workout.stepLoad(value, spec, 1);
  if (up !== null && up > value) return Math.round((up - value) * 100) / 100;
  const down = workout.stepLoad(value, spec, -1);
  return down !== null && down < value ? Math.round((value - down) * 100) / 100 : null;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  btn: { width: MIN_TOUCH + 12, height: MIN_TOUCH + 12, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  value: { flex: 1, textAlign: 'center' },
});
