# HARMONY FREQUENCY — STAGE 3 CONTENT REVIEW & AUDIT
**Document Version:** 1.0
**Date:** October 18, 2026
**Scope:** Stage 3 Content Integrity Calibration across Seed Files, Modals, Articles, and Onboarding

---

## 1. Audit & Content Delivery Path Verification

The entire content delivery pipeline in Harmony Frequency was audited to verify where user-facing text originates and how claims reach the screen:

1. **Seed Dataset (`expo/seed/`)**: Defines canonical default frequency records (`frequencies.ts`), curated programs (`programs.ts`), educational articles (`articles.ts`), and launch affirmations (`affirmations.ts`).
2. **Runtime Data Helpers (`expo/hooks/useDataHelpers.ts`)**: Resolves live authoritative Firestore content (`users/{uid}`, `frequencies`, `articles`), falls back to local `AsyncStorage` cache, and finally renders system seed baseline if Firestore is unseeded.
3. **Admin Protection**: Seeding routines (`expo/seed/seed.ts` & `useAdminData.ts`) perform non-destructive safe merges that never overwrite admin-edited records (`provenance: 'admin'` or `updatedBy: 'admin'`).

---

## 2. Evidence Classification & Calibrated Wording Inventory

All claims across seed files, UI modals, articles, and onboarding flows have been audited against five explicit evidence categories:

1. **Acoustic Fact**: Measurable audio properties (e.g. binaural beats require stereo headphones; phone speakers do not reproduce pure sub-20 Hz frequencies).
2. **Research Finding**: Preliminary studies with clear limitations (e.g. 2018 Akimoto et al. study on 528 Hz music; 40 Hz sensory stimulation research).
3. **Traditional / Spiritual Association**: Historical, symbolic, or contemplative practices (Solfeggio scale, Chakra mappings, 888 Hz numerology).
4. **Personal Preference / Experiential Framing**: Subjective user descriptions (e.g. *"many listeners find this soothing"*).
5. **Unsupported Claim [PROHIBITED]**: Unsubstantiated claims of physical healing, medical treatment, DNA repair, tissue regeneration, or guaranteed mental states.

---

### Detailed Claims Inventory & Revisions

| Source Location | Original Wording | Risk / Category | Calibrated Wording in Code | Review Status |
| :--- | :--- | :---: | :--- | :---: |
| `seed/frequencies.ts` & `constants/frequencies.ts` | `"DNA Repair & Cell Regeneration"` | **Unsupported Claim** [HIGH] | `"528-Hz pure tone associated with love, harmony and transformation in contemporary wellness traditions."` | **CALIBRATED** |
| `seed/frequencies.ts` (174 Hz) | `"Natural Anesthetic / Pain Relief"` | **Unsupported Claim** [HIGH] | `"A low-frequency pure tone presented for grounding, quiet reflection and relaxation."` | **CALIBRATED** |
| `seed/frequencies.ts` (285 Hz) | `"Cellular Tissue Healing"` | **Unsupported Claim** [HIGH] | `"A pure tone associated in contemporary sound-healing traditions with renewal, restoration and transition."` | **CALIBRATED** |
| `seed/frequencies.ts` (40 Hz) | `"40 Hz Gamma Focus Hack"` | **Unsupported Claim** [HIGH] | `"Research-inspired 40-Hz listening experience connected to gamma-range neuroscience research."` | **CALIBRATED** |
| `seed/frequencies.ts` (7.83 Hz) | `"Emits Earth Schumann Field directly"` | **Acoustic Fact** | `"Earth has naturally occurring electromagnetic Schumann resonances. This app provides a Schumann-inspired listening experience; it does not reproduce Earth's electromagnetic field."` | **CALIBRATED** |
| `seed/frequencies.ts` (1.5 Hz Delta) | `"1.5 Hz Pure Sleep Tone"` | **Acoustic Fact** | `"Low-beat listening experience for quiet wind-down and pre-sleep rest (carrier modulation applied for phone speaker audibility)."` | **CALIBRATED** |

---

## 3. Low-Frequency (< 20 Hz) and Binaural Technical Explanations

1. **Low-Frequency Speakers (< 20 Hz)**:
   * Pure frequencies such as 1.5 Hz or 7.83 Hz are below human hearing and physical phone speaker capabilities.
   * `SignalGenerator.ts` adds harmonic overtones/carrier frequencies to ensure audible delivery over mobile hardware.
   * UI modals explicitly state that carrier-modulated soundscapes are inspired by these frequency ranges.
2. **Binaural Beats & Headphones**:
   * Binaural entrainment requires distinct left/right channel frequencies ($f_{right} = f_{left} + f_{beat}$).
   * UI components and player overlays explicitly display: *"Headphones Required for Binaural Beats"*.

---

## 4. Universal Health Disclaimer

All frequency detail screens (`FrequencyInfoModal.tsx`), player cards (`AudioPlayer.tsx`), and articles (`seed/articles.ts`) display the following standardized universal health disclaimer:

> *"Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."*
