import * as SecureStore from 'expo-secure-store';

/**
 * Supabase auth storage backed by the iOS Keychain (expo-secure-store).
 * SecureStore values should stay under 2048 bytes, but a Supabase session (JWT + refresh token +
 * user JSON) is larger – so values are split into ≤ 1800-byte chunks:
 *   `<key>__n` = number of chunks, `<key>__0`, `<key>__1`, … = parts.
 */
export type SecureBackend = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

export const CHUNK_BYTES = 1800;

/** SecureStore keys may only contain letters, digits, ".", "-" and "_". */
export const sanitizeKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

const utf8Length = (codePoint: number) =>
  codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;

/** Split a string into parts of at most `maxBytes` UTF-8 bytes without breaking characters. */
export function splitByBytes(value: string, maxBytes = CHUNK_BYTES): string[] {
  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  for (const ch of value) {
    const size = utf8Length(ch.codePointAt(0) ?? 0);
    if (bytes + size > maxBytes && current) {
      parts.push(current);
      current = '';
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  if (current || parts.length === 0) parts.push(current);
  return parts;
}

export function createChunkedStorage(backend: SecureBackend = SecureStore, maxBytes = CHUNK_BYTES) {
  const countKey = (key: string) => `${sanitizeKey(key)}__n`;
  const partKey = (key: string, i: number) => `${sanitizeKey(key)}__${i}`;

  async function readCount(key: string): Promise<number> {
    const n = Number(await backend.getItemAsync(countKey(key)));
    return Number.isInteger(n) && n > 0 ? n : 0;
  }

  async function deleteParts(key: string, from: number, to: number) {
    await Promise.all(
      Array.from({ length: Math.max(0, to - from) }, (_, i) => backend.deleteItemAsync(partKey(key, from + i)))
    );
  }

  return {
    async getItem(key: string): Promise<string | null> {
      const n = await readCount(key);
      if (n === 0) return null;
      const parts = await Promise.all(Array.from({ length: n }, (_, i) => backend.getItemAsync(partKey(key, i))));
      if (parts.some((p) => p == null)) return null; // partially written → treat as signed out
      return parts.join('');
    },
    async setItem(key: string, value: string): Promise<void> {
      const previous = await readCount(key);
      const parts = splitByBytes(value, maxBytes);
      // Invalidate first so a crash mid-write never yields a mixed value.
      await backend.deleteItemAsync(countKey(key));
      for (let i = 0; i < parts.length; i++) {
        await backend.setItemAsync(partKey(key, i), parts[i] ?? '');
      }
      await backend.setItemAsync(countKey(key), String(parts.length));
      await deleteParts(key, parts.length, previous);
    },
    async removeItem(key: string): Promise<void> {
      const n = await readCount(key);
      await backend.deleteItemAsync(countKey(key));
      await deleteParts(key, 0, n);
    },
  };
}

/** Default instance used by the Supabase client. */
export const secureStorage = createChunkedStorage();
