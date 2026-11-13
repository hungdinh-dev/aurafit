import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

import { kv } from '@/lib/storage';

import {
  DEFAULT_LANGUAGE,
  DEFAULT_NAMESPACE,
  isLanguage,
  NAMESPACES,
  resources,
  type Language,
} from './resources';

export { LANGUAGES, NAMESPACES, type Language, type Namespace } from './resources';

const STORAGE_KEY = 'aurafit.language';

/** App-wide i18next instance (registered with react-i18next below). */
const i18n = createInstance();

/** Saved choice → device language if supported → Vietnamese. */
export function detectLanguage(): Language {
  const saved = kv.getString(STORAGE_KEY);
  if (isLanguage(saved)) return saved;
  try {
    const device = getLocales()[0]?.languageCode;
    if (isLanguage(device)) return device;
  } catch {
    // expo-localization unavailable (tests)
  }
  return DEFAULT_LANGUAGE;
}

// Resources are bundled, so init is synchronous (initAsync: false) – no flash of keys.
void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: ['vi', 'en'],
  ns: NAMESPACES,
  defaultNS: DEFAULT_NAMESPACE,
  interpolation: { escapeValue: false },
  returnNull: false,
  initAsync: false,
});

/** Switch language at runtime and remember the choice. */
export async function setLanguage(language: Language): Promise<void> {
  kv.setString(STORAGE_KEY, language);
  await i18n.changeLanguage(language);
}

/** Current language + setter, re-renders on change. */
export function useLanguage(): [Language, (language: Language) => Promise<void>] {
  const { i18n: instance } = useTranslation();
  const current = isLanguage(instance.resolvedLanguage) ? instance.resolvedLanguage : DEFAULT_LANGUAGE;
  return [current, setLanguage];
}

export default i18n;
