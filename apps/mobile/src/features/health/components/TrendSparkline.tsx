import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { useTheme } from '@/ui';

/** Minimal line chart: trend line (tint) + raw weigh-ins (dots). */
export function TrendSparkline({
  points,
  height = 64,
  accessibilityLabel,
}: {
  points: { trendKg: number; weightKg: number | null }[];
  height?: number;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const values = points.flatMap((p) => (p.weightKg != null ? [p.trendKg, p.weightKg] : [p.trendKg]));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.5, max - min);
  const pad = 6;
  const x = (i: number) => (points.length <= 1 ? width / 2 : pad + (i / (points.length - 1)) * (width - pad * 2));
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);

  return (
    <View onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ height }}>
      {width > 0 && points.length > 0 ? (
        <Svg width={width} height={height}>
          {points.map((p, i) =>
            p.weightKg != null ? (
              <Circle key={i} cx={x(i)} cy={y(p.weightKg)} r={2.5} fill={colors.tertiaryLabel} />
            ) : null,
          )}
          <Polyline
            points={points.map((p, i) => `${x(i)},${y(p.trendKg)}`).join(' ')}
            fill="none"
            stroke={colors.tint}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      ) : null}
    </View>
  );
}
