import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from './haptics';
import { Symbol, type SFSymbol } from './Symbol';
import { Text } from './Text';
import { radii, spacing } from './theme';
import { useTheme } from './useTheme';

export type ChipProps = {
  /** Already-translated label. */
  label: string;
  selected?: boolean;
  onPress?: () => void;
  symbol?: SFSymbol;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Small pill for filters / quick answers (clarifying questions, muscle groups…). */
export function Chip({ label, selected = false, onPress, symbol, disabled, style, testID }: ChipProps) {
  const { colors } = useTheme();
  const fg = selected ? colors.tint : colors.label;
  return (
    <Pressable
      testID={testID}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled || !onPress}
      hitSlop={6}
      onPress={() => {
        haptics.selection();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.tintSoft : colors.fill,
          borderColor: selected ? colors.tint : 'transparent',
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
        style,
      ]}>
      {symbol ? <Symbol name={symbol} size={14} color={fg} weight="semibold" /> : null}
      <Text variant="subheadline" weight="500" color={fg} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    minHeight: 34,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
});
