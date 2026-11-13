export function env(name: string, fallback?: string): string {
  const value = Deno.env.get(name);
  if (value !== undefined && value !== '') return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`missing environment variable ${name}`);
}

export function envOptional(name: string): string | undefined {
  const value = Deno.env.get(name);
  return value === undefined || value === '' ? undefined : value;
}

export function envInt(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  const n = raw === undefined ? NaN : Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function envNumber(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  const n = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
