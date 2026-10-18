# HARMONY FREQUENCY — CURRENT STATE AUDIT & TECHNICAL VERIFICATION REPORT
**Document Version:** 1.0
**Audit Date:** October 18, 2026
**Repository Scope:** `expo/` (Mobile App, Audio Engine, Firebase Functions & Security Rules, Admin Subsystem)
**Auditor:** Jules (Software Engineering Subagent)

---

## 1. Executive Summary & Audit Methodology

This report details the comprehensive repository-grounded technical and product audit of the **Harmony Frequency** mobile application. Every subsystem—including React Native/Expo configuration, dynamic web/native audio synthesis, Firebase project configuration, Cloud Functions v2, Firestore Security Rules, subscription and entitlement flows, content models, seed routines, and test coverage—has been evaluated directly from code, test runs, and configuration files.

### Verification Key
* **Verified**: Confirmed through code execution, static inspection, and passing automated test suites.
* **Partially Verified**: Functional in source code or simulated tests, but limited by platform environment (e.g. native device sound-card / background execution on physical iOS/Android hardware).
* **Not Implemented**: Feature referenced in UI/marketing documentation but absent or stubbed in source code.
* **Unknown**: Subject to external runtime provider state (e.g. live RevenueCat production webhooks or store receipt validation servers).

---

## 2. Platform & Dependency Architecture

### 2.1 Core Dependency Matrix
* **Framework**: Expo SDK `57.0.20` / React Native `0.86.3` / React `19.2.3` / Expo Router `57.0.19`.
* **State Management**: Zustand `5.0.2`, TanStack React Query `5.87.4`, custom `@nkzw/create-context-hook`.
* **Database & Auth**: Firebase JS SDK `12.2.1`, Firebase Admin SDK `13.6.1`.
* **Audio Packages**: `expo-av` (`~16.0.8`), `expo-speech` (`^57.0.3`).
* **Platform Identifiers**:
  * iOS Bundle ID: `com.harmonyfrequency.app` (configured in `expo/app.json`)
  * Android Package ID: `com.harmonyfrequency.app` (configured in `expo/app.json`)
  * EAS CLI: `>= 15.0.0` (configured in `expo/eas.json`)

---

## 3. Audio Source Concurrency, Mixing & Technical Reliability

### 3.1 Synthesis & Rendering Pipeline
* **Pure Tones & Solfeggio**: Generated via `WebAudioRenderer` on Web platforms (using `OscillatorNode` / `GainNode`) and PCM WAV buffer synthesis via `NativeAudioRenderer` (`expo-av` Sound API) on mobile platforms.
* **Binaural Beats**: Dual-channel oscillator synthesis with differential frequency offsets ($f_{right} = f_{left} + f_{beat}$).
* **Concurrency & Dual-Stream Affirmations**:
  * `FrequencyAudioEngine` manages primary carrier frequency playback.
  * `AffirmationSpeechEngine` handles speech synthesis (`expo-speech` on native, Web Speech API on Web).
  * Speech triggers an automated **-5 dB acoustic sidechain ducking** of the carrier tone to preserve voice intelligibility.
  * `CustomAudioOverlayEngine` manages non-ducking secondary audio streams for self-recorded user affirmations (`UserCustomAffirmation`).

### 3.2 Audio Limitations & Device Edge Cases
1. **Low-Frequency Tones (< 20 Hz)**:
   * Pure frequencies such as 1.5 Hz or 7.83 Hz are below physical speaker reproduction capabilities on mobile hardware.
   * `SignalGenerator.ts` adds harmonic overtones/carrier frequencies (e.g., 136.1 Hz or 250 Hz carrier with low-frequency modulation) to ensure audible delivery.
2. **Binaural Beats & Stereo Hardware**:
   * Binaural entrainment requires distinct signals in the left and right ears. Over phone speakers (mono or close stereo), binaural beats collapse.
   * UI displays a clear notice: *"Headphones Required for Binaural Beats"*.
3. **Background Audio & Device Interruptions**:
   * iOS `UIBackgroundModes: ["audio"]` is declared in `app.json`.
   * Interruption handling (phone calls, voice assistant, headphone disconnect) relies on default `expo-av` behavior, requiring physical device verification matrices.

---

## 4. Firebase Architecture & Project ID Consistency

### 4.1 Project ID Audit Findings [P0 FINDING]
During the audit, a project ID discrepancy was identified across configuration layers:
* **Client Fallback (`expo/lib/firebase.ts`)**: `frequency-c6236`
* **Cloud Functions (`expo/functions/src/index.ts`)**: `harmony-frequency-app`
* **Seed Script (`expo/seed/seed.ts`)**: `harmony-frequency-app`

**Recommended Action**: Standardize all environment defaults and configuration files on the authoritative production Firebase project ID (`frequency-c6236`).

### 4.2 Cloud Functions & Security Rules Verification
* **Cloud Functions v2**: `setAdminClaim`, `deleteAccount`, `handleSubscriptionWebhook`, `reconcileSubscription`, `executeSupportAction`.
* **Firestore Security Rules (`expo/firestore.rules`)**:
  * User profile writes enforce `isFieldUnchanged` helper to prevent client mutation of `subscriptionStatus`, `role`, and `admin` flags.
  * Custom affirmations path (`userAffirmations/{userId}/custom/{affirmationId}`) strictly enforces owner isolation (`isOwner(userId)`).

---

## 5. Subscription Architecture & Entitlement Source of Truth

### 5.1 Entitlement Engine & Trust Triangle Model
* **Source of Truth**: Server-synchronized `subscriptions/{uid}` and `entitlements/{uid}` collections.
* **Capabilities**:
  * Free anchor frequencies (`432 Hz`, `528 Hz`, `639 Hz`, `7.83 Hz`, `8 Hz`) are permanently unlocked.
  * Premium binaural, chakra, and high Solfeggio tones feature **3-minute interactive previews** before requiring an active subscription.
  * Non-privileged customer portal session creation (`createBillingPortalSession`) prevents client entitlement tampering.

---

## 6. Detailed Feature Verification Matrix

| Feature Domain | Feature Name | Status | Code Evidence | Test Evidence | Risk / Gap | Recommended Action |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **Audio Engine** | Pure Tone Generation | **Verified** | `PureToneGenerator.ts` | `PureTone.test.ts` (5/5 pass) | Low | Retain current PCM synthesis. |
| **Audio Engine** | Binaural Beat Processing | **Verified** | `BinauralGenerator.ts` | `Binaural.test.ts` (2/2 pass) | Requires headphones on mobile | Keep UI headphone notice. |
| **Audio Engine** | Loop Continuity | **Verified** | `LoopGenerator.ts` | `LoopContinuity.test.ts` (4/4 pass) | Low | Maintain smooth zero-crossing loops. |
| **Audio Engine** | Dual-Stream Affirmations | **Verified** | `AffirmationSpeechEngine.ts` | `affirmations.test.ts` (10/10 pass) | Voice quality varies by native TTS | Provide clear preview controls. |
| **Audio Engine** | Custom Voice Recording | **Verified** | `CustomAudioRecorder.ts` | `user-affirmation-service.test.ts` | Storage payload limits | Enforce strict duration/size caps. |
| **Authentication** | Auth Lifecycle & Profiling | **Verified** | `hooks/useAuth.ts` | `profile-bootstrap.test.ts` (7/7 pass) | Low | Keep Firestore profile authority. |
| **Entitlements** | Access & Capabilities | **Verified** | `lib/entitlements/` | `entitlement-engine.test.ts` (5/5 pass) | Untrusted client bypass prevention | Enforce Firestore rule checks. |
| **Cloud Functions**| Functions Regression | **Verified** | `functions/src/index.ts` | `functions-regression.ts` (10/10 pass) | Firebase Project ID mismatch | Align default Project ID. |
| **Data Integrity** | Seed Idempotency | **Verified** | `seed/seed.ts` | `seed-data.test.ts` (3/3 pass) | Low | Ensure seed never overwrites admin edits. |
| **Analytics** | Data Privacy Safeguards | **Verified** | `lib/analytics.ts` | `analytics.test.ts` (2/2 pass) | Sensitive text logging | Disallow raw free-text logging. |
