# CLAUDE.md — UriScan AI

> **Always read this file first before starting any task. After finishing a task that changes architecture, conventions, commands, or product rules, update this file in the same change.**

## Product
- Android-only (US/Canada) hydration app: user photographs urine color (or picks a swatch) → app estimates hydration level, tracks water intake, shows history/trends.
- Monetization: one-time **$9.99 "unlock all"** (RevenueCat entitlement `uriscan ai Pro`, Play Store). Only the **detailed report** (and its PDF export) is Pro-gated; everything else is free.
- **Force sign-in**: unauthenticated users are redirected to `/(auth)/sign-in` (see `useAuthGate` in `app/_layout.tsx`).
- Medical disclaimer must remain visible on scan/result flows (`components/DisclaimerBanner.tsx`).

## Stack
Expo SDK 54 · React Native 0.81 (new arch, React Compiler) · expo-router 6 (typed routes) · TypeScript · Zustand stores · TanStack Query · Supabase (auth + Postgres) · Google Sign-In · RevenueCat (`react-native-purchases`) · expo-print/sharing for PDF.

## Commands
- `npm run dev` — `expo run:android` (dev build; Expo Go won't work: native modules)
- `npm start` — Metro; `npm run lint` — `expo lint`; `npx tsc --noEmit` — typecheck
- `npm run build:icons` — regenerate PNG icons from `assets/icons-source/*.svg` (sharp)
- `npm run prod` — EAS production AAB; `npm run build` — local `gradlew bundleRelease`

## Layout
- `app/` — routes. `(auth)/` sign-in/up, forgot/reset password, auth-callback; `(tabs)/` index (home), tracker, history, profile; `scan.tsx`, `result.tsx`, `report/[reportId].tsx`, `reminders.tsx`, `account-deletion.tsx`.
- `store/` — Zustand: `useAuthStore` (session), `useHydrationStore` (today's scans/stats), `usePurchaseStore` (entitlement), `useTrackerStore` (water intake, local settings).
- `lib/` — `colorAnalysis.ts` (photo → pixel sampling, glare/shadow rejection, nearest swatch + confidence), `hydrationEngine.ts`, `reportEngine.ts` (detailed report data), `teaserCopy.ts` (free teaser), `database.ts` (all Supabase reads/writes; always scoped to the signed-in user), `notifications.ts`, `settings.ts`, `iap/` (RevenueCat wrapper + SKU/price constants), `pdf/` (HTML template + export), `supabase/client.ts`.
- `constants/hydrationData.ts` — swatches and per-level content (core domain data); `constants/theme.ts` is the design-token source (`colors.ts` is legacy/secondary).
- `components/` — UI; `components/report/` has `Paywall`, `ReportTeaser`, `DetailedReport`.
- `supabase/migrations/` — SQL. `profiles` table has RLS; a trigger blocks clients from changing entitlement columns, so entitlement can only be written server-side/definer paths.
- `docs/` — `SETUP_AUTH.md`, `PRIVACY_POLICY.md`, `ACCOUNT_DELETION_INSTRUCTIONS.md`, Play Data Safety CSV.
- `android/` and `ios/` are generated (gitignored); change native config via `app.json` / config plugins.

## Scan reticle → photo mapping
The scan screen's circle reticle is pinned to the exact center of the camera view (own absolute layer, tips card sits at the top). On capture, `reticleRegion()` in `app/scan.tsx` measures the reticle (`measureInWindow`) and maps it through the preview's "cover" crop (`coverMap` in `lib/colorAnalysis.ts`) to a `SampleRegion`; `analyzePhotoColor(..., region)` samples that spot, and the review screen draws the circle + center dot over the sampled region. Gallery picks have no region (center crop).

## Release (Play Store)
- Production build: `npm run prod` (EAS, AAB). EAS production env must contain all five `EXPO_PUBLIC_*` vars (Supabase URL/anon key, Google web/android client IDs, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`) — as of 2026-10-20 the RevenueCat key was missing from EAS production env.
- `google-services.json` is untracked, so EAS cloud builds won't see it unless it is committed or supplied as an EAS file env var.
- `eas.json` has no `appVersionSource`/`autoIncrement`; local `versionCode` is 3 — confirm the highest code already uploaded to Play before building.

## Conventions
- Import via `@/` alias. Match existing style: functional components, `StyleSheet.create`, tokens from `@/constants/theme`.
- Data access goes through `lib/database.ts`, not ad-hoc `supabase` calls in screens.
- Env vars are `EXPO_PUBLIC_*` (see `.env.example`): Supabase URL/anon key, Google web/android client IDs, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
- IAP bypass: `expo.extra.bypassIap` in `app.json` (must be `false` for release) or Expo Go → provider `mock`.
- Android package: `com.uriscanai.app`; URL scheme `uriscanai`.

## Secrets — never commit
`.env*` (except `.env.example`), `credentials.json`, `credentials/` (keystores), `*.jks`, `tmp/`. Never print or `cat` these files. `google-services.json` is Firebase client config referenced by `app.json`; it is currently untracked — decide deliberately before committing it.
The `origin` git remote URL must not embed a token; use a credential helper or `gh auth`.

## Git
Default branch `master`. Commit messages are short imperative summaries. `.claude/settings.local.json` is machine-local; don't include it in feature commits.
