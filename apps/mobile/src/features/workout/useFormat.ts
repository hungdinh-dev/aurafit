import { useTranslation } from 'react-i18next';

import { useLanguage } from '@/i18n';

import { formatClock, formatNumber } from './format';

/** Locale-aware formatters for workout screens ("62,5 kg", "8–10 rep", "2:30"). */
export function useWorkoutFormat() {
  const { t } = useTranslation('workout');
  const [language] = useLanguage();
  const kg = (value: number | null | undefined): string =>
    value == null ? t('session.bodyweight') : t('units.kg', { value: formatNumber(value, language) });
  const num = (value: number, digits = 2) => formatNumber(value, language, digits);
  const rest = (sec: number) => formatClock(sec);
  return { kg, num, rest, language };
}
