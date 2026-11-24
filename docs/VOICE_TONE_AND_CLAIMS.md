# Voice, tone and claim rules

Status: approved. Applies to every user-facing string: screens, cards, notifications, paywall, store listing and share text.

## 1. Voice

Calm, warm, confident, plain. Write as a knowledgeable guide, not a clinician and not a hype account.

- Calm. Short sentences. No urgency unless the user created it.
- Warm. Address the reader as "you". Use contractions such as "you'll" and "we'll".
- Confident. Say what the sound is and when to use it. Do not hedge every sentence.
- Plain. No jargon in primary text. Keep Hz and technique names in the secondary layer.
- Honest. Name the evidence tier. Never imply an outcome the app cannot deliver.

Do not use exclamation marks. Do not use all caps for emphasis. Do not use mystical overreach ("cosmic awakening") or clinical coldness ("acoustic intervention protocol").

## 2. Ten do and do not examples

| Do | Do not |
|---|---|
| Wind down before bed with 8 Hz theta listening. | This 8 Hz track induces deep sleep. |
| Popular for gratitude journaling and a calm reset. | Repairs your DNA and raises your vibration. |
| Try it for: study sessions, deep work, reading. | Proven to cure ADHD and double your focus. |
| Many listeners use this as part of a bedtime routine. | Guaranteed to eliminate insomnia tonight. |
| Set your intention, then press play. | Attract wealth and abundance into your life. |
| Part of the Solfeggio tradition. | Ancient frequencies lost to science, now rediscovered. |
| Designed to support relaxation. | Clinically treats anxiety. |
| Keep the volume comfortable and stop if you feel uneasy. | Push through discomfort to unlock results. |
| Early research, small studies, mixed results. | Scientifically proven by Harvard. |
| Not now, keep exploring free. | No thanks, I do not want to sleep better. |

## 3. Copy patterns

Display name:

```
[Hz] · [Benefit-led name]
```

Example: `528 Hz · Heart Calm`.

Hook, under 90 characters:

```
A calm reset for bedtime, gratitude practice and quiet evenings.
```

Use-case line:

```
Try it for: bedtime wind-down, journaling, a midday reset.
```

Why people use it, two or three sentences, tradition and popularity framing:

```
Many listeners use 528 Hz as a background for heart-centred meditation
and gratitude practice. It is one of the best-known tones in the modern
Solfeggio tradition. Individual experience varies.
```

About this sound, the honest technical layer:

```
528 Hz pure tone. Part of the modern Solfeggio scale. A small 2018 study
of nine participants reported mood and hormone changes after listening to
528-Hz-tuned music. The study used music, not an isolated tone, and the
sample was very small.
```

## 4. Evidence tiers

| Tier | Badge | Wording pattern |
|---|---|---|
| Early research | Early research | "Early studies suggest some listeners may feel more relaxed. Results are mixed and samples are small." |
| Traditional | Traditional | "Traditionally associated with..." |
| Popular practice | Popular practice | "Popular for..." |

Never present a tier as a guarantee. Never mix tiers in one sentence.

## 5. Allowed and forbidden language

Allowed:

- popular for
- many listeners use this for
- designed to support relaxation
- may help you feel
- pairs well with
- traditionally associated with
- use as part of your routine
- set your intention

Forbidden:

- cures, heals, treats
- repairs DNA, cellular regeneration
- proven to, guaranteed
- will make you rich
- eliminates anxiety, depression or pain
- replaces medication
- any named disease or condition
- fake statistics or fabricated studies
- "science-backed" applied to a tone with no research
- "designed by experts" or "join thousands" without evidence

Note on "healing": the word is removed from primary copy, tab labels, notifications, share text, permission text and category names. It stays only in tradition phrases such as "sound-healing tradition" and in store keyword fields, both flagged for human review.

## 6. Required disclaimer

Shown in the frequency detail page and the paywall, in plain language:

```
Harmony Frequency supports relaxation, focus and personal reflection.
It is not medical advice and not a substitute for professional care.
Individual experience varies.
```

Long form, used where space allows:

```
Harmony Frequency is designed for relaxation, meditation, focus and
personal reflection. Frequency-based listening is not a medical treatment
and is not intended to diagnose, treat, cure or prevent any disease or
health condition. Research findings described in the app may be
preliminary, mixed or specific to particular study conditions. Use a
comfortable listening volume and stop if you experience discomfort,
dizziness, headache or ringing in the ears. Do not listen while driving,
cycling or operating machinery.
```

## 7. Required safety notes

Show near isochronic or pulsing tones, and in the player help panel:

```
Keep the volume moderate. Do not listen while driving or operating
machinery. If you have epilepsy or a history of seizures, a pacemaker,
or are pregnant, talk to a doctor before using pulsing tones. Stop if you
feel uncomfortable.
```

## 8. Claim-safety checklist

Run before every copy change:

1. Does any sentence promise an outcome? Rewrite it.
2. Does any sentence name a disease or condition? Remove the name.
3. Does any sentence use a forbidden word from section 5? Replace it.
4. Is every scientific statement traceable to a real study? If not, reframe as tradition or popularity, or flag it.
5. Does abundance copy stay on mindset, focus and intention? If not, rewrite.
6. Is the evidence tier visible next to the claim? If not, add it.
7. Is the disclaimer present? Is the safety note present where needed?
8. Would the sentence still be true if the user felt nothing? If not, rewrite.
9. Is there social proof or authority language without evidence? Remove it.
10. Would a reviewer with insomnia or anxiety feel pressured? If yes, soften it.

## 9. Needs human review

| Item | Why | Owner |
|---|---|---|
| "Sound-healing tradition" phrasing | "Healing" may still read as a health claim to ASA or Apple reviewers even inside a tradition phrase. | Legal and content |
| 40 Hz article rewrite | The original named Alzheimer's research accurately. The rewrite keeps the science but drops the disease name for compliance. A clinician should confirm the new wording is not misleading. | Clinical adviser |
| 528 Hz 2018 study reference | Small study, nine participants, music rather than pure tone. Keep the caveat. Confirm the citation is current. | Clinical adviser |
| 432 Hz tuning claim | "Alternative tuning" is defensible. Any claim of physiological benefit is not. | Content |
| 888 Hz and abundance framing | Numerological symbolism. Must stay mindset and intention. | Legal and content |
| 7.83 Hz Schumann framing | The app does not reproduce Earth's electromagnetic field. Keep that sentence. | Content |
| Store keywords containing "healing" and "sound therapy" | Keyword fields are less visible but still reviewed by stores. | ASO and legal |
| UK ASA and CAP rules | Health and wellbeing claims are enforced strictly. Review the final store listing and paywall. | Legal |
| FTC health-claim guidance | Applies to US marketing copy and influencer scripts. | Legal |
| Apple App Store Review Guideline 1.4.1 and Google Play health policy | No medical claims, no disease names, no misleading screenshots. | Release owner |
| Subscription disclosure rules | Price, renewal, cancellation and trial terms must be clear before purchase on both stores. | Legal and release owner |
| App name change in `app.json` | Changes the home-screen label. Confirm with the product owner. | Product |
| Localization source strings | New keys must be translated by a human, not machine-translated, for claim-sensitive text. | Localization |
