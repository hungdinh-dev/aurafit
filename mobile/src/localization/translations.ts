import { create } from 'zustand';
import en from './languages/en';
import vi from './languages/vi';

export type Language = 'vi' | 'en';

export const translations = {
  vi: vi,
  en: en
};

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['vi']) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'vi', // default language is Vietnamese
  setLanguage: (language) => set({ language }),
  toggleLanguage: () => set((state) => ({ language: state.language === 'vi' ? 'en' : 'vi' })),
  t: (key) => {
    const lang = get().language;
    return translations[lang][key] || translations['vi'][key] || key;
  }
}));
