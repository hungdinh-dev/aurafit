import { coach } from '@aurafit/core';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { CAPTURE_BUTTON_CLEARANCE } from '@/features/capture/CaptureButton';
import { useFriends } from '@/features/friends/api';
import { useCoachState, useDisplayName, useHardStats, useWeeklyBoss } from '@/features/progress/api';
import { todayLocal, useCanSync } from '@/features/workout/api';
import { PreviewNote } from '@/features/workout/components/common';
import { formatNumber } from '@/features/workout/format';
import { useLanguage } from '@/i18n';
import {
  Card,
  GlassButton,
  GroupedList,
  ListRow,
  ProgressBar,
  ProgressRing,
  Screen,
  Text,
  spacing,
  useTheme,
  type SFSymbol,
} from '@/ui';

/** Aura tier colours (Profile mockup – data colours of the character aura). */
const TIER_COLORS: Readonly<Record<coach.AuraTier, string>> = {
  gray: '#8E8E93',
  green: '#4BE3A7',
  blue: '#5AB0FF',
  purple: '#8F84FF',
  gold: '#FFD27A',
  red: '#FF7A59',
};

/** Routes owned by other modules (typed loosely so this tab compiles before they exist). */
const ROUTES = {
  settings: '/settings' as Href,
  tasks: '/tasks' as Href,
  health: '/health/log' as Href,
  quests: '/coach/quests' as Href,
};

/** Tôi – Profile mockup: level / XP / Aura, 30-day stats, weekly boss, links. */
export default function MeScreen() {
  const { t } = useTranslation(['progress', 'common']);
  const { colors } = useTheme();
  const [language] = useLanguage();
  const canSync = useCanSync();
  const today = todayLocal();
  const state = useCoachState();
  const stats = useHardStats();
  const boss = useWeeklyBoss(today);
  const name = useDisplayName();
  const friends = useFriends();

  const xp = Number(state.data?.xp ?? 0);
  const lp = coach.levelProgress(xp);
  const aura = Number(state.data?.aura_score ?? 0);
  const tier = (state.data?.aura_tier ?? coach.auraTierFor(aura)) as coach.AuraTier;
  const tierIndex = coach.AURA_TIER_ORDER.indexOf(tier);
  const nextTier = [...coach.AURA_TIERS].sort((a, b) => a.min - b.min).find((x) => x.min > aura);
  const friendCount = friends.data?.friends.length ?? 0;

  const links: { key: string; title: string; icon: SFSymbol; color: string; value?: string; href: Href }[] = [
    { key: 'progress', title: t('me.links.progress'), icon: 'chart.xyaxis.line', color: colors.icon.mint, href: '/progress' },
    {
      key: 'friends',
      title: t('me.links.friends'),
      icon: 'person.2.fill',
      color: colors.icon.pink,
      value: canSync ? t('me.friendsValue', { count: friendCount }) : undefined,
      href: '/friends',
    },
    { key: 'quests', title: t('me.links.quests'), icon: 'checklist', color: colors.icon.orange, href: ROUTES.quests },
    { key: 'tasks', title: t('me.links.tasks'), icon: 'leaf.fill', color: colors.icon.green, href: ROUTES.tasks },
    { key: 'health', title: t('me.links.health'), icon: 'heart.text.square.fill', color: colors.icon.red, href: ROUTES.health },
  ];

  return (
    <Screen
      title={t('me.title')}
      bottomInset={CAPTURE_BUTTON_CLEARANCE}
      headerRight={
        <GlassButton
          symbol="gearshape.fill"
          accessibilityLabel={t('me.links.settings')}
          onPress={() => router.push(ROUTES.settings)}
        />
      }>
      {!canSync ? <PreviewNote text={t('me.preview')} /> : null}

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <ProgressRing
          progress={lp.xpForNextLevel ? lp.xpIntoLevel / lp.xpForNextLevel : 0}
          size={84}
          strokeWidth={8}
          color={TIER_COLORS[tier]}
          accessibilityLabel={t('me.xp', {
            xp: formatNumber(lp.xpIntoLevel, language, 0),
            next: formatNumber(lp.xpForNextLevel, language, 0),
          })}>
          <Text variant="headline">{t('me.level', { level: state.data?.level ?? lp.level })}</Text>
        </ProgressRing>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="title" numberOfLines={1}>
            {name.data ?? t('me.guest')}
          </Text>
          <Text variant="footnote" color="secondary">
            {t('me.xp', {
              xp: formatNumber(lp.xpIntoLevel, language, 0),
              next: formatNumber(lp.xpForNextLevel, language, 0),
            })}
          </Text>
          <Text variant="footnote" color="secondary">
            {t('me.streak', { count: state.data?.streak ?? 0 })} · {t('me.shields', { count: state.data?.shields ?? 0 })}
          </Text>
        </View>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <View className="flex-row items-center justify-between">
          <Text variant="headline">{t('me.aura')}</Text>
          <Text variant="metric" color={TIER_COLORS[tier]}>
            {formatNumber(aura, language, 0)}
          </Text>
        </View>
        <View className="flex-row" style={{ gap: spacing.xs }}>
          {coach.AURA_TIER_ORDER.map((tr, i) => (
            <View key={tr} style={{ flex: 1, gap: spacing.xs }}>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: TIER_COLORS[tr], opacity: i <= tierIndex ? 1 : 0.25 }} />
              <Text variant="caption" color={tr === tier ? 'label' : 'tertiary'} numberOfLines={1}>
                {t(`me.tier.${tr}`)}
              </Text>
            </View>
          ))}
        </View>
        <Text variant="footnote" color="secondary">
          {nextTier
            ? t('me.toNextTier', { points: formatNumber(nextTier.min - aura, language, 0), tier: t(`me.tier.${nextTier.tier}`) })
            : t('me.topTier')}
        </Text>
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Text variant="headline">{t('me.stats')}</Text>
        {stats.data && Object.keys(stats.data).length ? (
          coach.STAT_CODES.map((code) => {
            const v = stats.data?.[code];
            return (
              <View key={code} style={{ gap: spacing.xs }}>
                <View className="flex-row justify-between">
                  <Text variant="footnote">{t(`me.stat.${code}`)}</Text>
                  <Text variant="footnote" weight="600">
                    {v === undefined ? '—' : formatNumber(v, language, 0)}
                  </Text>
                </View>
                <ProgressBar
                  progress={(v ?? 0) / 100}
                  color={colors.tint}
                  accessibilityLabel={t('me.statA11y', { name: t(`me.stat.${code}`), value: Math.round(v ?? 0) })}
                />
              </View>
            );
          })
        ) : (
          <Text variant="footnote" color="secondary">
            {t('me.noStats')}
          </Text>
        )}
      </Card>

      <Card style={{ gap: spacing.sm }}>
        {boss.data ? (
          <>
            <View className="flex-row items-center justify-between">
              <Text variant="headline" style={{ flex: 1 }}>
                {t('me.boss', {
                  name: t(`me.bossName.${boss.data.bossCode}` as 'me.bossName.sloth', { defaultValue: boss.data.bossCode }),
                })}
              </Text>
              <Text variant="metric">
                {boss.data.hits}/{boss.data.hitsRequired}
              </Text>
            </View>
            <ProgressBar
              progress={boss.data.hitsRequired ? boss.data.hits / boss.data.hitsRequired : 0}
              color={colors.destructive}
              accessibilityLabel={`${boss.data.hits}/${boss.data.hitsRequired}`}
            />
            <Text variant="footnote" color="secondary">
              {boss.data.won ? t('me.bossWon') : t('me.bossHint')}
            </Text>
          </>
        ) : (
          <Text variant="footnote" color="secondary">
            {t('me.noBoss')}
          </Text>
        )}
      </Card>

      <GroupedList>
        {links.map((l) => (
          <ListRow
            key={l.key}
            icon={l.icon}
            iconColor={l.color}
            title={l.title}
            value={l.value}
            onPress={() => router.push(l.href)}
          />
        ))}
      </GroupedList>

      <GroupedList>
        <ListRow
          icon="gearshape.fill"
          iconColor={colors.icon.gray}
          title={t('me.links.settings')}
          onPress={() => router.push(ROUTES.settings)}
        />
      </GroupedList>
    </Screen>
  );
}
