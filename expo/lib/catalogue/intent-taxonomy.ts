/**
 * Intent-first taxonomy for the frequency catalogue.
 *
 * Navigation and search are organised by what a listener needs (sleep, calm,
 * focus) rather than by the technique used to produce the sound. Record ids,
 * Hz values and audio parameters are untouched; this module only maps the
 * existing catalogue onto listener intents.
 *
 * A category is only surfaced when it can offer at least three tracks, so a
 * sparse need never becomes a dead end. Related tones are cross-listed to
 * reach that minimum rather than inventing content.
 */

export type IntentCategoryId =
  | 'sleep'
  | 'calm'
  | 'focus'
  | 'meditation'
  | 'abundance'
  | 'connection'
  | 'body'
  | 'spiritual'
  | 'nature';

export interface IntentCategoryDefinition {
  id: IntentCategoryId;
  name: string;
  subtitle: string;
  color: string;
  softColor: string;
  icon: 'moon' | 'waves' | 'target' | 'lotus' | 'sparkles' | 'heart' | 'leaf' | 'eye' | 'globe';
  order: number;
}

/** Ordered by demand. Sleep and calm come first because they are the largest search intents. */
export const INTENT_CATEGORIES: IntentCategoryDefinition[] = [
  {
    id: 'sleep',
    name: 'Sleep & Rest',
    subtitle: 'Delta and theta listening for wind-down',
    color: '#60A5FA',
    softColor: 'rgba(96,165,250,0.12)',
    icon: 'moon',
    order: 1,
  },
  {
    id: 'calm',
    name: 'Calm & Stress Relief',
    subtitle: 'Alpha listening, release tones and 432 Hz tuning',
    color: '#34D399',
    softColor: 'rgba(52,211,153,0.12)',
    icon: 'waves',
    order: 2,
  },
  {
    id: 'focus',
    name: 'Focus & Energy',
    subtitle: 'Beta, SMR and 40 Hz gamma listening',
    color: '#A78BFA',
    softColor: 'rgba(167,139,250,0.12)',
    icon: 'target',
    order: 3,
  },
  {
    id: 'meditation',
    name: 'Meditation & Mindfulness',
    subtitle: 'Theta listening and stillness tones',
    color: '#818CF8',
    softColor: 'rgba(129,140,248,0.12)',
    icon: 'lotus',
    order: 4,
  },
  {
    id: 'abundance',
    name: 'Abundance & Manifestation',
    subtitle: '888 Hz symbolism and alpha goal focus',
    color: '#FBBF24',
    softColor: 'rgba(251,191,36,0.12)',
    icon: 'sparkles',
    order: 5,
  },
  {
    id: 'connection',
    name: 'Connection & Relationships',
    subtitle: '639 Hz and heart-centred tones',
    color: '#F472B6',
    softColor: 'rgba(244,114,182,0.12)',
    icon: 'heart',
    order: 6,
  },
  {
    id: 'body',
    name: 'Body & Recovery',
    subtitle: 'Low-frequency and renewal tones for relaxation',
    color: '#FB923C',
    softColor: 'rgba(251,146,60,0.12)',
    icon: 'leaf',
    order: 7,
  },
  {
    id: 'spiritual',
    name: 'Spiritual & Chakra Work',
    subtitle: 'Chakra framework and 963 Hz',
    color: '#C084FC',
    softColor: 'rgba(192,132,252,0.12)',
    icon: 'eye',
    order: 8,
  },
  {
    id: 'nature',
    name: 'Nature & Earth',
    subtitle: 'Schumann resonance and archaeoacoustic tones',
    color: '#2DD4BF',
    softColor: 'rgba(45,212,191,0.12)',
    icon: 'globe',
    order: 9,
  },
];

export interface FrequencyIntent {
  primary: IntentCategoryId;
  secondary?: IntentCategoryId[];
}

export const FREQUENCY_INTENTS: Record<string, FrequencyIntent> = {
  'binaural-1.5': { primary: 'sleep' },
  'binaural-2.5': { primary: 'sleep' },
  'sleep-1.5': { primary: 'sleep' },
  'sleep-4.5': { primary: 'sleep' },
  'sleep-8': { primary: 'sleep' },
  'sleep-6': { primary: 'sleep' },

  'solfeggio-396': { primary: 'calm' },
  'solfeggio-417': { primary: 'calm' },
  'solfeggio-528': { primary: 'calm', secondary: ['abundance'] },
  'binaural-8.5': { primary: 'calm' },
  'binaural-10': { primary: 'calm' },
  'healing-528': { primary: 'calm', secondary: ['abundance'] },
  'wealth-432': { primary: 'calm', secondary: ['nature'] },
  'scientific-432': { primary: 'calm', secondary: ['nature'] },

  'solfeggio-741': { primary: 'focus' },
  'binaural-12': { primary: 'focus' },
  'binaural-14': { primary: 'focus' },
  'binaural-16': { primary: 'focus' },
  'binaural-20': { primary: 'focus' },
  'binaural-25': { primary: 'focus' },
  'binaural-40': { primary: 'focus' },
  'healing-40': { primary: 'focus' },
  'scientific-40': { primary: 'focus' },

  'solfeggio-852': { primary: 'meditation' },
  'binaural-4.5': { primary: 'meditation' },
  'binaural-6': { primary: 'meditation' },
  'binaural-60': { primary: 'meditation' },

  'wealth-888': { primary: 'abundance' },
  'wealth-528': { primary: 'abundance' },
  'wealth-10': { primary: 'abundance' },

  'solfeggio-639': { primary: 'connection' },

  'solfeggio-174': { primary: 'body' },
  'solfeggio-285': { primary: 'body' },
  'healing-174': { primary: 'body' },

  'solfeggio-963': { primary: 'spiritual' },
  'chakra-194.18': { primary: 'spiritual', secondary: ['body'] },
  'chakra-210.42': { primary: 'spiritual' },
  'chakra-126.22': { primary: 'spiritual', secondary: ['focus'] },
  'chakra-341.3': { primary: 'spiritual', secondary: ['connection'] },
  'chakra-384': { primary: 'spiritual', secondary: ['connection'] },
  'chakra-426.7': { primary: 'spiritual' },
  'chakra-963': { primary: 'spiritual', secondary: ['meditation'] },

  'healing-7.83': { primary: 'nature', secondary: ['calm'] },
  'healing-110': { primary: 'nature' },
  'scientific-7.83': { primary: 'nature', secondary: ['calm'] },
  'scientific-110': { primary: 'nature' },
};

/** Words listeners actually type, mapped to the intent they are looking for. */
export const INTENT_SEARCH_TERMS: Record<IntentCategoryId, string[]> = {
  sleep: [
    'sleep', 'insomnia', 'cannot sleep', 'cant sleep', "can't sleep", 'bedtime', 'bed time',
    'wind down', 'wind-down', 'nap', 'napping', 'night', 'night time', 'rest', 'restless',
  ],
  calm: [
    'anxiety', 'anxious', 'stress', 'stressed', 'overthinking', 'overthink', 'panic', 'worry',
    'overwhelm', 'overwhelmed', 'calm', 'relax', 'relaxation', 'unwind', 'reset', 'de-stress',
  ],
  focus: [
    'focus', 'study', 'studying', 'revision', 'exam', 'concentration', 'concentrate', 'adhd',
    'deep work', 'flow', 'reading', 'work', 'productive', 'productivity', 'tired', 'energy',
    'motivation', 'morning', 'alert', 'alertness', 'wake up',
  ],
  meditation: [
    'meditate', 'meditation', 'mindfulness', 'mindful', 'breathing', 'breathwork', 'stillness',
    'present', 'quiet', 'contemplation',
  ],
  abundance: [
    'money', 'abundance', 'wealth', 'manifest', 'manifesting', 'manifestation', 'confidence',
    'prosperity', 'intention', 'goal', 'goals', 'mindset',
  ],
  connection: [
    'relationship', 'relationships', 'love', 'connection', 'compassion', 'communication',
    'boundaries', 'empathy', 'partner',
  ],
  body: [
    'recovery', 'sore', 'soreness', 'tension', 'body', 'ease', 'gentle', 'renew', 'renewal',
    'physical', 'ache', 'stretch',
  ],
  spiritual: [
    'chakra', 'chakras', 'spiritual', 'crown', 'root', 'heart chakra', 'third eye', 'aura',
    'energy centre', 'energy center', 'divine',
  ],
  nature: [
    'nature', 'earth', 'grounding', 'ground', 'schumann', '7.83', 'forest', 'outside',
    'ancient', 'resonance',
  ],
};

const INTENT_IDS = new Set<string>(INTENT_CATEGORIES.map((category) => category.id));

export function isIntentCategoryId(value: string): value is IntentCategoryId {
  return INTENT_IDS.has(value);
}

export function intentCategoryById(id: IntentCategoryId): IntentCategoryDefinition | undefined {
  return INTENT_CATEGORIES.find((category) => category.id === id);
}

export function intentsForFrequency(frequencyId: string): IntentCategoryId[] {
  const mapping = FREQUENCY_INTENTS[frequencyId];
  if (!mapping) return [];
  return [mapping.primary, ...(mapping.secondary ?? [])];
}

export function primaryIntentForFrequency(frequencyId: string): IntentCategoryId | undefined {
  return FREQUENCY_INTENTS[frequencyId]?.primary;
}

/** Unique ids reachable from a category, primary or cross-listed. */
export function frequencyIdsForIntent(intentId: IntentCategoryId): string[] {
  return Object.entries(FREQUENCY_INTENTS)
    .filter(([, mapping]) => mapping.primary === intentId || mapping.secondary?.includes(intentId))
    .map(([id]) => id);
}

/** Categories that can offer at least three tracks, in demand order. */
export function visibleIntentCategories(
  availableIds?: Iterable<string>
): IntentCategoryDefinition[] {
  const available = availableIds ? new Set(availableIds) : null;
  return INTENT_CATEGORIES
    .filter((category) => {
      const ids = frequencyIdsForIntent(category.id);
      const count = available ? ids.filter((id) => available.has(id)).length : ids.length;
      return count >= 3;
    })
    .sort((a, b) => a.order - b.order);
}

function normalise(query: string): string {
  return query.toLowerCase().replace(/[’']/g, "'").trim();
}

function containsTerm(query: string, term: string): boolean {
  if (term.includes(' ') || term.includes('-')) return query.includes(term);
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(query);
}

/** Intent categories whose listener vocabulary matches the query. */
export function intentsMatchingQuery(query: string): IntentCategoryId[] {
  const q = normalise(query);
  if (!q) return [];
  return INTENT_CATEGORIES
    .filter((category) =>
      INTENT_SEARCH_TERMS[category.id].some((term) => containsTerm(q, term))
    )
    .map((category) => category.id);
}

/** True when a record belongs to an intent the query describes. */
export function frequencyMatchesIntentQuery(frequencyId: string, query: string): boolean {
  const intents = intentsForFrequency(frequencyId);
  const matched = intentsMatchingQuery(query);
  return intents.some((intent) => matched.includes(intent));
}
