import { useLanguage } from '@/i18n';

export type Formatter = {
  locale: 'vi-VN' | 'en-US';
  /** Grouped integer / decimal ("1.240", "71,4"). */
  num: (value: number | null | undefined, maxDigits?: number) => string;
  /** Liters from ml with one decimal ("1,2"). */
  liters: (ml: number) => string;
  /** "7 g 12 p" style duration via the caller's template – returns { h, m }. */
  hm: (minutes: number) => { h: number; m: number };
  /** Day + month ("13/11"). */
  dayMonth: (localDate: string) => string;
  /** Weekday, day month ("Thứ Sáu, 13 tháng 11"). */
  longDate: (localDate: string) => string;
  /** Clock time of an ISO instant ("19:12"). */
  clock: (iso: string) => string;
};

const EMPTY = '—';

/** Parses "YYYY-MM-DD" as a local-noon Date (safe for Intl formatting in any zone). */
export function dateFromLocal(localDate: string): Date {
  const [y, m, d] = localDate.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
}

export function makeFormatter(language: 'vi' | 'en'): Formatter {
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  return {
    locale,
    num: (value, maxDigits = 0) =>
      value == null || !Number.isFinite(value)
        ? EMPTY
        : new Intl.NumberFormat(locale, { maximumFractionDigits: maxDigits }).format(value),
    liters: (ml) => new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(ml / 1000),
    hm: (minutes) => ({ h: Math.floor(Math.max(0, minutes) / 60), m: Math.round(Math.max(0, minutes) % 60) }),
    dayMonth: (localDate) =>
      new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'numeric' }).format(dateFromLocal(localDate)),
    longDate: (localDate) =>
      new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(dateFromLocal(localDate)),
    clock: (iso) => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)),
  };
}

/** Number/date formatting in the current app language (vi-VN / en-US). */
export function useFormat(): Formatter {
  const [language] = useLanguage();
  return makeFormatter(language);
}
