import { createChunkedStorage, splitByBytes, type SecureBackend } from '../secureStorage';

function memoryBackend() {
  const map = new Map<string, string>();
  const backend: SecureBackend = {
    getItemAsync: async (k) => map.get(k) ?? null,
    setItemAsync: async (k, v) => {
      map.set(k, v);
    },
    deleteItemAsync: async (k) => {
      map.delete(k);
    },
  };
  return { map, backend };
}

describe('splitByBytes', () => {
  it('keeps every part under the byte limit without splitting characters', () => {
    const text = 'Nguyễn Văn A – phở bò 🍜 '.repeat(200);
    const parts = splitByBytes(text, 100);
    expect(parts.join('')).toBe(text);
    for (const p of parts) expect(new TextEncoder().encode(p).length).toBeLessThanOrEqual(100);
  });
});

describe('createChunkedStorage', () => {
  it('round-trips large values and cleans up old chunks', async () => {
    const { map, backend } = memoryBackend();
    const storage = createChunkedStorage(backend, 50);
    const big = 'x'.repeat(420);

    await storage.setItem('sb-ref-auth-token', big);
    expect(await storage.getItem('sb-ref-auth-token')).toBe(big);
    expect(map.size).toBe(9 + 1);

    await storage.setItem('sb-ref-auth-token', 'small');
    expect(await storage.getItem('sb-ref-auth-token')).toBe('small');
    expect(map.size).toBe(2);

    await storage.removeItem('sb-ref-auth-token');
    expect(await storage.getItem('sb-ref-auth-token')).toBeNull();
    expect(map.size).toBe(0);
  });
});
