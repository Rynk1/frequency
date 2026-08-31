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
    usageGuidelines: freq.duration ? `Listen for ${freq.duration}` : 'Use as needed for meditation and healing',
    duration: freq.duration || '15-30 minutes',
    research: freq.research || `Traditional ${category} healing practices`,
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
      content: `Solfeggio frequencies are a set of ancient musical tones that have been used for healing and spiritual purposes for centuries. These frequencies are believed to have specific healing properties and are often used in sound therapy and meditation.

## The History

The Solfeggio frequencies were first introduced by Guido d'Arezzo, a Benedictine monk, in the 11th century. These frequencies were used in Gregorian chants and were believed to have spiritual and healing properties.

## The Frequencies

- **174 Hz**: Foundation frequency for pain relief and grounding
- **285 Hz**: Transformation frequency for tissue healing
- **396 Hz**: Liberation frequency for releasing fear and guilt
- **417 Hz**: Change frequency for facilitating transformation
- **528 Hz**: Love frequency for DNA repair and miracles
- **639 Hz**: Relationship frequency for harmony and communication
- **741 Hz**: Intuition frequency for awakening inner wisdom
- **852 Hz**: Spiritual order frequency for returning to divine order
- **963 Hz**: Divine connection frequency for pineal gland activation

## Scientific Research

While the effects of Solfeggio frequencies are largely anecdotal, some studies have shown potential benefits:

- A 2018 study found that 528 Hz may reduce stress and anxiety
- Research suggests certain frequencies may influence brainwave patterns
- Some studies indicate potential effects on cellular regeneration

## How to Use

For best results:
- Listen for 15-30 minutes daily
- Use headphones for optimal effect
- Find a quiet, comfortable space
- Focus on your intention while listening

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
      content: `The chakra system represents seven energy centers in the human body, each associated with specific frequencies that can help balance and align your energy.

## The Seven Chakras

### Root Chakra (Muladhara) - 194.18 Hz
- **Element**: Earth
- **Color**: Red
- **Benefits**: Grounding, stability, security
- **When Balanced**: Feeling secure and grounded

### Sacral Chakra (Svadhisthana) - 210.42 Hz
- **Element**: Water
- **Color**: Orange
- **Benefits**: Creativity, sexuality, emotional flow
- **When Balanced**: Creative and emotionally stable

### Solar Plexus Chakra (Manipura) - 126.22 Hz
- **Element**: Fire
- **Color**: Yellow
- **Benefits**: Personal power, confidence
- **When Balanced**: Confident and empowered

### Heart Chakra (Anahata) - 341.3 Hz
- **Element**: Air
- **Color**: Green
- **Benefits**: Love, compassion, connection
- **When Balanced**: Loving and compassionate

### Throat Chakra (Vishuddha) - 384 Hz
- **Element**: Space
- **Color**: Blue
- **Benefits**: Communication, truth, expression
- **When Balanced**: Clear communication

### Third Eye Chakra (Ajna) - 426.7 Hz
- **Element**: Light
- **Color**: Indigo
- **Benefits**: Intuition, wisdom, insight
- **When Balanced**: Clear intuition and wisdom

### Crown Chakra (Sahasrara) - 963 Hz
- **Element**: Thought
- **Color**: Violet/White
- **Benefits**: Spiritual connection, enlightenment
- **When Balanced**: Spiritual awareness and connection

## Balancing Your Chakras

1. **Assessment**: Identify which chakras need attention
2. **Meditation**: Use specific frequencies during meditation
3. **Visualization**: Imagine the chakra's color while listening
4. **Affirmations**: Use positive affirmations for each chakra
5. **Regular Practice**: Consistency is key for balance

## Tips for Chakra Healing

- Start with the root chakra and work upward
- Spend 5-10 minutes on each chakra
- Use visualization and breathwork
- Practice regularly for best results

*Remember: Chakra healing is a complementary practice and should be used alongside conventional healthcare.*`,
      category: 'chakra',
      tags: ['chakra', 'energy', 'balance', 'meditation'],
      isPremium: false,
      author: 'Energy Master',
      publishedAt: new Date().toISOString(),
    },
    {
      id: 'article-binaural-beats',
      title: 'Binaural Beats: The Science of Brainwave Entrainment',
      content: `Binaural beats are an auditory illusion created when two slightly different frequencies are played in each ear, resulting in the perception of a third "beat" frequency.

## How Binaural Beats Work

When you listen to a 200 Hz tone in your left ear and a 210 Hz tone in your right ear, your brain perceives a 10 Hz "beat." This phenomenon can potentially influence your brainwave patterns through a process called entrainment.

## Brainwave Frequencies

### Delta Waves (0.5-4 Hz)
- **State**: Deep sleep, healing
- **Benefits**: Physical regeneration, immune support
- **Best Time**: Before bed, during rest

### Theta Waves (4-8 Hz)
- **State**: Deep meditation, REM sleep
- **Benefits**: Creativity, memory consolidation
- **Best Time**: Meditation, creative work

### Alpha Waves (8-13 Hz)
- **State**: Relaxed awareness
- **Benefits**: Stress relief, learning enhancement
- **Best Time**: Study, light meditation

### Beta Waves (13-30 Hz)
- **State**: Active concentration
- **Benefits**: Focus, problem-solving
- **Best Time**: Work, analytical tasks

### Gamma Waves (30-100 Hz)
- **State**: Higher consciousness
- **Benefits**: Cognitive enhancement, insight
- **Best Time**: Peak performance tasks

## Scientific Research

Studies have shown that binaural beats may:
- Reduce anxiety and stress
- Improve focus and attention
- Enhance memory and learning
- Promote relaxation and sleep
- Increase creativity

## Best Practices

1. **Use Headphones**: Essential for the binaural effect
2. **Start Slowly**: Begin with 10-15 minute sessions
3. **Choose the Right Time**: Match frequency to desired state
4. **Be Consistent**: Regular use may increase effectiveness
5. **Stay Hydrated**: Drink water before and after sessions

## Safety Considerations

- Not recommended for people with epilepsy
- Avoid while driving or operating machinery
- Start with lower volumes
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