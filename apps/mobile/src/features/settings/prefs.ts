import { create } from 'zustand';

import { kv } from '@/lib/storage';

/**
 * Device-level preferences that have no column in the database (NUT-12 display toggles,
 * reminder switches, Apple Health read toggles). Persisted with `kv`, read synchronously.
 */
export type Prefs = {
  showFiber: boolean;
  showSodium: boolean;
  waterReminders: boolean;
  weighReminders: boolean;
  mealReminders: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  showFiber: true,
  showSodium: false,
  waterReminders: true,
  weighReminders: true,
  mealReminders: true,
};

const KEY = 'aurafit.prefs';

function load(): Prefs {
  const raw = kv.getString(KEY);
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    const out = { ...DEFAULT_PREFS };
    for (const k of Object.keys(DEFAULT_PREFS) as (keyof Prefs)[]) {
      if (typeof parsed[k] === 'boolean') out[k] = parsed[k];
    }
    return out;
  } catch {
    return DEFAULT_PREFS;
  }
}

type PrefsStore = Prefs & { set: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void };

export const usePrefs = create<PrefsStore>((set, get) => ({
  ...load(),
  set: (key, value) => {
    set({ [key]: value } as Pick<Prefs, typeof key>);
    const { set: _omit, ...prefs } = get();
    kv.setString(KEY, JSON.stringify(prefs));
  },
}));
