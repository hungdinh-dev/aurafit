import type { Language } from '@/i18n';

/** BCP-47 locale for Intl formatting. */
export const localeOf = (language: Language): string => (language === 'vi' ? 'vi-VN' : 'en-US');

/** "62,5" (vi) / "62.5" (en) – up to 2 decimals, no trailing zeros. */
export function formatNumber(value: number, language: Language, maxFractionDigits = 2): string {
  return new Intl.NumberFormat(localeOf(language), { maximumFractionDigits: maxFractionDigits }).format(value);
}

/** Seconds → "2:30" (or "1:02:05" over an hour). Negative values clamp to 0. */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

/** Short date like "Th 5, 12/11" / "Thu, 11/12". */
export function formatShortDate(iso: string, language: Language): string {
  return new Intl.DateTimeFormat(localeOf(language), { weekday: 'short', day: 'numeric', month: 'numeric' }).format(
    new Date(iso)
  );
}

export function formatDateTime(iso: string, language: Language): string {
  return new Intl.DateTimeFormat(localeOf(language), {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function formatWeekday(date: Date, language: Language): string {
  return new Intl.DateTimeFormat(localeOf(language), { weekday: 'long' }).format(date);
}
