import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from './haptics';
import { Symbol } from './Symbol';
import { Text } from './Text';
import { MIN_TOUCH, radii, spacing } from './theme';
import { useTheme } from './useTheme';

export type StepperProps = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Format the displayed value (e.g. `(v) => t('common:units.kg', { value: v })`). Omit to hide the value. */
  format?: (value: number) => string;
  /** VoiceOver label of the control, e.g. t('workout:reps'). */
  accessibilityLabel: string;
  /** VoiceOver labels for the −/+ buttons (already translated). */
  decrementLabel: string;
  incrementLabel: string;
  style?: StyleProp<ViewStyle>;
};

/** iOS-style −/+ stepper (reps, weight, servings) with selection haptics. */
export function Stepper({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  format,
  accessibilityLabel,
  decrementLabel,
  incrementLabel,
  style,
}: StepperProps) {
  const { colors } = useTheme();
  const round = (v: number) => Math.round(v * 1000) / 1000;
  const set = (next: number) => {
    const clamped = Math.min(max, Math.max(min, round(next)));
    if (clamped !== value) {
      haptics.selection();
      onChange(clamped);
    }
  };
  const canDec = value - step >= min;
  const canInc = value + step <= max;

  return (
    <View
      style={[styles.row, style]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: format ? format(value) : String(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => set(e.nativeEvent.actionName === 'increment' ? value + step : value - step)}>
      <Pressable
        accessibilityLabel={decrementLabel}
        disabled={!canDec}
        onPress={() => set(value - step)}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: colors.fill, opacity: !canDec ? 0.35 : pressed ? 0.6 : 1 },
        ]}>
        <Symbol name="minus" size={16} weight="semibold" />
      </Pressable>
      {format ? (
        <Text variant="metric" style={styles.value} numberOfLines={1}>
          {format(value)}
        </Text>
      ) : null}
      <Pressable
        accessibilityLabel={incrementLabel}
        disabled={!canInc}
        onPress={() => set(value + step)}
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: colors.fill, opacity: !canInc ? 0.35 : pressed ? 0.6 : 1 },
        ]}>
        <Symbol name="plus" size={16} weight="semibold" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  btn: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { minWidth: 64, textAlign: 'center' },
});
