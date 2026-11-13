import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ComingSoon } from '@/features/placeholder/ComingSoon';
import { GlassButton, GroupedList, ListRow, SheetContent, useTheme } from '@/ui';

/** Thêm món (sheet, NUT-02/04/05/06/07). Presented with sheetOptions() from the root layout. */
export default function AddFoodSheet() {
  const { t } = useTranslation(['nutrition', 'common']);
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <SheetContent
      title={t('nutrition:add.title')}
      headerRight={
        <GlassButton symbol="xmark" size={36} accessibilityLabel={t('common:actions.close')} onPress={() => router.back()} />
      }>
      <GroupedList>
        <ListRow icon="camera.fill" iconColor={colors.icon.mint} title={t('nutrition:add.photo')} />
        <ListRow icon="text.bubble.fill" iconColor={colors.icon.blue} title={t('nutrition:add.describe')} />
        <ListRow icon="barcode.viewfinder" iconColor={colors.icon.orange} title={t('nutrition:add.barcode')} />
        <ListRow icon="star.fill" iconColor={colors.icon.pink} title={t('nutrition:add.myFoods')} />
        <ListRow icon="clock.arrow.circlepath" iconColor={colors.icon.gray} title={t('nutrition:add.recent')} />
      </GroupedList>
      <ComingSoon symbol="fork.knife" />
    </SheetContent>
  );
}
