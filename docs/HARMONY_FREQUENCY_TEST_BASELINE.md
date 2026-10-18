# HARMONY FREQUENCY — TEST BASELINE & REGRESSION SUITE REPORT
**Document Version:** 1.0
**Audit Date:** October 18, 2026
**Environment:** Linux 6.6 x86_64 / Node.js `v22.22.1` / npm `10.9.4` / Vitest `v2.1.9` / tsx `v4.23.15`

---

## 1. Test Execution Commands & Environment Setup

All automated test suites were executed within the `expo/` sandbox environment:

```bash
# Core Application & Audio Engine Unit Tests (Vitest)
cd expo && npm test -- --run

# Firebase Cloud Functions v2 Regression Tests (tsx)
cd expo && npx tsx functions/__tests__/functions-regression.ts
```

---

## 2. Automated Test Results Summary

### 2.1 Core Application Suite (`expo/`) — Vitest
* **Total Test Files**: 15 passed (15)
* **Total Tests**: 67 passed (67)
* **Execution Duration**: 2.15 seconds

#### Test File Breakdown
| Test File Path | Tests Passed | Domain Covered | Result |
| :--- | :---: | :--- | :---: |
| `__tests__/admin-overview.test.ts` | 11 | Admin analytics metrics, authorization, and tenant isolation | **PASS** |
| `__tests__/profile-bootstrap.test.ts` | 7 | User profile state machine (`AUTHENTICATED`, `READY`, cache fallback) | **PASS** |
| `__tests__/cache-isolation.test.ts` | 3 | Multi-user UID-scoped AsyncStorage cache isolation | **PASS** |
| `__tests__/entitlement-engine.test.ts` | 5 | Capabilities, Trust Triangle free frequencies, 3m preview validation | **PASS** |
| `__tests__/affirmations.test.ts` | 10 | Dual-stream speech engine, -5 dB ducking, intent scope matching | **PASS** |
| `__tests__/audio/PureTone.test.ts` | 5 | PCM WAV pure tone synthesis & signal generator zero-crossing | **PASS** |
| `__tests__/audio/Binaural.test.ts` | 2 | Differential stereo channel oscillator synthesis | **PASS** |
| `__tests__/audio/LoopContinuity.test.ts` | 4 | Seamless loop buffer continuity & click prevention | **PASS** |
| `__tests__/user-affirmation-service.test.ts` | 2 | Custom user voice affirmation Firestore subcollection caching | **PASS** |
| `__tests__/recommendation.test.ts` | 4 | Seed-hashed daily recommendations (`userId + YYYY-MM-DD`) | **PASS** |
| `__tests__/auth-error-mapping.test.ts` | 4 | User-friendly auth error mapping and recovery prompts | **PASS** |
| `__tests__/subscription-status.test.ts` | 4 | RevenueCat billing portal delegation and non-privileged cancellations | **PASS** |
| `__tests__/audio/CatalogueAudioAudit.test.ts` | 1 | Comprehensive validation of all 46 canonical catalogue entries | **PASS** |
| `__tests__/seed-data.test.ts` | 3 | Non-destructive idempotent seed data integrity | **PASS** |
| `__tests__/analytics.test.ts` | 2 | Minimal event logging & private text exclusion verification | **PASS** |

---

### 2.2 Cloud Functions v2 Regression Suite — tsx
* **Total Tests**: 10 passed (10)
* **Execution Duration**: 0.85 seconds

#### Function Test Breakdown
| Cloud Function Endpoint | Test Check Performed | Result |
| :--- | :--- | :---: |
| `setAdminClaim` | Rejects GET / non-POST HTTP methods | **PASS** |
| `setAdminClaim` | Rejects unauthenticated caller with 401 | **PASS** |
| `deleteAccount` | Enforces POST-only method check | **PASS** |
| `handleSubscriptionWebhook` | Enforces POST-only method check | **PASS** |
| `handleSubscriptionWebhook` | Rejects unsigned or missing auth signature with 401 | **PASS** |
| `handleSubscriptionWebhook` | Validates authenticated RevenueCat webhook payload structure | **PASS** |
| `reconcileSubscription` | Rejects GET / non-POST HTTP methods | **PASS** |
| `reconcileSubscription` | Rejects unauthenticated user with 401 | **PASS** |
| `executeSupportAction` | Rejects unauthenticated caller with 401 | **PASS** |
| `executeSupportAction` | Processes authenticated admin support refund action | **PASS** |

---

## 3. Untested Areas & Known Test Gaps

1. **Physical Hardware Audio Interruptions**:
   * Incoming phone call interruptions, Siri/Google Assistant triggers, and physical headphone plug/unplug audio routing cannot be tested inside headless Linux CLI environment.
   * **Action Required**: Conduct physical iOS/Android device matrix verification during Stage 2.
2. **Native Microphones & Custom Recording**:
   * Native device microphone audio buffer capture via `expo-av` / `MediaRecorder` requires physical device testing.
3. **Live App Store Purchase Webhooks**:
   * End-to-end sandbox purchase verification relies on live RevenueCat / Apple / Google store receipt validation servers.
