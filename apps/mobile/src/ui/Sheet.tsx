import type { NativeStackNavigationOptions } from 'expo-router';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './Text';
import { hasLiquidGlass } from './glass';
import { radii, spacing } from './theme';

export type SheetOptionsInput = {
  /** Heights as fractions of the screen, ascending (e.g. [0.5, 1]); or 'fitToContents'. */
  detents?: number[] | 'fitToContents';
  /** Show the grabber handle (default true). */
  grabber?: boolean;
  /** Start at this detent index (default 0). */
  initialDetent?: number;
  /** Sheet background where Liquid Glass is unavailable (pass `useTheme().colors.surface`). */
  backgroundColor?: string;
};

/**
 * Native iOS sheet presentation for a route (expo-router `formSheet`).
 * Usage in a layout:  `<Stack.Screen name="food/add" options={sheetOptions({ detents: [0.6, 1] })} />`
 * The sheet itself is drawn by iOS (Liquid Glass on iOS 26). Put content in `<SheetContent>`.
 */
export function sheetOptions({
  detents = [0.6, 1],
  grabber = true,
  initialDetent = 0,
  backgroundColor = '#1C1C1E',
}: SheetOptionsInput = {}): NativeStackNavigationOptions {
  return {
    presentation: 'formSheet',
    headerShown: false,
    sheetAllowedDetents: detents,
    sheetInitialDetentIndex: initialDetent,
    sheetGrabberVisible: grabber,
    sheetCornerRadius: radii.group,
    // iOS 26 draws a glass sheet: keep content transparent so the system material shows.
    contentStyle: { backgroundColor: hasLiquidGlass ? 'transparent' : backgroundColor },
  };
}

export type SheetContentProps = {
  /** Sheet title (Title 2), already translated. */
  title?: string;
  /** Right side of the title row (e.g. a close GlassButton). */
  headerRight?: React.ReactNode;
  /** Wrap children in a ScrollView (default true). */
  scroll?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Padding + title layout for content presented with `sheetOptions()`. */
export function SheetContent({ title, headerRight, scroll = true, children, style }: SheetContentProps) {
  const insets = useSafeAreaInsets();
  const header = title ? (
    <View style={styles.header}>
      <Text variant="title" accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {headerRight}
    </View>
  ) : null;

  if (!scroll) {
    return (
      <View style={[styles.body, { paddingBottom: insets.bottom + spacing.lg }, style]}>
        {header}
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.lg }, style]}
      keyboardShouldPersistTaps="handled">
      {header}
      {children}
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  body: { paddingHorizontal: spacing.gutter, paddingTop: spacing.xl, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { flex: 1 },
});
