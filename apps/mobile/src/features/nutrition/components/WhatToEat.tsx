import { nutrition } from '@aurafit/core';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useFormat } from '@/features/coach/lib/format';
import { Button, Symbol, Text, haptics, spacing, useTheme, MIN_TOUCH } from '@/ui';

import { useLogSuggestion, type SavedFood } from '../api';
import type { MealSlot } from '../analysis';

/** Picks the best "Ăn gì bây giờ?" suggestion from the user's library (NUT-10, on device). */
export function useSuggestion(input: {
  remaining: nutrition.Nutrients | null;
  foods: readonly SavedFood[] | undefined;
  slot: MealSlot;
}) {
  return useMemo(() => {
    if (!input.remaining) return { status: 'no_targets' as const, best: null };
    const res = nutrition.suggestFoods({
      remaining: { kcal: input.remaining.kcal, protein_g: input.remaining.protein_g },
      foods: (input.foods ?? []).map((f) => ({
        ...f,
        kind: f.kind === 'combo' ? ('combo' as const) : ('item' as const),
        usual_slot: f.usual_slot as MealSlot | null,
      })),
      slot: input.slot,
      limit: 1,
    });
    return { status: res.status, best: res.suggestions[0] ?? null };
  }, [input.remaining, input.foods, input.slot]);
}

export function suggestionName(
  s: nutrition.Suggestion,
  foods: readonly SavedFood[],
  portionLabel: (p: number) => string,
): string {
  return s.parts
    .map((p) => {
      const food = foods.find((f) => f.id === p.foodId);
      const name = food?.name ?? '';
      return p.portion === 1 ? name : `${portionLabel(p.portion)} ${name}`;
    })
    .join(' + ');
}

/** Collapsible "Ăn gì bây giờ?" row for the Today nutrition card. */
export function WhatToEat({
  remaining,
  foods,
  slot,
  canLog,
}: {
  remaining: nutrition.Nutrients | null;
  foods: SavedFood[] | undefined;
  slot: MealSlot;
  canLog: boolean;
}) {
  const { t } = useTranslation('today');
  const { colors } = useTheme();
  const f = useFormat();
  const [open, setOpen] = useState(false);
  const { status, best } = useSuggestion({ remaining, foods, slot });
  const log = useLogSuggestion();

  const name = best ? suggestionName(best, foods ?? [], (p) => `×${f.num(p, 1)}`) : '';
  const message =
    status === 'no_targets'
      ? t('suggest.noTargets')
      : status === 'no_budget'
        ? t('suggest.noBudget')
        : status === 'no_foods'
          ? t('suggest.noFoods')
          : status === 'no_match'
            ? t('suggest.noMatch')
            : null;

  return (
    <View style={[styles.wrap, { borderTopColor: colors.separator }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => {
          haptics.selection();
          setOpen((v) => !v);
        }}
        style={({ pressed }) => [styles.header, { opacity: pressed ? 0.6 : 1 }]}>
        <Symbol name="sparkles" size={18} color="tint" weight="semibold" />
        <Text variant="body" color="tint" weight="600" style={styles.flex}>
          {t('whatToEat')}
        </Text>
        <Symbol name={open ? 'chevron.up' : 'chevron.down'} size={13} color="tertiary" weight="semibold" />
      </Pressable>
      {open ? (
        <View style={styles.body}>
          {best ? (
            <>
              <Text variant="footnote" color="secondary">
                {t('suggest.title')}
              </Text>
              <Text variant="headline">{name}</Text>
              <Text variant="subheadline" color="secondary">
                {t('suggest.summary', { kcal: f.num(best.totals.kcal), protein: f.num(best.totals.protein_g) })}
              </Text>
              {canLog ? (
                <Button
                  title={t('suggest.log')}
                  accessibilityLabel={t('suggest.logA11y', { name })}
                  variant="tinted"
                  size="medium"
                  symbol="plus"
                  loading={log.isPending}
                  onPress={() => {
                    const parts = best.parts.flatMap((p) => {
                      const food = (foods ?? []).find((x) => x.id === p.foodId);
                      return food ? [{ food, portion: p.portion, nutrients: p.nutrients }] : [];
                    });
                    log.mutate(
                      { parts, slot },
                      {
                        onSuccess: () => {
                          haptics.success();
                          setOpen(false);
                        },
                        onError: () => haptics.error(),
                      },
                    );
                  }}
                />
              ) : null}
            </>
          ) : (
            <Text variant="subheadline" color="secondary">
              {message}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: StyleSheet.hairlineWidth },
  header: {
    minHeight: MIN_TOUCH + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  flex: { flex: 1 },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.xs + 2 },
});
