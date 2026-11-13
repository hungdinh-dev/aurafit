import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from './haptics';
import { Symbol, type SFSymbol } from './Symbol';
import { Text } from './Text';
import { MIN_TOUCH, radii, spacing } from './theme';
import { useTheme } from './useTheme';

export type ButtonVariant = 'filled' | 'tinted' | 'gray' | 'plain' | 'inverted';
export type ButtonSize = 'large' | 'medium' | 'small';

export type ButtonProps = {
  /** Already-translated label (use `t()`). */
  title: string;
  onPress?: () => void;
  /**
   * `filled` – the ONE primary action (mint) · `tinted` – secondary (mint text on soft mint)
   * `gray` – neutral secondary · `plain` – text only · `inverted` – white/black (e.g. Google sign-in)
   */
  variant?: ButtonVariant;
  size?: ButtonSize;
  symbol?: SFSymbol;
  /** Custom leading element (overrides `symbol`). */
  leading?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  /** Stretch to container width (default true for `large`). */
  block?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const HEIGHT: Record<ButtonSize, number> = { large: 56, medium: MIN_TOUCH, small: 34 };

/** Pill-shaped button (fully rounded), light haptic on press. */
export function Button({
  title,
  onPress,
  variant = 'filled',
  size = 'large',
  symbol,
  leading,
  loading = false,
  disabled = false,
  destructive = false,
  block,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const { colors, isDark } = useTheme();
  const accent = destructive ? colors.destructive : colors.tint;

  const palette: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    filled: { bg: accent, fg: destructive ? '#FFFFFF' : colors.onTint },
    tinted: { bg: destructive ? 'rgba(255,69,58,0.16)' : colors.tintSoft, fg: accent },
    gray: { bg: colors.fill, fg: colors.label, border: isDark ? colors.glassBorder : undefined },
    plain: { bg: 'transparent', fg: accent },
    inverted: { bg: colors.label, fg: colors.background },
  };
  const { bg, fg, border } = palette[variant];
  const isBlock = block ?? size === 'large';
  const inactive = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      hitSlop={size === 'small' ? 6 : 0}
      onPress={() => {
        haptics.light();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: HEIGHT[size],
          paddingHorizontal: size === 'small' ? spacing.md : spacing.xl,
          backgroundColor: bg,
          alignSelf: isBlock ? 'stretch' : 'flex-start',
          opacity: inactive ? 0.4 : pressed ? 0.7 : 1,
        },
        border ? { borderWidth: StyleSheet.hairlineWidth, borderColor: border } : null,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {leading ??
            (symbol ? (
              <Symbol name={symbol} size={size === 'small' ? 15 : 19} color={fg} weight="semibold" />
            ) : null)}
          <Text
            variant={size === 'small' ? 'subheadline' : 'headline'}
            weight="600"
            color={fg}
            numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
