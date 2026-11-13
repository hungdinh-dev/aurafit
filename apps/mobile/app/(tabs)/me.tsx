import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';

import { LanguageToggle } from '@/features/auth/components';
import { CAPTURE_BUTTON_CLEARANCE } from '@/features/capture/CaptureButton';
import { useAuth, useSignOut } from '@/lib/auth';
import { GroupedList, ListRow, Screen, useTheme } from '@/ui';

/** Tôi (profile + settings entry). M0: account, language switch, sign out. */
export default function MeScreen() {
  const { t } = useTranslation(['settings', 'progress', 'friends', 'tasks']);
  const { colors } = useTheme();
  const { user, devPreview } = useAuth();
  const signOut = useSignOut();

  return (
    <Screen title={t('settings:me.title')} bottomInset={CAPTURE_BUTTON_CLEARANCE}>
      <GroupedList header={t('settings:account')}>
        <ListRow
          icon="envelope.fill"
          iconColor={colors.icon.blue}
          title={
            user?.email ? t('settings:signedInAs', { email: user.email }) : devPreview ? t('settings:devPreview') : '—'
          }
        />
      </GroupedList>

      <GroupedList>
        <ListRow icon="chart.xyaxis.line" iconColor={colors.icon.mint} title={t('progress:title')} />
        <ListRow icon="person.2.fill" iconColor={colors.icon.pink} title={t('friends:title')} />
        <ListRow icon="leaf.fill" iconColor={colors.icon.green} title={t('tasks:title')} />
      </GroupedList>

      <GroupedList header={t('settings:general')}>
        <ListRow icon="globe" iconColor={colors.icon.teal} title={t('settings:language')} trailing={<LanguageToggle />} />
        <ListRow
          icon="info.circle.fill"
          iconColor={colors.icon.gray}
          title={t('settings:version')}
          value={Constants.expoConfig?.version ?? '—'}
        />
      </GroupedList>

      <GroupedList>
        <ListRow
          icon="rectangle.portrait.and.arrow.right"
          iconColor={colors.icon.red}
          title={t('settings:signOut')}
          destructive
          chevron={false}
          disabled={signOut.isPending}
          onPress={() => signOut.mutate()}
        />
      </GroupedList>
    </Screen>
  );
}
