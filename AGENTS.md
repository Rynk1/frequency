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
  Note that Python's `Path.read_text()` silently converts CRLF to LF, so a
  `read_text()`/`write_text()` round-trip rewrites the whole file. Edit with
  `read_bytes()`/`write_bytes()`, or check `git diff --stat` afterwards: a file
  showing every line changed means the endings were mangled.
- When `expo/functions/src/index.ts` changes, rebuild (`npm run build`) so the
  committed `lib/` stays in sync — a stale `lib/` previously contained a Stripe
  signature bypass that was already fixed in source.

## Premium claims

- **Every advertised benefit must map to an enforced code path.**
  `expo/lib/premium-benefits.ts` is the single source of paywall copy, and each
  entry records the code that enforces it. `PremiumModal`, `PremiumGate` and
  `app/subscription-result.tsx` all render from it, so copy cannot drift
  between surfaces. `__tests__/premium-benefits.test.ts` fails if an unbuilt
  claim is re-advertised.
- Offline downloads, custom frequency mixing and priority support were once
  advertised with nothing behind them. Do not re-add a benefit without real
  gating; the paywall is a purchase contract.
- The `offlineDownloads` / `customMixing` capability flags are still granted
  to premium users but nothing reads them. Remove or implement before
  relying on them.

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
- **Trial countdown:** use `getTrialDaysLeft(trialEndsAt)` from `lib/pricing.ts`
  for every "N days left" label. It clamps a running trial to a minimum of 1 day
  so a user on their last day never sees "0 days left", and 0 once it has ended.
  Do not recompute this inline (the raw `Math.ceil(...)` form produced "0 days").
- **Deep links:** `app/+native-intent.tsx` must preserve `?subscription=` return
  params (and `session_id`) — Google Play returns the user to the app through this
  link, and stripping the query leaves them on a blank root screen after payment.
- `app/index.tsx` reads `subscription`/`session_id` from the root URL and routes to
  `app/subscription-result.tsx`; the result screen only *verifies* via
  `reconcileSubscription` and never mutates entitlement itself.
- Entitlement `source` is `'google_play' | 'revenuecat'`.
- The `handleSubscriptionWebhook` cloud function must verify
  `WEBHOOK_SECRET` / `REVENUECAT_WEBHOOK_SECRET` and **fails closed** (500) when the
  secret is not configured — never grant premium on an unauthenticated event.

## Audio player semantics

- **Pause and stop are different operations.** `pause()` holds the loaded track:
  the web renderer ramps gain to zero and keeps the oscillators alive, the native
  renderer calls `pauseAsync()` on the loaded sound. `stop()` tears everything
  down. Never wire a "Pause" affordance to `stopFrequency()` — that was the
  original bug and it loses the listener's session.
- **Anything time-based must gate on `isPaused`.** The session countdown and the
  listening-time accumulator both live in the tick effect in
  `components/AudioPlayer.tsx`. Its dependency list must include `isPaused`, or a
  paused session keeps draining while silent.
- **Dismissing the mini-bar stops audio.** `stopAndClose` in
  `lib/player/PlayerContext.tsx` calls `globalAudioEngine.stop()`. The engine is a
  process-wide singleton, so mutating only React state leaves the tone playing
  with no control surface.
- **"Repeat when finished" must be read at completion.** The toggle in the player
  menu is only meaningful if the session-complete and timer-complete branches
  check it before stopping.
- Background audio is a user preference (`settings.backgroundAudio`) applied per
  `play()` through `setAudioModeAsync`; it does not take effect mid-track.
