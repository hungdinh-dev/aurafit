# apps/mobile – conventions

Read this before adding screens. Spec: `docs/03-design/` (design-language, screen-map, implementation-plan). Mockups: `docs/03-design/ui-preview/*.dc.html`.

**Stack:** Expo SDK 58 (React Native 0.88, React 19.3, React Compiler on) · Expo Router 58 (typed routes) · TypeScript 6 strict · NativeWind 4 (layout only) · TanStack Query 5 · Zustand 5 · Zod 4 · i18next 27 · Supabase JS 2.

## 1. Folder layout

```text
apps/mobile/
├── app/                      # Expo Router – ONLY route files (every file is a screen)
│   ├── _layout.tsx           # providers + auth guard (Stack.Protected)
│   ├── index.tsx             # "/" → redirects to welcome / basics / today
│   ├── (auth)/               # welcome, sign-in            – shown when signed out
│   ├── (onboarding)/         # basics (+ goal, coach…)     – signed in, onboarding not done
│   ├── (tabs)/               # today, diary, train, me     – native tabs + capture button
│   ├── food/add.tsx          # sheet (formSheet), registered in app/_layout.tsx
│   └── auth/callback.tsx     # OAuth deep-link fallback
├── src/
│   ├── ui/                   # UI kit – import from '@/ui'
│   ├── i18n/                 # i18next setup + vi/*.json, en/*.json (one namespace per module)
│   ├── lib/                  # env, supabase, queryClient, auth, storage, locale
│   └── features/<module>/    # components/, hooks/, api.ts – module code used by routes
└── global.css · tailwind.config.js · babel.config.js · metro.config.js
```

- Routes live in **`app/`** (never create `src/app/` – Expo Router would switch to it). Keep route files thin: read params, call feature hooks, compose UI kit components.
- Non-route code goes in `src/`. Feature modules match i18n namespaces: `nutrition`, `health`, `tasks`, `coach`, `workout`, `progress`, `friends`, `settings`, `onboarding`, `today`.
- Path alias: `@/…` → `src/…` (`@/ui`, `@/lib/auth`, `@/features/nutrition/api`).
- Tests: `src/**/*.test.ts(x)` (jest-expo). Pure business logic belongs in `@aurafit/core` with its tests.

## 2. Adding a screen

1. Create the route file, e.g. `app/food/confirm.tsx` (`export default function ConfirmMealScreen()`).
2. If it is a **sheet**, register it in `app/_layout.tsx` inside the signed-in `Stack.Protected`:
   `<Stack.Screen name="food/confirm" options={sheetOptions({ detents: [0.75, 1], backgroundColor: colors.surface })} />`
   and wrap content in `<SheetContent title={…}>`. Pushed screens need no registration.
3. A tab screen uses `<Screen title={t('…')} bottomInset={CAPTURE_BUTTON_CLEARANCE}>`.
4. A new tab: add `app/(tabs)/<name>.tsx` **and** a `NativeTabs.Trigger` in `app/(tabs)/_layout.tsx` (SF Symbol `sf={{ default, selected }}`).
5. Navigate with `router.push('/food/confirm')` / `<Link href=…>` from `expo-router` (typed routes: run `npm start` once to regenerate `.expo/types`).
6. Every string through i18n, every color through `useTheme()`.

## 3. Translations (i18next)

- Files: `src/i18n/vi/<ns>.json` and `src/i18n/en/<ns>.json` – **same keys in both** (`npm test` enforces it). Vietnamese is the source and default language.
- Use: `const { t } = useTranslation('nutrition'); t('add.title')` or across namespaces `useTranslation(['today', 'common'])` → `t('common:actions.save')`. Keys are **type-checked** (`src/i18n/i18next.d.ts`).
- Plurals: vi uses `key_other` only; en uses `key_one` + `key_other`; call `t('coach:streak', { count })`.
- New namespace: add both JSON files, import them in `src/i18n/resources.ts` (`vi` and `en` objects).
- Language: `const [language, setLanguage] = useLanguage()` (from `@/i18n`) – persisted, switches instantly. `<LanguageToggle />` (features/auth/components) is the ready-made VI/EN control.
- Lint: `react/jsx-no-literals` fails on text in JSX children (`<Text>Hello</Text>` or `{'Hello'}`). Punctuation (`· – / : % + ( ) …`) and numbers are allowed. Props are not linted – still translate `accessibilityLabel`, `placeholder`, `title`.
- Format numbers/dates with `Intl` and the current language (`vi-VN` / `en-US`); see `app/(tabs)/today.tsx`.

## 4. UI kit (`@/ui`)

Rules (design-language.md): content on solid grouped surfaces, **glass only for floating controls**, **one mint accent** for the primary action and the user's own progress, data colors only in charts/bars, 16-pt gutters, 44-pt touch targets, SF Symbols, haptics.

| Component | Key props |
|---|---|
| `Screen` | `title` (large title), `eyebrow`, `headerRight`, `scroll` (default true), `gap` (20), `bottomInset`, `contentStyle`, `scrollProps` |
| `Text` | `variant`: `largeTitle · title · headline · body · subheadline · footnote · caption · metric · metricLarge` (metric = SF Pro Rounded, tabular digits); `color`: `label · secondary · tertiary · tint · onTint · destructive · warning · success` or any color; `weight`, `align` |
| `Card` | `padding` (16), `level`: `surface · nested` – radius 26/16, no border |
| `GroupedList` / `ListRow` | list: `header`, `footer`; row: `title`, `subtitle`, `value`, `icon` (SF Symbol in colored tile) + `iconColor` (`colors.icon.*`), `trailing`, `chevron`, `onPress`, `destructive`, `disabled` |
| `Button` | `title`, `onPress`, `variant`: `filled` (one per screen) · `tinted` · `gray` · `plain` · `inverted`; `size`: `large` (56, block) · `medium` (44) · `small` (34); `symbol`, `loading`, `disabled`, `destructive`, `block` |
| `GlassButton` | `accessibilityLabel` (required), `symbol`, `label`, `prominent` (mint glass), `size` (44), `color`, `onPress`. `GlassSurface` = raw glass container |
| `ProgressRing` | `progress` 0–1, `size` (112), `strokeWidth` (10), `color`, `trackColor`, `children` (center), `accessibilityLabel` |
| `ProgressBar` | `progress` 0–1, `color`, `height` (4), `accessibilityLabel` |
| `Stepper` | `value`, `onChange`, `min`, `max`, `step`, `format`, `accessibilityLabel`, `decrementLabel`, `incrementLabel` |
| `SegmentedControl` | `options: { value, label }[]`, `value`, `onChange`, `segmentWidth`, `accessibilityLabel` |
| `Chip` | `label`, `selected`, `onPress`, `symbol` |
| `TextField` | all `TextInput` props + `label`, `message`, `error`, `numeric` |
| `Symbol` | `name` (typed SF Symbol), `size`, `color`, `weight`, `fallback` |
| `sheetOptions()` / `SheetContent` | `detents`, `grabber`, `initialDetent`, `backgroundColor` / `title`, `headerRight`, `scroll` |
| `haptics` | `light` (tick set, water, buttons) · `selection` · `success` (meal saved) · `warning` · `error` · `heavy` (celebration) |
| tokens | `useTheme()` → `{ colors, isDark, spacing, radii, typography }`; `colors.data.protein/carb/fat/sugar/water/sleep`, `colors.icon.*`, `colors.streak/shield`; `MIN_TOUCH`, `hasLiquidGlass` |

**Styling:** NativeWind `className` for **layout only** (`flex-row`, `items-center`, `gap-2`, `px-4`, `mt-6`…). Colors, type and radii come from the kit/tokens (`style={{ backgroundColor: colors.surface }}`), never hex literals or Tailwind color classes – they don't follow light/dark. `StyleSheet.create` is fine for static layout too.

## 5. Data: Supabase + TanStack Query

- Client: `import { supabase, assertSupabase } from '@/lib/supabase'` – typed with `Database` from `@aurafit/db` (`Tables<'meal_entries'>`, `TablesInsert<…>`).
- Put queries/mutations in `src/features/<module>/api.ts`; screens only call the hooks. Reference: `src/features/profile/api.ts`.

```ts
export function useMealsForDay(day: LocalDate) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['nutrition', 'meals', user?.id, day],
    enabled: !!user && isSupabaseConfigured,
    queryFn: async () => {
      assertSupabase();
      const { data, error } = await supabase.from('meal_entries').select('*, meal_items(*)').eq('local_date', day);
      if (error) throw error;
      return data;
    },
  });
}
// mutations: useMutation({ mutationFn, onSuccess: () => qc.invalidateQueries({ queryKey: ['nutrition'] }) })
```

- Query keys start with the module name (`['nutrition', …]`) so a module can invalidate its own cache. Shared keys in `queryKeys` (`src/lib/queryClient.ts`).
- RLS protects data; never compute score/XP/streak in the app (server only, tech-stack rule 1).
- Validate external input (forms, AI JSON) with Zod.
- Zustand only for small UI/session state (`useAuthStore`); server data lives in TanStack Query.

## 6. Auth & navigation guard

- `useAuth()` → `{ session, user, initialized, isSignedIn, devPreview }`; `useSession()`, `useUser()`.
- Actions: `signInWithGoogle()`, `sendEmailOtp(email)`, `verifyEmailOtp(email, code)`, `signOut()` + mutation hooks `useSignInWithGoogle()`, `useSendEmailOtp()`, `useVerifyEmailOtp()`, `useSignOut()`.
- `app/_layout.tsx` guards groups with `Stack.Protected`: signed out → `(auth)`; signed in without `profiles.onboarding_completed_at` → `(onboarding)`; otherwise `(tabs)`. Don't navigate manually after sign-in/out – changing auth state re-routes.
- Finish onboarding with `useCompleteOnboarding()` (`src/features/profile/api.ts`).
- Without `.env` (no Supabase) the welcome screen shows a dev warning and a "preview without account" button (`__DEV__` only).

## 7. Using `@aurafit/core`

Pure, tested TypeScript (no React, no I/O), consumed from source through the workspace:

```ts
import { nutrition, time, workout, coach, health } from '@aurafit/core';
const zone = time.DEFAULT_TIME_ZONE;
```

Call core functions inside hooks/selectors (e.g. `useMemo` over query data) – never re-implement formulas in components. Need new logic? Add it (with tests) to `packages/core`, not the app.

## 8. Checks

`npm run typecheck -w @aurafit/mobile` · `npm run lint -w @aurafit/mobile` · `npm test -w @aurafit/mobile` (CI runs all three from the root). Install SDK-compatible native libs with `npx expo install <pkg>` inside `apps/mobile`; adding a native module requires a new dev build (EAS `development` profile). Not installed yet on purpose: Rive, HealthKit, victory-native, MMKV.
