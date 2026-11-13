import { useTranslation } from 'react-i18next';

import { CAPTURE_BUTTON_CLEARANCE } from '@/features/capture/CaptureButton';
import { ComingSoon } from '@/features/placeholder/ComingSoon';
import { Button, GroupedList, ListRow, Screen, useTheme } from '@/ui';

/** Tập (WRK-*). M0 placeholder. */
export default function TrainScreen() {
  const { t } = useTranslation('workout');
  const { colors } = useTheme();
  return (
    <Screen title={t('title')} bottomInset={CAPTURE_BUTTON_CLEARANCE}>
      <Button title={t('start')} symbol="figure.strengthtraining.traditional" disabled />
      <GroupedList>
        <ListRow icon="dumbbell.fill" iconColor={colors.icon.green} title={t('library')} />
        <ListRow icon="bolt.heart.fill" iconColor={colors.icon.red} title={t('recovery')} />
      </GroupedList>
      <ComingSoon symbol="dumbbell.fill" />
    </Screen>
  );
}
