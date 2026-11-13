import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { hasLiquidGlass as HAS_LIQUID_GLASS } from './glass';
import { haptics } from './haptics';
import { Symbol, type SFSymbol } from './Symbol';
import { Text } from './Text';
import { MIN_TOUCH, radii, spacing } from './theme';
import { useTheme } from './useTheme';

export type GlassSurfaceProps = {
  /** Tint the glass (e.g. brand mint for the capture button). */
  tintColor?: string;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/**
 * Control-layer glass surface: Liquid Glass on iOS 26+, expo-blur material on older iOS,
 * translucent fill elsewhere. Use ONLY for floating controls / toolbars – never for content cards.
 */
export function GlassSurface({ tintColor, interactive = false, style, children }: GlassSurfaceProps) {
  const { colors, isDark } = useTheme();
  if (HAS_LIQUID_GLASS) {
    return (
      <GlassView glassEffectStyle="regular" tintColor={tintColor} isInteractive={interactive} style={style}>
        {children}
      </GlassView>
    );
  }
  const border = { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.glassBorder };
  if (Platform.OS === 'ios' && !tintColor) {
    return (
      <BlurView
        tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        intensity={80}
        style={[style, border, styles.clip]}>
        {children}
      </BlurView>
    );
  }
  return (
    <View style={[style, border, styles.clip, { backgroundColor: tintColor ?? colors.glassFallback }]}>
      {children}
    </View>
  );
}

export type GlassButtonProps = {
  /** Required: VoiceOver label (already translated). */
  accessibilityLabel: string;
  onPress?: () => void;
  symbol?: SFSymbol;
  /** Optional short text (renders a pill instead of a circle). */
  label?: string;
  /** Brand-tinted glass for the ONE prominent floating action (e.g. capture). */
  prominent?: boolean;
  /** Diameter / height in pt (default 44, HIG minimum). */
  size?: number;
  /** Symbol/text color override. */
  color?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Round (or pill) floating glass button – header actions (streak, settings) and the capture FAB. */
export function GlassButton({
  accessibilityLabel,
  onPress,
  symbol,
  label,
  prominent = false,
  size = MIN_TOUCH,
  color,
  accessibilityHint,
  style,
  testID,
}: GlassButtonProps) {
  const { colors } = useTheme();
  const fg = color ?? (prominent ? colors.onTint : colors.label);
  const shape: ViewStyle = label
    ? { height: size, borderRadius: radii.pill, paddingHorizontal: spacing.md }
    : { width: size, height: size, borderRadius: size / 2 };

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={() => {
        haptics.light();
        onPress?.();
      }}
      style={({ pressed }) => [{ opacity: pressed && !HAS_LIQUID_GLASS ? 0.75 : 1 }, style]}>
      <GlassSurface
        tintColor={prominent ? colors.tint : undefined}
        interactive
        style={[shape, styles.center, prominent ? styles.prominentShadow : null]}>
        <View style={styles.content}>
          {symbol ? <Symbol name={symbol} size={Math.round(size * 0.42)} color={fg} weight="semibold" /> : null}
          {label ? (
            <Text variant="subheadline" weight="600" color={fg}>
              {label}
            </Text>
          ) : null}
        </View>
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  prominentShadow: {
    shadowColor: '#4BE3A7',
    shadowOpacity: 0.28,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 10 },
  },
});
