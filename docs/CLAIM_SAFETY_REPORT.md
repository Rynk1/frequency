# Claim safety report

Date: 24 November 2026
Scope: promotional copy shipped in the app and the proposed store listing.

## Result

The automated scan found no forbidden claim in any promotional string.

- Strings scanned: about 720
- Violations: 0
- Test: `expo/__tests__/claim-safety.test.ts`
- Command: `cd expo && npx vitest run __tests__/claim-safety.test.ts`

The scan is negation-aware. A phrase such as "does not guarantee sleep" is
allowed, because it is a denial, not a claim. Article bodies are excluded
from the automated scan because they quote and debunk false claims (for
example, "claims that 528 Hz repairs DNA are unsupported"). Those bodies
were reviewed by hand.

## What the scan covers

Frequency records, for all 46 records:

- name
- description
- benefits
- purpose
- scientific basis
- background

Programs, for all 15 records:

- name
- description

Articles, for all 8 records:

- title
- excerpt

Reviewed copy:

- display name, hook, use case, why people use it, about this sound and
  evidence note for all 46 records
- paywall headline and body for all 9 intent categories, plus the default
- all premium benefit lines
- all shared UI strings in `lib/copy/strings.ts`

## Forbidden terms checked

- cure, cures, cured
- heal, heals, healed
- treat, treats, treated
- proven
- guaranteed
- repairs DNA
- will make you rich
- attract wealth, attract money
- eliminates anxiety, eliminates depression, eliminates pain
- replaces medication
- Alzheimer
- cancer

## Rules enforced

1. Any scientific sentence names the kind of evidence and its limits.
2. Abundance copy stays on mindset, focus and intention.
3. Every track shows an evidence tier and a one-line caveat.
4. Every detail sheet shows a safety note and a medical disclaimer.
5. Primary names and titles do not use "healing".

## Remaining risk and needs human review

### Legal and policy

1. Apple App Store Review Guidelines 2.3.1 and 3.1.1. The listing and in-app
   copy avoid health claims and do not link to an external purchase path.
   A reviewer should confirm the iOS manage-subscription link does not read
   as an external purchase link.
2. Google Play health and medical claims policy. The app now labels evidence
   and avoids treatment language. A policy reviewer should confirm the
   "Recovery" category label does not imply injury recovery.
3. FTC health claim guidance and UK ASA/CAP rules. "Supports relaxation" and
   "designed to support" are the strongest phrases used. A local reviewer
   should confirm they are acceptable in each market.
4. Spiritual wording. "Chakra", "crown" and "divine" are framed as
   tradition. Some markets are more sensitive to spiritual claims. Review
   before localisation.
5. Abundance wording. Copy says the tracks are a mindset and focus tool and
   that they do not create financial outcomes. Marketing must not add
   wealth language on social channels.

### Unverifiable or narrow science

1. 528 Hz. Copy cites a 2018 study of nine participants that used music, not
   an isolated tone. Confirm the citation and keep the sample-size caveat.
2. 110 Hz archaeoacoustics. Copy says researchers measured resonance in some
   ancient stone structures and that the track is not a reconstruction.
   Confirm the sources before publishing the store listing.
3. 432 Hz. Copy says "small pilot studies" without naming them. Either name
   a source or soften to "some listeners report".
4. 7.83 Hz. The Schumann resonance is a real geophysical phenomenon. The
   wellness use is traditional. Keep the sentence that phone audio produces
   sound waves, not electromagnetic fields.
5. 40 Hz. Copy says early laboratory research exists and that consumer audio
   is not a clinical protocol. Keep that sentence in every 40 Hz record.

### Wording choices

1. "Early research" may read as stronger than intended. Consider "Early,
   limited research" in a future pass.
2. "Traditional" is used for the modern Solfeggio system. Copy says "modern
   Solfeggio tradition", which is accurate. Do not call it ancient.
3. "Recovery" replaced "Healing". Confirm it does not imply injury recovery.
4. Article bodies still use "sound therapy" when describing history. This is
   descriptive, not a claim. Review if a store reviewer objects.

### Product gaps

1. Cited studies still need a source check before store publication. They
   are described conservatively and no study is invented.
2. Offline premium access is fail-closed: a cached profile grants nothing.
   The 72-hour policy is defined but unused.
3. iOS billing has not been run on a device. RevenueCat and store product
   configuration need a device test.
4. No product analytics provider is connected. Events are defined behind
   `expo/lib/telemetry.ts` and go nowhere until one is wired.

### Accessibility and layout

1. The free-today tile adds a fourth small-text row on Explore. Check that it
   does not push the first category below the fold on a small phone.
2. The longest display name is "Connection & Compassion". Check truncation on
   a 320-point-wide screen and at large text sizes.
3. The evidence badge and safety note use small text. Check contrast and
   dynamic type.
4. The paywall now has a secondary dismiss action. Confirm it is reachable by
   screen readers and does not sit under the home indicator.

## Audio and data safety

No audio generation, playback logic, frequency values or record ids changed
in this work. The catalogue audit test still enumerates all 46 records:

- `expo/__tests__/audio/CatalogueAudioAudit.test.ts`
- `expo/__tests__/audio/CatalogueAudibility.test.ts`

All 231 tests passed at the time of this report.
