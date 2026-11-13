import { Platform, ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './Text';
import { spacing } from './theme';
import { useTheme } from './useTheme';

export type ScreenProps = {
  /** Large title (34 Bold), already translated. Omit for screens without a title. */
  title?: string;
  /** Small line above the title (e.g. the date: "Thứ Sáu, 13 tháng 11"). */
  eyebrow?: string;
  /** Glass buttons on the right of the header row (streak, shields, settings…). */
  headerRight?: React.ReactNode;
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean;
  /** Gap between direct children (default 20). */
  gap?: number;
  /** Extra bottom space, e.g. to clear the floating capture button on tab screens. */
  bottomInset?: number;
  children?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Forwarded to the ScrollView (refreshControl, keyboardShouldPersistTaps…). */
  scrollProps?: Omit<ScrollViewProps, 'children' | 'contentContainerStyle'>;
  testID?: string;
};

/**
 * Screen container: grouped background, safe area, 16-pt gutters and an HIG large-title header.
 * On iOS the ScrollView uses automatic content insets, so it clears the status bar and the
 * native (Liquid Glass) tab bar by itself.
 */
export function Screen({
  title,
  eyebrow,
  headerRight,
  scroll = true,
  gap = 20,
  bottomInset = 0,
  children,
  contentStyle,
  scrollProps,
  testID,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const autoInsets = scroll && Platform.OS === 'ios';

  const header =
    title || headerRight ? (
      <View style={styles.header}>
        {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
        {title ? (
          <View style={styles.titleBlock}>
            {eyebrow ? (
              <Text variant="footnote" color="secondary">
                {eyebrow}
              </Text>
            ) : null}
            <Text variant="largeTitle" accessibilityRole="header">
              {title}
            </Text>
          </View>
        ) : null}
      </View>
    ) : null;

  const padding: ViewStyle = {
    paddingHorizontal: spacing.gutter,
    paddingTop: autoInsets ? spacing.md : insets.top + spacing.md,
    paddingBottom: (autoInsets ? spacing.xl : insets.bottom + spacing.xl) + bottomInset,
    gap,
  };

  if (!scroll) {
    return (
      <View testID={testID} style={[styles.fill, { backgroundColor: colors.background }, padding, contentStyle]}>
        {header}
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      testID={testID}
      style={[styles.fill, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode="interactive"
      keyboardShouldPersistTaps="handled"
      {...scrollProps}
      contentContainerStyle={[padding, contentStyle]}>
      {header}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: { gap: spacing.xs },
  headerRight: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  titleBlock: { gap: 2 },
});
