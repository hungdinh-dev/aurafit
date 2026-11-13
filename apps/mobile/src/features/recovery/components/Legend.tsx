import { StyleSheet, View } from 'react-native';

import { Text, spacing } from '@/ui';

export interface LegendItem {
  key: string;
  color: string;
  label: string;
}

/** Colour legend for maps / charts (data colours only). */
export function Legend({ items }: { items: readonly LegendItem[] }) {
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      {items.map((i) => (
        <View key={i.key} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: i.color }]} />
          <Text variant="caption" color="secondary">
            {i.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: spacing.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
