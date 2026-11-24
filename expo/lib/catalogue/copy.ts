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
  'solfeggio-174': {
    displayName: 'Ground & Settle',
    hook: 'A low tone for grounding and a quieter evening.',
    useCaseLine: 'Try it for: grounding breaks, slow breathing, the end of a busy day.',
    whyPeopleUseIt:
      '174 Hz is the lowest note in the modern Solfeggio scale. Many listeners use it as a soft backdrop for grounding and quiet reflection. Individual experience varies.',
    aboutThisSound:
      '174 Hz pure tone, the lowest of the modern Solfeggio frequencies. The association with grounding comes from contemporary sound-healing practice, not clinical research.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary Solfeggio tradition.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Evening',
    headphones: 'optional',
    keywords: ['174 hz', 'grounding', 'solfeggio', 'relax', 'evening', 'low tone'],
  },
  'solfeggio-285': {
    displayName: 'Gentle Renewal',
    hook: 'A soft tone for reflection on change and fresh starts.',
    useCaseLine: 'Try it for: journaling, a fresh start, quiet reflection on change.',
    whyPeopleUseIt:
      '285 Hz is associated with renewal and restoration in contemporary Solfeggio practice. Listeners use it as a reflective backdrop. Individual experience varies.',
    aboutThisSound:
      '285 Hz pure tone in the modern Solfeggio scale. The renewal association is traditional and not clinically established.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary Solfeggio tradition.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Morning or evening',
    headphones: 'optional',
    keywords: ['285 hz', 'renewal', 'fresh start', 'solfeggio', 'reflection', 'change'],
  },
  'solfeggio-396': {
    displayName: 'Release & Let Go',
    hook: 'A grounded tone for setting down worry at the end of the day.',
    useCaseLine: 'Try it for: a worry journal, a slow exhale, the end of a stressful day.',
    whyPeopleUseIt:
      '396 Hz is associated with release and letting go in contemporary sound-healing traditions. Many listeners use it as a calm backdrop for reflection. It is not a therapy for anxiety or any condition.',
    aboutThisSound:
      '396 Hz pure tone in the modern Solfeggio scale. The association with release comes from contemporary practice, not clinical research.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary Solfeggio tradition.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Evening',
    headphones: 'optional',
    keywords: ['396 hz', 'release', 'let go', 'calm', 'anxiety', 'solfeggio', 'worry'],
  },
  'solfeggio-417': {
    displayName: 'Fresh Start',
    hook: 'A clear tone for reflection on change and new beginnings.',
    useCaseLine: 'Try it for: planning a change, morning journaling, a fresh week.',
    whyPeopleUseIt:
      '417 Hz is associated with change and fresh perspective in contemporary Solfeggio practice. Listeners use it as a backdrop for reflection. Individual experience varies.',
    aboutThisSound:
      '417 Hz pure tone in the modern Solfeggio scale. The association with change is traditional and not clinically established.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary Solfeggio tradition.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Morning',
    headphones: 'optional',
    keywords: ['417 hz', 'change', 'new beginning', 'solfeggio', 'fresh start', 'reflection'],
  },
  'solfeggio-741': {
    displayName: 'Clear Intuition',
    hook: 'A bright tone for clarity and creative reflection.',
    useCaseLine: 'Try it for: creative work, decision journaling, a quiet planning session.',
    whyPeopleUseIt:
      '741 Hz is associated with clarity and intuition in contemporary sound-healing traditions. Many listeners use it as a backdrop for creative reflection. Individual experience varies.',
    aboutThisSound:
      '741 Hz pure tone in the modern Solfeggio scale. The association with intuition comes from contemporary practice, not clinical research.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary Solfeggio tradition.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Morning or afternoon',
    headphones: 'optional',
    keywords: ['741 hz', 'intuition', 'clarity', 'solfeggio', 'creativity', 'focus'],
  },
  'solfeggio-852': {
    displayName: 'Inner Stillness',
    hook: 'A high, still tone for contemplation and quiet order.',
    useCaseLine: 'Try it for: seated meditation, quiet reflection, a slow evening.',
    whyPeopleUseIt:
      '852 Hz is associated with inner stillness and spiritual order in contemporary traditions. Listeners use it as a contemplative backdrop. Individual experience varies.',
    aboutThisSound:
      '852 Hz pure tone in the modern Solfeggio scale. The association with stillness and spiritual order is traditional, not clinically established.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary Solfeggio tradition.',
    recommendedLength: '15 to 30 minutes',
    bestTimeOfDay: 'Evening',
    headphones: 'optional',
    keywords: ['852 hz', 'stillness', 'spiritual', 'meditation', 'solfeggio', 'contemplation'],
  },
  'chakra-194.18': {
    displayName: 'Root & Ground',
    hook: 'A steady tone for feeling grounded and present.',
    useCaseLine: 'Try it for: grounding practice, slow breathing, the start of meditation.',
    whyPeopleUseIt:
      'The root chakra tone is part of a contemporary chakra meditation framework. Many listeners use it for grounding and presence. The framework is traditional, not medical.',
    aboutThisSound:
      '194.18 Hz tone, the root chakra frequency in a contemporary chakra meditation framework. The association is traditional and not validated anatomy.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary chakra framework.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Morning or evening',
    headphones: 'optional',
    keywords: ['root chakra', 'grounding', '194 hz', 'chakra', 'presence', 'meditation'],
  },
  'chakra-210.42': {
    displayName: 'Creative Flow',
    hook: 'A warm tone for creativity and emotional reflection.',
    useCaseLine: 'Try it for: creative projects, journaling, an unhurried afternoon.',
    whyPeopleUseIt:
      'The sacral chakra tone belongs to a contemporary chakra meditation framework. Listeners use it for creativity and emotional reflection. The framework is traditional, not medical.',
    aboutThisSound:
      '210.42 Hz tone, the sacral chakra frequency in a contemporary chakra meditation framework. The association is traditional and not validated anatomy.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary chakra framework.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Afternoon',
    headphones: 'optional',
    keywords: ['sacral chakra', 'creativity', '210 hz', 'chakra', 'flow', 'emotion'],
  },
  'chakra-126.22': {
    displayName: 'Quiet Confidence',
    hook: 'A centred tone for confidence and steady focus.',
    useCaseLine: 'Try it for: before a meeting, a confidence journal, focused work.',
    whyPeopleUseIt:
      'The solar plexus tone belongs to a contemporary chakra meditation framework. Many listeners use it for confidence and steady focus. The framework is traditional, not medical.',
    aboutThisSound:
      '126.22 Hz tone, the solar plexus chakra frequency in a contemporary chakra meditation framework. The association is traditional and not validated anatomy.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary chakra framework.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Morning',
    headphones: 'optional',
    keywords: ['solar plexus', 'confidence', '126 hz', 'chakra', 'focus', 'agency'],
  },
  'chakra-341.3': {
    displayName: 'Heart Warmth',
    hook: 'A gentle tone for compassion and heart-centred meditation.',
    useCaseLine: 'Try it for: gratitude practice, loving-kindness meditation, a slow evening.',
    whyPeopleUseIt:
      'The heart chakra tone belongs to a contemporary chakra meditation framework. Listeners use it for compassion and warmth. The framework is traditional, not medical.',
    aboutThisSound:
      '341.3 Hz tone, the heart chakra frequency in a contemporary chakra meditation framework. The association is traditional and not validated anatomy.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary chakra framework.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Evening',
    headphones: 'optional',
    keywords: ['heart chakra', 'compassion', '341 hz', 'chakra', 'gratitude', 'meditation'],
  },
  'chakra-384': {
    displayName: 'Speak with Ease',
    hook: 'A clear tone for reflection on communication and expression.',
    useCaseLine: 'Try it for: before a conversation, voice notes, journaling.',
    whyPeopleUseIt:
      'The throat chakra tone belongs to a contemporary chakra meditation framework. Many listeners use it before speaking or writing. The framework is traditional, not medical.',
    aboutThisSound:
      '384 Hz tone, the throat chakra frequency in a contemporary chakra meditation framework. The association is traditional and not validated anatomy.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary chakra framework.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Before a conversation',
    headphones: 'optional',
    keywords: ['throat chakra', 'communication', '384 hz', 'chakra', 'expression', 'speaking'],
  },
  'chakra-426.7': {
    displayName: 'Third Eye Focus',
    hook: 'A quiet tone for intuition and reflective attention.',
    useCaseLine: 'Try it for: seated meditation, visualisation, a quiet evening.',
    whyPeopleUseIt:
      'The third eye tone belongs to a contemporary chakra meditation framework. Listeners use it for intuition and reflective attention. The framework is traditional, not medical.',
    aboutThisSound:
      '426.7 Hz tone, the third eye chakra frequency in a contemporary chakra meditation framework. The association is traditional and not validated anatomy.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary chakra framework.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Evening',
    headphones: 'optional',
    keywords: ['third eye', 'intuition', '426 hz', 'chakra', 'visualisation', 'meditation'],
  },
  'chakra-963': {
    displayName: 'Crown Stillness',
    hook: 'A high tone for stillness and spiritual contemplation.',
    useCaseLine: 'Try it for: deep meditation, quiet reflection, the end of practice.',
    whyPeopleUseIt:
      'The crown chakra tone belongs to a contemporary chakra meditation framework. Many listeners use it for stillness and contemplation. The framework is traditional, not medical.',
    aboutThisSound:
      '963 Hz tone, the crown chakra frequency in a contemporary chakra meditation framework. The association is traditional and not validated anatomy.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary chakra framework.',
    recommendedLength: '15 to 30 minutes',
    bestTimeOfDay: 'Evening',
    headphones: 'optional',
    keywords: ['crown chakra', 'stillness', '963 hz', 'chakra', 'spiritual', 'meditation'],
  },
  'binaural-1.5': {
    displayName: 'Deep Rest',
    hook: 'A low beat for the last stretch before sleep.',
    useCaseLine: 'Try it for: bedtime wind-down, a dark room, the last 15 minutes of the day.',
    whyPeopleUseIt:
      'Delta-range listening is popular as a pre-sleep backdrop. Many listeners use low beats to settle into a bedtime routine. It does not induce sleep.',
    aboutThisSound:
      '1.5 Hz binaural-style beat in the delta range. Binaural beats need stereo headphones to be perceived. Research on sleep outcomes is small and mixed.',
    evidenceTier: 'early-research',
    evidenceNote: 'Small, mixed sleep research.',
    recommendedLength: '15 to 30 minutes',
    bestTimeOfDay: 'Before bed',
    headphones: 'required',
    keywords: ['sleep', 'delta', 'binaural', 'bedtime', 'wind down', 'deep rest'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'binaural-2.5': {
    displayName: 'Delta Wind-Down',
    hook: 'A slow delta beat for evening rest and quiet.',
    useCaseLine: 'Try it for: evening reading, a pre-sleep routine, a quiet room.',
    whyPeopleUseIt:
      'Delta-range beats are used by listeners as a slow evening backdrop. Many people pair them with a wind-down routine. It is not a sleep treatment.',
    aboutThisSound:
      '2.5 Hz binaural-style beat in the delta range. Stereo headphones are needed for the beat to be perceived. Research on relaxation outcomes is small and mixed.',
    evidenceTier: 'early-research',
    evidenceNote: 'Small, mixed relaxation research.',
    recommendedLength: '15 to 30 minutes',
    bestTimeOfDay: 'Evening',
    headphones: 'required',
    keywords: ['delta', 'binaural', 'evening', 'wind down', 'sleep', 'rest'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'binaural-4.5': {
    displayName: 'Deep Meditation',
    hook: 'A theta beat for longer, quieter meditation.',
    useCaseLine: 'Try it for: seated meditation, breath practice, a slow evening.',
    whyPeopleUseIt:
      'Theta-range listening is popular for meditation and creative reflection. Many listeners use it as a longer meditation backdrop. Individual experience varies.',
    aboutThisSound:
      '4.5 Hz binaural-style beat in the theta range. Stereo headphones are needed for the beat to be perceived. Meditation research is small and mixed.',
    evidenceTier: 'early-research',
    evidenceNote: 'Small, mixed meditation research.',
    recommendedLength: '15 to 30 minutes',
    bestTimeOfDay: 'Evening',
    headphones: 'required',
    keywords: ['theta', 'binaural', 'meditation', 'deep meditation', 'breath', 'calm'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'binaural-6': {
    displayName: 'Creative Theta',
    hook: 'A gentle theta beat for creative sessions and reflection.',
    useCaseLine: 'Try it for: sketching, writing, a quiet afternoon.',
    whyPeopleUseIt:
      'Theta-range beats are a popular backdrop for creative work. Listeners use them to settle into an unhurried session. It is not a creativity treatment.',
    aboutThisSound:
      '6 Hz binaural-style beat in the theta range. Stereo headphones are needed for the beat to be perceived. Research on creativity outcomes is limited.',
    evidenceTier: 'early-research',
    evidenceNote: 'Limited direct research.',
    recommendedLength: '15 to 30 minutes',
    bestTimeOfDay: 'Afternoon',
    headphones: 'required',
    keywords: ['theta', 'binaural', 'creativity', 'writing', 'focus', 'reflection'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'binaural-8.5': {
    displayName: 'Calm Alpha',
    hook: 'A light alpha beat for a calmer, quieter head.',
    useCaseLine: 'Try it for: a midday reset, slow breathing, a screen break.',
    whyPeopleUseIt:
      'Alpha-range listening is popular for calm attention. Many listeners use it to step back from a busy day. It is not a therapy for anxiety.',
    aboutThisSound:
      '8.5 Hz binaural-style beat in the alpha range. Stereo headphones are needed for the beat to be perceived. Relaxation research is small and mixed.',
    evidenceTier: 'early-research',
    evidenceNote: 'Small, mixed relaxation research.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Midday or evening',
    headphones: 'required',
    keywords: ['alpha', 'binaural', 'calm', 'anxiety', 'reset', 'relaxation'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'binaural-10': {
    displayName: 'Alpha Presence',
    hook: 'A steady alpha beat for light meditation and presence.',
    useCaseLine: 'Try it for: mindfulness, a short pause, a tea break.',
    whyPeopleUseIt:
      'Alpha-range beats are a popular backdrop for light meditation. Listeners use them for a calm, present pause. Individual experience varies.',
    aboutThisSound:
      '10 Hz binaural-style beat in the alpha range. Stereo headphones are needed for the beat to be perceived. Research on mindfulness outcomes is limited.',
    evidenceTier: 'early-research',
    evidenceNote: 'Limited direct research.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Anytime',
    headphones: 'required',
    keywords: ['alpha', 'binaural', 'meditation', 'presence', 'mindfulness', 'calm'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'binaural-12': {
    displayName: 'Study Alpha',
    hook: 'A calm beat for reading and focused study.',
    useCaseLine: 'Try it for: revision, reading, a focused hour.',
    whyPeopleUseIt:
      'Alpha-range listening is popular for calm concentration. Many listeners use it for study and reading sessions. It is not a treatment for attention conditions.',
    aboutThisSound:
      '12 Hz binaural-style beat in the alpha range. Stereo headphones are needed for the beat to be perceived. Focus research is small and mixed.',
    evidenceTier: 'early-research',
    evidenceNote: 'Small, mixed focus research.',
    recommendedLength: '15 to 30 minutes',
    bestTimeOfDay: 'Morning or afternoon',
    headphones: 'required',
    keywords: ['study', 'focus', 'alpha', 'binaural', 'reading', 'adhd', 'concentration'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'binaural-14': {
    displayName: 'Steady Attention',
    hook: 'An SMR-range beat for steady, quiet focus.',
    useCaseLine: 'Try it for: detailed work, posture practice, a focused morning.',
    whyPeopleUseIt:
      'The sensorimotor rhythm range is used by listeners for steady attention. It is a popular background for detailed work. Individual experience varies.',
    aboutThisSound:
      '14 Hz binaural-style beat in the sensorimotor rhythm range. The SMR label comes from EEG research; consumer audio is not a clinical tool. Stereo headphones are needed for the beat.',
    evidenceTier: 'early-research',
    evidenceNote: 'EEG research; consumer audio is not a clinical protocol.',
    recommendedLength: '15 to 30 minutes',
    bestTimeOfDay: 'Morning',
    headphones: 'required',
    keywords: ['smr', 'sensorimotor rhythm', 'binaural', 'focus', 'attention', 'steady'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'binaural-16': {
    displayName: 'Active Focus',
    hook: 'A beta beat for structured, active tasks.',
    useCaseLine: 'Try it for: admin work, problem solving, a busy morning.',
    whyPeopleUseIt:
      'Beta-range listening is popular for alert focus. Many listeners use it for structured tasks and busy mornings. It is not a performance guarantee.',
    aboutThisSound:
      '16 Hz binaural-style beat in the beta range. Stereo headphones are needed for the beat to be perceived. Research on cognitive performance is small and mixed.',
    evidenceTier: 'early-research',
    evidenceNote: 'Small, mixed performance research.',
    recommendedLength: '15 to 30 minutes',
    bestTimeOfDay: 'Morning',
    headphones: 'required',
    keywords: ['beta', 'binaural', 'focus', 'work', 'productivity', 'alert'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'binaural-20': {
    displayName: 'Analytical Beta',
    hook: 'A faster beat for analytical work and engagement.',
    useCaseLine: 'Try it for: coding, analysis, a demanding task.',
    whyPeopleUseIt:
      'Higher-beta listening is used by listeners for analytical engagement. Many people play it during demanding tasks. Individual experience varies.',
    aboutThisSound:
      '20 Hz binaural-style beat in the beta range. Stereo headphones are needed for the beat to be perceived. Research on analytical performance is limited.',
    evidenceTier: 'early-research',
    evidenceNote: 'Limited direct research.',
    recommendedLength: '15 to 30 minutes',
    bestTimeOfDay: 'Morning or afternoon',
    headphones: 'required',
    keywords: ['beta', 'binaural', 'analysis', 'coding', 'focus', 'work'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'binaural-25': {
    displayName: 'Quick Energy',
    hook: 'A short, brighter beat for a mental lift.',
    useCaseLine: 'Try it for: a mid-afternoon slump, a short task burst, a workout warm-up.',
    whyPeopleUseIt:
      'High-beta listening is popular for a short burst of active focus. Listeners use it for quick tasks rather than long sessions. It is not a stimulant.',
    aboutThisSound:
      '25 Hz binaural-style beat in the high-beta range. Stereo headphones are needed for the beat to be perceived. Direct research at this beat is limited.',
    evidenceTier: 'popular-practice',
    evidenceNote: 'Popular use; limited direct research.',
    recommendedLength: '10 to 15 minutes',
    bestTimeOfDay: 'Afternoon',
    headphones: 'required',
    keywords: ['energy', 'beta', 'binaural', 'focus', 'afternoon', 'motivation'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },

  'binaural-40': {
    displayName: '40 Hz Gamma',
    hook: 'A 40 Hz beat for focused work and attentive listening.',
    useCaseLine: 'Try it for: deep work, study sessions, reading.',
    whyPeopleUseIt:
      '40 Hz sits in the gamma range and is popular for focused work. Early research has explored 40 Hz stimulation in relation to attention. Consumer audio is not a medical treatment.',
    aboutThisSound:
      '40 Hz binaural-style beat in the gamma range. Stereo headphones are needed for the beat to be perceived. Laboratory protocols use specialised equipment and are not equivalent to a phone track.',
    evidenceTier: 'early-research',
    evidenceNote: 'Early laboratory research; consumer audio is not a clinical protocol.',
    recommendedLength: '15 to 20 minutes',
    bestTimeOfDay: 'Morning or afternoon',
    headphones: 'required',
    keywords: ['40 hz', 'gamma', 'binaural', 'focus', 'study', 'deep work', 'attention'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'binaural-60': {
    displayName: 'High Gamma',
    hook: 'A fast, quiet beat for contemplative attention.',
    useCaseLine: 'Try it for: quiet contemplation, reading, a focused evening.',
    whyPeopleUseIt:
      '60 Hz sits in the high gamma range. Listeners use it for attentive, contemplative sessions. Specific effects at 60 Hz are not well studied.',
    aboutThisSound:
      '60 Hz binaural-style beat in the high gamma range. Stereo headphones are needed for the beat to be perceived. Research at this specific beat is very limited.',
    evidenceTier: 'popular-practice',
    evidenceNote: 'Popular use; very limited direct research.',
    recommendedLength: '10 to 15 minutes',
    bestTimeOfDay: 'Evening',
    headphones: 'required',
    keywords: ['60 hz', 'gamma', 'binaural', 'contemplation', 'focus', 'insight'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'healing-7.83': {
    displayName: 'Grounding Resonance',
    hook: "Inspired by the Earth's natural resonance near 7.83 Hz.",
    useCaseLine: 'Try it for: grounding breaks, time outdoors, a quiet reset.',
    whyPeopleUseIt:
      "Many listeners find an Earth-linked tone calming. This track is inspired by the Schumann resonance, a real geophysical phenomenon. It does not reproduce the Earth's electromagnetic field.",
    aboutThisSound:
      '7.83 Hz listening tone inspired by the Schumann resonance. Phone audio produces sound waves, not electromagnetic fields. The wellness use is traditional.',
    evidenceTier: 'traditional',
    evidenceNote: 'Real geophysical phenomenon; wellness use is traditional.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Afternoon or early evening',
    headphones: 'optional',
    keywords: ['schumann', '7.83 hz', 'grounding', 'nature', 'earth', 'resonance'],
  },
  'healing-174': {
    displayName: 'Gentle Ease',
    hook: 'A low tone for quiet rest and physical relaxation.',
    useCaseLine: 'Try it for: stretching, a warm bath, a slow evening.',
    whyPeopleUseIt:
      '174 Hz is associated with ease and grounding in contemporary sound-healing practice. Listeners use it as a relaxation backdrop. It is not a treatment for pain or injury.',
    aboutThisSound:
      '174 Hz pure tone. The association with physical ease comes from contemporary practice, not clinical research.',
    evidenceTier: 'traditional',
    evidenceNote: 'Contemporary sound-healing tradition.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Evening',
    headphones: 'optional',
    keywords: ['174 hz', 'ease', 'relaxation', 'body', 'grounding', 'rest'],
  },
  'healing-528': {
    displayName: 'Love Frequency',
    hook: 'A 528 Hz tone for gratitude and heart-centred calm.',
    useCaseLine: 'Try it for: gratitude journaling, loving-kindness meditation, a midday reset.',
    whyPeopleUseIt:
      '528 Hz is often called the Love Frequency in contemporary practice. Listeners use it for gratitude and heart-centred meditation. Individual experience varies.',
    aboutThisSound:
      '528 Hz pure tone, part of the modern Solfeggio scale. A small 2018 study of nine participants reported endocrine and autonomic changes after 528-Hz-tuned music, not an isolated tone.',
    evidenceTier: 'early-research',
    evidenceNote: 'One small study; music, not a pure tone.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Anytime',
    headphones: 'optional',
    keywords: ['528 hz', 'love frequency', 'gratitude', 'heart', 'calm', 'healing tone'],
  },
  'healing-40': {
    displayName: 'Gamma Reset',
    hook: 'A 40 Hz tone for focused, attentive listening.',
    useCaseLine: 'Try it for: study, deep work, a focused afternoon.',
    whyPeopleUseIt:
      '40 Hz is popular for focused work. Early research has explored 40 Hz stimulation in relation to attention. Consumer audio is not a medical treatment.',
    aboutThisSound:
      '40 Hz pure tone in the gamma range. Laboratory protocols use specialised equipment and are not equivalent to a phone audio track.',
    evidenceTier: 'early-research',
    evidenceNote: 'Early laboratory research; consumer audio is not a clinical protocol.',
    recommendedLength: '15 to 20 minutes',
    bestTimeOfDay: 'Morning or afternoon',
    headphones: 'optional',
    keywords: ['40 hz', 'gamma', 'focus', 'study', 'attention', 'deep work'],
  },
  'healing-110': {
    displayName: 'Chamber Resonance',
    hook: 'A low tone inspired by ancient stone chamber acoustics.',
    useCaseLine: 'Try it for: reflective reading, a slow evening, quiet listening.',
    whyPeopleUseIt:
      '110 Hz has been studied in archaeoacoustic research on ancient stone chambers. Listeners use it as a low, resonant backdrop. It has no established therapeutic effect.',
    aboutThisSound:
      '110 Hz pure tone. Researchers have measured resonance in some ancient stone structures. This track is inspired by that work, not a reconstruction of a specific site.',
    evidenceTier: 'early-research',
    evidenceNote: 'Archaeoacoustic room research, not health outcomes.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Evening',
    headphones: 'optional',
    keywords: ['110 hz', 'resonance', 'ancient', 'archaeoacoustic', 'reflection', 'low tone'],
  },
  'sleep-1.5': {
    displayName: 'Deep Sleep Drift',
    hook: 'A low delta beat for the last stretch before sleep.',
    useCaseLine: 'Try it for: lights-out, a dark room, the last 15 minutes of the day.',
    whyPeopleUseIt:
      'Delta-range listening is popular as a pre-sleep backdrop. Many listeners use low beats to settle into a bedtime routine. It does not induce sleep.',
    aboutThisSound:
      '1.5 Hz delta beat with a modulated carrier so it is audible on a phone speaker. Headphones give the intended stereo effect. Sleep research is small and mixed.',
    evidenceTier: 'early-research',
    evidenceNote: 'Small, mixed sleep research.',
    recommendedLength: '15 to 30 minutes',
    bestTimeOfDay: 'Before bed',
    headphones: 'recommended',
    keywords: ['sleep', 'delta', 'bedtime', 'wind down', 'deep sleep', 'binaural'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'sleep-4.5': {
    displayName: 'Rest & Dreaming',
    hook: 'A theta beat for pre-sleep reflection and rest.',
    useCaseLine: 'Try it for: the wind-down hour, gentle reading in bed, a quiet evening.',
    whyPeopleUseIt:
      'Theta-range listening is popular for the wind-down hour. Many listeners use it to slow down before sleep. It does not induce a specific sleep stage.',
    aboutThisSound:
      '4.5 Hz theta-range beat. Headphones are recommended for the intended stereo effect. Research on pre-sleep relaxation is small and mixed.',
    evidenceTier: 'early-research',
    evidenceNote: 'Small, mixed relaxation research.',
    recommendedLength: '15 to 30 minutes',
    bestTimeOfDay: 'Before bed',
    headphones: 'recommended',
    keywords: ['sleep', 'theta', 'bedtime', 'rest', 'wind down', 'dreaming'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'sleep-6': {
    displayName: 'Evening Theta',
    hook: 'A soft theta beat for a slower evening.',
    useCaseLine: 'Try it for: after dinner, bath time, a screen-free hour.',
    whyPeopleUseIt:
      'Theta-range beats are used by listeners to slow the pace of an evening. Many people pair them with a screen-free routine. Individual experience varies.',
    aboutThisSound:
      '6 Hz theta-range beat. Headphones are recommended for the intended stereo effect. Direct research on evening relaxation is limited.',
    evidenceTier: 'early-research',
    evidenceNote: 'Limited direct research.',
    recommendedLength: '15 to 20 minutes',
    bestTimeOfDay: 'Evening',
    headphones: 'recommended',
    keywords: ['evening', 'theta', 'relax', 'wind down', 'sleep routine', 'calm'],
    safetyNote: PULSING_TONE_SAFETY_NOTE,
  },
  'wealth-432': {
    displayName: 'Grounded Abundance',
    hook: 'A 432 Hz backdrop for calm intention setting.',
    useCaseLine: 'Try it for: morning intention, goal journaling, planning your week.',
    whyPeopleUseIt:
      '432 Hz is an alternative tuning that some listeners find softer. Paired with intention setting, it is a calm cue for focus. It does not create financial outcomes.',
    aboutThisSound:
      '432 Hz pure tone, an alternative to standard 440 Hz concert pitch. Tuning research is preliminary; the abundance framing is popular practice.',
    evidenceTier: 'popular-practice',
    evidenceNote: 'Alternative tuning; abundance framing is popular practice.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Morning',
    headphones: 'optional',
    keywords: ['432 hz', 'abundance', 'intention', 'money mindset', 'goals', 'calm'],
  },
  'wealth-10': {
    displayName: 'Alpha Success',
    hook: 'A calm alpha tone for goal reflection and focused intention.',
    useCaseLine: 'Try it for: visualising a goal, a planning session, a focused morning.',
    whyPeopleUseIt:
      '10 Hz alpha-range listening is popular for calm focus. Paired with goal reflection, it is a mindset cue. It does not promise financial results.',
    aboutThisSound:
      '10 Hz alpha-range tone. Alpha activity is associated with relaxed wakefulness; consumer audio is not a performance or financial tool.',
    evidenceTier: 'popular-practice',
    evidenceNote: 'Popular intention practice; no financial evidence.',
    recommendedLength: '10 to 20 minutes',
    bestTimeOfDay: 'Morning',
    headphones: 'optional',
    keywords: ['alpha', 'abundance', 'success', 'intention', 'goals', 'focus'],
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
