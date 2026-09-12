export interface CuratedProgramSeed {
  id: string;
  name: string;
  description: string;
  frequencies: string[];
  duration: number;
  category: string;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

const createFrequencyId = (category: string, hz: number) => `${category}-${hz}`;
const now = () => new Date().toISOString();

export function getProgramsSeed(): CuratedProgramSeed[] {
  return [
    {
      id: 'session-1',
      name: 'Morning Energy Boost',
      description: 'Structured listening for alertness, positive attention and reflective focus.',
      frequencies: [
        createFrequencyId('solfeggio', 528),
        createFrequencyId('binaural', 40),
        createFrequencyId('scientific', 432),
      ],
      duration: 30,
      category: 'focus',
      isPremium: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-2',
      name: 'Deep Relaxation Session',
      description: 'Multi-frequency relaxation journey using 174, 285 and 528 Hz for quiet reflection and relaxation.',
      frequencies: [
        createFrequencyId('solfeggio', 174),
        createFrequencyId('solfeggio', 285),
        createFrequencyId('solfeggio', 528),
      ],
      duration: 45,
      category: 'healing',
      isPremium: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-3',
      name: 'Seven-Chakra Meditation',
      description: 'Seven-part meditation using a contemporary chakra-frequency framework, presented as spiritual/wellness practice rather than validated energetic treatment.',
      frequencies: [
        createFrequencyId('chakra', 194.18),
        createFrequencyId('chakra', 210.42),
        createFrequencyId('chakra', 126.22),
        createFrequencyId('chakra', 341.3),
        createFrequencyId('chakra', 384),
        createFrequencyId('chakra', 426.7),
        createFrequencyId('chakra', 963),
      ],
      duration: 56,
      category: 'healing',
      isPremium: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-4',
      name: 'Deep Meditation Journey',
      description: 'Contemplative journey using a Schumann-inspired experience, theta-range binaural listening and higher Solfeggio tone.',
      frequencies: [
        createFrequencyId('healing', 7.83),
        createFrequencyId('binaural', 6),
        createFrequencyId('solfeggio', 852),
      ],
      duration: 40,
      category: 'meditation',
      isPremium: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-5',
      name: 'Sleep Wind-Down Journey',
      description: 'Gradual listening sequence designed to create a quiet pre-sleep environment; no claim of inducing specific sleep stages.',
      frequencies: [
        createFrequencyId('sleep', 8),
        createFrequencyId('sleep', 4.5),
        createFrequencyId('sleep', 1.5),
      ],
      duration: 60,
      category: 'sleep',
      isPremium: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-6',
      name: 'Manifestation & Abundance',
      description: 'Reflective goal-setting journey combining numerological symbolism, alternative tuning and alpha-range listening.',
      frequencies: [
        createFrequencyId('wealth', 888),
        createFrequencyId('wealth', 528),
        createFrequencyId('wealth', 10),
      ],
      duration: 45,
      category: 'manifestation',
      isPremium: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-7',
      name: 'Calm & Stress Release',
      description: 'Relaxation journey using a Schumann-inspired tone, alpha-range listening and a Solfeggio tone traditionally associated with release.',
      frequencies: [
        createFrequencyId('healing', 7.83),
        createFrequencyId('binaural', 8.5),
        createFrequencyId('solfeggio', 396),
      ],
      duration: 35,
      category: 'healing',
      isPremium: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-8',
      name: 'Focus & Mental Clarity',
      description: 'Structured alpha/beta/gamma-range listening journey for focused work and attentive listening.',
      frequencies: [
        createFrequencyId('binaural', 12),
        createFrequencyId('binaural', 16),
        createFrequencyId('binaural', 40),
      ],
      duration: 30,
      category: 'focus',
      isPremium: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-9',
      name: 'Emotional Reflection & Connection',
      description: 'Reflective journey using Solfeggio traditions associated with change, love and connection.',
      frequencies: [
        createFrequencyId('solfeggio', 417),
        createFrequencyId('solfeggio', 528),
        createFrequencyId('solfeggio', 639),
      ],
      duration: 40,
      category: 'healing',
      isPremium: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-10',
      name: 'Renewal & Restoration',
      description: 'Reflective relaxation journey inspired by sound-healing themes of renewal and restoration; no DNA/cellular claims.',
      frequencies: [
        createFrequencyId('solfeggio', 285),
        createFrequencyId('healing', 528),
        createFrequencyId('scientific', 110),
      ],
      duration: 45,
      category: 'healing',
      isPremium: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-11',
      name: 'Rest & Recovery',
      description: 'Quiet rest-oriented journey combining low-beat listening, a traditional renewal tone and Schumann-inspired listening; no immune claim.',
      frequencies: [
        createFrequencyId('binaural', 1.5),
        createFrequencyId('solfeggio', 285),
        createFrequencyId('scientific', 7.83),
      ],
      duration: 40,
      category: 'healing',
      isPremium: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-12',
      name: 'Intuition & Reflection Meditation',
      description: 'Contemplative journey inspired by Third Eye/chakra and Solfeggio traditions.',
      frequencies: [
        createFrequencyId('solfeggio', 741),
        createFrequencyId('chakra', 426.7),
        createFrequencyId('solfeggio', 963),
      ],
      duration: 45,
      category: 'meditation',
      isPremium: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-13',
      name: 'Creative Flow State',
      description: 'Theta/alpha/gamma-range listening as a backdrop for creative work and reflection; no guaranteed breakthrough claim.',
      frequencies: [
        createFrequencyId('binaural', 6),
        createFrequencyId('binaural', 10),
        createFrequencyId('binaural', 40),
      ],
      duration: 35,
      category: 'focus',
      isPremium: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-14',
      name: 'Physical Ease & Recovery',
      description: 'Relaxation journey using low-frequency, resonance-inspired and low-beat experiences. Not a treatment for pain or injury.',
      frequencies: [
        createFrequencyId('solfeggio', 174),
        createFrequencyId('scientific', 110),
        createFrequencyId('binaural', 2.5),
      ],
      duration: 40,
      category: 'healing',
      isPremium: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-15',
      name: 'Inner Peace & Spiritual Balance',
      description: 'Contemplative journey using Solfeggio tones traditionally associated with release, connection and spiritual awareness.',
      frequencies: [
        createFrequencyId('solfeggio', 396),
        createFrequencyId('solfeggio', 639),
        createFrequencyId('solfeggio', 963),
      ],
      duration: 45,
      category: 'meditation',
      isPremium: false,
      createdAt: now(),
      updatedAt: now(),
    },
  ];
}
