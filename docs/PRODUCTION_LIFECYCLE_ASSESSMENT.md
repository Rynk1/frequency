# HarmonyFrequency — Production Lifecycle Assessment

**Date:** 2026-11-19
**Scope:** Full responsiveness, functional correctness, category fit, consumer-psychology usability, cross-feature dependency integrity, and Play Store release readiness.
**Method:** Static audit of the Expo app, targeted runtime verification via Metro web bundle, unit/regression suite, and a control-by-control trace of every user-facing action to the code path it invokes.

---

## 1. Executive summary

HarmonyFrequency is a **single-tone / session-based frequency player with affirmations and a premium tier**. That is a narrow, well-understood category, and the app's information architecture fits it: pick a frequency or a curated session, play it, optionally layer voice affirmations, optionally full-screen the visualiser.

The app is **not yet releasable**. The blocking problems were not missing features — they were controls that lied. The most serious: every "Pause" button destroyed the track, and the mini-bar's X hid the only control surface while audio kept playing. For a sleep/meditation app, where the dominant use is "start it, lock the phone, drift off", those two defects alone would have produced one-star reviews and refund requests.

Two fix rounds are now merged or in review (PR #50, PR #51) plus PR #52 for the player work. With those, the core loop is honest. What remains is **verification on real devices**, a small number of **missing operational actions**, and **store-submission metadata**.

**Verdict:** functionally coherent, category-appropriate, and close to releasable — but it needs a device pass and the gaps in §7 closed first. Do not publish on the strength of automated tests alone; this app's core value is audio behaviour, which unit tests cannot hear.

---

## 2. What the app is for, and whether it does it

The intended user: someone who wants a tone or a short guided session for sleep, focus, or winding down. They open the app, choose something, start it, and mostly stop looking at the screen.

Judged against that:

| Requirement | Status | Notes |
|---|---|---|
| Start a tone in few taps | ✅ | Sessions is the landing tab; frequencies are one tap from a card |
| Keep playing with the screen off | ✅ | `UIBackgroundModes: audio` + `staysActiveInBackground`, user-toggleable |
| Pause without losing place | ✅ *(fixed)* | Was destructive; now true pause/resume across engine, both renderers, both UI surfaces |
| Stop cleanly | ✅ *(fixed)* | X on the mini-bar now actually stops; previously it orphaned playback |
| Know what is playing from anywhere | ✅ | Persistent `NowPlayingBar`, correctly offset above the tab bar |
| Session ends on its own | ✅ | Timer + optional fade-out, auto-stop preference |
| Repeat for sleep | ✅ *(fixed)* | "Repeat session" was a dead toggle; now restarts session and single tones |
| Full-screen visual for focus | ✅ | `ImmersiveStage`, now safe-area correct with Android back handling |
| Paywall is truthful | ✅ *(fixed in #51)* | Offline-download and custom-mixing claims removed |

**Category fit: good.** The app does not overreach into features the category doesn't need. The scope is honest. The risk was never ambition — it was that the transport controls, the one thing this category must get right, were broken.

---

## 3. Visual and consumer-psychology review

### 3.1 What works

- **One primary action per screen.** The player has an unambiguous centre-of-mass: the large gradient play button. Correct for the category.
- **Progressive disclosure is mostly right.** Details, settings, timer, playlist and insights live behind the overflow menu rather than competing with the transport.
- **The minimised bar is the right pattern.** It gives a constant, low-cost handle on playback without forcing the full player. Its "Playing / Paused · 528 Hz" subtitle answers the two questions a user actually has.
- **Premium gating is visible but not punitive.** Locked durations show a lock glyph and open a modal rather than dead-ending.
- **Empty states are written, not blank.** History and insights have copy that explains what will appear.

### 3.2 What was working against the user

- **A red pause button.** The play/pause control turned red (`#FF3B30`) while playing. Red is the universal stop/destructive signal. Users primed to read red as "stop" were being taught the wrong thing, and the actual behaviour *was* stop — so the colour was honest about a broken function. It is now a genuine pause, but the colour still says "stop". **Recommendation:** keep the gradient primary colour for both states, or use a neutral/amber pause. Reserve red for the X.
- **Dead controls in prime real estate.** Skip-previous/next sat in the transport row permanently disabled for single tones, which is the app's main mode. Two of five transport slots did nothing. Now hidden outside session mode.
- **Two settings panels with one shared toggle.** "Playback settings" and "Timer and fade" both flipped fade-out. A user changing it in one place and checking the other would find it apparently reverted. Now consolidated.
- **A scrubber that needed a drag.** Tapping did nothing; only dragging moved it. Users tap progress bars. Now responds to taps and measures its own width, so it maps correctly on tablets where the column is centred.
- **"Pause" that lost the session.** Beyond the audio loss, the countdown kept running while paused (the tick effect did not depend on pause state), so a user who paused for ten minutes returned to a session ten minutes shorter. Fixed.

### 3.3 Remaining psychology gaps (not blockers)

- **No confirmation of what will happen at the end of a session.** A user setting a 45-minute sleep timer is trusting the app to stop. There is an auto-stop setting, but the player does not state plainly "this will stop at the end". Consider surfacing the resolved behaviour near the timer control.
- **The affirmation mode selector uses four labels — Off / Visual / Voice / Both.** "Both" is clear only after you have seen the other two. Acceptable, but first-run users may not connect "Voice" to the spoken affirmations section below it.
- **Volume and mute are separate affordances** (a volume button opening a popover, plus a mute state). Two mental models for one concept. Works, but is a candidate for simplification.

---

## 4. Functional and operational audit

### 4.1 Controls traced end-to-end

Every interactive element in the player, mini-bar, and settings was traced to its handler and then to the effect it produces.

| Control | Intended | Actual before | Actual now |
|---|---|---|---|
| Play/Pause (player) | Toggle playback | `stopFrequency()` — destroyed track | True pause/resume |
| Play/Pause (mini-bar) | Toggle playback | Same destructive call | True pause/resume |
| Immersive stage play | Toggle playback | Same destructive call | True pause/resume |
| Mini-bar X | Dismiss playback | Hid bar, **audio kept playing** | Stops audio and closes |
| Mini-bar tap | Expand player | Works | Works |
| Skip prev/next | Move within session | Permanently disabled outside sessions | Hidden outside sessions |
| Progress scrubber | Set remaining time | Drag-only, hardcoded 40px offset | Tap or drag, self-measured |
| Repeat session | Loop | **Dead toggle — state written, never read** | Restarts session and single tones |
| Fade out at end | Fade final 10s | Works (two entry points) | Works (one entry point) |
| Timer & fade panel | Session length | Works | Works |
| Visual style | Cycle visualiser | Works | Works |
| Frequency details | Show info | Works | Works |
| Session playlist | Jump to track | Works | Works |
| Listening insights | Show history | Works | Works |
| Delete account | Remove account | Works, confirmed | Works |
| Restore purchases | Recover entitlement | Works, with error copy | Works |

### 4.2 Cross-feature dependencies (disconnect check)

This is where the most valuable findings were. Features that *look* independent but are wired together:

1. **Pause ↔ session countdown ↔ listening-time tracking.** The tick loop gated only on `isPlaying`, so pausing did not stop the countdown or the listening-time accrual. Three subsystems silently disagreed about whether the user was listening. **Fixed** — `isPaused` added to the effect dependency and both guards.

2. **Mini-bar dismiss ↔ audio engine.** `stopAndClose` mutated only React state; the engine is a process-wide singleton and kept playing. The UI and the audio had no shared notion of "stopped". **Fixed** — dismiss now calls the engine.

3. **Repeat toggle ↔ session completion.** The completion branch unconditionally stopped (subject to auto-stop) and never consulted the repeat flag. **Fixed** — completion now branches on repeat before stopping.

4. **Affirmation speech ↔ playback.** Correctly dependent: `AffirmationStreamCard` stops speech and the overlay engine when `isPlaying` goes false, and the cleanup function stops both on unmount. This one was already right, and it now benefits from pause actually pausing.

5. **Background audio preference ↔ audio session.** `setBackgroundPlayback` is applied per `play()` via `setAudioModeAsync`. Correct, and documented as taking effect on next play. No disconnect.

6. **Session completion ↔ Firestore.** `onSessionComplete` is threaded from `sessions.tsx` → `PlayerContext` → `PlayerHost` → `AudioPlayer`. Verified continuous; no broken prop chain.

7. **Premium entitlement ↔ duration cap ↔ locked presets.** `maxFreeDuration` derives from the single `DEFAULT_PREMIUM_POLICY`, and the same value drives the cap, the lock glyphs and the upsell copy. No drift.

8. **Deep link `?subscription=` ↔ result screen.** `app/index.tsx` reads and routes; `+native-intent.tsx` preserves the params. Verified intact (and this was the subject of an earlier fix — do not regress it).

9. **Favourites ↔ player heart ↔ settings library.** Both read `useFavorites`, which persists per-user to `userFavorites` in Firestore. The heart and the "N saved frequencies" count cannot disagree. No disconnect.

10. **Pricing constants ↔ paywall ↔ docs.** `lib/pricing.ts` is the single source; `docs/production-release.md` matches ($9.99 / $59.99, 7-day trial, correct product ids). No drift.

### 4.3 Responsiveness

- Tablet layout system shipped in PR #51; `contentWidth` constrains the player column and the visualiser is sized from it.
- The scrubber's hardcoded 40px offset was the one remaining tablet break — **fixed**, now measured from `onLayout`.
- `SafeAreaView`/`useSafeAreaInsets` used in the player, mini-bar (offset above tab bar) and immersive stage.
- `orientation: "portrait"` in `app.json`. **Deliberate constraint, not a bug** — but note that tablets will letterbox in landscape. For a sleep app that is defensible; confirm it is intentional.

---

## 5. What was fixed in this session (PR #52)

- Real pause/resume through `AudioTypes` → `FrequencyAudioEngine` → both platform renderers → `useAudioPlayer` → all three UI surfaces.
- Web pause via gain ramp to zero with oscillators alive; native pause via `pauseAsync`/`playAsync`.
- Countdown and listening-time frozen while paused.
- Mini-bar X stops audio.
- "Repeat session" implemented for sessions and single tones.
- Skip buttons hidden outside sessions.
- Scrubber: tap support and self-measured width.
- Duplicated fade-out toggle consolidated.
- Immersive stage: safe-area insets, Android `BackHandler`, dead `breathCue` removed.
- Removed orphaned `FrequencyVisualizer`, unused `Download` import, duplicate visualiser label map.
- PremiumModal CRLF line endings preserved (diff is 1 line, not 2000).

**Verification:** `tsc` clean; 27 test files / 157 tests passing; Metro web bundle HTTP 200; CI green on PR #52.

---

## 6. Play Store readiness — hard blockers

These are release blockers independent of code quality.

| # | Item | Status | Action |
|---|---|---|---|
| 1 | **RevenueCat API keys** | ❌ Not configured | `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` is empty in `.env.example` and no `.env` is committed. Without it `initializeNativePurchases()` returns false and **the paywall cannot complete a purchase**. This is the single most likely launch-day failure. |
| 2 | **Google Play products** | ⚠️ Unverified | `monthly_premium` / `yearly_premium` must exist in Play Console, be attached to the `premium` entitlement in RevenueCat, and be active. Cannot be verified from the repo. |
| 3 | **Device verification of audio** | ❌ Not done | Pause/resume, background playback, and interruption handling (phone call, another app taking audio focus) have not been exercised on a physical Android device. Unit tests cannot validate this. |
| 4 | **In-app account deletion** | ✅ Present | Settings → Delete Account, with confirmation. Satisfies Play policy. |
| 5 | **Medical-claim compliance** | ✅ Good | Disclaimers are hedged and rendered (`FrequencyInfoModal` "Important Notice"). No cure/treat/diagnose claims in user-facing copy. |
| 6 | **Privacy policy / ToS reachable** | ✅ | Linked in settings via `LEGAL_URLS`. |
| 7 | **Data safety form** | ⚠️ Unverified | Must match actual collection (email, usage, audio recordings for custom affirmations). `docs/DATA_OWNERSHIP_MATRIX.md` exists and should be the source. |
| 8 | **Microphone permission justification** | ⚠️ Review | `RECORD_AUDIO` is declared. Play requires a clear in-context rationale; copy exists in `app.json` and the recorder, but confirm the prompt appears only when recording is attempted. |
| 9 | **Notification permission** | ✅ Correct | `POST_NOTIFICATIONS` is requested only when a user schedules a reminder (`requestNotificationPermission`), not on cold start. |
| 10 | **Store listing claims** | ⚠️ Review | Listing copy must match the substantiated claims in `HARMONY_FREQUENCY_CLAIMS_INVENTORY.md`. Do not repeat the offline-download/custom-mixing claims that were removed from the app. |

---

## 7. Missing operational and functional actions

Ordered by user impact. None of these are required for a first release, but each closes a real gap.

**High value**

1. **Lock-screen / notification media controls.** There is no media session integration. A user who starts a 45-minute sleep session and locks the phone has no way to pause or stop without unlocking. For this category this is close to table stakes. Consider `expo-av` + a media notification, or a dedicated audio library.
2. **Sleep timer independent of session length.** The timer is tied to the track duration. A common expectation is "play this, but stop in 30 minutes regardless". Currently the only way to bound listening is to choose a shorter session.
3. **Resume-after-interruption.** If a call arrives, behaviour depends on `interruptionModeAndroid: DuckOthers` / `DoNotMix`. Whether playback resumes afterwards is unverified and should be explicitly handled and tested.

**Medium value**

4. **No "stop at end of session" confirmation.** State the resolved end behaviour next to the timer.
5. **Search or filter on the frequencies list.** With many frequencies, `categories.tsx` relies on browsing. A search field would help returning users who know the Hz they want.

**Low value / polish**

7. **Unify volume and mute** into one control.
8. **First-run explanation of the four affirmation modes.**
9. **Landscape on tablets**, if desired — currently locked to portrait.

---

## 8. Recommended release sequence

1. **Configure RevenueCat keys** and verify a real sandbox purchase on device, including restore and cancellation. Nothing else matters if this fails.
2. **Device pass on a mid-range Android phone**: pause/resume, background playback with screen off, phone-call interruption, Bluetooth headphone disconnect, session completion, repeat.
3. **Decide on lock-screen controls.** Ship without them only if you accept that sleep users must unlock to stop playback.
4. **Reconcile the Data safety form** against `docs/DATA_OWNERSHIP_MATRIX.md`.
5. **Confirm permission prompts** are contextual (microphone on record, notifications on first schedule).
6. **Run the store listing against the claims inventory** — no promises the app does not keep.
7. Internal testing track → closed testing → production.

---

## 9. Honest limitations of this assessment

- **The auth gate blocked runtime UI verification.** The app could not be driven past sign-in without credentials, so screen-level behaviour was assessed by code trace plus bundle build, not by clicking through.
- **No render-test tooling is installed** (`@testing-library/react-native` is absent), so component mounting is not covered. The visualiser and audio logic are unit-tested; React tree behaviour is not.
- **Audio cannot be validated without a device.** Every claim in this report about audible behaviour is a claim about the code path, not about what a speaker produces.
- **Google Play Console state** (products, entitlements, listing, data safety) cannot be inspected from the repository.

The gap between "tests pass" and "a tired person at 11pm can start a tone and trust it" is exactly the gap that device testing closes. Do that before publishing.
