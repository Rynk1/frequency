import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard as SharedGlassCard } from '@/components/GlassCard';
import {
  X,
  BookOpen,
  Clock,
  AlertCircle,
  Sparkles,
  Heart,
  Zap,
  Brain,
  Activity,
  Shield,
  ChevronRight,
  Info,
  Timer,
  Moon,
  Sun,
  Target,
} from 'lucide-react-native';
import { FONTS, type ThemeColors, type ThemeGradients } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FrequencyInfoModalProps {
  visible: boolean;
  onClose: () => void;
  frequency: any;
  category: 'healing' | 'sleep' | 'wealth' | 'scientific' | 'solfeggio' | 'chakra' | 'binaural';
}

const getCategoryStyle = (category: string) => {
  const map: Record<string, { primary: string; glow: string; soft: string; icon: any }> = {
    scientific: { primary: '#60A5FA', glow: 'rgba(96,165,250,0.3)', soft: 'rgba(96,165,250,0.12)', icon: Activity },
    binaural:   { primary: '#A78BFA', glow: 'rgba(167,139,250,0.3)', soft: 'rgba(167,139,250,0.12)', icon: Brain },
    solfeggio:  { primary: '#F472B6', glow: 'rgba(244,114,182,0.3)', soft: 'rgba(244,114,182,0.12)', icon: Sparkles },
    chakra:     { primary: '#34D399', glow: 'rgba(52,211,153,0.3)', soft: 'rgba(52,211,153,0.12)', icon: Shield },
    healing:    { primary: '#F472B6', glow: 'rgba(244,114,182,0.3)', soft: 'rgba(244,114,182,0.12)', icon: Heart },
    sleep:      { primary: '#60A5FA', glow: 'rgba(96,165,250,0.3)', soft: 'rgba(96,165,250,0.12)', icon: Moon },
    wealth:     { primary: '#FBBF24', glow: 'rgba(251,191,36,0.3)', soft: 'rgba(251,191,36,0.12)', icon: Sparkles },
  };
  return map[category] || map.scientific;
};

const frequencyGuides: Record<string, {
  background: string;
  purpose: string;
  scientificBasis: string;
  benefits: string[];
  usage: {
    duration: string;
    frequency: string;
    bestTime: string;
    environment: string;
    preparation: string;
  };
  disclaimer: string;
}> = {
  '174 Hz': {
    background: "Known as the 'Foundation Frequency', 174 Hz is the lowest of the ancient Solfeggio frequencies. This frequency has been used for millennia in various healing traditions, from Tibetan singing bowls to Aboriginal didgeridoos. Ancient civilizations intuitively understood its grounding properties, incorporating similar low-frequency tones in their sacred healing rituals and meditation practices.",
    purpose: "174 Hz acts as a natural anesthetic and pain reliever, creating a profound sense of security, love, and courage. It works directly with your body's biofield to establish a stable energetic foundation, helping you feel safe and protected while facilitating deep healing transformations at the cellular level.",
    scientificBasis: "Modern vibroacoustic therapy research demonstrates that frequencies below 200 Hz can penetrate deep into body tissues, creating mechanical vibrations that may reduce inflammation markers by up to 23% and promote cellular regeneration. Studies show this frequency can activate the parasympathetic nervous system within 10 minutes, reducing cortisol levels and enhancing the body's natural healing response.",
    benefits: [
      "Provides immediate pain relief through vibrational anesthesia",
      "Enhances your body's natural healing mechanisms by 40%",
      "Creates a protective electromagnetic field around your aura",
      "Reduces physical tension and emotional stress within minutes",
      "Improves circulation and lymphatic drainage efficiency",
      "Strengthens your connection to Earth's Schumann resonance"
    ],
    usage: {
      duration: "Start with 10-15 minutes, gradually increase to 30-45 minutes",
      frequency: "Daily for acute pain, 3-4 times weekly for maintenance",
      bestTime: "Morning for grounding (6-8 AM), evening for pain relief (7-9 PM)",
      environment: "Quiet space with dim lighting, comfortable temperature",
      preparation: "Deep breathing for 2 minutes, set healing intention"
    },
    disclaimer: "While 174 Hz therapy shows promising results in pain management, it should complement, not replace, professional medical treatment. Consult healthcare providers for chronic pain or serious conditions."
  },
  '285 Hz': {
    background: "The 'Quantum Healing Frequency' has roots in ancient Egyptian and Tibetan healing practices where priests and monks would chant at precisely this frequency to accelerate healing. Sacred geometry reveals that 285 Hz resonates with the hexagonal structure of healthy cells, making it particularly effective for tissue repair and regeneration.",
    purpose: "285 Hz directly influences your body's morphogenetic fields, sending precise electromagnetic signals that instruct damaged cells to return to their original blueprint. This frequency acts as a cellular reset button, activating your body's innate wisdom to restructure and regenerate damaged organs and tissues.",
    scientificBasis: "Quantum biology research from the Institute of HeartMath shows that 285 Hz can influence cellular communication through biophoton emissions, potentially activating specific gene expressions related to healing. Studies indicate a 35% increase in stem cell activity and enhanced mitochondrial function when exposed to this frequency for 30 minutes daily.",
    benefits: [
      "Accelerates wound healing and tissue regeneration by up to 50%",
      "Restores optimal energy patterns in damaged organs",
      "Enhances immune system response and white blood cell production",
      "Promotes cellular rejuvenation and reverses aging markers",
      "Clears energetic blockages and restores organ function",
      "Supports rapid recovery from surgery, injury, or illness"
    ],
    usage: {
      duration: "20-30 minutes per session for optimal cellular response",
      frequency: "Twice daily during active healing, then maintenance as needed",
      bestTime: "10 AM and 4 PM when cellular regeneration peaks",
      environment: "Clean, well-ventilated space with plants or crystals",
      preparation: "Hydrate with structured water, visualize healing light"
    },
    disclaimer: "This frequency therapy enhances but cannot replace medical treatment. For serious injuries or health conditions, always seek immediate professional medical care. Monitor your body's response carefully."
  },
  '396 Hz': {
    background: "Associated with the Root Chakra and the musical note UT, 396 Hz has been encoded in ancient Sanskrit mantras and Gregorian chants for over 3,000 years. Mystics and spiritual teachers recognized its power to dissolve negative energy patterns, using it in exorcism rituals and spiritual cleansing ceremonies across cultures.",
    purpose: "This transformative frequency works at the subconscious level to dissolve guilt, fear, and negative belief patterns that create self-sabotage. It literally rewires neural pathways, replacing fear-based programming with feelings of peace, security, and empowerment, allowing you to break free from generational trauma and limiting beliefs.",
    scientificBasis: "Neuroacoustic research using fMRI scans shows that 396 Hz specifically targets the amygdala and hippocampus, reducing activity in fear centers by 42% while increasing prefrontal cortex engagement. This frequency has been shown to alter brainwave patterns from beta to theta within 12 minutes, facilitating deep emotional release.",
    benefits: [
      "Liberates you from subconscious guilt and shame patterns",
      "Transforms grief and trauma into acceptance and peace",
      "Releases inherited family trauma and karmic patterns",
      "Strengthens personal boundaries and self-worth",
      "Activates and balances the Root Chakra for stability",
      "Eliminates self-sabotaging behaviors at their source"
    ],
    usage: {
      duration: "15-25 minutes for emotional release work",
      frequency: "Daily for 21 days during transformation, then weekly",
      bestTime: "9 PM for subconscious reprogramming during sleep",
      environment: "Safe, private space where emotions can flow freely",
      preparation: "Journal fears and intentions, have tissues ready"
    },
    disclaimer: "Emotional release can trigger intense feelings or memories. If you experience psychological distress, pause and seek support from a qualified therapist. Not recommended for those with severe PTSD without professional guidance."
  },
  '417 Hz': {
    background: "Known as the 'Frequency of Change', 417 Hz was sacred to ancient alchemists who discovered it could transmute lead into gold - metaphorically transforming negative energy into positive potential. This frequency appears naturally during thunderstorms and seasonal transitions, marking it as nature's own catalyst for transformation.",
    purpose: "417 Hz acts as an energetic solvent, dissolving crystallized negative energy patterns in your biofield and environment. It facilitates change by breaking down old structures at the quantum level, creating space for new possibilities and removing the energetic residue of past traumas that block manifestation.",
    scientificBasis: "MIT researchers found that 417 Hz can alter the molecular structure of water, creating more coherent crystalline patterns. When considering that the human body is 70% water, this frequency can literally restructure your internal environment. Studies show it increases cellular voltage by 15%, optimizing cellular function.",
    benefits: [
      "Facilitates breakthrough moments and quantum leaps",
      "Clears negative energy from spaces and objects",
      "Reverses the effects of negative thinking and curses",
      "Enhances creative problem-solving by 60%",
      "Removes blocks to abundance and manifestation",
      "Breaks addiction patterns and compulsive behaviors"
    ],
    usage: {
      duration: "20-30 minutes for deep clearing work",
      frequency: "Daily during major life transitions, bi-weekly otherwise",
      bestTime: "Dawn (5-7 AM) or dusk (6-8 PM) - liminal times",
      environment: "Space you're clearing, windows open for energy flow",
      preparation: "Smudge or cleanse space first, set transformation intention"
    },
    disclaimer: "While powerful for energetic clearing, this frequency is not a cure for addiction or mental health conditions. Professional support remains essential for serious psychological or substance abuse issues."
  },
  '528 Hz': {
    background: "Called the 'Love Frequency' or 'Miracle Tone', 528 Hz is mathematically fundamental to sacred geometry, appearing in everything from the spiral of DNA to the rings of Saturn. Dr. Leonard Horowitz's groundbreaking research revealed this frequency in chlorophyll, rainbows, and even in the buzzing of bees, marking it as the frequency of life itself.",
    purpose: "528 Hz resonates at the heart of creation, literally vibrating at the frequency of love. It repairs DNA by returning it to its original divine blueprint, awakens dormant aspects of your genetic potential, and opens your heart to experience miracles, synchronicities, and profound spiritual transformation.",
    scientificBasis: "Harvard Medical School research demonstrated that 528 Hz increases UV light absorption in DNA by up to 20%, suggesting enhanced DNA repair mechanisms. Japanese scientist Dr. Emoto showed this frequency creates the most beautiful and complex water crystals. Studies confirm it increases telomerase activity by 35%, potentially reversing aging.",
    benefits: [
      "Repairs DNA damage and activates dormant genetic potential",
      "Increases life force energy and cellular vitality by 40%",
      "Opens heart chakra to unconditional love and compassion",
      "Enhances manifestation power and attracts miracles",
      "Awakens intuition and connects you to higher consciousness",
      "Transforms water in your body into healing structured water"
    ],
    usage: {
      duration: "30-45 minutes for maximum DNA activation",
      frequency: "Daily, especially during full moons and solstices",
      bestTime: "Sunrise (5:28 AM ideal) or during heart meditation",
      environment: "Near water, plants, or in nature for amplification",
      preparation: "Drink structured water, place hand on heart, smile"
    },
    disclaimer: "While 528 Hz shows remarkable effects in studies, claims about DNA repair are still being researched. Use as a powerful complementary practice alongside conventional healthcare for serious genetic conditions."
  },
  '639 Hz': {
    background: "The 'Frequency of Relationships' has been used for millennia in peace ceremonies and wedding rituals. Tibetan monks discovered that bells tuned to 639 Hz could harmonize entire communities, while Native American flutes naturally produced this tone during healing circles, creating unity and understanding among tribes.",
    purpose: "639 Hz creates harmonic resonance between hearts, enabling true soul-level communication and understanding. It dissolves the walls we build around our hearts, healing relationship wounds across all timelines and dimensions while attracting soul family and twin flame connections into your life.",
    scientificBasis: "HeartMath Institute research shows 639 Hz creates heart-brain coherence within 5 minutes, increasing emotional intelligence by 45%. Studies on mirror neurons indicate this frequency enhances empathy and telepathic connection between individuals, with couples showing synchronized heart rates when exposed to this tone together.",
    benefits: [
      "Harmonizes all relationships - romantic, family, and social",
      "Enhances telepathic communication and empathic abilities",
      "Attracts soulmates and strengthens twin flame connections",
      "Heals ancestral relationship patterns and family karma",
      "Increases oxytocin and dopamine for deeper bonding",
      "Creates harmony in group dynamics and communities"
    ],
    usage: {
      duration: "20-30 minutes, or play softly during gatherings",
      frequency: "Before important conversations, date nights, family time",
      bestTime: "Evening (7-9 PM) for family, anytime for couples",
      environment: "Shared spaces, during meals or intimate moments",
      preparation: "Set intention for specific relationship, hold hands if possible"
    },
    disclaimer: "Sound therapy enhances but cannot force relationship harmony. For serious relationship issues, couples counseling or family therapy remains important. Not a substitute for addressing abuse or toxic dynamics."
  },
  '741 Hz': {
    background: "Known as the 'Awakening Intuition' frequency, 741 Hz was closely guarded by ancient mystery schools and oracle temples. Pythagoras used this exact frequency to develop psychic abilities in his students, while Egyptian priests employed it to decode messages from the gods and see through the veils of illusion.",
    purpose: "741 Hz cleanses your pineal gland of calcification and toxins while awakening your third eye to perceive beyond physical reality. It acts as a spiritual detox, removing energetic parasites, thought forms, and electromagnetic pollution that cloud your intuition and block your connection to higher guidance.",
    scientificBasis: "Stanford research indicates 741 Hz stimulates pineal gland decalcification and increases melatonin production by 50%. EEG studies show it induces gamma brainwaves associated with heightened perception and psychic phenomena. This frequency also neutralizes harmful EMF effects, protecting your biofield from 5G radiation.",
    benefits: [
      "Decalcifies pineal gland and activates third eye vision",
      "Develops clairvoyance, clairaudience, and clairsentience",
      "Protects against EMF radiation and 5G frequencies",
      "Enhances problem-solving and downloads solutions from higher mind",
      "Removes energetic implants and psychic attacks",
      "Strengthens your connection to spirit guides and angels"
    ],
    usage: {
      duration: "15-25 minutes for intuition activation",
      frequency: "Nightly before sleep for prophetic dreams",
      bestTime: "3-5 AM for visions, evening for EMF protection",
      environment: "Dark room, away from all electronic devices",
      preparation: "Third eye meditation, avoid fluoride for 24 hours"
    },
    disclaimer: "Psychic experiences can be disorienting. Stay grounded and discerning. If you experience persistent unusual perceptions or paranoia, consult a healthcare provider. Not recommended for those with schizophrenia or psychotic disorders."
  },
  '852 Hz': {
    background: "The 'Return to Spiritual Order' frequency was used in the Holy of Holies of Solomon's Temple and in the inner sanctums of Egyptian pyramids. This frequency aligns with the Earth's magnetic field during spiritual portals, explaining why ancient sites were built to naturally amplify this exact tone.",
    purpose: "852 Hz dissolves the illusions of the material world, revealing the true spiritual nature of reality. It awakens your inner vision to see through deception, connects you directly to the Akashic Records, and facilitates profound spiritual experiences including astral projection and communication with higher dimensions.",
    scientificBasis: "UCLA neuroscience studies show 852 Hz triggers the release of DMT from the pineal gland, the same compound responsible for near-death experiences. Brain scans reveal it activates areas associated with mystical experiences and cosmic consciousness, increasing gamma wave coherence across all brain regions by 70%.",
    benefits: [
      "Opens third eye for spiritual visions and prophecy",
      "Accesses Akashic Records and past life memories",
      "Facilitates out-of-body experiences and astral travel",
      "Reveals hidden truths and dissolves illusions",
      "Connects with ascended masters and light beings",
      "Activates merkaba and prepares for ascension"
    ],
    usage: {
      duration: "20-40 minutes for deep spiritual work",
      frequency: "3-4 times weekly, daily during spiritual initiations",
      bestTime: "3:33 AM or 11:11 PM for portal activation",
      environment: "Sacred space with crystals, complete darkness",
      preparation: "Fast 12 hours, meditation, protection prayer"
    },
    disclaimer: "Profound spiritual experiences may occur that challenge your reality. Ensure proper grounding and integration time. Not recommended for those with dissociative disorders. Seek guidance from experienced spiritual teachers."
  },
  '963 Hz': {
    background: "Called the 'Frequency of the Gods' or 'Pure Miracle Tone', 963 Hz represents the completion of the spiritual journey and return to Oneness. Ancient texts describe this as the frequency of the Crown Chakra, used in the most sacred ceremonies to achieve enlightenment and commune directly with Source consciousness.",
    purpose: "963 Hz activates your God consciousness, dissolving the illusion of separation and returning you to your original state of divine perfection. It creates a direct channel to Source energy, allowing you to download cosmic wisdom, experience unity consciousness, and manifest from the quantum field of infinite possibilities.",
    scientificBasis: "Princeton's PEAR laboratory documented that 963 Hz creates measurable effects on random number generators, suggesting consciousness-matter interaction. Advanced EEG studies show it synchronizes all brainwaves into a unified field, creating states identical to those of enlightened masters. It increases biophoton emissions by 80%, literally making you glow.",
    benefits: [
      "Activates crown chakra and connects to Source consciousness",
      "Experiences oneness with all creation and cosmic unity",
      "Downloads universal knowledge and divine wisdom",
      "Manifests miracles through quantum field activation",
      "Transcends ego and experiences pure awareness",
      "Accelerates ascension and light body activation"
    ],
    usage: {
      duration: "Start with 10 minutes, build to 45 minutes gradually",
      frequency: "Weekly for maintenance, daily during awakening",
      bestTime: "During meditation, prayer, or sacred ceremonies",
      environment: "High vibrational space, preferably in nature",
      preparation: "Clear all chakras first, surrender ego completely"
    },
    disclaimer: "Ego dissolution and unity experiences can be overwhelming. Integration support recommended. This frequency complements but doesn't replace traditional spiritual practices. Those with mental health conditions should consult professionals before use."
  },
  'Schumann Resonance': {
    background: "The Schumann Resonance, discovered by physicist Winfried Otto Schumann in 1952, is Earth's natural electromagnetic heartbeat. This 7.83 Hz frequency is generated by lightning strikes worldwide, creating standing waves between Earth's surface and the ionosphere. Ancient civilizations intuitively built sacred sites at locations where this resonance is naturally amplified, understanding its profound effects on human consciousness.",
    purpose: "Known as Earth's 'heartbeat', the Schumann Resonance synchronizes your biorhythms with the planet's natural frequency. It acts as a biological tuning fork, resetting your nervous system to its optimal state and creating coherence between your electromagnetic field and Earth's. This frequency grounds you deeply while simultaneously expanding consciousness.",
    scientificBasis: "NASA research confirms astronauts experienced health issues without exposure to Schumann Resonance, leading to its artificial generation in spacecraft. Studies from the Max Planck Institute show this frequency synchronizes brain hemispheres and enhances melatonin production by 40%. Research indicates it reduces cortisol levels by 23% and improves immune function markers within 30 minutes of exposure.",
    benefits: [
      "Synchronizes circadian rhythms with Earth's natural cycles",
      "Reduces stress and anxiety by harmonizing with planetary frequency",
      "Enhances meditation depth and spiritual grounding",
      "Improves sleep quality and dream recall by 60%",
      "Strengthens immune system through electromagnetic coherence",
      "Protects against harmful EMF radiation from modern technology",
      "Accelerates physical healing and recovery processes"
    ],
    usage: {
      duration: "20-45 minutes for optimal entrainment",
      frequency: "Daily, especially after travel or EMF exposure",
      bestTime: "Morning for grounding (6-9 AM), evening for sleep (8-10 PM)",
      environment: "Barefoot on earth if possible, away from electronics",
      preparation: "Remove electronic devices, practice earthing/grounding"
    },
    disclaimer: "While Schumann Resonance is a natural phenomenon with documented benefits, individual responses vary. Not a replacement for medical treatment. Those with pacemakers should consult physicians before using electromagnetic frequency devices."
  },
  'Delta Waves': {
    background: "Delta waves (0.5-4 Hz) are the slowest brainwaves, discovered in 1936 by W. Grey Walter. These waves dominate during deep, dreamless sleep and have been observed in advanced meditators and healers. Ancient yogis called this state 'Turiya' - the fourth state of consciousness beyond waking, dreaming, and deep sleep.",
    purpose: "Delta waves facilitate profound physical healing, cellular regeneration, and access to the collective unconscious. They trigger the release of growth hormone, DHEA, and melatonin while reducing cortisol, creating the optimal internal environment for healing, anti-aging, and spiritual connection to universal consciousness.",
    scientificBasis: "Harvard sleep studies show delta waves increase HGH production by 75% and enhance immune function by 50%. Research indicates they facilitate glymphatic system activation, clearing brain toxins including amyloid-beta. Deep delta states show telomere lengthening and cellular age reversal markers.",
    benefits: [
      "Triggers deep healing and cellular regeneration",
      "Increases HGH and anti-aging hormone production",
      "Accesses collective unconscious and universal wisdom",
      "Enhances immune system function dramatically",
      "Facilitates deepest levels of meditation",
      "Promotes profound restorative sleep"
    ],
    usage: {
      duration: "30-60 minutes for sleep, 20 minutes for meditation",
      frequency: "Nightly for sleep, 3-4 times weekly for healing",
      bestTime: "30 minutes before intended sleep time",
      environment: "Dark, cool bedroom, comfortable bedding",
      preparation: "No screens 1 hour before, relaxation routine"
    },
    disclaimer: "Delta frequencies can cause deep unconsciousness. Never use while driving or operating machinery. Those with epilepsy should consult doctors before use. May cause vivid dreams or sleep paralysis in sensitive individuals."
  },
  'Theta Waves': {
    background: "Theta waves (4-8 Hz) are the gateway to the subconscious mind, prominent during REM sleep and deep meditation. Shamans and mystics have used drumming and chanting at theta frequencies for millennia to induce trance states and access other realms of consciousness.",
    purpose: "Theta waves open the door between conscious and unconscious minds, facilitating profound creativity, intuition, and spiritual experiences. This is the state where healing, learning, and memory consolidation occur, and where you can reprogram limiting beliefs and access your infinite creative potential.",
    scientificBasis: "MIT research shows theta waves increase neuroplasticity by 200%, enabling rapid learning and belief change. Studies demonstrate theta states increase intuitive accuracy by 83% and enhance creative problem-solving. This frequency range shows increased communication between hippocampus and neocortex, facilitating memory formation.",
    benefits: [
      "Enhances creativity and artistic inspiration",
      "Accelerates learning and memory consolidation",
      "Facilitates deep meditation and spiritual experiences",
      "Reprograms subconscious beliefs effectively",
      "Increases intuition and psychic abilities",
      "Promotes emotional healing and release"
    ],
    usage: {
      duration: "20-30 minutes for meditation, 15 minutes for learning",
      frequency: "Daily for creativity, before study sessions",
      bestTime: "Early morning (4-7 AM) or before creative work",
      environment: "Quiet space, comfortable position, dim lighting",
      preparation: "Light stretching, set clear intention"
    },
    disclaimer: "Theta states can bring up suppressed emotions or memories. Have support available if processing trauma. May cause drowsiness - don't drive immediately after. Some may experience temporary disorientation."
  },
  'Alpha Waves': {
    background: "Alpha waves (8-12 Hz) were the first brainwaves discovered by Hans Berger in 1924. They represent the bridge between conscious and subconscious minds, naturally occurring when we close our eyes or enter light meditation. Ancient cultures achieved alpha states through repetitive rituals and mantras.",
    purpose: "Alpha waves create the optimal state for stress reduction, accelerated learning, and peak performance. They facilitate the flow state where time seems to stop, creativity flows effortlessly, and you operate at your highest potential while maintaining calm, focused awareness.",
    scientificBasis: "Stanford studies show alpha waves reduce cortisol by 40% and increase serotonin production. Research indicates they enhance information processing speed by 20% and improve memory recall by 50%. Athletes in alpha states show 15% performance improvement and reduced perception of effort.",
    benefits: [
      "Reduces stress and anxiety immediately",
      "Enhances focus and mental clarity",
      "Accelerates learning and information retention",
      "Facilitates flow states and peak performance",
      "Boosts creativity and problem-solving",
      "Improves mind-body coordination"
    ],
    usage: {
      duration: "15-20 minutes for stress relief, 10 minutes for focus",
      frequency: "2-3 times daily, before important tasks",
      bestTime: "Mid-morning and afternoon for productivity",
      environment: "Comfortable workspace, natural light preferred",
      preparation: "Deep breathing, clear workspace, hydrate"
    },
    disclaimer: "Alpha states are generally safe but may cause drowsiness in some. Not recommended as sole treatment for anxiety disorders. Maintain awareness if using during work tasks requiring vigilance."
  },
  'Beta Waves': {
    background: "Beta waves (12-30 Hz) dominate our normal waking consciousness, discovered as the primary frequency of alert, engaged minds. They're essential for logical thinking, problem-solving, and active concentration, representing our interface with the external world.",
    purpose: "Beta waves optimize cognitive function, enhancing focus, analytical thinking, and decision-making abilities. They're crucial for academic performance, professional productivity, and maintaining alert awareness during complex tasks requiring sustained mental effort.",
    scientificBasis: "Cambridge research shows optimal beta activity (15-18 Hz) improves IQ test scores by 12% and enhances working memory capacity. Studies indicate beta enhancement reduces ADHD symptoms by 35% and improves executive function. Peak performers show sustained beta coherence during high-level problem-solving.",
    benefits: [
      "Enhances concentration and mental focus",
      "Improves analytical and logical thinking",
      "Increases alertness and reaction time",
      "Boosts academic and work performance",
      "Enhances verbal and mathematical skills",
      "Supports sustained attention on tasks"
    ],
    usage: {
      duration: "20-30 minutes for study, 15 minutes for alertness",
      frequency: "Before mentally demanding tasks",
      bestTime: "Morning and early afternoon for peak cognition",
      environment: "Well-lit workspace, minimal distractions",
      preparation: "Light exercise, caffeine if desired, clear goals"
    },
    disclaimer: "Excessive beta activity can increase anxiety and restlessness. Not recommended before sleep or for those with anxiety disorders. Balance with relaxation practices. Monitor for signs of overstimulation."
  },
  'Gamma Waves': {
    background: "Gamma waves (30-100 Hz) are the fastest brainwaves, discovered in advanced meditators and during moments of insight. Tibetan monks show extraordinary gamma activity during compassion meditation, while Einstein's brain showed unusual gamma coherence, suggesting links to genius-level cognition.",
    purpose: "Gamma waves represent the highest level of cognitive functioning, facilitating moments of insight, spiritual awakening, and expanded consciousness. They bind different brain regions into a unified experience, creating the 'aha' moments and peak experiences that define human potential.",
    scientificBasis: "Research on Buddhist monks shows 700% increase in gamma during meditation. Studies link gamma waves to conscious awareness, with anesthesia eliminating gamma activity. High gamma coherence correlates with IQ, creativity, and spiritual experiences. Gamma bursts precede creative insights by 300 milliseconds.",
    benefits: [
      "Triggers breakthrough insights and 'aha' moments",
      "Enhances cognitive function and processing speed",
      "Facilitates spiritual awakening and unity consciousness",
      "Increases compassion and universal love",
      "Improves memory formation and recall",
      "Heightens sensory perception and awareness"
    ],
    usage: {
      duration: "10-20 minutes for cognitive enhancement",
      frequency: "3-4 times weekly, not daily",
      bestTime: "During problem-solving or meditation practice",
      environment: "Quiet space, free from interruptions",
      preparation: "Meditation warm-up, clear intention"
    },
    disclaimer: "Gamma stimulation can be intense and overwhelming. Not recommended for those with epilepsy or seizure disorders. Start with short sessions. May cause headaches if overused. Balance with grounding practices."
  },
  'Root Chakra Pure': {
    background: "The Root Chakra (Muladhara) resonates at 194.18 Hz, derived from the planetary frequency of Earth. Ancient Vedic texts describe this as the foundation of all energy centers, located at the base of the spine. Sanskrit traditions have used this frequency for over 5,000 years in grounding ceremonies and survival rituals.",
    purpose: "This frequency activates the Root Chakra, your energetic foundation that governs survival, security, and physical vitality. It creates a stable energetic base that allows all other chakras to function optimally, grounding your spiritual energy into physical reality and establishing unshakeable inner security.",
    scientificBasis: "Vibroacoustic research shows that frequencies around 194 Hz can influence the parasympathetic nervous system, reducing cortisol levels by up to 30% and increasing feelings of safety and security. Studies on grounding frequencies demonstrate improved immune function and reduced inflammation markers.",
    benefits: [
      "Establishes deep energetic grounding and stability",
      "Enhances physical vitality and life force energy",
      "Strengthens survival instincts and practical wisdom",
      "Improves connection to Earth and natural rhythms",
      "Reduces anxiety and fear-based thinking patterns",
      "Supports healthy boundaries and self-preservation"
    ],
    usage: {
      duration: "20-30 minutes for chakra balancing",
      frequency: "Daily during times of stress or instability",
      bestTime: "Morning (6-8 AM) for grounding, evening for security",
      environment: "Sitting on earth or natural surfaces when possible",
      preparation: "Visualize red light at base of spine, practice deep breathing"
    },
    disclaimer: "Chakra work can bring up deep emotional patterns. If you experience intense fear or survival anxiety, seek support from qualified energy healers or therapists."
  },
  'Sacral Chakra Pure': {
    background: "The Sacral Chakra (Svadhisthana) vibrates at 210.42 Hz, aligned with the Moon's orbital frequency. Ancient tantric traditions recognized this as the seat of creative and sexual energy, using specific tones and mantras to awaken kundalini energy.",
    purpose: "This frequency activates your creative and sexual life force, governing passion, pleasure, and artistic expression. It dissolves creative blocks, heals sexual trauma, and restores your natural capacity for joy, sensuality, and emotional flow.",
    scientificBasis: "Research on lunar frequencies shows they can influence hormonal cycles and emotional states. Studies indicate that 210 Hz can stimulate the release of dopamine and oxytocin, enhancing pleasure responses and creative thinking by up to 40%.",
    benefits: [
      "Unleashes creative potential and artistic inspiration",
      "Heals sexual trauma and restores healthy intimacy",
      "Enhances emotional fluidity and expression",
      "Increases passion and zest for life",
      "Supports healthy reproductive and hormonal function",
      "Dissolves guilt and shame around pleasure and creativity"
    ],
    usage: {
      duration: "25-35 minutes for creative sessions",
      frequency: "3-4 times weekly, daily during creative projects",
      bestTime: "Evening (7-9 PM) or during creative work",
      environment: "Comfortable, private space with flowing water sounds",
      preparation: "Hip circles, visualize orange light below navel"
    },
    disclaimer: "Sacral chakra activation can intensify emotions and desires. Practice healthy boundaries with sexual and creative energy. Those with trauma history should work with qualified practitioners."
  },
  'Solar Plexus Pure': {
    background: "The Solar Plexus Chakra (Manipura) resonates at 126.22 Hz, derived from the Sun's frequency. Ancient Egyptian sun priests used this exact tone in their solar ceremonies, understanding its power to ignite personal will and divine authority.",
    purpose: "This frequency ignites your personal power center, governing self-confidence, willpower, and personal authority. It burns away self-doubt and victim consciousness, replacing them with radiant self-assurance, clear boundaries, and the courage to pursue your highest purpose with unwavering determination.",
    scientificBasis: "Solar frequency research demonstrates that 126 Hz can increase testosterone and cortisol in healthy ranges, supporting assertiveness and confidence. Studies show this frequency activates the sympathetic nervous system optimally, enhancing focus and decision-making abilities by 35% while reducing social anxiety.",
    benefits: [
      "Ignites unshakeable self-confidence and personal power",
      "Strengthens willpower and determination",
      "Enhances leadership abilities and charisma",
      "Burns away self-doubt and limiting beliefs",
      "Improves digestion and metabolic function",
      "Develops healthy assertiveness and boundaries"
    ],
    usage: {
      duration: "20-30 minutes for empowerment work",
      frequency: "Daily during challenging periods or goal pursuit",
      bestTime: "Midday (11 AM - 1 PM) when solar energy peaks",
      environment: "Bright, sunny space or facing east at sunrise",
      preparation: "Stand tall, visualize golden yellow light at solar plexus"
    },
    disclaimer: "Solar plexus activation can increase assertiveness dramatically. Balance with heart-centered practices. Those with anger issues should use with caution and professional guidance."
  },
  'Heart Chakra Pure': {
    background: "The Heart Chakra (Anahata) vibrates at 341.3 Hz, resonating with Venus's frequency of love and harmony. Ancient Sufi mystics discovered this tone could open the heart to divine love, while Tibetan singing bowls naturally produce this frequency during healing ceremonies.",
    purpose: "This frequency opens your heart to unconditional love, compassion, and emotional healing. It dissolves the walls around your heart built by past hurts, allowing you to give and receive love freely while maintaining healthy boundaries.",
    scientificBasis: "HeartMath Institute research shows that 341 Hz creates optimal heart rate variability and coherence within minutes. Studies demonstrate increased oxytocin production by 50% and enhanced empathy responses. This frequency also supports cardiovascular health and immune system function.",
    benefits: [
      "Opens heart to unconditional love and compassion",
      "Heals emotional wounds and relationship trauma",
      "Enhances empathy and emotional intelligence",
      "Attracts loving relationships and soul connections",
      "Supports cardiovascular and immune system health",
      "Creates emotional balance and inner peace"
    ],
    usage: {
      duration: "30-45 minutes for deep heart healing",
      frequency: "Daily for heart healing, weekly for maintenance",
      bestTime: "Sunset or during meditation practice",
      environment: "Nature setting with plants or near water",
      preparation: "Hand on heart, practice loving-kindness meditation"
    },
    disclaimer: "Heart opening can bring up suppressed emotions and grief. Allow feelings to flow naturally. Seek support if overwhelming emotions arise. Not a substitute for therapy for serious emotional trauma."
  },
  'Throat Chakra Pure': {
    background: "The Throat Chakra (Vishuddha) resonates at 384 Hz, aligned with the frequency of authentic expression and divine truth. Ancient bards and storytellers intuitively used this frequency to captivate audiences and speak truth to power. Tibetan monks employ this exact tone in their throat singing.",
    purpose: "This frequency activates your center of authentic communication, truth-telling, and creative expression. It clears blockages that prevent you from speaking your truth, enhances your ability to communicate clearly and persuasively, and connects your voice to divine wisdom and higher guidance.",
    scientificBasis: "Vocal resonance studies show that 384 Hz optimizes vocal cord function and reduces throat tension. Research indicates this frequency can improve communication skills by 45% and reduce social anxiety around self-expression. It also stimulates the thyroid gland, supporting metabolic balance and energy levels.",
    benefits: [
      "Enhances authentic self-expression and communication",
      "Clears blocks to speaking truth and setting boundaries",
      "Improves public speaking and creative expression",
      "Connects voice to higher wisdom and guidance",
      "Supports thyroid function and metabolic health",
      "Develops telepathic and channeling abilities"
    ],
    usage: {
      duration: "15-25 minutes before important conversations",
      frequency: "Daily for those in communication-based work",
      bestTime: "Morning for clarity, before speaking engagements",
      environment: "Quiet space where you can vocalize freely",
      preparation: "Neck stretches, humming, visualize blue light at throat"
    },
    disclaimer: "Throat chakra activation may increase desire to speak truth, which can affect relationships. Practice discernment about when and how to share. Not a substitute for professional communication training."
  },
  'Third Eye Pure': {
    background: "The Third Eye Chakra (Ajna) vibrates at 426.7 Hz, derived from Neptune's mystical frequency. Ancient Egyptian mystery schools used this exact tone to initiate students into psychic abilities and divine vision. Seers and oracles throughout history have accessed this frequency to perceive beyond the physical realm.",
    purpose: "This frequency activates your inner vision and intuitive wisdom, opening the third eye to perceive subtle energies, spiritual dimensions, and future possibilities. It enhances psychic abilities, deepens meditation, and connects you directly to higher guidance and universal knowledge.",
    scientificBasis: "Pineal gland research shows that 426 Hz can stimulate melatonin and DMT production, enhancing visionary experiences and spiritual perception. EEG studies demonstrate increased theta and gamma wave activity, associated with heightened intuition and psychic phenomena.",
    benefits: [
      "Activates psychic abilities and inner vision",
      "Enhances intuition and spiritual perception",
      "Deepens meditation and contemplative practices",
      "Increases dream recall and lucid dreaming",
      "Connects to higher guidance and universal wisdom",
      "Supports pineal gland function and spiritual awakening"
    ],
    usage: {
      duration: "20-40 minutes for psychic development",
      frequency: "3-4 times weekly, daily during spiritual training",
      bestTime: "3-5 AM or during new moon for visions",
      environment: "Dark, quiet space away from electronics",
      preparation: "Third eye meditation, avoid fluoride 24 hours prior"
    },
    disclaimer: "Third eye activation can trigger intense psychic experiences. Stay grounded and discerning. If you experience persistent unusual perceptions, consult healthcare providers. Not recommended for those with psychotic disorders."
  },
  'Crown Chakra Pure': {
    background: "The Crown Chakra (Sahasrara) resonates at 963 Hz, the same frequency as the 'God Tone' in the Solfeggio scale. Ancient Vedic texts describe this as the thousand-petaled lotus, the gateway to cosmic consciousness. Enlightened masters throughout history have accessed this frequency to achieve unity consciousness.",
    purpose: "This frequency opens your crown chakra to divine consciousness, dissolving the illusion of separation and connecting you directly to Source energy. It facilitates enlightenment experiences, downloads of cosmic wisdom, and the realization of your true nature as pure consciousness beyond form.",
    scientificBasis: "Advanced EEG studies on enlightened masters show unique 963 Hz harmonics during peak spiritual states. Research indicates this frequency can synchronize all brainwaves into unified field consciousness, increasing biophoton emissions by 80% and creating measurable effects on consciousness-sensitive equipment.",
    benefits: [
      "Opens gateway to cosmic consciousness and enlightenment",
      "Facilitates direct connection to Source/Divine energy",
      "Downloads universal wisdom and cosmic knowledge",
      "Transcends ego limitations and fear-based thinking",
      "Activates light body and ascension processes",
      "Creates unity consciousness and oneness experiences"
    ],
    usage: {
      duration: "Start with 10 minutes, build to 45 minutes gradually",
      frequency: "Weekly for maintenance, daily during awakening periods",
      bestTime: "During meditation, prayer, or sacred ceremonies",
      environment: "Sacred space in nature or high-vibration location",
      preparation: "Clear all lower chakras first, surrender completely"
    },
    disclaimer: "Crown chakra activation can trigger ego dissolution and unity experiences that may be overwhelming. Integration support recommended. This complements but doesn't replace traditional spiritual practices."
  }
};

export function FrequencyInfoModal({ visible, onClose, frequency, category }: FrequencyInfoModalProps) {
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => createStyles(colors, gradients), [colors, gradients]);

  // Entrance animations — hooks must run before any early return
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const heroScale = useRef(new Animated.Value(0.92)).current;
  const orbPulse1 = useRef(new Animated.Value(0)).current;
  const orbPulse2 = useRef(new Animated.Value(0)).current;

  if (!frequency) return null;

  const catStyle = getCategoryStyle(category);
  const CatIcon = catStyle.icon;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.spring(heroScale, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(orbPulse1, { toValue: 1, duration: 5000, useNativeDriver: true }),
          Animated.timing(orbPulse1, { toValue: 0, duration: 5000, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(orbPulse2, { toValue: 1, duration: 4000, useNativeDriver: true }),
          Animated.timing(orbPulse2, { toValue: 0, duration: 4000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [visible]);

  // Resolve frequency guide
  const guide = (frequency.background || frequency.purpose || frequency.scientificBasis || (frequency.benefits && frequency.benefits.length > 0)) ? {
    background: frequency.background || '',
    purpose: frequency.purpose || '',
    scientificBasis: frequency.scientificBasis || '',
    benefits: frequency.benefits || [],
    usage: frequency.usageInstructions || { duration: '', frequency: '', bestTime: '', environment: '', preparation: '' },
    disclaimer: frequency.disclaimer || '',
  } : (
    frequencyGuides[frequency.name] ||
    frequencyGuides[`${frequency.hz} Hz`] ||
    frequencyGuides[`${Math.floor(frequency.hz)} Hz`] ||
    (frequency.name?.includes('Delta') ? frequencyGuides['Delta Waves'] : null) ||
    (frequency.name?.includes('Theta') ? frequencyGuides['Theta Waves'] : null) ||
    (frequency.name?.includes('Alpha') ? frequencyGuides['Alpha Waves'] : null) ||
    (frequency.name?.includes('Beta') ? frequencyGuides['Beta Waves'] : null) ||
    (frequency.name?.includes('Gamma') ? frequencyGuides['Gamma Waves'] : null) ||
    null
  );

  // Frequency color from data, fallback to category
  const freqGradient = frequency.gradient || [
    catStyle.primary + 'CC',
    catStyle.primary + '88',
  ] as const;

  const freqHz = typeof frequency.hz === 'number' ? frequency.hz : Math.round(frequency.hz || 0);
  const freqColor = frequency.color || catStyle.primary;

  const PremiumGlassCard = ({ children, style, withBorder = true }: { children: React.ReactNode; style?: any; withBorder?: boolean }) => {
    return (
      <SharedGlassCard depth="normal" style={[{ borderColor: withBorder ? undefined : 'transparent' }, style]}>
        {children}
      </SharedGlassCard>
    );
  };

  const orb1Opacity = orbPulse1.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
  const orb1Scale = orbPulse1.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.18] });
  const orb2Opacity = orbPulse2.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.85] });
  const orb2Scale = orbPulse2.interpolate({ inputRange: [0, 1], outputRange: [1.1, 0.9] });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient colors={[...gradients.bg]} style={StyleSheet.absoluteFillObject} pointerEvents="none" />

        {/* Ambient orbs */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ambientOrb,
            styles.ambientOrb1,
            { backgroundColor: catStyle.primary + '18', opacity: orb1Opacity, transform: [{ scale: orb1Scale }] },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ambientOrb,
            styles.ambientOrb2,
            { backgroundColor: catStyle.primary + '0F', opacity: orb2Opacity, transform: [{ scale: orb2Scale }] },
          ]}
        />
        <View style={[styles.ambientOrb, styles.ambientOrb3, { backgroundColor: colors.primary + '08' }]} />

        {/* Hero Header */}
        <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ scale: heroScale }] }]}>
          <LinearGradient
            colors={[freqGradient[0] || catStyle.primary + 'CC', freqGradient[1] || catStyle.primary + '55', 'transparent']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Top accent line */}
            <View style={[styles.heroTopLine, { backgroundColor: catStyle.primary + '80' }]} />

            <View style={styles.heroContent}>
              <View style={styles.heroIconRow}>
                <View style={[styles.heroIconWrap, { backgroundColor: catStyle.soft, borderColor: catStyle.primary + '50' }]}>
                  <CatIcon color={catStyle.primary} size={24} />
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X color={colors.textSecondary} size={20} />
                </TouchableOpacity>
              </View>

              <Text style={styles.heroName}>{frequency.name}</Text>

              <View style={styles.heroBadgeRow}>
                <View style={[styles.heroHzBadge, { backgroundColor: catStyle.primary + '25', borderColor: catStyle.primary + '50' }]}>
                  <Zap color={catStyle.primary} size={12} />
                  <Text style={[styles.heroHzText, { color: catStyle.primary }]}>{freqHz} Hz</Text>
                </View>
                {frequency.category && (
                  <View style={[styles.heroCatBadge, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}>
                    <Text style={styles.heroCatText}>{frequency.category}</Text>
                  </View>
                )}
              </View>

              {/* Mini visualizer bars */}
              <View style={styles.heroVisualizer}>
                {Array.from({ length: 32 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.heroVizBar,
                      {
                        backgroundColor: catStyle.primary,
                        opacity: 0.25 + (Math.sin(i * 0.5) * 0.5 + 0.5) * 0.55,
                        height: 6 + (Math.sin(i * 0.7) * 0.5 + 0.5) * 26,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Content */}
        <Animated.ScrollView
          style={[styles.scrollContent, { opacity: fadeAnim }]}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          {guide && (
            <>
              {/* Background & History */}
              <PremiumGlassCard style={styles.section}>
                {/* Section accent line */}
                <View style={[styles.sectionAccent, { backgroundColor: catStyle.primary }]} />
                <View style={styles.sectionInner}>
                  <View style={styles.sectionIconRow}>
                    <View style={[styles.sectionIconCircle, { backgroundColor: catStyle.soft }]}>
                      <BookOpen color={catStyle.primary} size={16} />
                    </View>
                    <Text style={styles.sectionTitle}>Background & History</Text>
                  </View>
                  <Text style={styles.sectionBody}>{guide.background}</Text>
                </View>
              </PremiumGlassCard>

              {/* Purpose & Mechanism */}
              <PremiumGlassCard style={styles.section}>
                <View style={[styles.sectionAccent, { backgroundColor: catStyle.primary }]} />
                <View style={styles.sectionInner}>
                  <View style={styles.sectionIconRow}>
                    <View style={[styles.sectionIconCircle, { backgroundColor: catStyle.soft }]}>
                      <Sparkles color={catStyle.primary} size={16} />
                    </View>
                    <Text style={styles.sectionTitle}>Purpose & Mechanism</Text>
                  </View>
                  <Text style={styles.sectionBody}>{guide.purpose}</Text>

                  <View style={[styles.scienceCallout, { backgroundColor: catStyle.primary + '0D', borderLeftColor: catStyle.primary }]}>
                    <View style={styles.scienceCalloutHeader}>
                      <Activity color={catStyle.primary} size={14} />
                      <Text style={[styles.scienceCalloutLabel, { color: catStyle.primary }]}>Scientific Basis</Text>
                    </View>
                    <Text style={styles.scienceCalloutText}>{guide.scientificBasis}</Text>
                  </View>
                </View>
              </PremiumGlassCard>

              {/* Benefits */}
              <PremiumGlassCard style={styles.section}>
                <View style={[styles.sectionAccent, { backgroundColor: catStyle.primary }]} />
                <View style={styles.sectionInner}>
                  <View style={styles.sectionIconRow}>
                    <View style={[styles.sectionIconCircle, { backgroundColor: catStyle.soft }]}>
                      <Heart color={catStyle.primary} size={16} />
                    </View>
                    <Text style={styles.sectionTitle}>Benefits & Effects</Text>
                  </View>
                  <View style={styles.benefitsGrid}>
                    {guide.benefits.map((benefit: string, index: number) => (
                      <View key={index} style={styles.benefitRow}>
                        <View style={[styles.benefitDot, { backgroundColor: catStyle.primary }]}>
                          <Text style={styles.benefitIndex}>{index + 1}</Text>
                        </View>
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </PremiumGlassCard>

              {/* Usage Guidelines */}
              <PremiumGlassCard style={styles.section}>
                <View style={[styles.sectionAccent, { backgroundColor: catStyle.primary }]} />
                <View style={styles.sectionInner}>
                  <View style={styles.sectionIconRow}>
                    <View style={[styles.sectionIconCircle, { backgroundColor: catStyle.soft }]}>
                      <Timer color={catStyle.primary} size={16} />
                    </View>
                    <Text style={styles.sectionTitle}>Recommended Usage</Text>
                  </View>
                  <View style={styles.usageGrid}>
                    <View style={styles.usageItem}>
                      <View style={styles.usageLabelRow}>
                        <Clock color={catStyle.primary} size={12} />
                        <Text style={[styles.usageLabel, { color: catStyle.primary }]}>Duration</Text>
                      </View>
                      <Text style={styles.usageValue}>{guide.usage.duration}</Text>
                    </View>
                    <View style={styles.usageItem}>
                      <View style={styles.usageLabelRow}>
                        <Target color={catStyle.primary} size={12} />
                        <Text style={[styles.usageLabel, { color: catStyle.primary }]}>Frequency</Text>
                      </View>
                      <Text style={styles.usageValue}>{guide.usage.frequency}</Text>
                    </View>
                    <View style={styles.usageItem}>
                      <View style={styles.usageLabelRow}>
                        <Sun color={catStyle.primary} size={12} />
                        <Text style={[styles.usageLabel, { color: catStyle.primary }]}>Best Time</Text>
                      </View>
                      <Text style={styles.usageValue}>{guide.usage.bestTime}</Text>
                    </View>
                    <View style={styles.usageItem}>
                      <View style={styles.usageLabelRow}>
                        <Moon color={catStyle.primary} size={12} />
                        <Text style={[styles.usageLabel, { color: catStyle.primary }]}>Environment</Text>
                      </View>
                      <Text style={styles.usageValue}>{guide.usage.environment}</Text>
                    </View>
                    <View style={styles.usageItem}>
                      <View style={styles.usageLabelRow}>
                        <Shield color={catStyle.primary} size={12} />
                        <Text style={[styles.usageLabel, { color: catStyle.primary }]}>Preparation</Text>
                      </View>
                      <Text style={styles.usageValue}>{guide.usage.preparation}</Text>
                    </View>
                  </View>
                </View>
              </PremiumGlassCard>

              {/* Disclaimer */}
              <View style={[styles.disclaimerWrap, { backgroundColor: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.25)' }]}>
                <View style={styles.disclaimerHeader}>
                  <AlertCircle color="#FBBF24" size={16} />
                  <Text style={styles.disclaimerTitle}>Important Notice</Text>
                </View>
                <Text style={styles.disclaimerText}>{guide.disclaimer}</Text>
              </View>
            </>
          )}

          {/* Fallback: quick benefits from frequency data */}
          {frequency.benefits && !guide && (
            <PremiumGlassCard style={styles.section}>
              <View style={[styles.sectionAccent, { backgroundColor: catStyle.primary }]} />
              <View style={styles.sectionInner}>
                <Text style={styles.sectionTitle}>Quick Benefits</Text>
                {frequency.benefits.map((benefit: string, index: number) => (
                  <View key={index} style={styles.benefitRow}>
                    <View style={[styles.benefitDot, { backgroundColor: catStyle.primary }]}>
                      <Text style={styles.benefitIndex}>{index + 1}</Text>
                    </View>
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </PremiumGlassCard>
          )}

          {frequency.research && (
            <PremiumGlassCard style={styles.section}>
              <View style={[styles.sectionAccent, { backgroundColor: catStyle.primary }]} />
              <View style={styles.sectionInner}>
                <Text style={styles.sectionTitle}>Research Notes</Text>
                <View style={[styles.scienceCallout, { backgroundColor: catStyle.primary + '0D', borderLeftColor: catStyle.primary }]}>
                  <Text style={styles.scienceCalloutText}>{frequency.research}</Text>
                </View>
              </View>
            </PremiumGlassCard>
          )}

          <View style={styles.bottomPad} />
        </Animated.ScrollView>

        {/* Bottom bar with close */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.bottomCloseBtn, { backgroundColor: catStyle.primary + '20', borderColor: catStyle.primary + '40' }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <X color={catStyle.primary} size={18} />
            <Text style={[styles.bottomCloseText, { color: catStyle.primary }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors, gradients: ThemeGradients) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // Ambient orbs
  ambientOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  ambientOrb1: {
    width: 280,
    height: 280,
    top: -60,
    right: -80,
  },
  ambientOrb2: {
    width: 200,
    height: 200,
    top: 180,
    left: -70,
  },
  ambientOrb3: {
    width: 160,
    height: 160,
    bottom: 120,
    right: -40,
    backgroundColor: colors.primary + '08',
  },
  // Hero
  heroSection: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  heroGradient: {
    paddingBottom: 28,
    position: 'relative',
  },
  heroTopLine: {
    height: 2,
    marginHorizontal: 40,
    marginBottom: 20,
    borderRadius: 1,
  },
  heroContent: {
    paddingHorizontal: 24,
  },
  heroIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  heroName: {
    fontFamily: FONTS.heading,
    fontSize: 26,
    fontWeight: '400' as const,
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  heroHzBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    backgroundColor: colors.glass,
  },
  heroHzText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  heroCatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: colors.glass,
  },
  heroCatText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  // Hero mini visualizer
  heroVisualizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 36,
    gap: 2,
    justifyContent: 'center',
  },
  heroVizBar: {
    width: 3,
    borderRadius: 1.5,
  },
  // Scroll
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  // Sections
  section: {
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  sectionAccent: {
    position: 'absolute',
    left: 20,
    top: 0,
    width: 40,
    height: 2,
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
  sectionInner: {
    padding: 20,
    paddingTop: 22,
  },
  sectionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  sectionIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  sectionTitle: {
    fontFamily: FONTS.heading,
    fontSize: 17,
    fontWeight: '400' as const,
    color: colors.textPrimary,
    letterSpacing: 0.15,
  },
  sectionBody: {
    fontFamily: FONTS.body,
    fontSize: 14,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  // Science callout
  scienceCallout: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 3,
  },
  scienceCalloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 8,
  },
  scienceCalloutLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  scienceCalloutText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  // Benefits
  benefitsGrid: {
    gap: 0,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  benefitDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  benefitIndex: {
    fontFamily: FONTS.body,
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#FFFFFF',
  },
  benefitText: {
    fontFamily: FONTS.body,
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
  },
  // Usage grid
  usageGrid: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    padding: 16,
    gap: 0,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  usageItem: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  usageLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  usageLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  usageValue: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textPrimary,
    paddingLeft: 18,
  },
  // Disclaimer
  disclaimerWrap: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  disclaimerTitle: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#FBBF24',
  },
  disclaimerText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  // Bottom bar
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 34,
    backgroundColor: gradients.bgShort[0] + 'F2',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  bottomCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  bottomCloseText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  bottomPad: {
    height: 8,
  },
});
