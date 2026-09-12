import {
  SOLFEGGIO_FREQUENCIES,
  CHAKRA_FREQUENCIES,
  BINAURAL_BEATS,
  HEALING_FREQUENCIES,
  SLEEP_FREQUENCIES,
  WEALTH_FREQUENCIES,
  SCIENTIFIC_FREQUENCIES
} from '@/constants/frequencies';

export interface SeededFrequency {
  id: string;
  name: string;
  hz: number;
  frequency: string;
  description: string;
  category: string;
  color: string;
  gradient: [string, string];
  benefits: string[];
  isPremium: boolean;
  tags: string[];
  scientificBasis?: string;
  usageGuidelines?: string;
  duration?: string;
  research?: string;
}

function generateId(name: string, hz: number): string {
  return `${name.toLowerCase().replace(/\s+/g, '-')}-${hz}`;
}

function convertToSeededFrequency(
  freq: any,
  category: string,
  isPremium: boolean = false
): SeededFrequency {
  return {
    id: generateId(freq.name, freq.hz),
    name: freq.name,
    hz: freq.hz,
    frequency: `${freq.hz} Hz`,
    description: freq.description,
    category,
    color: freq.color || freq.gradient?.[0] || '#8B5CF6',
    gradient: freq.gradient ? [freq.gradient[0], freq.gradient[1]] as [string, string] : ['#8B5CF6', '#7C3AED'] as [string, string],
    benefits: freq.benefits || [],
    isPremium,
    tags: [
      category,
      ...freq.benefits?.slice(0, 3).map((b: string) => b.toLowerCase().split(' ')[0]) || [],
      freq.element?.toLowerCase(),
      freq.range ? 'brainwave' : null,
    ].filter(Boolean),
    scientificBasis: freq.research || freq.note || `Traditional ${category} frequency`,
    usageGuidelines: freq.duration ? `Listen for ${freq.duration}` : 'Use as needed for meditation and relaxation',
    duration: freq.duration || '15-30 minutes',
    research: freq.research || `Traditional ${category} relaxation practices`,
  };
}

export function getSeededFrequencies(): SeededFrequency[] {
  const frequencies: SeededFrequency[] = [];

  // Solfeggio Frequencies
  SOLFEGGIO_FREQUENCIES.forEach(freq => {
    frequencies.push(convertToSeededFrequency(freq, 'solfeggio', false));
  });

  // Chakra Frequencies
  CHAKRA_FREQUENCIES.forEach(freq => {
    frequencies.push(convertToSeededFrequency(freq, 'chakra', false));
  });

  // Binaural Beats
  BINAURAL_BEATS.forEach(freq => {
    frequencies.push(convertToSeededFrequency(freq, 'brainwave', true));
  });

  // Healing Frequencies
  HEALING_FREQUENCIES.forEach(freq => {
    frequencies.push(convertToSeededFrequency(freq, 'healing', false));
  });

  // Sleep Frequencies
  SLEEP_FREQUENCIES.forEach(freq => {
    frequencies.push(convertToSeededFrequency(freq, 'sleep', false));
  });

  // Wealth Frequencies
  WEALTH_FREQUENCIES.forEach(freq => {
    frequencies.push(convertToSeededFrequency(freq, 'manifestation', true));
  });

  // Scientific Frequencies
  SCIENTIFIC_FREQUENCIES.forEach(freq => {
    frequencies.push(convertToSeededFrequency(freq, 'scientific', false));
  });

  return frequencies;
}

export function getSeededSessions() {
  return [
    {
      id: 'session-morning-energy',
      name: 'Morning Energy Boost',
      description: 'Start your day with energizing frequencies for focus and vitality',
      frequencies: ['gamma-focus-40', 'love-&-miracles-pure-528', 'alpha-focus-12'],
      duration: 25,
      category: 'energy',
      isPremium: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'session-deep-healing',
      name: 'Deep Healing Session',
      description: 'Comprehensive healing with Solfeggio and healing frequencies',
      frequencies: ['foundation-pure-174', 'transformation-pure-285', 'love-&-miracles-pure-528'],
      duration: 30,
      category: 'healing',
      isPremium: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'session-chakra-balance',
      name: 'Complete Chakra Balance',
      description: 'Balance all seven chakras with planetary frequencies',
      frequencies: ['root-chakra-pure-194.18', 'sacral-chakra-pure-210.42', 'heart-chakra-pure-341.3', 'crown-chakra-pure-963'],
      duration: 35,
      category: 'chakra',
      isPremium: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'session-deep-sleep',
      name: 'Deep Sleep Induction',
      description: 'Progressive brainwave entrainment for restorative sleep',
      frequencies: ['sleep-transition-8', 'deep-sleep-(delta)-1.5', 'rem-sleep-(theta)-4.5'],
      duration: 60,
      category: 'sleep',
      isPremium: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'session-focus-flow',
      name: 'Focus & Flow State',
      description: 'Binaural beats for enhanced concentration and productivity',
      frequencies: ['alpha-focus-12', 'smr-(sensorimotor-rhythm)-14', 'beta-focus-16'],
      duration: 45,
      category: 'focus',
      isPremium: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'session-manifestation',
      name: 'Abundance Manifestation',
      description: 'Wealth and manifestation frequencies for prosperity mindset',
      frequencies: ['abundance-frequency-888', 'manifestation-power-528', 'natural-harmony-432'],
      duration: 30,
      category: 'manifestation',
      isPremium: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function getSeededArticles() {
  return [
    {
      id: 'article-solfeggio-science',
      title: 'The Science Behind Solfeggio Frequencies',
      content: `Solfeggio frequencies are a set of musical tones used in sound therapy and meditation traditions.

## The History

The modern Solfeggio frequencies were inspired by traditional vocal scale patterns and modern wellness associations.

## The Frequencies

- **174 Hz**: Foundation frequency for grounding and reflection
- **285 Hz**: Transformation frequency for quiet renewal
- **396 Hz**: Liberation frequency for releasing worry
- **417 Hz**: Change frequency for facilitating perspective
- **528 Hz**: Love frequency associated with harmony and peace
- **639 Hz**: Relationship frequency for connection and empathy
- **741 Hz**: Intuition frequency for awakening clarity
- **852 Hz**: Spiritual order frequency for returning to inner stillness
- **963 Hz**: Divine connection frequency for crown meditation

## Scientific Research

While the effects of Solfeggio frequencies are largely exploratory and subject to ongoing research:

- A small 2018 study observed potential mood and stress marker changes with 528-Hz-tuned music
- Research suggests certain soundscapes may support relaxation and mindfulness

## How to Use

For best results:
- Listen for 15-30 minutes daily at a comfortable volume
- Use headphones for optimal immersion
- Find a quiet, comfortable space
- Focus on your personal reflection intention

*Note: These frequencies are complementary tools and should not replace medical treatment.*`,
      category: 'solfeggio',
      tags: ['solfeggio', 'healing', 'science', 'history'],
      isPremium: false,
      author: 'Dr. Sound Healer',
      publishedAt: new Date().toISOString(),
    },
    {
      id: 'article-chakra-frequencies',
      title: 'Understanding Chakra Frequencies and Energy Centers',
      content: `The chakra system represents seven energy centers in Indian spiritual tradition, each associated with contemporary sound-healing frequencies.

## The Seven Chakras

### Root Chakra (Muladhara) - 194.18 Hz
- **Element**: Earth
- **Color**: Red
- **Benefits**: Grounding, stability, presence
- **When Balanced**: Feeling secure and grounded

### Sacral Chakra (Svadhisthana) - 210.42 Hz
- **Element**: Water
- **Color**: Orange
- **Benefits**: Creativity, emotional flow
- **When Balanced**: Creative and emotionally open

### Solar Plexus Chakra (Manipura) - 126.22 Hz
- **Element**: Fire
- **Color**: Yellow
- **Benefits**: Agency, confidence
- **When Balanced**: Confident and grounded

### Heart Chakra (Anahata) - 341.3 Hz
- **Element**: Air
- **Color**: Green
- **Benefits**: Compassion, connection
- **When Balanced**: Loving and compassionate

### Throat Chakra (Vishuddha) - 384 Hz
- **Element**: Space
- **Color**: Blue
- **Benefits**: Expression, clear communication
- **When Balanced**: Clear expression

### Third Eye Chakra (Ajna) - 426.7 Hz
- **Element**: Light
- **Color**: Indigo
- **Benefits**: Intuition, insight
- **When Balanced**: Reflective insight

### Crown Chakra (Sahasrara) - 963 Hz
- **Element**: Thought
- **Color**: Violet/White
- **Benefits**: Spiritual reflection, contemplation
- **When Balanced**: Quiet presence and connection

## Balancing Your Chakras

1. **Assessment**: Identify which areas need attention
2. **Meditation**: Use specific frequencies during meditation
3. **Visualization**: Imagine the chakra's color while listening
4. **Affirmations**: Use positive reflection statements
5. **Regular Practice**: Consistency supports mindfulness

*Remember: Chakra soundscapes offer a contemplative meditation framework and should be used alongside conventional healthcare.*`,
      category: 'chakra',
      tags: ['chakra', 'energy', 'balance', 'meditation'],
      isPremium: false,
      author: 'Energy Master',
      publishedAt: new Date().toISOString(),
    },
    {
      id: 'article-binaural-beats',
      title: 'Binaural Beats: The Science of Brainwave Entrainment',
      content: `Binaural beats are an auditory percept created when two slightly different frequencies are played in each ear through stereo headphones.

## How Binaural Beats Work

When you listen to a 200 Hz tone in your left ear and a 210 Hz tone in your right ear, your brain perceives a 10 Hz "beat." Research is investigating effects on relaxation and focus, though results remain mixed.

## Brainwave Frequencies

### Delta Waves (0.5-4 Hz)
- **State**: Deep rest, wind-down
- **Benefits**: Evening relaxation
- **Best Time**: Before bed, during rest

### Theta Waves (4-8 Hz)
- **State**: Deep meditation, reflection
- **Benefits**: Creativity, reflective focus
- **Best Time**: Meditation, creative work

### Alpha Waves (8-13 Hz)
- **State**: Relaxed awareness
- **Benefits**: Stress relief, calm focus
- **Best Time**: Study, light meditation

### Beta Waves (13-30 Hz)
- **State**: Active attention
- **Benefits**: Focus, structured tasks
- **Best Time**: Work, analytical tasks

### Gamma Waves (30-100 Hz)
- **State**: Attentive processing
- **Benefits**: Cognitive engagement, clarity
- **Best Time**: Attentive study

## Safety Considerations

- Avoid while driving or operating machinery
- Start with lower, comfortable volumes
- Discontinue if you experience discomfort

*Binaural beats are a tool for wellness and should not replace medical treatment.*`,
      category: 'brainwave',
      tags: ['binaural', 'brainwaves', 'science', 'entrainment'],
      isPremium: true,
      author: 'Neuroscience Researcher',
      publishedAt: new Date().toISOString(),
    },
  ];
}
