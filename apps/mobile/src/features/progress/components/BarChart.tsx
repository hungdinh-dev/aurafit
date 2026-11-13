import { StyleSheet, View } from 'react-native';

import { Text, spacing, useTheme } from '@/ui';

import type { BarChart as Chart } from '../chart';

const HEIGHT = 120;
/** Over-target colour (Progress mockup, data colour). */
const OVER_COLOR = '#FFB36B';

/** Simple vertical bar chart drawn with Views (no chart library). */
export function BarChart({ chart, accessibilityLabel }: { chart: Chart; accessibilityLabel: string }) {
  const { colors } = useTheme();
  const narrow = chart.bars.length > 10;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ gap: spacing.xs }}>
      <View style={[styles.plot, { height: HEIGHT }]}>
        {chart.targetRatio !== null ? (
          <View
            style={[
              styles.target,
              { bottom: Math.min(1, chart.targetRatio) * HEIGHT, borderColor: colors.secondaryLabel },
            ]}
          />
        ) : null}
        {chart.bars.map((b) => (
          <View key={b.key} style={[styles.col, { marginHorizontal: narrow ? 1.5 : 4 }]}>
            <View
              style={{
                height: Math.max(3, b.ratio * HEIGHT),
                borderRadius: 4,
                backgroundColor: b.ratio === 0 ? colors.fill : b.over ? OVER_COLOR : colors.tint,
              }}
            />
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {chart.bars.map((b, i) => (
          <View key={b.key} style={[styles.col, { marginHorizontal: narrow ? 1.5 : 4 }]}>
            {!narrow || i % 2 === 0 ? (
              <Text variant="caption" color="secondary" align="center" numberOfLines={1}>
                {b.label}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', alignItems: 'flex-end' },
  col: { flex: 1, justifyContent: 'flex-end' },
  labels: { flexDirection: 'row' },
  target: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed' },
});
