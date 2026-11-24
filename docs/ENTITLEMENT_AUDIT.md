# Entitlement audit

Date: 24 November 2026
Scope: what the app gates, where it gates it, and what still needs fixing.

## Summary

The free tier is defined in one place and enforced in three: the catalogue
flag, the player, and the session ledger. Two mismatches were found and fixed
in this branch. Premium programs are now gated too. Two gaps remain and are
listed at the end.

## Where entitlement comes from

The only source of paid access is the server-verified profile:

- `hooks/useAuth.ts` evaluates `globalEntitlementEngine` only when
  `profileSource === 'AUTHORITATIVE_FIRESTORE'`.
- A cached local profile is treated as free. It cannot grant premium.
- `lib/entitlements/entitlement-service.ts` requires an active premium or
  trial status and an end date in the future.
- The `handleSubscriptionWebhook` cloud function fails closed with 500 when
  `WEBHOOK_SECRET` or `REVENUECAT_WEBHOOK_SECRET` is not configured. It
  returns 401 for a missing or wrong token.

## Free tier

Nine records are free. They are every record whose Hz is 432, 528, 639, 7.83
or 8. The seed sets `isPremium` from that list, so proximity to the trust
triangle is the only rule.

- 46 records total
- 9 free
- 37 premium

`__tests__/free-tier.test.ts` pins these counts and checks that every free
record is a trust-triangle frequency.

Free listening limits:

- 15 minutes per session
- 3 session starts per calendar day
- counted in a local ledger (`lib/usage/SessionLedger.ts`)
- a preview consumes one of the 3 starts

## What was broken

### Free binaural and chakra records were locked

`components/AudioPlayer.tsx` locked any record in the chakra or binaural
category, even when the seed marked it free. The 8 Hz binaural record is free
in data but was treated as premium in the player.

The player now trusts `isPremium` alone. The seed already marks binaural and
chakra records premium by default, except trust-triangle frequencies.

### Locked tracks could hit the duration gate before the preview

A locked track on a 30-minute timer sent `30` to `attemptStartSession`. A free
listener then hit the 15-minute duration gate and never saw the 3-minute
preview.

A locked track now requests the smaller of the timer and the free cap, so the
preview is authorised first. The preview then ends at the preview length and
shows the paywall with the `preview_complete` trigger.

## Preview length

The default is 180 seconds. It resolves in this order:

1. a runtime override set by a future remote-config provider
2. `extra.previewDurationSeconds` in the Expo app config, changeable by an
   OTA update
3. the canonical 180-second default

The preview badge reads from the same function, so it cannot say 3 minutes
while playing 4. Tests cover the default, an override and invalid values.

## Premium programs

Three programs are flagged `isPremium: true` in `seed/programs.ts`: session-6,
session-10 and session-12. `sessions.tsx` keeps the flag when it maps the
program list, marks those cards, and opens the paywall instead of starting
playback. `lib/catalogue/program-access.ts` holds the rule and
`__tests__/program-access.test.ts` pins both the locked and free sets.

The paywall now advertises guided programs because the gate is enforced.

## Gaps that remain

### 1. Offline grace is defined but unreachable

`CANONICAL_PREMIUM_POLICY.offlineGracePeriodHours` is 72, and the entitlement
engine can enforce it, but `useAuth.ts` never passes `isOffline`. A cached
profile therefore grants no premium at all, even within the window.

This is safe (fail closed) but the policy constant is misleading. Either pass
the offline flag and a real verification timestamp, or delete the policy
field. `lastVerifiedAt` is currently `lastLoginAt`, which is a login time, not
an entitlement verification time.

## Removed flags

`offlineDownloads` and `customMixing` were granted to premium users but no
code read them. They are removed from the entitlement type, the capability
registry, the cloud function response and the operational feature flags.
Do not re-add either without an implementation.

## Verified enforcement points

| Claim | Enforced in |
|---|---|
| 37 premium records | `seed/frequencies.ts` `isPremium`, gated in Explore and `AudioPlayer.tsx` |
| Full-length sessions | `hooks/usePremiumUsage.getMaxSessionDuration`, session clock cap in `AudioPlayer.tsx` |
| 3 sessions a day | `lib/usage/SessionLedger.ts`, `attemptStartSession` |
| Binaural and chakra tones | seed `isPremium` plus `CapabilityRegistry` in `EntitlementValidator` |
| Own affirmations | `AffirmationStreamCard` returns early when not premium |
| Guided programs | `seed/programs.ts` `isPremium`, `isProgramLocked` in `sessions.tsx` |
| Progress insights | `UsageAnalyticsModal.hasAccess` |
| Webhook fail-closed | `functions/src/index.ts` `handleSubscriptionWebhook` |

## Tests

- `expo/__tests__/free-tier.test.ts`
- `expo/__tests__/preview-config.test.ts`
- `expo/__tests__/entitlements/*`
- `expo/__tests__/audio/CatalogueAudioAudit.test.ts`
- `expo/__tests__/premium-benefits.test.ts`

## Needs human review

1. Offline access: decide whether premium should survive a short offline
   period. If yes, record a verification timestamp and pass `isOffline`.
2. Session ledger tampering: a local ledger resets if the user clears app
   data. Accept this as a UX limit or move the count to the server.
3. iOS: the store-management link and RevenueCat product setup are untested
   on a device.
4. Trial reminder: it only fires if notification permission is granted. There
   is no email fallback.
