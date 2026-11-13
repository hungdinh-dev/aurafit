import { coach, time } from '@aurafit/core';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useBossBattle, useQuests } from '@/features/coach/api';
import { BackHeader } from '@/features/coach/components/BackHeader';
import { localToday } from '@/features/coach/lib/clock';
import { isRecord } from '@/features/coach/lib/json';
import { useFormat } from '@/features/coach/lib/format';
import { useMyProfile } from '@/features/profile/api';
import { Card, GroupedList, ListRow, ProgressBar, Screen, Symbol, Text, spacing, useTheme } from '@/ui';

const QUEST_CODES = new Set<string>(coach.QUEST_DEFINITIONS.map((d) => d.code));
const STAT_CODES = new Set<string>(coach.STAT_CODES);
const BOSS_CODES = new Set<string>(coach.BOSS_DEFINITIONS.map((b) => b.code));

/** Nhiệm vụ & Boss tuần (COA-04, COA-05) – generated and checked by the server, read-only here. */
export default function QuestsScreen() {
  const { t } = useTranslation(['coach', 'common']);
  const { colors } = useTheme();
  const f = useFormat();
  const today = localToday();
  const weekStart = time.startOfWeek(today);
  const quests = useQuests(today);
  const boss = useBossBattle(weekStart);
  const profile = useMyProfile();
  const charName = profile.data?.character_name ?? (profile.data?.character === 'mira' ? 'Mira' : 'Kai');

  const list = (quests.data ?? []).filter((q) => QUEST_CODES.has(q.code));
  const earned = list.reduce((s, q) => s + (q.completed_at ? q.xp_reward : 0), 0);
  const total = list.reduce((s, q) => s + q.xp_reward, 0);

  const b = boss.data;
  const bossCode = b && BOSS_CODES.has(b.boss_code) ? (b.boss_code as coach.BossCode) : null;
  const reward = isRecord(b?.reward) ? b.reward : {};
  const fragments = typeof reward.shieldFragments === 'number' ? reward.shieldFragments : 1;
  const weekRange = `${f.dayMonth(weekStart)}–${f.dayMonth(time.endOfWeek(today))}`;

  return (
    <>
      <BackHeader />
      <Screen title={t('coach:quest.title')}>
        <GroupedList
          header={list.length > 0 ? t('coach:quest.todayXp', { xp: earned, total }) : undefined}
          footer={list.length > 0 ? t('coach:quest.footer') : t('coach:quest.empty')}>
          {list.map((q) => {
            const done = !!q.completed_at;
            const xpLabel = '+' + q.xp_reward;
            const stat = q.stat && STAT_CODES.has(q.stat) ? t(`coach:stats.${q.stat as coach.StatCode}`) : null;
            return (
              <ListRow
                key={q.id}
                title={t(`coach:quest.codes.${q.code as coach.QuestCode}`)}
                subtitle={stat ? t('coach:quest.why', { stat }) : undefined}
                accessibilityLabel={`${t(`coach:quest.codes.${q.code as coach.QuestCode}`)}, +${q.xp_reward} XP, ${done ? t('coach:quest.done') : t('coach:quest.notDone')}`}
                trailing={
                  <View style={styles.trailing}>
                    <Text variant="subheadline" weight="600" color={done ? 'secondary' : 'tint'}>
                      {xpLabel}
                    </Text>
                    <Symbol
                      name={done ? 'checkmark.circle.fill' : 'circle'}
                      size={24}
                      color={done ? colors.tint : colors.tertiaryLabel}
                    />
                  </View>
                }
              />
            );
          })}
        </GroupedList>

        <Card style={{ gap: spacing.md }}>
          <Text variant="footnote" color="secondary">
            {t('coach:boss.week', { range: weekRange })}
          </Text>
          {b && bossCode ? (
            <>
              <View style={styles.bossHead}>
                <Text variant="title" style={styles.flex}>
                  {t(`coach:boss.codes.${bossCode}.name`)}
                </Text>
                <Text variant="metric" accessibilityLabel={t('coach:boss.hitsA11y', { hits: b.hits, required: b.hits_required })}>
                  {t('coach:boss.hits', { hits: b.hits, required: b.hits_required })}
                </Text>
              </View>
              <ProgressBar
                progress={b.hits_required > 0 ? b.hits / b.hits_required : 0}
                color={colors.icon.pink}
                height={8}
                accessibilityLabel={t('coach:boss.hitsA11y', { hits: b.hits, required: b.hits_required })}
              />
              <Text variant="subheadline" color="secondary">
                {t(`coach:boss.codes.${bossCode}.rule`)}
              </Text>
              {b.won_at ? (
                <Text variant="headline" color="tint">
                  {t('coach:boss.won')}
                </Text>
              ) : null}
              <GroupedList header={t('coach:boss.rewards')}>
                <ListRow
                  icon="rosette"
                  iconColor={colors.icon.pink}
                  title={t('coach:boss.rewardBadge', { name: t(`coach:boss.codes.${bossCode}.name`) })}
                />
                <ListRow
                  icon="shield.lefthalf.filled"
                  iconColor={colors.icon.teal}
                  title={t('coach:boss.rewardFragment', { count: fragments })}
                />
                <ListRow icon="tshirt.fill" iconColor={colors.icon.indigo} title={t('coach:boss.rewardAccessory', { name: charName })} />
              </GroupedList>
            </>
          ) : (
            <Text variant="subheadline" color="secondary">
              {t('coach:boss.empty')}
            </Text>
          )}
        </Card>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bossHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
