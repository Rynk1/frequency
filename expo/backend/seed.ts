import {
  SOLFEGGIO_FREQUENCIES,
  CHAKRA_FREQUENCIES,
  BINAURAL_BEATS,
  HEALING_FREQUENCIES,
  SLEEP_FREQUENCIES,
  WEALTH_FREQUENCIES,
  SCIENTIFIC_FREQUENCIES,
} from '../constants/frequencies';

export interface Frequency {
  id: string;
  name: string;
  hz: number;
  frequency: string;
  description: string;
  category: string;
  color?: string;
  gradient?: [string, string];
  benefits: string[];
  isPremium: boolean;
  tags: string[];
  scientificBasis?: string;
  usageGuidelines?: string;
  duration?: string;
  research?: string;
}

export interface Session {
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

export interface LearningArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  publishedAt: string;
  author: string;
  readTime?: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  keyPoints?: string[];
  practicalTips?: string[];
  scientificBasis?: string;
  historicalContext?: string;
}

const createFrequencyId = (category: string, hz: number) => `${category}-${hz}`;

const convertFrequencies = (): Frequency[] => {
  const frequencies: Frequency[] = [];

  const addFrequencies = (list: any[], category: string, isPremium: boolean) => {
    list.forEach((freq) => {
      frequencies.push({
        id: createFrequencyId(category, freq.hz),
        name: freq.name,
        hz: freq.hz,
        frequency: `${freq.hz} Hz`,
        description: freq.description,
        category,
        color: freq.color || freq.gradient?.[0],
        gradient: freq.gradient,
        benefits: freq.benefits || [],
        isPremium,
        tags: [],
        duration: freq.duration,
        research: freq.research,
      });
    });
  };

  addFrequencies(SOLFEGGIO_FREQUENCIES, 'solfeggio', false);
  addFrequencies(CHAKRA_FREQUENCIES, 'chakra', false);
  addFrequencies(BINAURAL_BEATS, 'brainwave', true);
  addFrequencies(HEALING_FREQUENCIES, 'healing', false);
  addFrequencies(SLEEP_FREQUENCIES, 'sleep', false);
  addFrequencies(WEALTH_FREQUENCIES, 'manifestation', true);
  addFrequencies(SCIENTIFIC_FREQUENCIES, 'scientific', false);

  return frequencies;
};

const now = () => new Date().toISOString();

export function getSeedData() {
  const frequencies = convertFrequencies();
  const sessions: Session[] = [
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

  const articles: LearningArticle[] = [
    {
      id: 'article-1',
      title: 'Solfeggio Frequencies: Ancient Tones for Modern Healing',
      content: `Solfeggio frequencies are a set of ancient musical tones that date back to Medieval Gregorian chants. These specific frequencies were believed to impart spiritual blessings when sung in harmony. Dr. Joseph Puleo rediscovered these frequencies in the 1990s, identifying six core tones: 396 Hz, 417 Hz, 528 Hz, 639 Hz, 741 Hz, and 852 Hz.

Each frequency is associated with specific benefits. The 528 Hz frequency, often called the "Love Frequency" or "Miracle Tone," is particularly notable. Some researchers claim it can repair DNA and bring about positive transformation, though these claims require more scientific validation.

The 396 Hz frequency is associated with liberating fear and guilt, helping to break down barriers that prevent us from achieving our goals. The 417 Hz tone facilitates change and helps undo negative situations. The 639 Hz frequency enhances communication, understanding, and tolerance, making it ideal for relationship healing.

Modern sound therapists use these frequencies in various healing modalities, from tuning fork therapy to music composition. While scientific evidence is still emerging, many practitioners and listeners report profound benefits including reduced anxiety, enhanced meditation depth, and improved emotional well-being.`,
      category: 'solfeggio',
      tags: ['solfeggio', 'basics', 'ancient', 'healing'],
      isPremium: false,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 6,
      difficulty: 'Beginner',
      keyPoints: [
        'Six core Solfeggio tones: 396, 417, 528, 639, 741, 852 Hz',
        '528 Hz is the most studied — associated with transformation and DNA repair',
        'Used in Gregorian chants and modern sound therapy',
        'Each tone targets specific emotional and physical healing',
      ],
      practicalTips: [
        'Use headphones for best binaural effect',
        'Start with 528 Hz for 10–15 minutes daily',
        'Combine with breath work for deeper results',
        'Keep a journal to track subtle shifts',
      ],
    },
    {
      id: 'article-2',
      title: 'Brainwave Entrainment: Science of the Synchronised Mind',
      content: `Brainwave entrainment is the practice of synchronising brain activity to an external stimulus — typically audio frequencies. The brain naturally tends to match the dominant frequency it is exposed to, a phenomenon known as the Frequency Following Response (FFR).

Our brains operate across five primary states: Delta (0.5–4 Hz) for deep sleep and healing; Theta (4–8 Hz) for creativity and deep meditation; Alpha (8–13 Hz) for relaxed awareness; Beta (13–30 Hz) for active thinking; and Gamma (30+ Hz) for heightened perception.

Binaural beats are the most popular form of brainwave entrainment. When you hear two slightly different frequencies in each ear — for example, 200 Hz in the left and 210 Hz in the right — your brain perceives a phantom beat at the difference frequency, in this case 10 Hz (Alpha). This gently guides the brain into that target state.

Research supports binaural beats for anxiety reduction, focus enhancement, sleep improvement, and even pain management. A 2019 meta-analysis in Psychological Research found significant improvements in anxiety and mood from regular binaural beat listening.`,
      category: 'brainwave',
      tags: ['brainwaves', 'focus', 'science', 'binaural'],
      isPremium: false,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 8,
      difficulty: 'Intermediate',
      keyPoints: [
        'Five brainwave states: Delta, Theta, Alpha, Beta, Gamma',
        'Binaural beats work through Frequency Following Response',
        'Requires stereo headphones for binaural effects',
        'Research-backed for anxiety, focus and sleep',
      ],
      practicalTips: [
        'Always use stereo headphones for binaural beats',
        'Start with Alpha (8–12 Hz) for general relaxation',
        'Use Theta (4–8 Hz) before creative work or meditation',
        'Avoid high-beta frequencies before sleep',
      ],
      scientificBasis: 'Frequency Following Response (FFR) has been documented since 1973. Multiple peer-reviewed studies confirm effects on mood, anxiety and cognition.',
    },
    {
      id: 'article-3',
      title: 'Sleep Frequencies: Your Guide to Restorative Nights',
      content: `Quality sleep is foundational to health, yet millions struggle to achieve it. Sound frequencies offer a gentle, non-pharmaceutical approach to improving sleep onset, depth, and duration.

Delta waves (0.5–4 Hz) are the hallmark of deep, restorative sleep — the stage where the body repairs tissue, consolidates memories, and releases growth hormone. Listening to delta frequency binaural beats before and during sleep can help encourage this deeply restorative state.

Theta waves (4–8 Hz) dominate during REM sleep, the dream phase critical for emotional processing and memory consolidation. A well-structured sleep frequency programme transitions you from theta into delta as the night progresses.

The 432 Hz "natural tuning" frequency has also gained popularity as a pre-sleep tone. Proponents suggest it aligns with the natural harmonic series of the universe, inducing a calmer, more receptive state conducive to sleep.

Practically, sleep frequency programmes work best when listened to in the 30–60 minutes before bed, ideally with low-volume headphones or a quality speaker placed away from the bed. Consistency is key — like any sleep intervention, effects accumulate over days and weeks.`,
      category: 'sleep',
      tags: ['sleep', 'delta', 'theta', 'recovery', 'insomnia'],
      isPremium: false,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 7,
      difficulty: 'Beginner',
      keyPoints: [
        'Delta (0.5–4 Hz) promotes deep NREM sleep and physical repair',
        'Theta (4–8 Hz) supports REM, dreaming and emotional processing',
        'Progressive programmes guide the brain from wakefulness to deep sleep',
        'Consistency over 2–4 weeks yields the strongest results',
      ],
      practicalTips: [
        'Begin your sleep programme 30–45 minutes before bed',
        'Use sleep-safe headphones or low-volume speakers',
        'Avoid blue light screens while listening',
        'Pair with a cool, dark room for maximum effect',
        'Start with the Sleep & Dream Enhancement programme',
      ],
    },
    {
      id: 'article-4',
      title: 'Chakra Frequencies: Tuning Your Energy Body',
      content: `The chakra system, originating in ancient Indian tradition, describes seven primary energy centres along the body's central axis. Each chakra governs specific physical, emotional and spiritual functions. Sound healers have mapped musical frequencies to each chakra, creating a powerful system for energetic balancing.

The Root Chakra (Muladhara) at the base of the spine is associated with 194.18 Hz — the Earth's year frequency. It governs our sense of safety, grounding, and basic survival needs. When balanced, we feel secure and present; when blocked, anxiety and fear dominate.

Moving up, the Sacral Chakra (Svadhisthana) resonates at 210.42 Hz and governs creativity, sexuality, and emotional flow. The Solar Plexus Chakra (Manipura) at 126.22 Hz is our centre of personal power and confidence. The Heart Chakra (Anahata) at 341.3 Hz opens us to love and compassion.

The upper chakras work with higher frequencies: the Throat Chakra (Vishuddha) at 384 Hz governs authentic expression; the Third Eye (Ajna) at 426.7 Hz activates intuition; and the Crown Chakra (Sahasrara) at 963 Hz connects us to universal consciousness.

A complete chakra balancing session, working through all seven frequencies sequentially, can leave practitioners feeling deeply centred, energised and aligned.`,
      category: 'chakra',
      tags: ['chakra', 'energy', 'healing', 'balance', 'spiritual'],
      isPremium: false,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 9,
      difficulty: 'Beginner',
      keyPoints: [
        'Seven chakras mapped to specific planetary frequencies',
        'Root (194.18 Hz) to Crown (963 Hz) — a complete energetic scale',
        'Sequential sessions restore overall energetic harmony',
        'Each chakra governs distinct physical and emotional domains',
      ],
      practicalTips: [
        'Work through chakras in order from root to crown',
        'Spend 8–10 minutes on each chakra',
        'Visualise the associated colour while listening',
        'Notice areas of resistance — they may need extra attention',
      ],
    },
    {
      id: 'article-5',
      title: 'The Science of 528 Hz: The Love Frequency Explained',
      content: `Of all the Solfeggio frequencies, 528 Hz has attracted the most scientific interest and popular fascination. Sometimes called the "Love Frequency," "Miracle Tone," or "DNA Repair Frequency," 528 Hz sits at the heart of the ancient Solfeggio scale and at the centre of considerable debate.

The frequency 528 Hz is mathematically central to nature. It appears in the geometry of the chlorophyll molecule (responsible for turning sunlight into life energy), the ratio of sacred geometry, and reportedly within the double helix structure of DNA. These mathematical connections, while fascinating, do not yet constitute clinical proof of healing effects.

Biochemist Dr. Glen Rein published a study in 1998 suggesting that 528 Hz could enhance DNA repair in test tubes. While this single study requires replication, it sparked enormous interest. Several subsequent studies have suggested that 528 Hz reduces cortisol (the stress hormone) and increases melatonin and serotonin in drinking water exposed to the frequency — effects that, if they translate to biological tissue, would be profoundly significant.

From a practical standpoint, thousands of practitioners and listeners report that 528 Hz induces feelings of love, warmth, and profound well-being — independent of any scientific mechanism. In a world saturated by stress, that experiential reality matters.`,
      category: 'solfeggio',
      tags: ['528hz', 'love frequency', 'DNA', 'science', 'healing'],
      isPremium: false,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 8,
      difficulty: 'Intermediate',
      keyPoints: [
        '528 Hz is mathematically present in chlorophyll and sacred geometry',
        'Early research suggests cortisol-reducing effects',
        'Widely used in sound therapy for heart chakra healing',
        'Pairs powerfully with loving-kindness meditation',
      ],
      practicalTips: [
        'Listen for at least 20 minutes for noticeable effects',
        'Combine with heart-centred breath work',
        'Use morning or midday, not late at night',
        'Pair with positive affirmations for amplified results',
      ],
      scientificBasis: 'Rein (1998) — DNA conformational changes in-vitro. Basar et al (2013) — emotional state modulation. Further peer-reviewed research ongoing.',
    },
    {
      id: 'article-6',
      title: 'Schumann Resonance: Syncing With the Earth\'s Pulse',
      content: `The Schumann Resonance is one of the most remarkable discoveries in geophysics. In 1952, German physicist Winfried Schumann mathematically predicted that the space between Earth's surface and the ionosphere — a cavity of roughly 60 km height — would act as a resonating chamber for electromagnetic waves. The fundamental frequency of this cavity is approximately 7.83 Hz.

What makes this extraordinary is that 7.83 Hz falls precisely within the human theta–alpha brainwave boundary — the state associated with deep relaxation, meditation, and the threshold of sleep. This has led many researchers and practitioners to hypothesise that human consciousness evolved in resonance with this planetary frequency.

When we spend extended time in urban environments, surrounded by artificial electromagnetic fields (WiFi, mobile networks, overhead lighting), our natural entrainment to the Schumann Resonance can be disrupted. Some functional medicine practitioners link this disruption to increased anxiety, poor sleep, reduced immune function and a vague sense of "disconnection."

Listening to 7.83 Hz can help re-attune your nervous system to this ancient Earth rhythm. Combined with time in nature — bare feet on grass, swimming in the ocean, or simply sitting under a tree — Schumann Resonance audio work can be a powerful antidote to modern over-stimulation.`,
      category: 'healing',
      tags: ['Schumann', 'earth frequency', 'grounding', 'nature', '7.83hz'],
      isPremium: false,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 7,
      difficulty: 'Intermediate',
      keyPoints: [
        'Earth\'s fundamental electromagnetic frequency: 7.83 Hz',
        'Sits at the theta-alpha brainwave boundary',
        'Human biology may have co-evolved with this rhythm',
        'Supports grounding, sleep quality, and immune function',
      ],
      practicalTips: [
        'Use Schumann frequency before outdoor meditation',
        'Pair with earthing practices (bare feet on soil)',
        'Ideal for morning grounding routines',
        'Use for 20–30 minutes for noticeable calming effects',
      ],
    },
    {
      id: 'article-7',
      title: 'Manifestation Frequencies: Tuning Into Abundance',
      content: `The idea that specific frequencies can support manifestation and abundance draws from multiple traditions — quantum physics interpretations, numerology, and the law of resonance. While the scientific community remains cautious, the experiential and psychological mechanisms are real and worth understanding.

The 888 Hz frequency carries powerful numerological significance. In many traditions, 8 represents infinity, abundance, and the flow of energy in both directions. Triple 8 — as in 888 — is considered an amplification of these qualities. As a sound frequency, 888 Hz creates a particular resonant state that practitioners describe as expansive and prosperity-aligned.

The 432 Hz "natural tuning" is often positioned as the foundation of an abundance mindset. Unlike the standard 440 Hz concert pitch, 432 Hz is said to be more harmonically aligned with the natural world. Studies comparing music played at 432 Hz versus 440 Hz suggest subjects find 432 Hz more calming and emotionally satisfying.

The 528 Hz frequency bridges healing and manifestation — its transformation properties make it ideal for dissolving limiting beliefs about what you can receive and achieve.

Psychologically, regular listening to these frequencies while holding clear intentions creates a form of mental priming — the Reticular Activating System (the brain's attention filter) becomes tuned to recognise opportunities aligned with your stated desires.`,
      category: 'manifestation',
      tags: ['manifestation', 'abundance', '888hz', '432hz', 'law of attraction'],
      isPremium: true,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 8,
      difficulty: 'Intermediate',
      keyPoints: [
        '888 Hz carries numerological abundance significance',
        '432 Hz natural tuning promotes harmonic resonance',
        '528 Hz dissolves limiting beliefs to open flow',
        'Mental priming through intention + frequency is psychologically valid',
      ],
      practicalTips: [
        'Hold a clear, specific intention before each session',
        'Journal your desires immediately after listening',
        'Combine with alpha waves (10 Hz) for best results',
        'Practice daily during morning windows of peak receptivity',
      ],
    },
    {
      id: 'article-8',
      title: 'Gamma Waves & 40 Hz: The Frequency of Awakening',
      content: `Gamma brainwaves (30–100 Hz) represent the fastest documented brain oscillations and are associated with the highest states of cognitive function, perception, and consciousness. At the centre of gamma research sits 40 Hz — a frequency that has drawn extraordinary scientific attention since the 1990s.

MIT researcher Li-Huei Tsai demonstrated in 2016 that flickering light and sound at precisely 40 Hz reduced amyloid plaques and tau tangles — the hallmarks of Alzheimer's disease — in mouse models. This landmark study ignited a wave of human clinical trials. While human results are more nuanced, the mechanism is real: gamma entrainment appears to synchronise neural activity in ways that support memory consolidation, attention, and neuroprotective processes.

From a consciousness perspective, Tibetan monks with decades of meditation practice show dramatically elevated gamma activity compared to novices — particularly during states of compassion and loving-kindness meditation. The 40 Hz gamma state appears to be the neurological signature of heightened awareness and integration.

Practically, 40 Hz binaural and monaural beats are used to enhance focus before demanding cognitive work, support memory and learning, and access elevated meditative states more quickly than traditional practice alone allows.`,
      category: 'scientific',
      tags: ['gamma', '40hz', 'Alzheimer', 'cognitive', 'science', 'MIT'],
      isPremium: false,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 9,
      difficulty: 'Advanced',
      keyPoints: [
        'MIT studies show 40 Hz reduces Alzheimer\'s markers in mice',
        'Gamma activity is the signature of peak meditative consciousness',
        'Enhances memory consolidation and cognitive performance',
        'Used by experienced meditators and neuroscience researchers',
      ],
      practicalTips: [
        'Use 40 Hz before deep study or creative problem solving',
        'Pair with eyes-open meditation for best gamma induction',
        'Start with 15 minutes — gamma is activating, not sedating',
        'Combine with the Focus & Mental Clarity programme',
      ],
      scientificBasis: 'Tsai et al., MIT (2016) — gamma entrainment reduces amyloid plaques. Multiple follow-up human trials ongoing at MIT, Oxford, and UCSF.',
    },
  ];

  return { frequencies, sessions, articles };
}
