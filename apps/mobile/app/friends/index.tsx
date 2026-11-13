import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share, View } from 'react-native';

import {
  inviteLink,
  useAddFriend,
  useFriends,
  useInvite,
  useRedeemInvite,
  useRespondRequest,
  useStartDuo,
} from '@/features/friends/api';
import { useCanSync } from '@/features/workout/api';
import { EmptyCard, ErrorCard, LoadingCard, PushedHeader } from '@/features/workout/components/common';
import { Button, Card, GroupedList, ListRow, Screen, Text, TextField, haptics, spacing, useTheme } from '@/ui';

/** Bạn bè – Friends mockup: invite link / code, add by username, requests, duo streak (FRD-01 / FRD-03). */
export default function FriendsScreen() {
  const { t } = useTranslation(['friends', 'progress']);
  const { colors } = useTheme();
  const canSync = useCanSync();
  const friends = useFriends();
  const invite = useInvite();
  const add = useAddFriend();
  const respond = useRespondRequest();
  const redeem = useRedeemInvite();
  const startDuo = useStartDuo();
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [addMsg, setAddMsg] = useState<string | null>(null);

  if (!canSync) {
    return (
      <Screen title={t('friends:title')}>
        <PushedHeader />
        <EmptyCard symbol="person.2.fill" body={t('friends:signInNeeded')} />
      </Screen>
    );
  }

  const share = async () => {
    if (!invite.data) return;
    haptics.light();
    const link = inviteLink(invite.data);
    await Share.share({ message: t('friends:invite.message', { link, code: invite.data }), url: link });
  };

  const submitAdd = () => {
    setAddMsg(null);
    add.mutate(username, {
      onSuccess: (found) => {
        if (found) {
          haptics.success();
          setUsername('');
          setAddMsg(t('friends:add.sent', { username: found }));
        } else {
          haptics.warning();
          setAddMsg(t('friends:add.notFound', { username: username.replace(/^@/, '') }));
        }
      },
      onError: () => {
        haptics.error();
        setAddMsg(t('friends:add.error'));
      },
    });
  };

  const tierName = (tier: string | null) =>
    tier && ['gray', 'green', 'blue', 'purple', 'gold', 'red'].includes(tier)
      ? t(`progress:me.tier.${tier as 'gray'}`)
      : '—';
  const duoWith = (userId: string) =>
    friends.data?.duos.find((d) => d.user_a === userId || d.user_b === userId) ?? null;
  const topDuo = friends.data?.duos[0];
  const duoFriend = topDuo ? friends.data?.friends.find((f) => f.userId === topDuo.user_a || f.userId === topDuo.user_b) : null;

  return (
    <Screen title={t('friends:title')}>
      <PushedHeader />

      <Card style={{ gap: spacing.md }}>
        <Text variant="headline">{t('friends:invite.title')}</Text>
        <Text variant="footnote" color="secondary">
          {t('friends:invite.meta')}
        </Text>
        {invite.isError ? (
          <Text variant="footnote" color="destructive">
            {t('friends:invite.error')}
          </Text>
        ) : (
          <View
            accessible
            accessibilityLabel={t('friends:invite.codeA11y', { code: invite.data ?? '' })}
            style={{ backgroundColor: colors.surfaceNested, borderRadius: 16, padding: spacing.lg, alignItems: 'center', gap: spacing.xs }}>
            <Text variant="caption" color="secondary">
              {t('friends:invite.code')}
            </Text>
            <Text variant="metricLarge" selectable>
              {invite.data ?? '…'}
            </Text>
            <Text variant="caption" color="secondary" align="center">
              {t('friends:invite.qrNote')}
            </Text>
          </View>
        )}
        <Button
          title={t('friends:invite.share')}
          symbol="square.and.arrow.up"
          disabled={!invite.data}
          onPress={() => void share()}
        />
      </Card>

      <Card style={{ gap: spacing.sm }}>
        <TextField
          label={t('friends:add.label')}
          value={username}
          onChangeText={setUsername}
          placeholder={t('friends:add.placeholder')}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
          onSubmitEditing={submitAdd}
        />
        <Button
          title={t('friends:add.action')}
          variant="tinted"
          size="medium"
          loading={add.isPending}
          disabled={username.trim().length < 3}
          onPress={submitAdd}
        />
        {addMsg ? (
          <Text variant="footnote" color="secondary">
            {addMsg}
          </Text>
        ) : null}
        <TextField
          label={t('friends:redeem.label')}
          value={code}
          onChangeText={setCode}
          placeholder={t('friends:redeem.placeholder')}
          autoCapitalize="none"
          autoCorrect={false}
          message={redeem.isError ? t('friends:redeem.error') : redeem.isSuccess ? t('friends:redeem.done') : undefined}
          error={redeem.isError}
        />
        <Button
          title={t('friends:redeem.action')}
          variant="gray"
          size="medium"
          loading={redeem.isPending}
          disabled={code.trim().length !== 10}
          onPress={() =>
            redeem.mutate(code, {
              onSuccess: () => {
                haptics.success();
                setCode('');
              },
              onError: () => haptics.error(),
            })
          }
        />
      </Card>

      {friends.isLoading ? <LoadingCard /> : null}
      {friends.isError ? <ErrorCard message={t('friends:error')} onRetry={() => void friends.refetch()} /> : null}

      {(friends.data?.incoming ?? []).map((r) => (
        <Card key={r.friendshipId} style={{ gap: spacing.md }}>
          <Text variant="subheadline">{t('friends:request.wants', { username: r.username ?? r.name })}</Text>
          <View className="flex-row" style={{ gap: spacing.sm }}>
            <Button
              title={t('friends:request.decline')}
              variant="gray"
              size="medium"
              block={false}
              onPress={() => respond.mutate({ friendshipId: r.friendshipId, accept: false })}
            />
            <Button
              title={t('friends:request.accept')}
              variant="tinted"
              size="medium"
              block={false}
              onPress={() => {
                haptics.success();
                respond.mutate({ friendshipId: r.friendshipId, accept: true });
              }}
            />
          </View>
        </Card>
      ))}

      {topDuo && duoFriend ? (
        <Card style={{ gap: spacing.xs }}>
          <Text variant="headline" color={colors.streak}>
            {t('friends:duo.title', { name: duoFriend.name, count: topDuo.streak })}
          </Text>
          <Text variant="footnote" color="secondary">
            {t('friends:duo.body')}
          </Text>
        </Card>
      ) : null}

      {friends.data ? (
        <GroupedList header={t('friends:list')} footer={friends.data.friends.length ? undefined : t('friends:empty')}>
          {friends.data.friends.map((f) => (
            <ListRow
              key={f.userId}
              icon="person.crop.circle.fill"
              iconColor={colors.icon.indigo}
              title={f.name}
              subtitle={t('friends:meta', { streak: f.streak ?? 0, tier: tierName(f.auraTier) })}
              accessibilityHint={t('friends:openStory', { name: f.name })}
              trailing={
                duoWith(f.userId) ? undefined : (
                  <Button
                    title={t('friends:duo.start')}
                    variant="plain"
                    size="small"
                    block={false}
                    onPress={() => startDuo.mutate(f.userId, { onSuccess: () => haptics.success() })}
                  />
                )
              }
              onPress={() => router.push({ pathname: '/friends/[userId]', params: { userId: f.userId, name: f.name } })}
            />
          ))}
          {friends.data.outgoing.map((f) => (
            <ListRow key={f.friendshipId} title={f.username ? `@${f.username}` : f.name} value={t('friends:pendingOut')} />
          ))}
        </GroupedList>
      ) : null}
    </Screen>
  );
}
