import { Children, Fragment, isValidElement } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from './haptics';
import { Symbol, type SFSymbol } from './Symbol';
import { Text } from './Text';
import { MIN_TOUCH, radii, spacing } from './theme';
import { useTheme } from './useTheme';

export type GroupedListProps = {
  /** Section header (already translated). */
  header?: string;
  /** Section footer / explanation (already translated). */
  footer?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

const ICON_TILE = 30;
/** Separator inset when a row has an icon tile: 16 + 30 + 12. */
const ICON_INSET = spacing.lg + ICON_TILE + spacing.md;

/** iOS inset-grouped list section. Children are usually `<ListRow>`; hairline separators are inserted. */
export function GroupedList({ header, footer, children, style }: GroupedListProps) {
  const { colors } = useTheme();
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[styles.section, style]}>
      {header ? (
        <Text variant="footnote" color="secondary" style={styles.caption} accessibilityRole="header">
          {header}
        </Text>
      ) : null}
      <View style={[styles.group, { backgroundColor: colors.surface }]}>
        {rows.map((row, i) => {
          const hasIcon = !!(row.props as Partial<ListRowProps>).icon;
          return (
            <Fragment key={row.key ?? i}>
              {i > 0 ? (
                <View
                  style={{
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: colors.separator,
                    marginLeft: hasIcon ? ICON_INSET : spacing.lg,
                  }}
                />
              ) : null}
              {row}
            </Fragment>
          );
        })}
      </View>
      {footer ? (
        <Text variant="footnote" color="secondary" style={styles.caption}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

export type ListRowProps = {
  title: string;
  subtitle?: string;
  /** Right-aligned secondary value, e.g. "1,2 / 2,6 L". */
  value?: string;
  /** SF Symbol shown in a colored rounded tile (Settings style). */
  icon?: SFSymbol;
  /** Tile color – use `colors.icon.*` from `useTheme()`. */
  iconColor?: string;
  /** Custom right element (Switch, Button, Stepper…). */
  trailing?: React.ReactNode;
  /** Show a chevron (defaults to true when `onPress` is set and there is no `trailing`). */
  chevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

/** A row inside `<GroupedList>` (≥ 52 pt, 60 with subtitle). */
export function ListRow({
  title,
  subtitle,
  value,
  icon,
  iconColor,
  trailing,
  chevron,
  onPress,
  destructive,
  disabled,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ListRowProps) {
  const { colors } = useTheme();
  const showChevron = chevron ?? (!!onPress && !trailing);

  const content = (
    <View style={[styles.row, { minHeight: subtitle ? 60 : MIN_TOUCH + 8 }]}>
      {icon ? (
        <View style={[styles.tile, { backgroundColor: iconColor ?? colors.icon.gray }]}>
          <Symbol name={icon} size={17} color="#FFFFFF" weight="semibold" />
        </View>
      ) : null}
      <View style={styles.texts}>
        <Text variant="body" color={destructive ? 'destructive' : 'label'} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="footnote" color="secondary" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="subheadline" color="secondary" numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {trailing}
      {showChevron ? <Symbol name="chevron.right" size={13} color="tertiary" weight="semibold" /> : null}
    </View>
  );

  if (!onPress) {
    return (
      <View testID={testID} accessible={!trailing} accessibilityLabel={accessibilityLabel}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? [title, value].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.selection();
        onPress();
      }}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.surfaceNested : 'transparent',
        opacity: disabled ? 0.4 : 1,
      })}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  caption: { paddingHorizontal: spacing.lg },
  group: { borderRadius: radii.group, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tile: {
    width: ICON_TILE,
    height: ICON_TILE,
    borderRadius: radii.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
});
