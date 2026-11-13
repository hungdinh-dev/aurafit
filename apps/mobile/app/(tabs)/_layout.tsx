import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { CaptureButton } from '@/features/capture/CaptureButton';
import { useTheme } from '@/ui';

/**
 * Native tab bar (UITabBarController): iOS 26 draws Liquid Glass and minimizes it on scroll.
 * Hôm nay · Nhật ký · Tập · Tôi + the floating capture button (opens /food/add as a sheet).
 */
export default function TabsLayout() {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <NativeTabs tintColor={colors.tint} minimizeBehavior="onScrollDown">
        <NativeTabs.Trigger name="today">
          <NativeTabs.Trigger.Label>{t('tabs.today')}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="diary">
          <NativeTabs.Trigger.Label>{t('tabs.diary')}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="train">
          <NativeTabs.Trigger.Label>{t('tabs.train')}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'dumbbell', selected: 'dumbbell.fill' }} />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="me">
          <NativeTabs.Trigger.Label>{t('tabs.me')}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
        </NativeTabs.Trigger>
      </NativeTabs>
      <CaptureButton />
    </View>
  );
}
