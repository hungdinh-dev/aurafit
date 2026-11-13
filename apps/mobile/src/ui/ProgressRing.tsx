import { useEffect } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { motion } from './theme';
import { useTheme } from './useTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

export type ProgressRingProps = {
  /** 0…1 (clamped). */
  progress: number;
  size?: number;
  strokeWidth?: number;
  /** Default: brand tint (the user's own progress). Use `colors.data.*` for data rings. */
  color?: string;
  trackColor?: string;
  /** Centered content, e.g. `<Text variant="metric">1.240</Text>`. */
  children?: React.ReactNode;
  /** Required for VoiceOver, e.g. t('today:kcalLeft', { count }). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Circular progress (kcal left, daily score). Animates with a short timing curve (Reduce Motion aware). */
export function ProgressRing({
  progress,
  size = 112,
  strokeWidth = 10,
  color,
  trackColor,
  children,
  accessibilityLabel,
  style,
}: ProgressRingProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withTiming(clamp01(progress), { duration: motion.duration * 2 });
  }, [progress, value]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - value.value),
  }));

  return (
    <View
      style={[{ width: size, height: size }, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp01(progress) * 100) }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor ?? colors.surfaceNested}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color ?? colors.tint}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          {children}
        </View>
      ) : null}
    </View>
  );
}
