import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { REACTIONS, useFriendStory, useReact, type Reaction } from '@/features/friends/api';
import { ErrorCard, EmptyCard, LoadingCard, PushedHeader } from '@/features/workout/components/common';
import { formatNumber, localeOf } from '@/features/workout/format';
import { useLanguage } from '@/i18n';
import { Card, Chip, GlassButton, ProgressBar, Screen, Text, haptics, spacing, useTheme, type SFSymbol } from '@/ui';

const REACTION_SYMBOL: Record<Reaction, SFSymbol> = {
  fire: 'flame.fill',
  clap: 'hands.clap.fill',
  heart: 'heart.fill',
  drool: 'fork.knife',
  strong: 'dumbbell.fill',
};
const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

/** Story bữa ăn – StoryView mockup: a friend's meals shared today + reactions (FRD-02). */
export default function StoryScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();
  const { t } = useTranslation('friends');
  const { colors } = useTheme();
  const [language] = useLanguage();
  const story = useFriendStory(userId);
  const react = useReact();
  const [index, setIndex] = useState(0);
  const meals = story.data ?? [];
  const meal = meals[Math.min(index, Math.max(0, meals.length - 1))];
  const friendName = name ?? '—';

  return (
    <Screen title={friendName} eyebrow={t('story.title')}>
      <PushedHeader />
      {story.isLoading ? <LoadingCard /> : null}
      {story.isError ? <ErrorCard message={t('error')} onRetry={() => void story.refetch()} /> : null}
      {!story.isLoading && !story.isError && meals.length === 0 ? (
        <EmptyCard symbol="fork.knife" body={t('story.empty', { name: friendName })} />
      ) : null}

      {meal ? (
        <>
          <View className="flex-row" style={{ gap: 4 }}>
            {meals.map((m, i) => (
              <View key={m.id} style={{ flex: 1 }}>
                <ProgressBar progress={i <= index ? 1 : 0} color={colors.tint} accessibilityLabel={t('story.position', { index: index + 1, total: meals.length })} />
              </View>
            ))}
          </View>
          <Card style={{ gap: spacing.md, minHeight: 220, justifyContent: 'flex-end' }}>
            <Text variant="footnote" color="secondary">
              {(SLOTS as readonly string[]).includes(meal.slot) ? t(`story.slot.${meal.slot as 'lunch'}`) : meal.slot} ·{' '}
              {new Intl.DateTimeFormat(localeOf(language), { hour: '2-digit', minute: '2-digit' }).format(new Date(meal.eatenAt))}
            </Text>
            {meal.items.length ? (
              <Text variant="title">{meal.items.join(' + ')}</Text>
            ) : (
              <Text variant="subheadline" color="secondary">
                {t('story.itemsHidden')}
              </Text>
            )}
            {meal.kcal !== null ? (
              <Text variant="subheadline" color="secondary">
                {t('story.nutrition', {
                  kcal: formatNumber(meal.kcal, language, 0),
                  protein: formatNumber(meal.proteinG ?? 0, language, 0),
                })}
              </Text>
            ) : null}
          </Card>
          <View className="flex-row items-center justify-between">
            <GlassButton
              symbol="chevron.left"
              accessibilityLabel={t('story.prev')}
              onPress={() => setIndex(Math.max(0, index - 1))}
            />
            <Text variant="footnote" color="secondary">
              {t('story.position', { index: index + 1, total: meals.length })}
            </Text>
            <GlassButton
              symbol="chevron.right"
              accessibilityLabel={t('story.next')}
              onPress={() => setIndex(Math.min(meals.length - 1, index + 1))}
            />
          </View>
          <View className="flex-row flex-wrap" style={{ gap: spacing.sm }}>
            {REACTIONS.map((r) => (
              <Chip
                key={r}
                label={t(`story.reaction.${r}`)}
                symbol={REACTION_SYMBOL[r]}
                selected={meal.myReaction === r}
                onPress={() => {
                  haptics.light();
                  react.mutate({ mealId: meal.id, reaction: r }, { onError: () => haptics.error() });
                }}
              />
            ))}
          </View>
          {react.isError ? (
            <Text variant="footnote" color="destructive">
              {t('story.reactError')}
            </Text>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
