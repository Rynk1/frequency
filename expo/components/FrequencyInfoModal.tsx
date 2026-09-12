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
    background: "Part of the modern Solfeggio/sound-healing tradition. In contemporary sound-healing practices, 174 Hz is often presented as a low-frequency foundation tone for quiet reflection and physical ease.",
    purpose: "A low-frequency pure tone presented for grounding, quiet reflection and relaxation. In contemporary sound-healing traditions, 174 Hz is associated with physical ease and a sense of foundation.",
    scientificBasis: "Low-frequency sound and vibroacoustic approaches have been studied in research settings, but evidence does not establish 174 Hz as an anaesthetic, painkiller or tissue treatment.",
    benefits: [
      "Grounding and stability",
      "Physical comfort and ease",
      "Contemplative atmosphere",
      "Mindful relaxation",
      "Eased mental tension",
      "Calm listening experience"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Daily or as needed for relaxation",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Quiet, comfortable space",
      preparation: "Deep breathing for 1-2 minutes"
    },
    disclaimer: "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."
  },
  '285 Hz': {
    background: "Associated in contemporary sound-healing traditions with renewal, restoration and transition. Modern wellness practices use 285 Hz as a symbolic tone for renewal.",
    purpose: "A pure tone associated in contemporary sound-healing traditions with renewal, restoration and transition. Offers reflective listening for 'renewal' or 'reset' themes.",
    scientificBasis: "No reliable evidence establishes that 285 Hz regenerates cells, restructures tissue, changes biophotons or repairs mitochondria.",
    benefits: [
      "Restorative atmosphere",
      "Harmonic balance",
      "Contemplative renewal",
      "Sense of tranquility",
      "Relaxed reflection",
      "Mindful reset"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Daily or as needed",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Clean, comfortable space",
      preparation: "Sip water and set a quiet reflection intention"
    },
    disclaimer: "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."
  },
  '396 Hz': {
    background: "Associated with the Root Chakra in contemporary sound healing. Traditionally associated in wellness practice with release, grounding and letting go of worry.",
    purpose: "A pure tone traditionally associated with release, grounding and letting go of worry. Useful for reflection, breathing or meditation.",
    scientificBasis: "No adequate evidence demonstrates that 396 Hz specifically targets the amygdala, rewires neural pathways or reliably shifts brainwaves into theta.",
    benefits: [
      "Stress release and ease",
      "Mindful liberation from worry",
      "Emotional comfort",
      "Root chakra meditation harmony",
      "Grounded reflection",
      "Calm presence"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Daily or as part of a reflection routine",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Quiet, safe space for reflection",
      preparation: "Breathe deeply and focus on letting go of daily stress"
    },
    disclaimer: "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."
  },
  '417 Hz': {
    background: "Known in modern sound healing as a tone associated with change, transition and fresh perspective. Used in wellness traditions to symbolize fresh beginnings.",
    purpose: "A pure tone associated with change, transition and fresh perspective. Ideal for journaling, reflection or meditation during periods of change.",
    scientificBasis: "No reliable evidence demonstrates that 417 Hz structures molecular water or creates a special biological-fluid state.",
    benefits: [
      "Facilitating perspective",
      "Clearing mental clutter",
      "Transformative reflection",
      "Sacral chakra balance",
      "Encouraging adaptability",
      "Fresh mental clarity"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Daily or during periods of transition",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Well-ventilated, quiet space",
      preparation: "Reflect on fresh goals or journal thoughts"
    },
    disclaimer: "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."
  },
  '528 Hz': {
    background: "Called the 'Love Frequency' or 'Miracle Tone' in contemporary sound-healing traditions. Widely used for heart-centered meditation, personal wellbeing and calm focus.",
    purpose: "A 528-Hz pure tone associated with love, harmony and transformation in contemporary wellness traditions. Ideal for calm, heart-focused meditation.",
    scientificBasis: "A small 2018 study of nine healthy participants reported changes in cortisol, oxytocin, autonomic measures and mood after 528-Hz-tuned music. The intervention was music rather than an isolated pure tone and the sample was very small. No adequate evidence establishes DNA repair or cellular regeneration.",
    benefits: [
      "Heart-centered peace",
      "Love frequency harmony",
      "Calming reflection",
      "Heart chakra balance",
      "Mindful warmth",
      "Positive emotional reflection"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Daily or as desired for heart meditation",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Quiet space near natural light or quiet comfort",
      preparation: "Sip water, place a hand over the heart, and breathe deeply"
    },
    disclaimer: "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."
  },
  '639 Hz': {
    background: "Associated in contemporary Solfeggio traditions with connection, compassion and communication. Used in modern sound therapy for interpersonal harmony.",
    purpose: "A pure tone associated in contemporary Solfeggio traditions with connection, compassion and communication. Designed for reflection, journaling, meditation or quiet shared time.",
    scientificBasis: "No adequate evidence establishes that 639 Hz specifically increases HRV coherence or activates mirror neurons.",
    benefits: [
      "Harmonious connection",
      "Enhanced empathy",
      "Social openness",
      "Emotional balance",
      "Mindful communication",
      "Heart-centered warmth"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Before important conversations or shared quiet time",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Comfortable shared or private space",
      preparation: "Set an intention for active listening and empathy"
    },
    disclaimer: "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."
  },
  '741 Hz': {
    background: "Traditionally associated in modern sound healing with clarity, intuition and creative reflection. Used as a focal tone for clearing mental distractions.",
    purpose: "A pure tone traditionally associated with clarity, intuition and creative reflection. Ideal for journaling, meditation or creative reflection.",
    scientificBasis: "No reliable evidence demonstrates that 741 Hz produces gamma/theta synchrony or reliably increases intuitive cognition.",
    benefits: [
      "Awakening intuition",
      "Mental clarity",
      "Creative expression",
      "Throat chakra balance",
      "Clearing mental clutter",
      "Focused discernment"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Nightly before sleep or prior to creative work",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Quiet room away from active electronic screens",
      preparation: "Practice mindful breathwork and clear focus"
    },
    disclaimer: "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."
  },
  '852 Hz': {
    background: "Associated in contemporary wellness traditions with inner stillness and spiritual contemplation. Used as a soundscape backdrop for inward attention.",
    purpose: "A pure tone associated with inner stillness and spiritual contemplation. Ideal for quiet meditation and inward attention.",
    scientificBasis: "No adequate evidence demonstrates that 852 Hz produces global brain coherence.",
    benefits: [
      "Inner stillness",
      "Quiet balance",
      "Third eye focus",
      "Meditative awareness",
      "Calm contemplation",
      "Spiritual reflection"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "3-4 times weekly or as part of meditation practice",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Quiet, dimly lit or darkened space",
      preparation: "Sit in silent reflection and set an intention for inner calm"
    },
    disclaimer: "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."
  },
  '963 Hz': {
    background: "Associated with crown awareness, contemplation and spiritual connection in contemporary sound-healing traditions. Sometimes called a crown frequency in wellness literature.",
    purpose: "A pure tone associated with crown awareness, contemplation and spiritual connection in contemporary traditions. Ideal for meditation and quiet reflection.",
    scientificBasis: "No adequate evidence establishes that 963 Hz produces unified hemispheric brainwave states.",
    benefits: [
      "Crown chakra connection",
      "Expanded awareness",
      "Deep meditation",
      "Universal harmony",
      "Meditative stillness",
      "Contemplative presence"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Weekly or during quiet meditation retreats",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Peaceful space with soft lighting or quiet darkness",
      preparation: "Ground yourself with quiet breathing before crown meditation"
    },
    disclaimer: "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."
  },
  'Schumann Resonance': {
    background: "Earth has naturally occurring electromagnetic Schumann resonances, with a fundamental frequency near 7.83 Hz created by global lightning activity in the ionosphere cavity. This app provides a Schumann-inspired listening experience; it does not reproduce Earth's electromagnetic field.",
    purpose: "A 7.83-Hz listening experience inspired by Earth's atmospheric electromagnetic resonance. Designed for natural grounding, calm presence and circadian relaxation.",
    scientificBasis: "Schumann resonances are well-documented geophysical atmospheric phenomena. However, phone audio reproduces acoustic sound waves, not Earth's planetary electromagnetic fields.",
    benefits: [
      "Natural grounding atmosphere",
      "Relaxed presence",
      "Circadian wind-down support",
      "Calm focus",
      "Mindful meditation backdrop",
      "Stress relief"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Daily or after long periods indoors",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Quiet space, comfortably resting",
      preparation: "Relax your posture and take gentle deep breaths"
    },
    disclaimer: "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."
  },
  'Delta Waves': {
    background: "Delta brainwaves (0.5-4 Hz) dominate during deep, restorative NREM sleep stages. Binaural delta beats present subtle frequency differences to encourage evening relaxation.",
    purpose: "A low-beat delta listening experience designed for quiet wind-down, evening rest and pre-sleep relaxation. Does not guarantee sleep induction.",
    scientificBasis: "Delta waves naturally occur during deep sleep. Binaural beat research is investigating effects on relaxation and sleep, though evidence remains mixed and non-deterministic.",
    benefits: [
      "Restful wind-down environment",
      "Evening tension relief",
      "Relaxed pre-sleep atmosphere",
      "Calm listening experience",
      "Eased mental chatter",
      "Mindful stillness"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Nightly during pre-sleep wind-down",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Dark, cool, comfortable bedroom setup",
      preparation: "Dim lights and refrain from active screens before bed"
    },
    disclaimer: "If you listen while resting or sleeping, keep the volume low and use a comfortable setup. Avoid prolonged high-volume headphone use. Do not use headphones while driving or during activities requiring environmental awareness."
  },
  'Theta Waves': {
    background: "Theta brainwaves (4-8 Hz) are prominent during light sleep, dreaming and deep meditative reflection. Binaural theta beats offer a backdrop for creative reflection.",
    purpose: "A theta-range listening experience for relaxation, creative reflection and pre-sleep meditation.",
    scientificBasis: "Theta activity correlates with meditative states and dreaming. Binaural entrainment research is ongoing, with variable results across study designs.",
    benefits: [
      "Relaxed creative reflection",
      "Deep meditation backdrop",
      "Subconscious focus",
      "Calm mindfulness",
      "Intuitive exploration",
      "Eased tension"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Daily for reflection or creative sessions",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Quiet space with dim lighting",
      preparation: "Sit comfortably and set a clear creative intention"
    },
    disclaimer: "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."
  },
  'Alpha Waves': {
    background: "Alpha brainwaves (8-12 Hz) occur naturally during relaxed alertness and light meditation. Alpha binaural beats offer a tranquil backdrop for study and calm focus.",
    purpose: "An alpha-range listening experience for relaxed focus, stress reduction and light meditation.",
    scientificBasis: "Alpha waves characterize relaxed, awake states. Studies on binaural beats report potential reductions in anxiety for some listeners, though results are heterogeneous.",
    benefits: [
      "Calm awareness",
      "Relaxed focus",
      "Mental tranquility",
      "Light meditation support",
      "Eased daily stress",
      "Mindful presence"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "2-3 times daily or before focused tasks",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Comfortable workspace or quiet reflection corner",
      preparation: "Take three slow, deep breaths"
    },
    disclaimer: "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."
  },
  'Beta Waves': {
    background: "Beta brainwaves (12-30 Hz) dominate active, alert waking consciousness and analytical tasks. Beta binaural beats provide an active listening backdrop.",
    purpose: "A beta-range listening experience for alert, structured attention and active mental engagement.",
    scientificBasis: "Beta activity accompanies active cognitive processing. Research on beta binaural entrainment suggests potential effects on focus, but individual responses vary.",
    benefits: [
      "Alert attention",
      "Active engagement",
      "Structured focus",
      "Cognitive drive",
      "Task preparation",
      "Problem-solving backdrop"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Before mentally demanding tasks",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Well-lit workspace",
      preparation: "Outline your task goals before starting"
    },
    disclaimer: "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."
  },
  'Gamma Waves': {
    background: "Gamma brainwaves (30-100 Hz) represent fast neural oscillations investigated in cognitive research and advanced meditation studies.",
    purpose: "A research-inspired 40-Hz gamma listening experience connected to cognitive clarity and neuroscience research.",
    scientificBasis: "40-Hz sensory stimulation is an active area of clinical research (including Alzheimer's studies). However, consumer audio tracks are not equivalent to clinical treatment protocols.",
    benefits: [
      "Cognitive clarity backdrop",
      "Heightened awareness",
      "Focused mindfulness",
      "Advanced meditation support",
      "Attentive listening",
      "Mental engagement"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "3-4 times weekly as a focus backdrop",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Quiet space free from interruptions",
      preparation: "Clear your workspace and state your focus goal"
    },
    disclaimer: "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery."
  },
  'Root Chakra Pure': {
    background: "Chakras are concepts found in Indian spiritual traditions. The Root Chakra (Muladhara) is associated in contemporary sound healing with 194.18 Hz and Earth symbolism.",
    purpose: "A contemporary meditation framework tone for grounding, physical presence and reflective stability.",
    scientificBasis: "Contemporary sound-healing chakra mappings are spiritual and contemplative frameworks, not scientifically validated anatomy or medical treatments.",
    benefits: [
      "Grounded presence",
      "Reflective stability",
      "Earth symbolism connection",
      "Calm foundation",
      "Mindful centering",
      "Eased tension"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Daily or during meditation practice",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Quiet, comfortable space",
      preparation: "Visualize red light at base of spine during meditation"
    },
    disclaimer: "This description reflects a traditional or contemporary wellness framework. The associated spiritual or energetic interpretation is not a scientifically established physiological mechanism."
  },
  'Sacral Chakra Pure': {
    background: "Chakras are concepts found in Indian spiritual traditions. The Sacral Chakra (Svadhisthana) is associated in contemporary sound healing with 210.42 Hz and Water symbolism.",
    purpose: "A contemporary meditation framework tone for creativity, emotional reflection and flow.",
    scientificBasis: "Contemporary sound-healing chakra mappings are spiritual and contemplative frameworks, not scientifically validated anatomy or medical treatments.",
    benefits: [
      "Creative reflection",
      "Emotional flow",
      "Water symbolism connection",
      "Sensory awareness",
      "Mindful passion",
      "Inner harmony"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "3-4 times weekly for creative sessions",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Quiet, comfortable space",
      preparation: "Visualize orange light below navel during reflection"
    },
    disclaimer: "This description reflects a traditional or contemporary wellness framework. The associated spiritual or energetic interpretation is not a scientifically established physiological mechanism."
  },
  'Solar Plexus Pure': {
    background: "Chakras are concepts found in Indian spiritual traditions. The Solar Plexus Chakra (Manipura) is associated in contemporary sound healing with 126.22 Hz and Fire symbolism.",
    purpose: "A contemporary meditation framework tone for confidence, agency and focused reflection.",
    scientificBasis: "Contemporary sound-healing chakra mappings are spiritual and contemplative frameworks, not scientifically validated anatomy or medical treatments.",
    benefits: [
      "Confidence building",
      "Agency and willpower",
      "Fire symbolism connection",
      "Personal empowerment",
      "Focused reflection",
      "Self-esteem support"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Daily or before active tasks",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Well-lit, comfortable space",
      preparation: "Stand tall and visualize golden yellow light at solar plexus"
    },
    disclaimer: "This description reflects a traditional or contemporary wellness framework. The associated spiritual or energetic interpretation is not a scientifically established physiological mechanism."
  },
  'Heart Chakra Pure': {
    background: "Chakras are concepts found in Indian spiritual traditions. The Heart Chakra (Anahata) is associated in contemporary sound healing with 341.3 Hz and Air symbolism.",
    purpose: "A contemporary meditation framework tone for compassion, warmth and heart-centered meditation.",
    scientificBasis: "Contemporary sound-healing chakra mappings are spiritual and contemplative frameworks, not scientifically validated anatomy or medical treatments.",
    benefits: [
      "Compassion expansion",
      "Emotional warmth",
      "Heart-centered peace",
      "Air symbolism connection",
      "Inner harmony",
      "Mindful empathy"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Daily or during quiet meditation",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Quiet, relaxing space",
      preparation: "Place a hand over your heart and practice loving-kindness breathing"
    },
    disclaimer: "This description reflects a traditional or contemporary wellness framework. The associated spiritual or energetic interpretation is not a scientifically established physiological mechanism."
  },
  'Throat Chakra Pure': {
    background: "Chakras are concepts found in Indian spiritual traditions. The Throat Chakra (Vishuddha) is associated in contemporary sound healing with 384 Hz and Space symbolism.",
    purpose: "A contemporary meditation framework tone for communication and vocal expression.",
    scientificBasis: "Contemporary sound-healing chakra mappings are spiritual and contemplative frameworks, not scientifically validated anatomy or medical treatments.",
    benefits: [
      "Clear expression",
      "Authentic voice",
      "Communication ease",
      "Space symbolism connection",
      "Creative resonance",
      "Mindful expression"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Daily or before speaking engagements",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Quiet space for vocal humming or reflection",
      preparation: "Gentle neck stretches and soft vocal humming"
    },
    disclaimer: "This description reflects a traditional or contemporary wellness framework. The associated spiritual or energetic interpretation is not a scientifically established physiological mechanism."
  },
  'Third Eye Pure': {
    background: "Chakras are concepts found in Indian spiritual traditions. The Third Eye Chakra (Ajna) is associated in contemporary sound healing with 426.7 Hz and Light symbolism.",
    purpose: "A contemporary meditation framework tone for intuition, imagination and reflective attention.",
    scientificBasis: "Contemporary sound-healing chakra mappings are spiritual and contemplative frameworks, not scientifically validated anatomy or medical treatments.",
    benefits: [
      "Intuitive reflection",
      "Inner vision",
      "Meditative insight",
      "Light symbolism connection",
      "Mental focus",
      "Reflective stillness"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "3-4 times weekly during meditation",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Darkened, quiet space",
      preparation: "Focus attention softly between the eyebrows during meditation"
    },
    disclaimer: "This description reflects a traditional or contemporary wellness framework. The associated spiritual or energetic interpretation is not a scientifically established physiological mechanism."
  },
  'Crown Chakra Pure': {
    background: "Chakras are concepts found in Indian spiritual traditions. The Crown Chakra (Sahasrara) is associated in contemporary sound healing with 963 Hz and Thought symbolism.",
    purpose: "A contemporary meditation framework tone for contemplation, stillness and spiritual reflection.",
    scientificBasis: "Contemporary sound-healing chakra mappings are spiritual and contemplative frameworks, not scientifically validated anatomy or medical treatments.",
    benefits: [
      "Spiritual awareness",
      "Meditative unity",
      "Transcendent stillness",
      "Thought symbolism connection",
      "Universal harmony",
      "Quiet presence"
    ],
    usage: {
      duration: "Start with 5-20 minutes at a comfortable volume.",
      frequency: "Weekly or during deep meditation sessions",
      bestTime: "Choose a time and environment that fits your routine.",
      environment: "Quiet, peaceful space",
      preparation: "Ground lower chakras with calm breathing before meditation"
    },
    disclaimer: "This description reflects a traditional or contemporary wellness framework. The associated spiritual or energetic interpretation is not a scientifically established physiological mechanism."
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
