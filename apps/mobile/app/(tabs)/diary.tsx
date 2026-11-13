import { useTranslation } from 'react-i18next';

import { CAPTURE_BUTTON_CLEARANCE } from '@/features/capture/CaptureButton';
import { ComingSoon } from '@/features/placeholder/ComingSoon';
import { GroupedList, ListRow, Screen, useTheme } from '@/ui';

/** Nhật ký (NUT-08). M0 placeholder. */
export default function DiaryScreen() {
  const { t } = useTranslation('nutrition');
  const { colors } = useTheme();
  return (
    <Screen title={t('diary.title')} bottomInset={CAPTURE_BUTTON_CLEARANCE}>
      <GroupedList>
        <ListRow icon="sunrise.fill" iconColor={colors.icon.orange} title={t('meals.breakfast')} />
        <ListRow icon="sun.max.fill" iconColor={colors.icon.green} title={t('meals.lunch')} />
        <ListRow icon="moon.stars.fill" iconColor={colors.icon.indigo} title={t('meals.dinner')} />
        <ListRow icon="cup.and.saucer.fill" iconColor={colors.icon.pink} title={t('meals.snack')} />
      </GroupedList>
      <ComingSoon symbol="fork.knife" />
    </Screen>
  );
}
