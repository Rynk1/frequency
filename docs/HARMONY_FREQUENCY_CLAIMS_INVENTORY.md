# HARMONY FREQUENCY — CLAIMS & CONTENT EVIDENCE INVENTORY
**Document Version:** 1.0
**Audit Date:** October 18, 2026
**Scope:** UI Components, Seed Files (`frequencies.ts`, `programs.ts`, `articles.ts`, `affirmations.ts`), Metadata, Notifications, and Store Assets

---

## 1. Overview & Classification Framework

To maintain full compliance with FTC health product compliance guidelines, Apple App Store Review Guidelines, and Google Play Health Content policies, all health, scientific, neurological, biological, and traditional claims within Harmony Frequency are audited and categorized into five explicit evidence levels:

1. **Acoustic Fact**: Measurable physical properties of audio signals, synthesis parameters, or stereo separation requirements.
2. **Research Finding**: Preliminary, peer-reviewed, or exploratory scientific research with clear contextual boundaries and limitations.
3. **Traditional / Spiritual Association**: Historical, symbolic, or contemplative concepts within yoga, sound healing, or spiritual traditions.
4. **Personal Preference / Experiential Framing**: Subjective user descriptions (e.g., *"many listeners find this soothing"*).
5. **Unsupported Claim [HIGH RISK]**: Direct claims of physical healing, medical treatment, DNA repair, immune activation, or guaranteed physiological/neurological states lacking clinical proof.

---

## 2. Comprehensive Inventory Matrix

| Location / File | Exact Wording in Code / UI | Evidence Category | Risk Level | Proposed Calibration / Replacement Wording | Human Review Required |
| :--- | :--- | :---: | :---: | :--- | :---: |
| `seed/frequencies.ts` (Solfeggio 528 Hz) | `"Transformation & Miracles (DNA Repair)"` *(Legacy Marketing)* | **Unsupported Claim** | **HIGH** | `"Associated in modern sound traditions with intention, transformation, and inner clarity."` | **YES** |
| `seed/frequencies.ts` (Solfeggio 174 Hz) | `"Natural Anesthetic / Pain Relief"` | **Unsupported Claim** | **HIGH** | `"Traditionally associated with physical relaxation and grounding comfort."` | **YES** |
| `seed/frequencies.ts` (Solfeggio 285 Hz) | `"Cellular Tissue Healing"` | **Unsupported Claim** | **HIGH** | `"Associated in contemporary sound healing with subtle energetic restoration."` | **YES** |
| `seed/frequencies.ts` (Scientific 40 Hz) | `"40 Hz Gamma Focus Hack — Guarantees Flow State"` | **Unsupported Claim** | **HIGH** | `"Explores 40 Hz Gamma sensory stimulation. Cognitive research on auditory entrainment is ongoing."` | **YES** |
| `seed/frequencies.ts` (Solfeggio 639 Hz) | `"Heals Broken Relationships & Interpersonal Conflict"` | **Unsupported Claim** | **HIGH** | `"Associated with relationship harmony, compassion, and open reflection."` | **YES** |
| `seed/frequencies.ts` (Sleep 1.5 Hz) | `"1.5 Hz Pure Sleep Tone"` *(Phone Speaker)* | **Acoustic Fact** | **MEDIUM** | `"1.5 Hz is below audible phone speaker range; carrier overtone modulation is applied for listening."` | **NO** |
| `components/FrequencyInfoModal.tsx` | `"Chakra Frequencies (194.18 Hz - 963 Hz)"` | **Traditional Association** | **LOW** | `"Contemplative chakra mappings based on sound-healing traditions, not physical anatomy."` | **NO** |
| `seed/articles.ts` (Binaural Article) | `"Binaural Beats Entrain Brainwaves Automatically"` | **Research Finding** | **MEDIUM** | `"Research on binaural beats indicates varied responses across individuals; headphones required."` | **NO** |

---

## 3. Disclaimers & Regulatory Safeguards

All frequency detail screens, player modals, and educational articles enforce the following standardized universal disclaimer:

> **Universal Health Disclaimer**:
> *"Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."*

---

## 4. Recommendations for Product Owner Review

1. **Explicit Disavowal of "DNA Repair" Claims**: Formally purge any remaining references to DNA repair, tissue regeneration, or pain removal across app store metadata and ad creative assets.
2. **Stereo & Speaker Guidance**: Ensure every binaural beat session includes explicit UI notices that headphones are required for stereo separation.
3. **Low-Frequency Explanation**: Clarify that pure signals below 20 Hz (e.g. Schumann 7.83 Hz or Delta 1.5 Hz) are modulated using audible acoustic carrier frequencies.
