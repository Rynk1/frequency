/**
 * Benefit-led copy for the frequency catalogue.
 *
 * Record ids are the join key. Hz values, audio parameters and premium flags
 * stay in the seed and are never duplicated here. Entries are added in
 * reviewed batches; anything without an entry falls back to the technical
 * `name` and `description` from the seed.
 *
 * Claim rules: see docs/VOICE_TONE_AND_CLAIMS.md. Every scientific sentence
 * must be traceable, and abundance copy stays on mindset, focus and intention.
 */

export type EvidenceTier = 'early-research' | 'traditional' | 'popular-practice';

export const EVIDENCE_TIER_LABELS: Record<EvidenceTier, string> = {
  'early-research': 'Early research',
  traditional: 'Traditional',
  'popular-practice': 'Popular practice',
};

export const SAFETY_NOTE =
  'Keep the volume moderate. Do not listen while driving or operating machinery. Stop if you feel uncomfortable.';

export const MEDICAL_DISCLAIMER =
  'Harmony Frequency supports relaxation, focus and personal reflection. It is not medical advice and not a substitute for professional care. Individual experience varies.';

export const PULSING_TONE_SAFETY_NOTE =
  'Keep the volume moderate. Do not listen while driving or operating machinery. If you have epilepsy or a history of seizures, a pacemaker, or are pregnant, talk to a doctor before using pulsing tones. Stop if you feel uncomfortable.';

export type HeadphoneRequirement = 'required' | 'recommended' | 'optional';

export interface FrequencyCopy {
  /** Benefit-led name, five words or fewer. */
  displayName: string;
  /** One line for cards and share, under 90 characters. */
  hook: string;
  /** A real moment of use. */
  useCaseLine: string;
  /** Two or three sentences of tradition and popularity framing. */
  whyPeopleUseIt: string;
  /** The honest technical layer: Hz, technique, origin, evidence caveat. */
  aboutThisSound: string;
  evidenceTier: EvidenceTier;
  evidenceNote: string;
  recommendedLength: string;
  bestTimeOfDay: string;
  headphones: HeadphoneRequirement;
  keywords: string[];
  safetyNote?: string;
}

export const FREQUENCY_COPY: Record<string, FrequencyCopy> = {
  'scientific-432': {
    displayName: 'Natural Tuning',
    hook: 'An alternative tuning for a calmer listening backdrop.',
    useCaseLine: 'Try it for: evening wind-down, background listening, a slow start to the day.',
    whyPeopleUseIt:
      'Many listeners prefer 432 Hz tuning for its softer character. It is a popular alternative to the standard 440 Hz concert pitch. Individual experience varies.',
    aboutThisSound:
      '432 Hz pure tone. Standard concert pitch is 440 Hz; 432 Hz is an alternative tuning used by some musicians and listeners. Small pilot studies have reported differences in how listeners describe the sound, but the evidence is preliminary.',
    evidenceTier: 'early-research',
    evidenceNote: 'Small pilot studies, mixed results.',
    recommendedLength: '15 to 30 minutes',
    bestTimeOfDay: 'Evening or background listening',
    headphones: 'optional',
    keywords: ['432 hz', 'natural tuning', 'alternative tuning', 'calm', 'relax', 'background'],
  },
  'solfeggio-528': {
    displayName: 'Heart Calm',
    hook: 'A gentle tone for gratitude, heart-centred meditation and calm.',
    useCaseLine: 'Try it for: gratitude journaling, a midday reset, quiet meditation.',
    whyPeopleUseIt:
      '528 Hz is one of the best-known tones in the modern Solfeggio tradition. Many listeners use it for heart-centred meditation and gratitude practice. Individual experience varies.',
    aboutThisSound:
      '528 Hz pure tone, part of the modern Solfeggio scale. A small 2018 study of nine participants reported endocrine and autonomic changes after listening to 528-Hz-tuned music. The study used music rather than an isolated tone, and the sample was very small.',
    evidenceTier: 'early-research',
    evidenceNote: 'One small study; music, not a pure tone.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Anytime; often used in the evening',
    headphones: 'optional',
    keywords: ['528 hz', 'love frequency', 'gratitude', 'heart', 'calm', 'solfeggio'],
  },
  'solfeggio-639': {
    displayName: 'Connection & Compassion',
    hook: 'A warm tone for reflection on connection and kind communication.',
    useCaseLine:
      'Try it for: before a difficult conversation, journaling about relationships, shared quiet time.',
    whyPeopleUseIt:
      '639 Hz is associated in the modern Solfeggio tradition with connection, compassion and communication. Many listeners use it as a backdrop for reflection on relationships. It does not fix or change a relationship; it is a space for your own reflection.',
    aboutThisSound:
      '639 Hz pure tone, part of the modern Solfeggio scale. The association with connection comes from contemporary sound-healing practice, not clinical research.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary Solfeggio tradition.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Before a conversation or in the evening',
    headphones: 'optional',
    keywords: ['639 hz', 'relationships', 'connection', 'compassion', 'communication', 'solfeggio'],
  },
  'scientific-7.83': {
    displayName: 'Earth Resonance',
    hook: "Inspired by the Earth's natural resonance near 7.83 Hz.",
    useCaseLine: 'Try it for: grounding breaks, time outdoors, a quiet evening reset.',
    whyPeopleUseIt:
      'Schumann resonances are a real geophysical phenomenon, and many listeners find the idea of an Earth-linked tone calming. This track is inspired by that resonance; it does not reproduce the Earth\'s electromagnetic field.',
    aboutThisSound:
      '7.83 Hz listening tone inspired by the Schumann resonance, a documented atmospheric electromagnetic phenomenon near 7.83 Hz. Phone audio produces sound waves, not electromagnetic fields.',
    evidenceTier: 'traditional',
    evidenceNote: 'Real geophysical phenomenon; the wellness use is traditional.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Afternoon or early evening',
    headphones: 'optional',
    keywords: ['schumann', '7.83 hz', 'earth', 'grounding', 'nature', 'resonance'],
  },
  'sleep-8': {
    displayName: 'Drift Off',
    hook: 'A quiet 8 Hz tone for the last stretch before bed.',
    useCaseLine: 'Try it for: the last 15 minutes before bed, winding down after screens.',
    whyPeopleUseIt:
      'Many listeners use low-frequency tones as part of a bedtime routine. This track is designed to support a calmer wind-down; it does not induce sleep.',
    aboutThisSound:
      '8 Hz listening tone in the alpha range, used here as a pre-sleep wind-down. Headphones are recommended so both ears receive the intended signal.',
    evidenceTier: 'early-research',
    evidenceNote: 'Binaural beat research is mixed and samples are small.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Before bed',
    headphones: 'recommended',
    keywords: ['sleep', '8 hz', 'bedtime', 'wind down', 'alpha', 'insomnia'],
  },
  'wealth-888': {
    displayName: 'Abundance Mindset',
    hook: 'A reflective tone for goal setting and a constructive money mindset.',
    useCaseLine: 'Try it for: morning intention setting, journaling about goals, planning your week.',
    whyPeopleUseIt:
      '888 Hz carries numerological symbolism in popular manifestation practice. Many listeners use it as a cue for intention setting and goal reflection. It is a mindset and focus tool; it does not create financial outcomes.',
    aboutThisSound:
      '888 Hz pure tone. The association with abundance comes from numerology and popular manifestation practice, not from financial or clinical research.',
    evidenceTier: 'popular-practice',
    evidenceNote: 'Numerological symbolism; no financial or clinical evidence.',
    recommendedLength: '10 to 15 minutes',
    bestTimeOfDay: 'Morning or early afternoon',
    headphones: 'optional',
    keywords: ['888 hz', 'abundance', 'money mindset', 'manifestation', 'goals', 'intention', 'confidence'],
  },
  'wealth-528': {
    displayName: 'Manifestation Focus',
    hook: 'A 528 Hz backdrop for intention setting and focused goal reflection.',
    useCaseLine: 'Try it for: writing down a goal, a morning intention, a planning session.',
    whyPeopleUseIt:
      'Listeners pair 528 Hz with affirmations and goal reflection. It is used as a focus cue for intention setting. It does not promise or produce financial results.',
    aboutThisSound:
      '528 Hz pure tone, part of the modern Solfeggio scale, paired here with an intention-setting frame. The abundance association is popular practice, not established science.',
    evidenceTier: 'popular-practice',
    evidenceNote: 'Popular intention practice; 528 Hz evidence is small and unrelated to wealth.',
    recommendedLength: '10 to 15 minutes',
    bestTimeOfDay: 'Morning',
    headphones: 'optional',
    keywords: ['528 hz', 'manifestation', 'abundance', 'intention', 'affirmation', 'goals'],
  },
  'solfeggio-963': {
    displayName: 'Divine Connection',
    hook: 'A still, high tone for quiet contemplation and meditation.',
    useCaseLine: 'Try it for: seated meditation, quiet reflection, the end of a longer practice.',
    whyPeopleUseIt:
      '963 Hz is associated with crown awareness and spiritual connection in contemporary sound-healing traditions. Many listeners use it for deep meditation and quiet reflection.',
    aboutThisSound:
      '963 Hz pure tone, the highest note in the modern Solfeggio scale. The crown and spiritual associations come from contemporary wellness traditions, not validated anatomy.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary Solfeggio tradition.',
    recommendedLength: '15 to 30 minutes',
    bestTimeOfDay: 'Evening or during a longer meditation',
    headphones: 'optional',
    keywords: ['963 hz', 'crown', 'spiritual', 'meditation', 'divine', 'solfeggio'],
  },
  'scientific-110': {
    displayName: 'Ancient Chamber Tone',
    hook: 'A low resonance inspired by archaeoacoustic research.',
    useCaseLine: 'Try it for: reflective listening, reading, a slow evening.',
    whyPeopleUseIt:
      '110 Hz has been studied in archaeoacoustic research on ancient stone chambers. Listeners use it as a low, resonant backdrop for reflection. It has no established therapeutic effect.',
    aboutThisSound:
      '110 Hz pure tone. Researchers have measured resonant frequencies in some ancient stone structures and discussed how sound behaves in those spaces. This track is inspired by that work; it is not a reconstruction of any specific site.',
    evidenceTier: 'early-research',
    evidenceNote: 'Archaeoacoustic research on room resonance, not health outcomes.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Evening',
    headphones: 'optional',
    keywords: ['110 hz', 'ancient', 'resonance', 'archaeoacoustic', 'low tone', 'reflection'],
  },
  'scientific-40': {
    displayName: '40 Hz Gamma Focus',
    hook: 'A 40 Hz tone for focused work and attentive listening.',
    useCaseLine: 'Try it for: deep work, study sessions, reading, a focused morning.',
    whyPeopleUseIt:
      '40 Hz falls in the gamma range and is a popular choice for focused work. Early research has explored 40 Hz stimulation in relation to attention and memory. Consumer audio is not a medical treatment.',
    aboutThisSound:
      '40 Hz listening tone in the gamma range. Early laboratory research has explored 40 Hz light and sound stimulation in relation to memory and attention. Those protocols use specialised equipment and are not equivalent to a phone audio track.',
    evidenceTier: 'early-research',
    evidenceNote: 'Early laboratory research; consumer audio is not a clinical protocol.',
    recommendedLength: '15 to 20 minutes',
    bestTimeOfDay: 'Morning or afternoon',
    headphones: 'recommended',
    keywords: ['40 hz', 'gamma', 'focus', 'study', 'deep work', 'concentration', 'attention'],
  },
};

export function copyForFrequency(frequencyId: string): FrequencyCopy | undefined {
  return FREQUENCY_COPY[frequencyId];
}

export function displayNameForFrequency(frequencyId: string, fallbackName: string): string {
  return FREQUENCY_COPY[frequencyId]?.displayName ?? fallbackName;
}

export function evidenceTierLabel(tier: EvidenceTier): string {
  return EVIDENCE_TIER_LABELS[tier];
}
