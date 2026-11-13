import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from './haptics';
import { Text } from './Text';
import { useTheme } from './useTheme';

export type SegmentOption<T extends string> = {
  value: T;
  /** Already-translated label. */
  label: string;
  accessibilityLabel?: string;
};

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Group label for VoiceOver (e.g. t('common:language')). */
  accessibilityLabel?: string;
  /** Segment width in pt; omit to stretch evenly. */
  segmentWidth?: number;
  style?: StyleProp<ViewStyle>;
};

/** iOS segmented control (VI/EN toggle, day/week/month…). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  segmentWidth,
  style,
}: SegmentedControlProps<T>) {
  const { colors, isDark } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: colors.fill }, segmentWidth ? styles.inline : null, style]}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="tab"
            accessibilityLabel={opt.accessibilityLabel ?? opt.label}
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) {
                haptics.selection();
                onChange(opt.value);
              }
            }}
            style={[
              styles.segment,
              segmentWidth ? { width: segmentWidth } : styles.flex,
              selected
                ? [
                    { backgroundColor: colors.fillSelected },
                    isDark ? null : styles.selectedShadow,
                  ]
                : null,
            ]}>
            <Text variant="footnote" weight="600" numberOfLines={1}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 2, borderRadius: 10 },
  inline: { alignSelf: 'flex-start' },
  flex: { flex: 1 },
  segment: {
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  selectedShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
