import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform } from 'react-native';

function detect() {
  if (Platform.OS !== 'ios') return false;
  try {
    return isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

/** true on iOS 26+ builds where Liquid Glass (UIGlassEffect) is available. Evaluated once. */
export const hasLiquidGlass = detect();
