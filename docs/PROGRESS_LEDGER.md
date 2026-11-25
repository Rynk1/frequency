# Monetization progress ledger

Status: the approved product changes are implemented. Price and trial
experiments are approved but staged until telemetry and traffic data exist.
No live price changed in this pass.

This ledger records the decisions, the implementation status, the effort
estimates and the pinned tests that changed or would need to change.

The sections below preserve the original analysis. Where they say "not
started" or "decisions needed", the recorded decisions and implementation
status above take precedence.

## Change control

- Authentication stays first. Guest-first is deferred to item K.
- Do not change free or premium flags, prices or pinned tests without a
  specific written approval.
- Do not advertise ambient layers or offline playback before they work.
- Run no more than two experiments at once.
- Ship obvious fixes without an experiment. Current obvious fixes: preview
  counting, premium content leaks in free programs, and the deferred
  guest-first decision.
- A listening session means 5 minutes or more, or a session ended by its
  timer. Previews do not count as listening sessions.

## Effort scale

- S: 1 to 3 working days.
- M: 1 to 2 working weeks.
- L: 3 working weeks or more.

## A to K tracker

| ID | Item | Status | Effort | Depends on | Next action |
|---|---|---|---|---|---|
| A | Day 0 offer | Implemented after the authenticated first session; guest-first still deferred | M with guest-first, S for offer UI | Guest-first | Revisit guest-first later |
| B | Sleep and free playback | Implemented | M | None | Monitor bedtime reminder opt-outs |
| C | Programs as the premium pillar | Implemented | M | None | Monitor day-one conversion |
| D | Streaks and notifications | Implemented | M | None | Monitor freeze use |
| E | Ambient layers and offline playback | Roadmap only, do not advertise | Ambient M, offline M to L | Licensing, entitlement grace | Scope and estimate only |
| F | Experiments | Protocol approved; no experiment started | S to set up, M to run | Telemetry and weekly installs | Fill weekly installs and sample sizes |
| G | Pricing display | Implemented; lifetime and win-back deferred | S to M | None | Revisit lifetime and win-back |
| H | Listening metrics | Definition and events implemented; provider not connected | S to M | Analytics provider | Connect provider and dashboard |
| I | Compliance review | No decision today | S audit, M changes | Legal owner | Assign reviewer and markets |
| J | Sequencing and catalogue copy | Copy complete; telemetry next | S | Copy approval | Connect telemetry |
| K | Authentication guardrail and guest-first | Deferred | M to L when reconsidered | Owner decision | Document only |

## Recorded decisions, 24 November 2026

1. Guest-first stays deferred. Authentication stays first.
2. The first-session soft offer runs after the authenticated first session
   in the meantime.
3. Free sleep sessions can run 30 minutes once per day.
4. Judgement: background audio defaults on. Fade stays free because it
   protects a comfortable ending and is not a meaningful paywall lever.
5. The morning check-in appears only after a sleep session.
6. Programs that contain premium tones are premium.
7. Day one means the first track.
8. Free users keep program progress when they upgrade.
9. Streak freezes: two per week, for free and premium listeners, with a
   6pm to 4am night window.
10. Lifetime and win-back are deferred.
11. Price and trial experiments are confirmed but staged.
12. Judgement: a listening session is 5 minutes or more, or a timer-ended
    session. The north star is weekly listeners with at least one listening
    session, broken down by intent.
13. Compliance review is not a decision for today.
14. Judgement: ambient layers and offline playback stay on the roadmap. Do
    not advertise them until they work.
15. The approved items are implemented.

## Implementation status

- A: `FirstSessionOffer` shows once after the first authenticated session.
  "Continue free" and the trial button have equal width. Nothing shows before
  the first sound. Guest-first is untouched.
- B: `freeSleepSessionMaxDuration` is 30 minutes, once per day, tracked in
  `SessionLedger.sleepLongStarts`. Background audio defaults on. Fade stays
  free. Sleep intent gets a 9.30pm bedtime reminder, cancelled when
  notifications are turned off. The morning check-in is scheduled only after
  a sleep session and opens the trial only after a positive answer.
- C: all 15 existing programs are premium. A new free starter, `session-16`,
  uses only free tones. Free listeners get the first track of every premium
  program and then see the paywall. Seed flags override a stale local cache.
- D: the home stat is "Nights this week". Two freezes per week are available
  to every tier. The night window is 6pm to 4am. Night alerts default off.
- F: no experiment has started. The sample-size worksheet remains below.
- G: the annual card shows the billed yearly amount first, with monthly and
  weekly equivalents second. Lifetime and win-back are not built.
- H: `lib/metrics/listening.ts` defines a listening session. New telemetry
  events are defined at the sink; no analytics provider is connected.
- I: no compliance change was made today.
- K: the auth gate is unchanged.

## A. Day 0 offer

Approved shape:

1. Ask the intent question.
2. Let the person play a first free session without an account.
3. After that session, show a soft, dismissible offer. "Continue free" is
   equally visible.
4. Nothing is shown before the first sound.

Implemented as an authenticated-first variant. The first-session offer runs
after the first completed authenticated session. Guest-first remains deferred,
and the auth gate is unchanged.

## B. Sleep and free playback

Approved direction:

- Background and screen-off playback stay available in the free tier.
  Premium sells length, the full timer and fade, the full library and
  programs, not basic playback.
- Add a bedtime reminder default at the end of onboarding, with an easy
  opt-out.
- Add a next-morning "How was last night?" one-tap check-in.
- Show the trial offer only after a positive answer. Never push after a
  negative answer.
- No outcome claims.

Current code facts:

- Background audio is a user preference in `settings.backgroundAudio`.
  It is not premium gated. It now defaults on.
- `UIBackgroundModes` includes audio.
- Fade out stays free by judgement: it protects a comfortable ending and is
  not a meaningful paywall lever.
- Free timer presets stop at 15 minutes, except one 30-minute sleep session
  per day. Premium timers run longer.

Decisions needed:

- Free sleep length: keep 15 minutes, or allow one 30-minute sleep session
  per day.
- Whether fade becomes premium.
- Whether background audio defaults on.
- Bedtime reminder time and opt-out wording.
- What counts as a positive check-in.

Pinned tests that would change if this ships:

- `__tests__/free-tier.test.ts` pins 15 minutes and 3 starts per day.
- `__tests__/paywall-copy.test.ts` pins "15 minutes" and "3 sessions" in
  duration and session-limit copy.
- `__tests__/preview-config.test.ts` pins the 180-second preview and its
  label if the offer uses a different preview length.
- `__tests__/trial-reminder.test.ts` if the trial offer timing changes.
- `__tests__/notifications/schedule.test.ts` if reminder presets change.
  The existing test only pins weekday expansion.
- `__tests__/onboarding-intents.test.ts` if onboarding gains a reminder step
  and the test is extended.
- `__tests__/telemetry.test.ts` if new check-in or reminder events are added.
- `__tests__/preview-config.test.ts` if the preview length changes.

New tests needed:

- Default bedtime reminder is created at onboarding and can be disabled.
- A negative check-in does not schedule or show a trial offer.
- Background playback is not blocked for a free listener.

## C. Programs as the premium pillar

Approved direction:

- Programs become the main premium pillar.
- Free: day one of every program, plus one starter program.
- Premium: full paths.

Leak to resolve: free programs currently play premium tones. For example,
`Morning Energy Boost` uses a 40 Hz binaural tone and `Seven-Chakra
Meditation` uses all seven chakra tones, but both programs are free. Program
frequencies also reach the player without their premium flags.

Options, for approval only:

1. Make the affected programs premium.
2. Remove "binaural and chakra access" from paywall copy and sell programs,
   length, library and convenience instead.
3. Gate individual premium tones inside a free program, so the program opens
   but some steps lock.

Recommended option: 2, because it keeps the free programs useful and removes
a claim that is not currently true. Do not apply without approval.

Decisions needed:

- Which leak option to use.
- What "day one" means: first track, first 10 minutes, or first chapter.
- Whether free users keep program progress after upgrading.
- All 15 existing programs became premium. A new free starter was added.

Pinned tests that would change:

- `__tests__/program-access.test.ts` pins three starter programs as free and
  the `isProgramLocked` rule.
- `__tests__/premium-claims.test.ts` pins 37 premium records against the seed.
- `__tests__/premium-benefits.test.ts` pins the binaural and chakra benefit
  and the capability claims.
- `__tests__/free-tier.test.ts` pins nine free records and requires the
  daily free track to stay free.
- `__tests__/seed-data.test.ts` now pins 16 programs.
- `__tests__/entitlement-engine.test.ts` pins free-tier binaural as locked.
- `__tests__/audio/CatalogueAudibility.test.ts` checks that free entries stay
  free and that the free tier has at least three audible pitches.

New tests needed:

- Day one is available to a free listener for every program.
- Day two and later lock for a free listener.
- A free program cannot expose a premium-only tone without a lock.

## D. Streaks and notifications

Approved direction:

- Reframe streak language as "nights this week".
- Add a streak-freeze option.
- Default the "streak at risk" notification to off.
- No guilt copy.

Decisions needed:

- How many freezes per week, and whether freeze is free or premium.
- What counts as a night: a 5-minute session after a set hour, a completed
  sleep timer, or any session after 8pm.
- Week start day.
- Exact notification wording.

Pinned tests that would change:

- `__tests__/strings.test.ts` pins shared string rules, including no
  exclamation marks and no double spaces.
- `__tests__/notifications/schedule.test.ts` if reminder scheduling changes.
- New streak tests are needed. There is no existing streak test file.

## E. Roadmap: ambient layers and offline playback

Do not advertise either until built.

Ambient layers:

- S: one bundled loop and a volume control. About 1 to 3 days.
- M: four to six layers, per-layer volume, presets, and ducking under a
  tone. About 2 to 4 weeks.
- L: licensed library, background mixing, crossfade, offline packs and
  rights management. About 6 to 10 weeks.

Offline playback:

- S: cache one generated track and play it from local storage. About 3 days.
- M: cached tracks or programs, offline entitlement grace, storage screen,
  delete and eviction. About 2 to 4 weeks.
- L: full library, program and ambient packs, background downloads,
  cross-device sync, encrypted cache. About 8 to 12 weeks.

Dependencies:

- Offline entitlement is currently fail-closed. The 72-hour grace policy is
  defined but `isOffline` is never passed.
- Ambient audio needs an audio engine change and a licensing decision.
- Offline files increase app size and need storage limits.

Pinned tests that would change:

- `__tests__/premium-benefits.test.ts` currently forbids "offline" and
  "download" claims until the feature exists. Update only when it ships.
- `__tests__/premium-claims.test.ts` if premium counts change.
- `__tests__/free-tier.test.ts` if offline access is free.
- `__tests__/entitlement-engine.test.ts` pins the 72-hour offline grace
  failure and the 180-second preview allowance.
- Audio tests if ambient layers change the render path.

Decisions needed:

- Ambient source: generated or licensed.
- Offline scope: selected tracks, all tracks, programs or ambient packs.
- Free or premium.
- Storage cap and eviction policy.
- Whether offline entitlement uses the 72-hour grace policy.

## F. Experiments

Rules:

- No more than two experiments at once.
- Report weekly installs and the sample size per arm before starting.
- Ship obvious fixes without testing.
- Priority: preview counting, free sleep length, then price. Guest-first is
  deferred to K.

Sample-size method:

`n per arm = 16 × p × (1 - p) ÷ d²`

This assumes 80% power, a two-sided 5% significance level, equal arms and no
peeking. Add 10 to 20% for dropout. Round up.

| Test | Metric | Assumed baseline | MDE | n per arm | Total |
|---|---|---|---|---|---|
| Guest-first, deferred | First-session completion | 40% | 5 pp | 1,536 | 3,072 |
| Previews not counted | D7 retention | 35% | 5 pp | 1,456 | 2,912 |
| Free sleep length | Trial start | 5% | 1.5 pp | 3,378 | 6,756 |
| Annual price | Purchase per install | 3% | 0.8 pp | 7,275 | 14,550 |
| Today's premium track | D7 retention | 25% | 4 pp | 1,875 | 3,750 |
| 3-day vs 7-day trial | Trial to paid | 40% | 6 pp | 1,067 | 2,134 |
| Paywall after first session | Trial start | 6% | 2 pp | 2,256 | 4,512 |
| Billed-price prominence | Trial start | 6% | 1.5 pp | 4,011 | 8,022 |

Weekly installs:

- Not available in the repository or from the connected tools. Fill this from
  Google Play Console and App Store Connect before any experiment.
- Weekly activated users, paywall views and trial starts are also unknown
  until the analytics provider is connected.
- If weekly installs are below about 2,000, do not run the price test. Run
  one test at a time and expect several weeks per result.

Decisions needed:

- Accept the two-experiment limit.
- Confirm the minimum runtime and the traffic threshold.
- Approve the assumed baselines once real data exists.

## G. Pricing display, lifetime and win-back

Approved direction:

- The billed amount is the most prominent price.
- The weekly equivalent is secondary text.
- Show localised prices for each region.
- Lifetime is a secondary option, shown after a declined trial or on a second
  view. It is not a headline plan.
- Win-back is sent once, a few days after trial expiry.

Decisions needed:

- Lifetime price.
- Win-back discount and exact timing.
- What counts as a second view.
- Local price rounding rules.
- Whether the weekly equivalent appears for monthly as well as yearly.

Pinned tests that would change:

- `__tests__/pricing.test.ts` pins $9.99, $59.99, 7 trial days, 50% savings,
  weekly equivalents and exact billing notes.
- `__tests__/paywall-copy.test.ts` pins auto-renew, secure checkout and
  manage-subscription wording.
- `__tests__/subscription-details.test.ts` if status mapping changes.
- `__tests__/responsive-layout.test.ts` is not expected to change. Add a new
  layout test for price prominence.

New tests needed:

- Billed amount is the largest price element.
- Weekly equivalent is present but secondary.
- Lifetime appears only after a declined trial or a second view.
- Win-back is sent once and not before trial expiry.

## H. Listening metrics

Approved definition:

- A listening session is 5 minutes or more, or a session ended by its timer.
- North star: weekly listeners with at least one such session.
- Break the number down by onboarding intent.

Decisions needed:

- Whether a manual stop at exactly zero counts as "ended by timer".
- Attribution window for installs and trials.
- Consent and privacy wording for analytics.

Pinned tests that would change:

- `__tests__/telemetry.test.ts` if the event contract changes.
- `__tests__/free-tier.test.ts` if session counting changes.
- `__tests__/recommendation.test.ts` if Daily Alignment selection changes.
- `__tests__/onboarding-intents.test.ts` if intent ids or labels change.

New tests needed:

- A 4-minute session is not counted as listening.
- A 5-minute session is counted.
- A timer-ended session is counted even if the user leaves at zero.
- Results can be grouped by intent.

## I. Compliance review

Flag for human review:

- Apple billed-price prominence and paywall presentation.
- Google Play and iOS store listing text.
- UK DMCC subscription rules and commencement dates.
- FTC click-to-cancel guidance.
- Billing-portal links on both platforms.
- Health and wellness claim review for every market.

Decisions needed:

- Who owns legal review.
- Which markets launch first.
- The applicable DMCC commencement date.
- Refund and cancellation wording.

Pinned tests that would change if the flows change:

- `__tests__/paywall-copy.test.ts`
- `__tests__/trial-reminder.test.ts`
- `__tests__/pricing.test.ts`
- `__tests__/subscription-details.test.ts`
- `__tests__/premium-benefits.test.ts`

## J. Sequencing and catalogue copy

Agreed order:

1. Finish the catalogue copy batches. The 46-record copy set is complete in
   the current branch.
2. Ship telemetry.
3. Recalibrate the free tier.
4. Rewrite paywall copy.
5. Reconsider guest-first only after the owner's decision.

Paywall personalisation depends on the intent taxonomy, so the paywall copy
stage waits for the taxonomy and the free-tier policy.

Pinned tests that would change at the copy and telemetry stages:

- `__tests__/frequency-copy.test.ts` pins 46 records, five-word names and
  90-character hooks.
- `__tests__/claim-safety.test.ts` scans every promotional string.
- `__tests__/seed-data.test.ts` pins 46 frequencies, 16 programs and 8
  articles.
- `__tests__/strings.test.ts` pins shared string rules.
- `__tests__/premium-claims.test.ts` pins the premium count.
- `__tests__/telemetry.test.ts` pins the sink contract.
- `__tests__/paywall-copy.test.ts` pins the paywall copy limits and the
  `premium_content` trigger fallback.

## K. Authentication guardrail and guest-first deferral

Current state: authentication stays first. Do not remove the auth gate when
assessing or changing the app.

Deferred proposal, for later review:

- Let a new listener play one free session before creating an account.
- Offer account creation after the session to save progress, streaks and
  sync.
- Use anonymous Firebase auth or a local guest profile.
- Link the guest profile to a real account without losing history.

Effort: M to L when reconsidered.

Decisions needed:

- Whether and when to reconsider guest-first.
- Identity model: anonymous Firebase account or local guest.
- Account-linking and conflict rules.
- Abuse and rate limits for guest sessions.

Pinned tests that would change only if guest-first is built:

- `__tests__/onboarding-intents.test.ts`
- `__tests__/telemetry.test.ts`
- `__tests__/free-tier.test.ts`
- `__tests__/preview-config.test.ts`
- New auth and account-linking tests

`__tests__/auth-error-mapping.test.ts` stays as it is while auth remains
first.
