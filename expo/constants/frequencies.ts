// Solfeggio Frequencies - Ancient musical scale with spiritual significance
// Note: Limited scientific validation, effects are largely anecdotal
export const SOLFEGGIO_FREQUENCIES = [
  {
    name: "Foundation Pure",
    hz: 174,
    description: "Traditional foundation frequency for grounding and pain relief",
    color: "#8B5CF6",
    gradient: ["#8B5CF6", "#6366F1"] as const,
    benefits: ["Deep grounding and stability", "Natural pain relief", "Foundation healing", "Physical security"],
  },
  {
    name: "Transformation Pure",
    hz: 285,
    description: "Traditional transformation frequency for tissue healing",
    color: "#10B981",
    gradient: ["#10B981", "#059669"] as const,
    benefits: ["Tissue regeneration", "Cellular healing", "Energy restoration", "Physical renewal"],
  },
  {
    name: "Liberation Pure",
    hz: 396,
    description: "Traditional liberation frequency for releasing fear and guilt",
    color: "#F59E0B",
    gradient: ["#F59E0B", "#D97706"] as const,
    benefits: ["Fear release", "Guilt liberation", "Emotional freedom", "Root chakra healing"],
  },
  {
    name: "Change Pure",
    hz: 417,
    description: "Traditional change frequency for facilitating transformation",
    color: "#EF4444",
    gradient: ["#EF4444", "#DC2626"] as const,
    benefits: ["Facilitating change", "Clearing negativity", "Transformation energy", "Sacral chakra balance"],
  },
  {
    name: "Love & Miracles Pure",
    hz: 528,
    description: "Traditional love frequency for DNA repair and miracles",
    color: "#EC4899",
    gradient: ["#EC4899", "#DB2777"] as const,
    benefits: ["DNA repair activation", "Love frequency healing", "Miraculous transformation", "Heart chakra opening"],
  },
  {
    name: "Relationships Pure",
    hz: 639,
    description: "Traditional relationship frequency for harmony and communication",
    color: "#06B6D4",
    gradient: ["#06B6D4", "#0891B2"] as const,
    benefits: ["Harmonious relationships", "Enhanced communication", "Social connection", "Heart healing"],
  },
  {
    name: "Intuition Pure",
    hz: 741,
    description: "Traditional intuition frequency for awakening inner wisdom",
    color: "#8B5CF6",
    gradient: ["#8B5CF6", "#7C3AED"] as const,
    benefits: ["Awakening intuition", "Problem solving clarity", "Mental purification", "Throat chakra activation"],
  },
  {
    name: "Spiritual Order Pure",
    hz: 852,
    description: "Traditional spiritual frequency for returning to divine order",
    color: "#A855F7",
    gradient: ["#A855F7", "#9333EA"] as const,
    benefits: ["Spiritual order restoration", "Divine balance", "Third eye activation", "Higher consciousness"],
  },
  {
    name: "Divine Connection Pure",
    hz: 963,
    description: "Traditional divine frequency for pineal gland activation",
    color: "#C084FC",
    gradient: ["#C084FC", "#A855F7"] as const,
    benefits: ["Pineal gland activation", "Divine connection", "Crown chakra opening", "Highest consciousness"],
  },
];

// Chakra Frequencies - Based on planetary frequencies and traditional associations
// Note: These are theoretical frequencies, not scientifically validated
export const CHAKRA_FREQUENCIES = [
  {
    name: "Root Chakra Pure",
    hz: 194.18,
    description: "Traditional root chakra frequency for grounding and stability",
    color: "#DC2626",
    gradient: ["#DC2626", "#991B1B"] as const,
    element: "Earth",
    benefits: ["Deep grounding and stability", "Physical security", "Survival instincts", "Earth connection"],
  },
  {
    name: "Sacral Chakra Pure",
    hz: 210.42,
    description: "Traditional sacral chakra frequency for creativity and sexuality",
    color: "#EA580C",
    gradient: ["#EA580C", "#C2410C"] as const,
    element: "Water",
    benefits: ["Creative energy flow", "Sexual energy balance", "Emotional fluidity", "Passion activation"],
  },
  {
    name: "Solar Plexus Pure",
    hz: 126.22,
    description: "Traditional solar plexus frequency for personal power",
    color: "#F59E0B",
    gradient: ["#F59E0B", "#D97706"] as const,
    element: "Fire",
    benefits: ["Personal power boost", "Confidence building", "Inner fire activation", "Self-esteem enhancement"],
  },
  {
    name: "Heart Chakra Pure",
    hz: 341.3,
    description: "Traditional heart chakra frequency for love and compassion",
    color: "#10B981",
    gradient: ["#10B981", "#059669"] as const,
    element: "Air",
    benefits: ["Unconditional love", "Compassion expansion", "Heart healing", "Emotional balance"],
  },
  {
    name: "Throat Chakra Pure",
    hz: 384,
    description: "Traditional throat chakra frequency for communication and truth",
    color: "#06B6D4",
    gradient: ["#06B6D4", "#0891B2"] as const,
    element: "Space",
    benefits: ["Clear communication", "Truth expression", "Authentic voice", "Creative expression"],
  },
  {
    name: "Third Eye Pure",
    hz: 426.7,
    description: "Traditional third eye frequency for intuition and wisdom",
    color: "#6366F1",
    gradient: ["#6366F1", "#4F46E5"] as const,
    element: "Light",
    benefits: ["Enhanced intuition", "Inner wisdom", "Psychic abilities", "Spiritual insight"],
  },
  {
    name: "Crown Chakra Pure",
    hz: 963,
    description: "Traditional crown chakra frequency for spiritual connection",
    color: "#8B5CF6",
    gradient: ["#8B5CF6", "#7C3AED"] as const,
    element: "Thought",
    benefits: ["Spiritual connection", "Divine consciousness", "Enlightenment", "Universal awareness"],
  },
];

// Brainwave Entrainment Frequencies - Scientifically documented brainwave ranges
// Note: These represent target brainwave states, effectiveness varies by individual
export const BINAURAL_BEATS = [
  {
    name: "Deep Delta Sleep",
    hz: 1.5,
    description: "Ultra-deep delta frequency for restorative sleep and healing",
    color: "#0F172A",
    gradient: ["#0F172A", "#020617"] as const,
    range: "0.5-2 Hz",
    baseFreq: 200,
    beatFreq: 1.5,
    benefits: ["Ultra-deep sleep", "Physical regeneration", "Growth hormone boost", "Immune system support"],
  },
  {
    name: "Delta Waves Pure",
    hz: 2.5,
    description: "Traditional delta frequency for deep sleep and healing",
    color: "#1E293B",
    gradient: ["#1E293B", "#0F172A"] as const,
    range: "2-4 Hz",
    baseFreq: 200,
    beatFreq: 2.5,
    benefits: ["Deep restorative sleep", "Physical healing", "Cellular regeneration", "Pain relief"],
  },
  {
    name: "Theta Deep Meditation",
    hz: 4.5,
    description: "Deep theta frequency for profound meditation and REM sleep",
    color: "#1F2937",
    gradient: ["#1F2937", "#111827"] as const,
    range: "4-5 Hz",
    baseFreq: 200,
    beatFreq: 4.5,
    benefits: ["Deep meditation", "REM sleep enhancement", "Dream recall", "Subconscious programming"],
  },
  {
    name: "Theta Waves Pure",
    hz: 6,
    description: "Traditional theta frequency for creativity and intuition",
    color: "#374151",
    gradient: ["#374151", "#1F2937"] as const,
    range: "5-8 Hz",
    baseFreq: 200,
    beatFreq: 6,
    benefits: ["Enhanced creativity", "Intuitive insights", "Memory consolidation", "Emotional healing"],
  },
  {
    name: "Alpha Relaxation",
    hz: 8.5,
    description: "Lower alpha frequency for deep relaxation and stress relief",
    color: "#047857",
    gradient: ["#047857", "#065F46"] as const,
    range: "8-9 Hz",
    baseFreq: 200,
    beatFreq: 8.5,
    benefits: ["Deep relaxation", "Stress relief", "Anxiety reduction", "Mental calmness"],
  },
  {
    name: "Alpha Waves Pure",
    hz: 10,
    description: "Traditional alpha frequency for relaxed awareness",
    color: "#059669",
    gradient: ["#059669", "#047857"] as const,
    range: "9-11 Hz",
    baseFreq: 200,
    beatFreq: 10,
    benefits: ["Relaxed awareness", "Mental clarity", "Light meditation", "Learning enhancement"],
  },
  {
    name: "Alpha Focus",
    hz: 12,
    description: "Upper alpha frequency for focused relaxation and learning",
    color: "#10B981",
    gradient: ["#10B981", "#059669"] as const,
    range: "11-13 Hz",
    baseFreq: 200,
    beatFreq: 12,
    benefits: ["Focused relaxation", "Accelerated learning", "Memory retention", "Creative flow"],
  },
  {
    name: "SMR (Sensorimotor Rhythm)",
    hz: 14,
    description: "Sensorimotor rhythm for calm focus and attention",
    color: "#F59E0B",
    gradient: ["#F59E0B", "#D97706"] as const,
    range: "12-15 Hz",
    baseFreq: 200,
    beatFreq: 14,
    benefits: ["Calm focus", "Attention enhancement", "Motor control", "Relaxed alertness"],
  },
  {
    name: "Beta Focus",
    hz: 16,
    description: "Lower beta frequency for concentration and mental clarity",
    color: "#EF4444",
    gradient: ["#EF4444", "#DC2626"] as const,
    range: "15-18 Hz",
    baseFreq: 200,
    beatFreq: 16,
    benefits: ["Enhanced concentration", "Mental clarity", "Problem solving", "Cognitive performance"],
  },
  {
    name: "Beta Waves Pure",
    hz: 20,
    description: "Traditional beta frequency for alert consciousness and focus",
    color: "#DC2626",
    gradient: ["#DC2626", "#B91C1C"] as const,
    range: "18-25 Hz",
    baseFreq: 200,
    beatFreq: 20,
    benefits: ["Alert consciousness", "Analytical thinking", "Active concentration", "Mental energy"],
  },
  {
    name: "High Beta Energy",
    hz: 25,
    description: "High beta frequency for peak mental performance",
    color: "#B91C1C",
    gradient: ["#B91C1C", "#991B1B"] as const,
    range: "25-30 Hz",
    baseFreq: 200,
    beatFreq: 25,
    benefits: ["Peak performance", "High energy focus", "Complex problem solving", "Mental agility"],
  },
  {
    name: "Gamma Waves Pure",
    hz: 40,
    description: "Traditional gamma frequency for higher consciousness",
    color: "#7C3AED",
    gradient: ["#7C3AED", "#6D28D9"] as const,
    range: "30-50 Hz",
    baseFreq: 200,
    beatFreq: 40,
    benefits: ["Higher consciousness", "Cognitive enhancement", "Perception binding", "Heightened awareness"],
  },
  {
    name: "High Gamma Insight",
    hz: 60,
    description: "High gamma frequency for peak cognitive states",
    color: "#6D28D9",
    gradient: ["#6D28D9", "#5B21B6"] as const,
    range: "50-80 Hz",
    baseFreq: 200,
    beatFreq: 60,
    benefits: ["Peak cognitive states", "Insight and epiphanies", "Advanced problem solving", "Transcendent awareness"],
  },
];

// Healing Frequencies - Mix of traditional and research-based frequencies
export const HEALING_FREQUENCIES = [
  {
    name: "Schumann Resonance",
    hz: 7.83,
    description: "Earth's natural frequency - stress reduction",
    gradient: ["#10B981", "#059669"] as const,
    benefits: ["Stress Relief", "Natural Grounding", "Circadian Rhythm"],
    duration: "20-30 minutes",
    research: "Documented Earth frequency, some stress reduction studies",
  },
  {
    name: "Pain Relief (Solfeggio)",
    hz: 174,
    description: "Traditional pain relief frequency",
    gradient: ["#8B5CF6", "#6366F1"] as const,
    benefits: ["Pain Relief", "Muscle Relaxation", "Grounding"],
    duration: "15-25 minutes",
    research: "Anecdotal evidence, traditional use",
  },
  {
    name: "Love Frequency",
    hz: 528,
    description: "Most studied Solfeggio frequency",
    gradient: ["#EC4899", "#DB2777"] as const,
    benefits: ["Stress Reduction", "Positive Emotions", "Harmony"],
    duration: "20-30 minutes",
    research: "Some studies on stress and anxiety reduction",
  },
  {
    name: "40 Hz Gamma",
    hz: 40,
    description: "Cognitive enhancement and neural synchrony",
    gradient: ["#7C3AED", "#6D28D9"] as const,
    benefits: ["Cognitive Function", "Memory", "Neural Synchrony"],
    duration: "15-20 minutes",
    research: "Research on Alzheimer's and cognitive enhancement",
  },
  {
    name: "110 Hz Bone Resonance",
    hz: 110,
    description: "Bone and tissue resonance frequency",
    gradient: ["#F59E0B", "#D97706"] as const,
    benefits: ["Bone Health", "Tissue Resonance", "Physical Healing"],
    duration: "20-30 minutes",
    research: "Archaeological sites built to resonate at this frequency",
  },
];

// Sleep Frequencies - Research-based brainwave entrainment for sleep
export const SLEEP_FREQUENCIES = [
  {
    name: "Deep Sleep (Delta)",
    hz: 1.5,
    description: "Delta waves for restorative sleep",
    gradient: ["#1E293B", "#0F172A"] as const,
    duration: "60-90 minutes",
    stage: "Stage 3-4 NREM",
    research: "Well-documented for deep sleep induction",
  },
  {
    name: "REM Sleep (Theta)",
    hz: 4.5,
    description: "Theta waves for dream sleep",
    gradient: ["#374151", "#1F2937"] as const,
    duration: "45-60 minutes",
    stage: "REM Sleep",
    research: "Associated with REM sleep patterns",
  },
  {
    name: "Sleep Transition",
    hz: 8,
    description: "Alpha waves for sleep onset",
    gradient: ["#4B5563", "#374151"] as const,
    duration: "20-30 minutes",
    stage: "Stage 1 NREM",
    research: "Helps transition from wake to sleep",
  },
  {
    name: "Light Sleep (Theta)",
    hz: 6,
    description: "Theta waves for light sleep and dreams",
    gradient: ["#6366F1", "#4F46E5"] as const,
    duration: "30-45 minutes",
    stage: "Stage 2 NREM",
    research: "Associated with memory consolidation",
  },
];

// Wealth & Manifestation Frequencies - Traditional and modern approaches
export const WEALTH_FREQUENCIES = [
  {
    name: "Abundance Frequency",
    hz: 888,
    description: "Attract wealth and prosperity (numerological)",
    gradient: ["#F59E0B", "#D97706"] as const,
    affirmations: [
      "I am worthy of abundance",
      "Money flows to me easily",
      "I attract prosperity in all forms",
      "My wealth grows every day",
    ],
    note: "Based on numerological significance of 888",
  },
  {
    name: "Natural Harmony",
    hz: 432,
    description: "Natural tuning for success mindset",
    gradient: ["#10B981", "#059669"] as const,
    affirmations: [
      "I achieve my goals with ease",
      "Success is my natural state",
      "I create value wherever I go",
      "Opportunities come to me naturally",
    ],
    note: "Alternative to 440 Hz standard tuning",
  },
  {
    name: "Manifestation Power",
    hz: 528,
    description: "Love frequency for manifesting desires",
    gradient: ["#EC4899", "#DB2777"] as const,
    affirmations: [
      "I manifest my dreams into reality",
      "The universe supports my success",
      "I am aligned with abundance",
      "My thoughts create my wealth",
    ],
    note: "Solfeggio frequency for transformation",
  },
  {
    name: "Alpha Success State",
    hz: 10,
    description: "Relaxed focus for financial clarity",
    gradient: ["#8B5CF6", "#7C3AED"] as const,
    affirmations: [
      "I am financially free",
      "Money is a tool for good in my life",
      "I make wise financial decisions",
      "My income exceeds my expenses",
    ],
    note: "Alpha brainwave for relaxed focus",
  },
];

// Binaural Beat Generator Utility
export const generateBinauralBeat = (baseFreq: number, beatFreq: number) => {
  return {
    leftEar: baseFreq,
    rightEar: baseFreq + beatFreq,
    beatFrequency: beatFreq,
    description: `Left ear: ${baseFreq}Hz, Right ear: ${baseFreq + beatFreq}Hz, Beat: ${beatFreq}Hz`
  };
};

// Binaural Beat Presets for different purposes
export const BINAURAL_PRESETS = {
  sleep: {
    name: "Sleep Induction",
    frequencies: [1.5, 2.5, 4.5],
    baseFreq: 200,
    description: "Progressive delta and theta frequencies for natural sleep onset"
  },
  meditation: {
    name: "Deep Meditation",
    frequencies: [4.5, 6, 8.5],
    baseFreq: 200,
    description: "Theta and alpha frequencies for profound meditative states"
  },
  focus: {
    name: "Enhanced Focus",
    frequencies: [12, 14, 16, 20],
    baseFreq: 200,
    description: "Alpha and beta frequencies for sustained concentration"
  },
  creativity: {
    name: "Creative Flow",
    frequencies: [6, 10, 12],
    baseFreq: 200,
    description: "Theta and alpha frequencies for enhanced creativity"
  },
  energy: {
    name: "Mental Energy",
    frequencies: [20, 25, 40],
    baseFreq: 200,
    description: "Beta and gamma frequencies for peak mental performance"
  },
  relaxation: {
    name: "Deep Relaxation",
    frequencies: [8.5, 10, 12],
    baseFreq: 200,
    description: "Alpha frequencies for stress relief and relaxation"
  }
};

// Generate binaural beat sessions dynamically
export const generateBinauralSession = (preset: keyof typeof BINAURAL_PRESETS, duration: number) => {
  const presetData = BINAURAL_PRESETS[preset];
  const segmentDuration = duration / presetData.frequencies.length;
  
  return presetData.frequencies.map((freq, index) => ({
    ...generateBinauralBeat(presetData.baseFreq, freq),
    duration: segmentDuration,
    startTime: index * segmentDuration,
    name: `${presetData.name} - Segment ${index + 1}`,
    frequency: freq
  }));
};

// Additional Research-Based Frequencies
export const SCIENTIFIC_FREQUENCIES = [
  {
    name: "Schumann Resonance",
    hz: 7.83,
    description: "Traditional earth frequency for grounding and stability",
    category: "Natural",
    research: "Documented natural phenomenon, some studies on stress reduction",
    benefits: ["Deep grounding and stability", "Natural stress relief", "Circadian rhythm support", "Enhanced meditation"],
  },
  {
    name: "40 Hz Gamma Pure",
    hz: 40,
    description: "Traditional gamma frequency for cognitive enhancement",
    category: "Cognitive",
    research: "MIT studies on Alzheimer's, memory enhancement",
    benefits: ["Enhanced memory function", "Improved focus", "Neural synchronization", "Cognitive clarity"],
  },
  {
    name: "110 Hz Resonance Pure",
    hz: 110,
    description: "Traditional temple frequency for meditation and healing",
    category: "Archaeological",
    research: "Found in ancient sites worldwide, possible consciousness effects",
    benefits: ["Deep meditation states", "Bone resonance healing", "Altered consciousness", "Physical grounding"],
  },
  {
    name: "432 Hz Natural Tuning",
    hz: 432,
    description: "Traditional natural tuning for harmony and balance",
    category: "Musical",
    research: "Some studies suggest more harmonious than 440 Hz",
    benefits: ["Natural harmony", "Stress reduction", "Emotional balance", "Musical healing"],
  },
];