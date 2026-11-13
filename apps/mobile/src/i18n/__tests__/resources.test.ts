import { en, NAMESPACES, vi } from '../resources';

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

/** Flatten nested keys to dot paths; plural forms collapse to their base key. */
function keyPaths(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [prefix.replace(PLURAL_SUFFIX, '')];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    keyPaths(v, prefix ? `${prefix}.${k}` : k)
  );
}

const unique = (xs: string[]) => [...new Set(xs)].sort();

describe('i18n resources', () => {
  it('has the same namespaces for vi and en', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(vi).sort());
    expect(NAMESPACES.length).toBeGreaterThanOrEqual(12);
  });

  it.each(NAMESPACES)('namespace "%s" has the same keys in vi and en', (ns) => {
    expect(unique(keyPaths(en[ns]))).toEqual(unique(keyPaths(vi[ns])));
  });

  it.each(NAMESPACES)('namespace "%s" has no empty strings', (ns) => {
    const empty = (obj: unknown): boolean =>
      typeof obj === 'string' ? obj.trim() === '' : Object.values(obj as object).some(empty);
    expect(empty(vi[ns])).toBe(false);
    expect(empty(en[ns])).toBe(false);
  });
});
