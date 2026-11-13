import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton, spacing } from '@/ui';

const SIZE = 62;
/** Height of the native tab bar area the button floats above (iOS 26 floating tab bar ≈ 62 pt). */
const TAB_BAR = 62;

/** Extra bottom padding for tab screens so the last row is not hidden behind the capture button. */
export const CAPTURE_BUTTON_CLEARANCE = SIZE + spacing.lg;

/**
 * Floating mint glass button above the tab bar that opens the Add-food sheet (design-language §4).
 * Rendered by app/(tabs)/_layout.tsx as an overlay on top of the native tabs.
 */
export function CaptureButton() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <GlassButton
        testID="capture-button"
        prominent
        size={SIZE}
        symbol="camera.fill"
        accessibilityLabel={t('capture.label')}
        accessibilityHint={t('capture.hint')}
        onPress={() => router.push('/food/add')}
        style={{ position: 'absolute', right: spacing.gutter, bottom: insets.bottom + TAB_BAR + spacing.sm }}
      />
    </View>
  );
}
