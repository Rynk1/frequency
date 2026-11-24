# Content audit and intent taxonomy

Status: approved for implementation. Companion document: `docs/VOICE_TONE_AND_CLAIMS.md`.

## 1. Summary

The catalogue is well written for compliance and poorly written for the people who use it. Every one of the 46 records scores 3 or below on at least one audience-fit axis, and the dominant failures are need-clarity and plain language.

The largest structural problem is not wording. Explore only exposes four of the seven categories, so 13 records in `healing`, `sleep` and `wealth` cannot be browsed at all. The two needs people search for hardest, sleep and abundance, are the ones missing from navigation.

This document records the inventory, the audit scores and the approved intent taxonomy. It does not change code.

## 2. Inventory

### 2.1 Catalogue size

| Category | Records | Visible in Explore before this work |
|---|---:|---|
| solfeggio | 9 | yes |
| chakra | 7 | yes |
| binaural | 13 | yes |
| scientific | 4 | yes |
| healing | 5 | no |
| sleep | 4 | no |
| wealth | 4 | no |
| total | 46 | 33 of 46 |

### 2.2 Where user-facing text lives

| Area | Files |
|---|---|
| App identity and permissions | `expo/app.json` |
| Navigation | `app/(tabs)/_layout.tsx`, `app/(tabs)/categories.tsx` |
| Catalogue data | `constants/frequencies.ts`, `seed/frequencies.ts`, `seed/extracted-guides.json` |
| Frequency detail | `components/FrequencyInfoModal.tsx` |
| Player | `components/AudioPlayer.tsx`, `lib/player/NowPlayingBar.tsx` |
| Sessions and programs | `app/(tabs)/sessions.tsx`, `seed/programs.ts`, `components/CreateSessionModal.tsx` |
| Learn | `app/(tabs)/learn.tsx`, `seed/articles.ts` |
| Paywall and billing | `components/PremiumModal.tsx`, `components/PremiumGate.tsx`, `lib/premium-benefits.ts`, `lib/pricing.ts`, `app/subscription-result.tsx` |
| Onboarding and auth | `app/onboarding.tsx`, `components/AuthScreen.tsx` |
| Notifications and share | `hooks/useSessionManager.ts`, `components/AudioPlayer.tsx` |
| Daily challenge | `lib/recommendation.ts` |
| Settings and library | `app/(tabs)/settings.tsx`, `components/LibraryModal.tsx` |
| Second seed copy | `backend/seed.ts`, `backend/trpc/routes/frequencies/seed-data.ts` |
| Store metadata draft | `docs/PRODUCT_TO_CONSUMER_FIT_REPORT.md` section 8.3 |

There is no localization layer. Every string is inline in a component or seed file.

### 2.3 Data model

`CanonicalFrequency` already carries `id`, `name`, `hz`, `baseFreq`, `beatFreq`, `description`, `category`, `benefits`, `isPremium`, `status`, `intentTags`, `timeOfDayTags`, `background`, `purpose`, `scientificBasis`, `usageInstructions`, `disclaimer`, `research` and `tags`.

Missing fields needed for intent-first copy:

| Field | Purpose |
|---|---|
| `intentCategory` primary and secondary | Navigation and search by need |
| `displayName` | Benefit-led name, separate from the technical `name` |
| `hook` | One line for cards and share |
| `useCaseLine` | When and how to use it |
| `whyPeopleUseIt` | Tradition and popularity framing |
| `aboutThisSound` | The honest technical layer |
| `evidenceTier` | Badge shown in the detail page |
| `recommendedLength`, `bestTimeOfDay`, `headphonesRequired` | Practical guidance |
| `searchKeywords` and `synonyms` | Intent search |
| `safetyNotes` | Epilepsy, pacemaker, pregnancy, driving |
| `legacyName` | Traceability for renames |

`tags` is currently set equal to `intentTags`, so it adds nothing to search.

## 3. Audit method

Each item is scored 1 to 5 on five axes. For the plain-language axis, 5 means no blocking jargon and 1 means heavy jargon. Anything scoring 3 or below on need-clarity, search relevance, emotional pull or plain language is flagged. Anything scoring 3 or below on claim safety is flagged.

### 3.1 Catalogue results

| id | Current name | Need | Search | Emotion | Plain | Claim safety | Flag |
|---|---|---:|---:|---:|---:|---:|---|
| solfeggio-174 | Foundation Pure | 2 | 2 | 2 | 3 | 5 | need, search, emotion |
| solfeggio-285 | Transformation Pure | 2 | 2 | 2 | 3 | 5 | need, search, emotion |
| solfeggio-396 | Liberation Pure | 2 | 2 | 3 | 3 | 5 | need, search |
| solfeggio-417 | Change Pure | 2 | 2 | 2 | 3 | 5 | need, search, emotion |
| solfeggio-528 | Love & Harmony Pure | 3 | 4 | 4 | 4 | 5 | need |
| solfeggio-639 | Relationships Pure | 3 | 4 | 3 | 4 | 5 | none |
| solfeggio-741 | Intuition Pure | 2 | 3 | 3 | 4 | 5 | need |
| solfeggio-852 | Spiritual Order Pure | 1 | 2 | 2 | 2 | 5 | need, search, emotion, plain |
| solfeggio-963 | Divine Connection Pure | 1 | 2 | 2 | 2 | 5 | need, search, emotion, plain |
| chakra-194.18 | Root Chakra Pure | 2 | 3 | 3 | 3 | 5 | need |
| chakra-210.42 | Sacral Chakra Pure | 1 | 2 | 2 | 3 | 5 | need, search, emotion |
| chakra-126.22 | Solar Plexus Pure | 2 | 3 | 3 | 3 | 5 | need |
| chakra-341.3 | Heart Chakra Pure | 2 | 3 | 3 | 3 | 5 | need |
| chakra-384 | Throat Chakra Pure | 2 | 3 | 2 | 3 | 5 | need, emotion |
| chakra-426.7 | Third Eye Pure | 2 | 3 | 3 | 3 | 5 | need |
| chakra-963 | Crown Chakra Pure | 1 | 2 | 2 | 2 | 5 | need, search, emotion, plain |
| binaural-1.5 | Deep Rest Delta | 4 | 3 | 4 | 2 | 5 | plain |
| binaural-2.5 | Delta Waves Pure | 3 | 3 | 2 | 2 | 5 | emotion, plain |
| binaural-4.5 | Theta Deep Meditation | 3 | 3 | 3 | 3 | 5 | none |
| binaural-6 | Theta Waves Pure | 2 | 3 | 2 | 2 | 5 | need, emotion, plain |
| binaural-8.5 | Alpha Relaxation | 3 | 3 | 3 | 3 | 5 | none |
| binaural-10 | Alpha Waves Pure | 2 | 3 | 2 | 2 | 5 | need, emotion, plain |
| binaural-12 | Alpha Focus | 4 | 4 | 3 | 3 | 5 | none |
| binaural-14 | SMR (Sensorimotor Rhythm) | 2 | 2 | 1 | 1 | 5 | need, search, emotion, plain |
| binaural-16 | Beta Focus | 3 | 3 | 2 | 3 | 5 | emotion |
| binaural-20 | Beta Waves Pure | 2 | 3 | 2 | 2 | 5 | need, emotion, plain |
| binaural-25 | High Beta Energy | 3 | 3 | 3 | 3 | 5 | none |
| binaural-40 | Gamma Waves Pure | 3 | 4 | 2 | 2 | 5 | emotion, plain |
| binaural-60 | High Gamma Insight | 2 | 2 | 2 | 2 | 5 | need, search, emotion, plain |
| healing-7.83 | Schumann Resonance | 3 | 4 | 3 | 2 | 5 | plain |
| healing-174 | Physical Ease | 4 | 3 | 4 | 4 | 5 | none |
| healing-528 | Love Frequency | 3 | 4 | 4 | 3 | 5 | plain |
| healing-40 | 40 Hz Gamma | 3 | 4 | 2 | 2 | 5 | emotion, plain |
| healing-110 | 110 Hz Resonance | 1 | 2 | 1 | 1 | 5 | need, search, emotion, plain |
| sleep-1.5 | Deep Rest Delta | 4 | 3 | 4 | 2 | 5 | plain |
| sleep-4.5 | Rest & Dreaming Theta | 3 | 3 | 3 | 2 | 5 | plain |
| sleep-8 | Sleep Transition | 4 | 3 | 3 | 3 | 5 | none |
| sleep-6 | Evening Theta | 3 | 3 | 3 | 2 | 5 | plain |
| wealth-888 | Abundance Frequency | 3 | 4 | 4 | 3 | 4 | plain |
| wealth-432 | Natural Harmony | 2 | 4 | 3 | 3 | 5 | need |
| wealth-528 | Manifestation Power | 3 | 4 | 4 | 3 | 3 | claim safety, plain |
| wealth-10 | Alpha Success State | 3 | 3 | 3 | 3 | 4 | none |
| scientific-7.83 | Schumann Resonance | 3 | 4 | 3 | 2 | 5 | plain |
| scientific-40 | 40 Hz Gamma Pure | 3 | 4 | 2 | 2 | 5 | emotion, plain |
| scientific-110 | 110 Hz Resonance Pure | 1 | 2 | 1 | 1 | 5 | need, search, emotion, plain |
| scientific-432 | 432 Hz Natural Tuning | 2 | 4 | 3 | 3 | 5 | need |

### 3.2 Surface results

| Surface | Need | Search | Emotion | Plain | Claim safety | Main issue |
|---|---:|---:|---:|---:|---:|---|
| Explore navigation | 1 | 2 | 2 | 1 | 2 | Technique names, 13 records hidden, "science-backed" claim |
| Explore search | 2 | 2 | 2 | 3 | 5 | Cannot answer "sleep", "anxiety", "money", "study" |
| Frequency cards | 3 | 3 | 3 | 2 | 4 | Name plus Hz, no hook or use case |
| Detail page | 3 | 3 | 3 | 2 | 3 | Six technical sections, no evidence badge |
| Onboarding | 3 | 2 | 3 | 4 | 4 | Four goals, missing anxiety and abundance |
| Paywall | 3 | 2 | 3 | 3 | 4 | Abstract, technical nouns, track-count led |
| Notifications | 3 | not scored | 3 | 4 | 3 | "healing session" |
| Share text | 3 | not scored | 4 | 4 | 3 | "healing journey" |
| Store metadata | 2 | 2 | 3 | 3 | 3 | 43-character title, "Spiritual Soundscape" |
| Sessions and programs | 3 | 2 | 3 | 3 | 2 | "designed by experts" |
| Learn | 3 | 3 | 3 | 3 | 4 | "unlock your full potential" |
| Auth | 3 | not scored | 3 | 4 | 2 | "Join thousands", "healing frequencies" |
| Daily challenges | 3 | 3 | 3 | 2 | 1 | "attract wealth", "Quantum Repair", "subconscious healing" |

### 3.3 Prioritized findings

High impact, fixed in commit 1 or scheduled in this work:

1. Four live claim breaches in daily challenges and articles: "attract focus and wealth", "subconscious healing", "Quantum Repair", and the Alzheimer's disease name in five places.
2. Unverifiable social proof and expertise claims: "Join thousands", "designed by experts", "Science-backed frequencies with documented research".
3. Explore hides 13 records and names categories after techniques.
4. Search cannot answer intent queries.
5. Store title is 43 characters and leads with "Spiritual Soundscape".
6. "Healing" is used as a product claim in the app name, tab label, notification, share text and permission text.

Medium impact:

7. The detail page is a wall of six technical sections with no progressive disclosure and no evidence badge.
8. Onboarding asks "What brings you here?" and offers four options.
9. Paywall copy is abstract and leads with track counts.
10. "SMR (Sensorimotor Rhythm)", "110 Hz Resonance" and "Crown Chakra Pure" are unreadable to the target audience.
11. Duplicate Hz values carry different names, including two records both called "Deep Rest Delta".
12. `backend/seed.ts` and `backend/trpc/routes/frequencies/seed-data.ts` hold a second copy of program and article text that already disagrees with `seed/`.

Low impact:

13. Settings uses "Islands" as a section label.
14. "Begin my journey" and "Start Now" are inconsistent CTAs.
15. The detail modal labels usage frequency as "Frequency", which reads as Hz.
16. The night challenge references "2 Hz Delta waves", which is not a catalogue record.

## 4. Approved taxonomy

Categories are ordered by demand. Each category shows the technical term as a subtitle, never as the headline.

| Order | Intent category | Subtitle | Primary records | Cross-listed |
|---:|---|---|---:|---|
| 1 | Sleep & Rest | Delta and theta listening for wind-down | 6 | 0 |
| 2 | Calm & Stress Relief | Alpha listening, release tones, 432 Hz tuning | 8 | 2 |
| 3 | Focus & Energy | Beta, SMR and 40 Hz gamma listening | 9 | 1 |
| 4 | Meditation & Mindfulness | Theta listening and stillness tones | 4 | 1 |
| 5 | Abundance & Manifestation | 888 Hz symbolism and alpha goal focus | 3 | 2 |
| 6 | Connection & Relationships | 639 Hz and heart-centred tones | 1 | 2 |
| 7 | Body & Recovery | Low-frequency and renewal tones | 3 | 1 |
| 8 | Spiritual & Chakra Work | Chakra framework and 963 Hz | 8 | 1 |
| 9 | Nature & Earth | Schumann resonance and archaeoacoustic tones | 4 | 3 |

Decisions applied:

- Energy & Mood Boost is merged into Focus & Energy until the catalogue has at least three genuine energy tracks. The gap is logged as a content need in section 7.
- Healing & Recovery is renamed Body & Recovery.
- Connection & Relationships is added. It has one primary record, so two related chakra tones are cross-listed to reach the three-track minimum. No tone is invented.
- A category is only shown when it has at least three reachable tracks after cross-listing.

### 4.1 Mapping table

IDs, Hz values, audio parameters and premium flags do not change. Only display copy moves.

| id | Current name | Current category | New intent category | New display name |
|---|---|---|---|---|
| binaural-1.5 | Deep Rest Delta | binaural | Sleep & Rest | Deep Rest |
| binaural-2.5 | Delta Waves Pure | binaural | Sleep & Rest | Deeper Wind-Down |
| sleep-1.5 | Deep Rest Delta | sleep | Sleep & Rest | Bedtime Wind-Down |
| sleep-4.5 | Rest & Dreaming Theta | sleep | Sleep & Rest | Rest & Dreaming |
| sleep-8 | Sleep Transition | sleep | Sleep & Rest | Drift Off |
| sleep-6 | Evening Theta | sleep | Sleep & Rest | Evening Unwind |
| solfeggio-396 | Liberation Pure | solfeggio | Calm & Stress Relief | Let Go of Worry |
| solfeggio-417 | Change Pure | solfeggio | Calm & Stress Relief | Fresh Start |
| solfeggio-528 | Love & Harmony Pure | solfeggio | Calm & Stress Relief | Heart Calm |
| binaural-8.5 | Alpha Relaxation | binaural | Calm & Stress Relief | Steady Calm |
| binaural-10 | Alpha Waves Pure | binaural | Calm & Stress Relief | Light Meditation |
| healing-528 | Love Frequency | healing | Calm & Stress Relief | Gratitude Practice |
| wealth-432 | Natural Harmony | wealth | Calm & Stress Relief | Natural Harmony |
| scientific-432 | 432 Hz Natural Tuning | scientific | Calm & Stress Relief | 432 Hz Natural Tuning |
| solfeggio-741 | Intuition Pure | solfeggio | Focus & Energy | Clear Mind |
| binaural-12 | Alpha Focus | binaural | Focus & Energy | Study Focus |
| binaural-14 | SMR (Sensorimotor Rhythm) | binaural | Focus & Energy | Steady Attention |
| binaural-16 | Beta Focus | binaural | Focus & Energy | Deep Work |
| binaural-20 | Beta Waves Pure | binaural | Focus & Energy | Analytical Focus |
| binaural-25 | High Beta Energy | binaural | Focus & Energy | Quick Alertness |
| binaural-40 | Gamma Waves Pure | binaural | Focus & Energy | Gamma Focus |
| healing-40 | 40 Hz Gamma | healing | Focus & Energy | Gamma Clarity |
| scientific-40 | 40 Hz Gamma Pure | scientific | Focus & Energy | 40 Hz Gamma Focus |
| solfeggio-852 | Spiritual Order Pure | solfeggio | Meditation & Mindfulness | Inner Stillness |
| binaural-4.5 | Theta Deep Meditation | binaural | Meditation & Mindfulness | Deep Meditation |
| binaural-6 | Theta Waves Pure | binaural | Meditation & Mindfulness | Creative Drift |
| binaural-60 | High Gamma Insight | binaural | Meditation & Mindfulness | Quiet Insight |
| wealth-888 | Abundance Frequency | wealth | Abundance & Manifestation | Abundance Mindset |
| wealth-528 | Manifestation Power | wealth | Abundance & Manifestation | Manifestation Focus |
| wealth-10 | Alpha Success State | wealth | Abundance & Manifestation | Confident Decisions |
| solfeggio-639 | Relationships Pure | solfeggio | Connection & Relationships | Connection & Compassion |
| chakra-341.3 | Heart Chakra Pure | chakra | Spiritual & Chakra Work (cross-listed Connection) | Open Heart |
| chakra-384 | Throat Chakra Pure | chakra | Spiritual & Chakra Work (cross-listed Connection) | Speak with Ease |
| solfeggio-174 | Foundation Pure | solfeggio | Body & Recovery | Ground & Settle |
| solfeggio-285 | Transformation Pure | solfeggio | Body & Recovery | Gentle Renewal |
| healing-174 | Physical Ease | healing | Body & Recovery | Body Ease |
| solfeggio-963 | Divine Connection Pure | solfeggio | Spiritual & Chakra Work | Divine Connection |
| chakra-194.18 | Root Chakra Pure | chakra | Spiritual & Chakra Work | Rooted Calm |
| chakra-210.42 | Sacral Chakra Pure | chakra | Spiritual & Chakra Work | Creative Flow |
| chakra-126.22 | Solar Plexus Pure | chakra | Spiritual & Chakra Work | Confident Focus |
| chakra-426.7 | Third Eye Pure | chakra | Spiritual & Chakra Work | Clear Insight |
| chakra-963 | Crown Chakra Pure | chakra | Spiritual & Chakra Work | Crown Stillness |
| healing-7.83 | Schumann Resonance | healing | Nature & Earth | Earth Grounding |
| healing-110 | 110 Hz Resonance | healing | Nature & Earth | Ancient Resonance |
| scientific-7.83 | Schumann Resonance | scientific | Nature & Earth | Earth Resonance |
| scientific-110 | 110 Hz Resonance Pure | scientific | Nature & Earth | Ancient Chamber Tone |

### 4.2 Duplicate register

Duplicates stay as separate records with separate IDs. They are differentiated by use case, suggested length and session defaults, never by stronger claims.

| Hz | Records | Current problem | Differentiation |
|---|---|---|---|
| 528 | solfeggio-528, healing-528, wealth-528 | Three names and three framings | Heart Calm / Gratitude Practice / Manifestation Focus |
| 40 | binaural-40, healing-40, scientific-40 | Three near-identical names | Gamma Focus / Gamma Clarity / 40 Hz Gamma Focus |
| 7.83 | healing-7.83, scientific-7.83 | Identical name | Earth Grounding / Earth Resonance |
| 1.5 | binaural-1.5, sleep-1.5 | Identical name | Deep Rest / Bedtime Wind-Down |
| 174 | solfeggio-174, healing-174 | Two names | Ground & Settle / Body Ease |
| 963 | solfeggio-963, chakra-963 | Two names | Divine Connection / Crown Stillness |
| 110 | healing-110, scientific-110 | Two near-identical names | Ancient Resonance / Ancient Chamber Tone |
| 432 | wealth-432, scientific-432 | Two names | Natural Harmony / 432 Hz Natural Tuning |

A separate entitlement audit determines whether duplicate-Hz records render identical audio. Until that audit is signed off, no surface may claim "46 unique frequencies". Use "the full library".

### 4.3 Search synonyms

Search resolves intent words to records through a synonym index. IDs are not changed.

| Query words | Intent category |
|---|---|
| sleep, insomnia, cannot sleep, bedtime, wind down, nap, night, rest | Sleep & Rest |
| anxiety, stress, overthinking, panic, worry, overwhelm, calm, relax, unwind | Calm & Stress Relief |
| focus, study, revision, exam, concentration, adhd, deep work, flow, reading, work, tired, energy, motivation, morning | Focus & Energy |
| meditate, meditation, mindfulness, breathing, stillness, present | Meditation & Mindfulness |
| money, abundance, wealth, manifest, manifestation, confidence, prosperity, intention | Abundance & Manifestation |
| relationship, relationships, love, connection, compassion, communication, boundaries | Connection & Relationships |
| recovery, sore, tension, body, ease, gentle, renew | Body & Recovery |
| chakra, spiritual, crown, root, heart, third eye, aura, energy centres | Spiritual & Chakra Work |
| nature, earth, grounding, schumann, 7.83, forest, outside | Nature & Earth |

## 5. Naming convention

Every record follows one shape:

```
[Hz or technique badge] + [Benefit-led name] + [Use-case line]
```

Example:

```
528 Hz · Heart Calm
Try it for: bedtime wind-down, gratitude journaling, a calm reset.
Part of the Solfeggio tradition.
```

Rules:

- Display name is five words or fewer.
- The technical name, Hz and technique stay visible as secondary text.
- The hook is under 90 characters.
- The use-case line names a real moment, for example "before bed" or "while studying".
- No exclamation marks.
- No outcome promises.

## 6. Claim rules

Evidence tiers shown in the UI:

| Tier | Badge text | Applies to |
|---|---|---|
| Research-backed, early evidence | Early research | Some binaural beat studies for relaxation, 40 Hz attention research |
| Traditional or cultural | Traditional | Solfeggio, chakra associations, 888 Hz numerology |
| Popular intention | Popular practice | Abundance and manifestation framing |

Allowed: "popular for", "many listeners use this for", "designed to support relaxation", "may help you feel", "pairs well with", "traditionally associated with", "use as part of your routine", "set your intention".

Forbidden: "cures", "heals", "treats", "repairs DNA", "proven to", "guaranteed", "will make you rich", "eliminates anxiety or depression or pain", "replaces medication", any named disease or condition, invented statistics, invented studies.

Additional rules:

- Any scientific statement must be verifiable. If it cannot be verified, rewrite it as tradition or popularity, or flag it for human review.
- Abundance and wealth content is framed as mindset, focus and intention, never as financial outcome.
- The plain-language disclaimer appears in the detail page and the paywall.
- Safety notes appear wherever isochronic or pulsing tones are described.

## 7. Content needs logged, not invented

| Need | Detail |
|---|---|
| Energy & Mood Boost | Only one genuine energy track (`binaural-25`). Category is merged into Focus & Energy until at least three exist. |
| Sleep depth | Sleep has six tracks but only two distinct Hz values below 3 Hz. |
| Napping | No short nap-length sleep session exists. |
| Study sessions | Focus has strong coverage but no exam-anxiety framing. |
| Connection | One primary track. Two chakra tones are cross-listed to reach the minimum. |

## 8. What does not change

- Frequency values, `baseFreq`, `beatFreq`, audio generation and playback logic.
- Record IDs, which programs reference.
- Premium flags, preview length and daily limits, until the entitlement audit is approved.
- The five trust-triangle free tones: 432, 528, 639, 7.83 and 8 Hz.

## 9. Implementation status

Shipped in this branch, in review-sized commits:

| Area | State |
|---|---|
| Live claim breaches | Removed from challenges, the Learn screen, seed articles, extracted guides and backend seed. |
| Intent taxonomy | `expo/lib/catalogue/intent-taxonomy.ts`, with all 46 records mapped and a three-track minimum per category. |
| Explore | Nine intent categories, all 46 records reachable, intent search in Overview and Library. |
| Shared strings | `expo/lib/copy/strings.ts`, with placeholder interpolation and article and session category labels. |
| Primary labels | "Healing" removed from tab labels, article titles, chips, player fallbacks, share text and the app name. |
| Pilot copy | 10 records in `expo/lib/catalogue/copy.ts`, with evidence tier, hook, use case, guidance and keywords. |
| Detail sheet | Hook, use case, why people use it, about this sound, evidence badge, practical guidance, safety and disclaimer. |
| Onboarding | Asks "What do you need right now?" with six needs. Stores an additive `primaryIntent`. |
| Paywall | Intent-led headline, trigger-specific copy, store-aware billing text, weekly price, trial timeline, secondary dismiss. |
| Entitlement | Free set pinned at nine, category-based lock removed, locked tracks always preview, preview length configurable. |
| Free today | One rotating free track above Explore search. |
| Telemetry | Paywall funnel defined behind a sink seam in `expo/lib/telemetry.ts`. |
| Store metadata | Three variants in `docs/APP_STORE_METADATA.md`. |
| Claim scan | `expo/__tests__/claim-safety.test.ts`, with a report in `docs/CLAIM_SAFETY_REPORT.md`. |
| Catalogue export | `docs/frequency-catalog.csv`, 46 rows, pilot rows marked reviewed. |

Still open:

- 36 records need reviewed copy.
- Premium program gating is not enforced. Do not advertise premium programs.
- Offline grace is defined but never applied, because `isOffline` is not passed.
- The duplicate partial catalogue has not been merged.
- Search synonyms for the 36 pending records are not authored.
- iOS billing has not been tested on a device.

