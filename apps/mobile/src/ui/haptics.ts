import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const run = (fn: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  fn().catch(() => {
    // Haptics are best-effort (simulator, low-power mode…)
  });
};

/**
 * Haptics policy (design-language §6):
 * - `light`     tick a set, log water, press a primary button
 * - `selection` change a segmented control / stepper / chip
 * - `success`   meal saved, sign-in done
 * - `warning`   validation problem
 * - `heavy`     celebration screen
 */
export const haptics = {
  light: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  selection: () => run(() => Haptics.selectionAsync()),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
