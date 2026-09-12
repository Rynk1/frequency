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
  addFrequencies(BINAURAL_BEATS, 'binaural', true);
  addFrequencies(HEALING_FREQUENCIES, 'healing', false);
  addFrequencies(SLEEP_FREQUENCIES, 'sleep', false);
  addFrequencies(WEALTH_FREQUENCIES, 'wealth', true);
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

  const articles: LearningArticle[] = [
    {
      id: 'article-1',
      title: 'Solfeggio Frequencies: Ancient Tones for Modern Healing',
      content: `Solfeggio frequencies represent a system of musical tones popular in contemporary sound-healing and wellness traditions. The modern scale commonly includes 396 Hz, 417 Hz, 528 Hz, 639 Hz, 741 Hz, and 852 Hz.\n\nWhile popular accounts frequently attribute these tones directly to ancient Medieval Gregorian chants, historical claims linking the complete modern system to ancient practice should be treated cautiously.\n\nEach frequency carries strong contemporary wellness associations: 396 Hz with letting go of worry; 417 Hz with change; 528 Hz with harmony and love; 639 Hz with interpersonal connection; 741 Hz with clarity; and 852 Hz with inner stillness.`,
      category: 'solfeggio',
      tags: ['solfeggio', 'basics', 'wellness', 'tradition'],
      isPremium: false,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 6,
      difficulty: 'Beginner',
      keyPoints: [
        'The modern Solfeggio system commonly includes 396, 417, 528, 639, 741 and 852 Hz',
        'These frequencies have strong contemporary spiritual and wellness associations',
        'Historical claims linking the complete modern system directly to ancient Gregorian practice should be treated cautiously',
        '528 Hz has small exploratory human evidence but no established DNA-repair effect',
      ],
      practicalTips: [
        'Start with 5–20 minutes at a comfortable volume',
        'Choose a time and environment that fits your routine',
        'Notice subjective relaxation rather than expecting predetermined outcomes',
        'Keep a quiet journal to track mindfulness shifts',
      ],
    },
    {
      id: 'article-2',
      title: 'Brainwave Entrainment: Science of the Synchronised Mind',
      content: `Binaural beats are a genuine psychoacoustic percept that occurs when two slightly different frequencies are presented separately to each ear through stereo headphones.\n\nBrainwaves naturally shift across Delta, Theta, Alpha, Beta, and Gamma ranges. Scientific evidence regarding reliable brainwave entrainment remains mixed.\n\nBinaural beats offer a helpful backdrop for meditation and focus, but a specific beat should not be viewed as a guaranteed method to induce a precise neural state.`,
      category: 'brainwave',
      tags: ['brainwaves', 'focus', 'science', 'binaural'],
      isPremium: false,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 8,
      difficulty: 'Intermediate',
      keyPoints: [
        'Binaural beats occur when slightly different tones are presented separately to each ear',
        'Five primary brainwave ranges describe neural activity',
        'Stereo headphones are strictly required for binaural beat perception',
        'Scientific evidence for reliable brainwave entrainment remains mixed and study-dependent',
      ],
      practicalTips: [
        'Always use stereo headphones for binaural beat listening',
        'Choose a comfortable session length (5–20 minutes)',
        'Never drive, cycle or operate machinery while listening to binaural beats',
      ],
      scientificBasis: 'Binaural beats are a psychoacoustic phenomenon. Meta-analyses (Garcia-Argibay et al., 2019) report possible effects on anxiety and focus, though systematic reviews (Ingendoh et al., 2023) highlight mixed entrainment evidence.',
    },
    {
      id: 'article-3',
      title: 'Sleep & Sound: Building a Restful Listening Routine',
      content: `A quality night's rest is foundational to health and mental clarity. A 2022 Cochrane systematic review concluded that music may help some adults improve subjective sleep quality.\n\nDelta and Theta describe brainwave ranges typical of deep NREM and REM sleep. Listening to low-beat audio during a pre-sleep routine can encourage relaxation, but does not guarantee the induction of specific sleep stages.`,
      category: 'sleep',
      tags: ['sleep', 'delta', 'theta', 'relaxation', 'wind-down'],
      isPremium: false,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 7,
      difficulty: 'Beginner',
      keyPoints: [
        'Music may help some people improve subjective sleep quality according to a 2022 Cochrane review',
        'Sleep cannot be reduced to one frequency or guaranteed sound trigger',
        'Delta and Theta describe neural activity ranges, not guaranteed externally induced sleep stages',
        'A calm environment and comfortable listening volume are essential',
      ],
      practicalTips: [
        'Begin your pre-sleep listening routine 30–45 minutes before bed',
        'Keep the volume low and comfortable for resting',
        'Avoid bright blue-light screens while winding down',
      ],
    },
    {
      id: 'article-4',
      title: 'Chakra Frequencies: Tuning Your Energy Body',
      content: `The chakra system originates in Indian spiritual traditions. Modern sound-healing systems associate specific musical pitch frequencies with each chakra (Root 194.18 Hz to Crown 963 Hz).\n\nFrequency-to-chakra mappings vary across lineages and are not scientifically validated human anatomy. They provide a structured framework for meditation and visualization.`,
      category: 'chakra',
      tags: ['chakra', 'energy', 'meditation', 'tradition', 'spiritual'],
      isPremium: false,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 9,
      difficulty: 'Beginner',
      keyPoints: [
        'Chakras are spiritual and contemplative concepts from Indian traditions',
        'Modern frequency mappings vary and are not scientifically validated anatomy',
        'Chakra soundscapes serve as a structured framework for meditation and visualization',
        'Sequential meditation offers a calming routine for mindfulness',
      ],
      practicalTips: [
        'Treat chakra soundscapes as a reflective meditation framework',
        'Spend 5–15 minutes per frequency during focused meditation',
        'Visualize calm color themes associated with each focus area',
      ],
    },
    {
      id: 'article-5',
      title: '528 Hz: The "Love Frequency" — What We Know and What We Don\'t',
      content: `The 528 Hz frequency is widely associated with love and transformation. A small 2018 study observed reductions in cortisol after subjects listened to 528-Hz-tuned music. The study evaluated music rather than a pure tone, and sample size was small. Claims of DNA repair are unsupported.`,
      category: 'solfeggio',
      tags: ['528hz', 'love frequency', 'wellness', 'research', 'meditation'],
      isPremium: false,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 8,
      difficulty: 'Intermediate',
      keyPoints: [
        '528 Hz is widely associated with love and transformation in modern sound therapy',
        'A small 2018 study (9 subjects) noted cortisol changes after 528-Hz-tuned music',
        'The study tested music rather than an isolated pure tone',
        'Claims that 528 Hz repairs DNA or regenerates cells are not established by clinical science',
      ],
      practicalTips: [
        'Use 528 Hz as a tranquil backdrop for heart-focused meditation',
        'Listen for 5–20 minutes at a comfortable volume',
        'Do not rely on audio tones for medical conditions',
      ],
      scientificBasis: 'Akimoto et al. (2018) reported endocrine changes in 9 subjects listening to 528-Hz music. DNA repair claims remain unsupported in human clinical research.',
    },
    {
      id: 'article-6',
      title: "Schumann Resonance: Earth's Electromagnetic Phenomenon",
      content: `The Schumann Resonance is an atmospheric electromagnetic phenomenon near 7.83 Hz. Phone audio reproduces acoustic sound waves, not Earth's planetary electromagnetic fields. Schumann-inspired tracks offer a calming acoustic backdrop for grounding meditation.`,
      category: 'healing',
      tags: ['Schumann', 'earth frequency', 'geophysics', 'grounding', '7.83hz'],
      isPremium: false,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 7,
      difficulty: 'Intermediate',
      keyPoints: [
        'Earth has fundamental atmospheric electromagnetic resonances near 7.83 Hz',
        '7.83 Hz falls mathematically within the alpha-theta brainwave boundary',
        'Phone audio generates acoustic sound waves, not planetary electromagnetic fields',
        'Schumann-inspired audio offers a soothing backdrop for grounding meditation',
      ],
      practicalTips: [
        'Use Schumann-inspired audio as a calm backdrop for meditation',
        'Listen at a comfortable, moderate volume',
        'Use for 5–20 minutes to settle a busy mind',
      ],
    },
    {
      id: 'article-7',
      title: 'Sound, Intention & Abundance: Using Music for Goal Reflection',
      content: `Using audio frequencies for goal reflection combines numerological symbolism (888 Hz), alternative tuning (432 Hz), and alpha-range focus (10 Hz). Goal setting during audio sessions operates through cognitive priming. Sound does not supernatural attract wealth; concrete personal action creates success.`,
      category: 'manifestation',
      tags: ['manifestation', 'abundance', '888hz', '432hz', 'psychology'],
      isPremium: true,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 8,
      difficulty: 'Intermediate',
      keyPoints: [
        '888 Hz carries traditional numerological symbolism for abundance reflection',
        '432 Hz is an alternative musical tuning used for calming focus',
        'Goal setting during audio sessions works through psychological focus and priming',
        'Sound does not magically attract wealth; concrete personal action creates success',
      ],
      practicalTips: [
        'Formulate clear personal goals before your listening session',
        'Journal concrete action steps immediately after listening',
        'Use 10 Hz Alpha or 432 Hz audio as a focus backdrop',
      ],
    },
    {
      id: 'article-8',
      title: '40 Hz Gamma Research: What Scientists Are Investigating',
      content: `MIT researchers investigate 40 Hz sensory stimulation in Alzheimer's disease models. While promising, human clinical trials are preliminary and use specialized equipment. Playing a 40 Hz audio track through a commercial smartphone app is not a medical treatment for Alzheimer's disease.`,
      category: 'scientific',
      tags: ['gamma', '40hz', 'neuroscience', 'cognitive', 'research', 'MIT'],
      isPremium: false,
      publishedAt: now(),
      author: 'Frequency Lab',
      readTime: 9,
      difficulty: 'Advanced',
      keyPoints: [
        '40 Hz falls in the gamma brainwave range associated with active cognition',
        'MIT studies investigate 40 Hz sensory stimulation in Alzheimer\'s models',
        'Human clinical trials are preliminary',
        'A consumer audio track is not an Alzheimer\'s medical treatment',
      ],
      practicalTips: [
        'Use 40 Hz audio as a focus backdrop during study or work',
        'Keep sessions to 15–20 minutes as gamma frequencies are activating',
        'Listen at a comfortable volume during waking hours',
      ],
      scientificBasis: 'Tsai et al. (MIT, 2016) demonstrated microglial and amyloid changes in mice using 40 Hz sensory stimulation. Human trials remain exploratory.',
    },
  ];

  return { frequencies, sessions, articles };
}
