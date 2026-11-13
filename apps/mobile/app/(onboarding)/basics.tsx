import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/features/placeholder/ComingSoon';
import { useCompleteOnboarding } from '@/features/profile/api';
import { Button, Screen, Text, haptics } from '@/ui';

/** Onboarding step 1 – "Về bạn" (ONB-03). M0 placeholder: finishing marks onboarding complete. */
export default function BasicsScreen() {
  const { t } = useTranslation(['onboarding', 'common']);
  const complete = useCompleteOnboarding();
  return (
    <Screen title={t('onboarding:basics.title')}>
      <Text variant="body" color="secondary">
        {t('onboarding:basics.body')}
      </Text>
      <ComingSoon symbol="person.fill" />
      <Button
        title={t('onboarding:basics.finish')}
        loading={complete.isPending}
        onPress={() => complete.mutate(undefined, { onSuccess: () => haptics.success() })}
      />
      {complete.isError ? (
        <Text variant="footnote" color="destructive">
          {t('common:errors.generic')}
        </Text>
      ) : null}
    </Screen>
  );
}
