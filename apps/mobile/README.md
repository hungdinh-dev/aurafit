# AuraFit – mobile app (`@aurafit/mobile`)

Expo SDK 58 · Expo Router · TypeScript strict. iOS first (bundle id `com.aurafit.app`, scheme `aurafit`). Conventions for contributors: [`CONVENTIONS.md`](./CONVENTIONS.md).

## Setup

```bash
# from the repo root (npm workspaces)
npm install
cp apps/mobile/.env.example apps/mobile/.env   # fill EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY
npm start -w @aurafit/mobile                    # or: cd apps/mobile && npx expo start
```

The app starts without `.env`: the welcome screen shows "Supabase is not configured", sign-in is disabled, and in development you can tap **Preview without an account** to browse the screens.

## Run on an iPhone

- **Expo Go** (quickest): install Expo Go from the App Store, run `npx expo start`, scan the QR code. Works for everything in M0 (all libraries are in Expo Go).
- **Development build** (needed once we add HealthKit, MMKV, Rive…):
  ```bash
  npx eas-cli@latest login
  npx eas-cli@latest build --profile development --platform ios   # registers your device, builds in the cloud
  npx expo start --dev-client
  ```

## Supabase Auth settings (one-time, in the Supabase dashboard)

- **Google**: Auth → Providers → Google, add the Web + iOS client IDs. Auth → URL Configuration → Redirect URLs: add `aurafit://auth/callback` (dev/production builds) and `exp://**` (Expo Go).
- **Email OTP**: Auth → Email Templates → Magic Link must include `{{ .Token }}` so users receive a 6-digit code.

## TestFlight (EAS, no Mac needed)

```bash
npx eas-cli@latest build --profile production --platform ios
npx eas-cli@latest submit --profile production --platform ios
```

Requires the Apple Developer Program. Set `EXPO_PUBLIC_*` values as EAS environment variables (`eas env:create`) for `preview`/`production` builds – `.env` is not uploaded.

## Scripts

| Script | |
|---|---|
| `npm start` | Expo dev server |
| `npm run ios` | dev server + iOS simulator (macOS only) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`eslint-config-expo` + no hard-coded UI strings) |
| `npm test` | Jest (`jest-expo`) |
