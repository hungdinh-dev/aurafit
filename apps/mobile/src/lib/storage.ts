import * as SecureStore from 'expo-secure-store';

/**
 * Tiny synchronous key-value store for small app preferences (language, local flags).
 * Backed by expo-secure-store's sync API for now; swap for MMKV once the dev build lands.
 * Keys: letters, digits, ".", "-", "_" only. Never throws.
 */
export const kv = {
  getString(key: string): string | null {
    try {
      return SecureStore.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setString(key: string, value: string): void {
    try {
      SecureStore.setItem(key, value);
    } catch {
      // best-effort persistence
    }
  },
  getBoolean(key: string): boolean {
    return kv.getString(key) === '1';
  },
  setBoolean(key: string, value: boolean): void {
    kv.setString(key, value ? '1' : '0');
  },
  remove(key: string): void {
    SecureStore.deleteItemAsync(key).catch(() => {});
  },
};
