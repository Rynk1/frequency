# AGENTS.md

Repository-specific knowledge for the Harmony Frequency mobile app.

## Layout

- `expo/` — Expo / React Native app (expo-router). Run app commands from here.
- `expo/functions/` — Firebase Cloud Functions (TypeScript). `src/index.ts` is the
  source of truth; `lib/` is compiled output that is committed and deployed.
- `docs/` — product, security and release documentation.

## Commands

- Install (root may have no `node_modules`): `cd expo && npm install --legacy-peer-deps`
- Typecheck: `cd expo && npx tsc --noEmit`
- Unit tests: `cd expo && npm test` (vitest)
- Functions: `cd expo/functions && npm install --legacy-peer-deps && npm run build`
- Functions regression: `cd expo/functions && npx tsx __tests__/functions-regression.ts`
  - Some tests hit real Firestore; without credentials/emulator the run can hang
    after the pure-logic assertions. Fast-fail tests are ordered before them.

## Conventions

- Several app files use **CRLF** line endings (e.g. `components/PremiumModal.tsx`,
  `app/subscription-result.tsx`, `app/index.tsx`, `app/admin/(dashboard)/settings.tsx`).
  Preserve CRLF when editing these, or the diff balloons with whitespace noise.
- When `expo/functions/src/index.ts` changes, rebuild (`npm run build`) so the
  committed `lib/` stays in sync — a stale `lib/` previously contained a Stripe
  signature bypass that was already fixed in source.

## Payment / subscription architecture

- **Billing authority is Google Play** (mobile app), brokered through RevenueCat
  (`react-native-purchases`). There is no Stripe integration and none should be
  added for in-app purchases.
- **Single source of truth for pricing:** `expo/lib/pricing.ts` (`PREMIUM_PLANS`,
  `PREMIUM_PRODUCT_IDS`, `PREMIUM_TRIAL_DAYS`). Product ids: `monthly_premium`
  ($9.99/mo) and `yearly_premium` ($59.99/yr). The paywall renders the live Google
  Play price at runtime (`getStoreOfferings`) and falls back to these constants.
  Keep `docs/production-release.md`, `docs/PRODUCT_TO_CONSUMER_FIT_REPORT.md`,
  the Google Play listings and RevenueCat products in sync with `pricing.ts`.
- Entitlement `source` is `'google_play' | 'revenuecat'`.
- The `handleSubscriptionWebhook` cloud function must verify
  `WEBHOOK_SECRET` / `REVENUECAT_WEBHOOK_SECRET` and **fails closed** (500) when the
  secret is not configured — never grant premium on an unauthenticated event.
