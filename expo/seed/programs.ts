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
      description: 'Ignite your day with high-vibration frequencies that activate focus, vitality and a positive mindset. Perfect before meditation or movement.',
      frequencies: [
        createFrequencyId('solfeggio', 528),
        createFrequencyId('brainwave', 40),
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
      name: 'Deep Healing Session',
      description: 'A powerful multi-frequency journey through foundational Solfeggio tones designed to promote tissue repair, emotional release and full-body restoration.',
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
      name: 'Complete Chakra Alignment',
      description: 'Journey through all seven energy centres, from root to crown. Each frequency attunes a specific chakra to restore energetic balance and spiritual vitality.',
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
      description: 'Ground in the Earth\'s own resonance, descend into theta, then rise into spiritual clarity. A complete arc for profound meditative depth and inner peace.',
      frequencies: [
        createFrequencyId('healing', 7.83),
        createFrequencyId('brainwave', 6),
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
      name: 'Sleep & Dream Enhancement',
      description: 'A scientifically sequenced programme that guides your brainwaves from alpha relaxation through theta dreaming to deep delta restoration for peak overnight recovery.',
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
      description: 'Align your subconscious with prosperity using the numerological 888 frequency, the transformative 528 Hz love tone and a focused alpha success state.',
      frequencies: [
        createFrequencyId('manifestation', 888),
        createFrequencyId('manifestation', 528),
        createFrequencyId('manifestation', 10),
      ],
      duration: 45,
      category: 'manifestation',
      isPremium: true,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-7',
      name: 'Stress Release & Anxiety Relief',
      description: 'Dissolve tension layer by layer — beginning with Schumann grounding, moving into alpha calm, and finishing with 396 Hz liberation to release fear and guilt at the root.',
      frequencies: [
        createFrequencyId('healing', 7.83),
        createFrequencyId('brainwave', 8.5),
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
      description: 'A precision-stacked sequence of alpha and gamma frequencies to sharpen concentration, boost cognitive performance and enter a state of effortless flow.',
      frequencies: [
        createFrequencyId('brainwave', 12),
        createFrequencyId('brainwave', 16),
        createFrequencyId('brainwave', 40),
      ],
      duration: 30,
      category: 'focus',
      isPremium: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-9',
      name: 'Emotional Healing & Heart Opening',
      description: 'A deeply compassionate session using the 417 Hz clearing tone, the 528 Hz love frequency and the 639 Hz relationship harmoniser to process grief, open the heart and restore emotional flow.',
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
      name: 'DNA Repair & Cellular Regeneration',
      description: 'Harness the scientifically studied 528 Hz transformation frequency alongside 285 Hz tissue healing and 110 Hz deep resonance to support your body\'s innate cellular repair processes.',
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
      name: 'Immune System Activation',
      description: 'Strengthen your body\'s natural defences with delta healing waves, the 285 Hz tissue regeneration tone and grounding Schumann resonance for whole-body immune support.',
      frequencies: [
        createFrequencyId('brainwave', 1.5),
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
      name: 'Third Eye Awakening',
      description: 'Activate your intuitive centres with the 741 Hz awakening frequency, third eye chakra resonance and the 963 Hz pineal gland stimulator for heightened insight and spiritual perception.',
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
      description: 'Drop into theta imagination, ride the alpha creative current and elevate to gamma insight — an ideal session for artists, writers and innovators seeking inspired breakthroughs.',
      frequencies: [
        createFrequencyId('brainwave', 6),
        createFrequencyId('brainwave', 10),
        createFrequencyId('brainwave', 40),
      ],
      duration: 35,
      category: 'focus',
      isPremium: false,
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: 'session-14',
      name: 'Pain Relief & Physical Recovery',
      description: 'A targeted healing programme combining the 174 Hz natural analgesic, 110 Hz bone resonance and delta waves to accelerate physical recovery and relieve persistent pain.',
      frequencies: [
        createFrequencyId('solfeggio', 174),
        createFrequencyId('scientific', 110),
        createFrequencyId('brainwave', 2.5),
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
      description: 'A complete spiritual reset — clearing fear with 396 Hz, harmonising relationships with 639 Hz, and ascending to divine connection at 963 Hz for profound stillness and clarity.',
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
