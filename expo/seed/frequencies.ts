import {
  SOLFEGGIO_FREQUENCIES,
  CHAKRA_FREQUENCIES,
  BINAURAL_BEATS,
  HEALING_FREQUENCIES,
  SLEEP_FREQUENCIES,
  WEALTH_FREQUENCIES,
  SCIENTIFIC_FREQUENCIES,
} from '../constants/frequencies';
import { CanonicalFrequency, FrequencyCategory, ContentStatus } from '../types/content';
import extractedGuides from './extracted-guides.json';

const createFrequencyId = (category: string, hz: number) => `${category}-${hz}`;

const getGuide = (name: string, hz: number) => {
  const guideMap = extractedGuides as Record<string, any>;
  return (
    guideMap[name] ||
    guideMap[`${hz} Hz`] ||
    guideMap[`${Math.floor(hz)} Hz`] ||
    (name.includes('Delta') ? guideMap['Delta Waves'] : null) ||
    (name.includes('Theta') ? guideMap['Theta Waves'] : null) ||
    (name.includes('Alpha') ? guideMap['Alpha Waves'] : null) ||
    (name.includes('Beta') ? guideMap['Beta Waves'] : null) ||
    (name.includes('Gamma') ? guideMap['Gamma Waves'] : null) ||
    null
  );
};

// Trust Triangle frequencies stay free: 432 Hz, 528 Hz, 639 Hz, 7.83 Hz, 8 Hz
const TRUST_TRIANGLE_FREE_HZ = [432, 528, 639, 7.83, 8];

const REVISED_UNIVERSAL_DISCLAIMER =
  "Harmony Frequency is designed for relaxation, meditation, focus and personal reflection. Frequency-based listening is not a medical treatment and is not intended to diagnose, treat, cure or prevent any disease or health condition. Research findings described in the app may be preliminary, mixed or specific to particular study conditions. Use a comfortable listening volume and stop if you experience discomfort, dizziness, headache or ringing in the ears. Do not listen while driving, cycling or operating machinery.";

// Explicit Evidence-Calibrated Overrides to prevent uncalibrated marketing claims in seed data
const CALIBRATED_SEED_OVERRIDES: Record<number, { description?: string; background?: string; purpose?: string; scientificBasis?: string }> = {
  174: {
    description: "A low-frequency pure tone presented for grounding, quiet reflection and relaxation",
    background: "Part of the modern Solfeggio sound-healing tradition. Presented as a low-frequency foundation tone for quiet reflection and physical ease.",
    purpose: "A low-frequency pure tone presented for grounding, quiet reflection and relaxation.",
    scientificBasis: "Low-frequency sound and vibroacoustic approaches have been studied in research settings, but evidence does not establish 174 Hz as an anaesthetic, painkiller or tissue treatment.",
  },
  285: {
    description: "A pure tone associated in contemporary sound-healing traditions with renewal, restoration and transition",
    background: "Associated in contemporary sound-healing traditions with renewal, restoration and transition.",
    purpose: "A pure tone associated in contemporary sound-healing traditions with renewal, restoration and transition.",
    scientificBasis: "No reliable evidence establishes that 285 Hz regenerates cells, restructures tissue, changes biophotons or repairs mitochondria.",
  },
  528: {
    description: "A 528-Hz pure tone associated with love, harmony and transformation in contemporary wellness traditions",
    background: "Associated with love, harmony and transformation in contemporary wellness traditions. Widely used for heart-centered meditation and calm focus.",
    purpose: "A 528-Hz pure tone associated with love, harmony and transformation in contemporary wellness traditions.",
    scientificBasis: "A small 2018 study of nine healthy participants reported changes in cortisol, oxytocin, autonomic measures and mood after 528-Hz-tuned music. The intervention was music rather than an isolated pure tone and the sample was very small. No adequate evidence establishes DNA repair or cellular regeneration.",
  },
  40: {
    description: "Research-inspired 40-Hz listening experience connected to gamma-range neuroscience research",
    background: "Gamma brainwaves (30-100 Hz) represent fast neural oscillations investigated in cognitive research.",
    purpose: "A research-inspired 40-Hz gamma listening experience connected to cognitive clarity and neuroscience research.",
    scientificBasis: "40-Hz sensory stimulation is an active area of clinical research. Consumer audio tracks provide an acoustic listening experience and are not equivalent to medical treatment protocols.",
  },
  7.83: {
    description: "Earth has naturally occurring electromagnetic Schumann resonances. This app provides a Schumann-inspired listening experience; it does not reproduce Earth's electromagnetic field.",
    background: "Earth has naturally occurring electromagnetic Schumann resonances near 7.83 Hz. This app provides an acoustic listening experience inspired by atmospheric resonance.",
    purpose: "A 7.83-Hz listening experience inspired by Earth's atmospheric electromagnetic resonance.",
    scientificBasis: "Schumann resonances are well-documented geophysical atmospheric phenomena. Phone audio reproduces acoustic sound waves, not Earth's planetary electromagnetic fields.",
  },
  1.5: {
    description: "Low-beat listening experience for quiet wind-down and pre-sleep rest (carrier overtone modulation applied for phone speaker audibility)",
    background: "Delta brainwaves (0.5-4 Hz) occur during deep NREM sleep stages. Binaural delta beats present subtle frequency differences for evening relaxation.",
    purpose: "A low-beat delta listening experience designed for quiet wind-down and pre-sleep relaxation.",
    scientificBasis: "Delta waves naturally occur during deep sleep. Binaural beat research is investigating effects on relaxation and sleep, though evidence remains mixed and non-deterministic.",
  },
};

export function getFrequenciesSeed(): CanonicalFrequency[] {
  const frequencies: CanonicalFrequency[] = [];
  const now = '2026-01-01T00:00:00.000Z';

  const addFrequencies = (
    list: any[],
    category: FrequencyCategory,
    categoryIsPremiumDefault: boolean,
    intentTags: string[],
    timeOfDayTags: string[]
  ) => {
    list.forEach((freq) => {
      const guide = getGuide(freq.name, freq.hz);

      // Trust Triangle check: 432, 528, 639, 7.83, 8 are permanently free as introductory experience
      const isPremium = TRUST_TRIANGLE_FREE_HZ.includes(freq.hz)
        ? false
        : categoryIsPremiumDefault;

      const override = CALIBRATED_SEED_OVERRIDES[freq.hz];

      frequencies.push({
        id: createFrequencyId(category, freq.hz),
        name: freq.name,
        hz: freq.hz,
        baseFreq: freq.baseFreq,
        beatFreq: freq.beatFreq,
        frequency: `${freq.hz} Hz`,
        description: override?.description || freq.description,
        category,
        color: freq.color || freq.gradient?.[0] || '#8B5CF6',
        gradient: freq.gradient || [freq.color || '#8B5CF6', '#6C63FF'],
        benefits: guide?.benefits || freq.benefits || [],
        isPremium,
        status: ContentStatus.PUBLISHED,
        intentTags,
        timeOfDayTags,
        background: override?.background || guide?.background || freq.description || '',
        purpose: override?.purpose || guide?.purpose || freq.description,
        scientificBasis: override?.scientificBasis || guide?.scientificBasis || freq.research || '',
        usageInstructions: guide?.usage || {
          duration: 'Start with 5-20 minutes at a comfortable volume.',
          frequency: 'Daily or as needed for relaxation',
          bestTime: 'Choose a time and environment that fits your routine.',
          environment: 'Quiet, comfortable space',
          preparation: 'Deep breathing for 1-2 minutes',
        },
        disclaimer: guide?.disclaimer || freq.disclaimer || REVISED_UNIVERSAL_DISCLAIMER,
        research: freq.research || guide?.scientificBasis || '',
        tags: intentTags,
        provenance: 'system_seed',
        seedVersion: 2,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system_seed',
      });
    });
  };

  // Solfeggio: 432, 528, 639 are free; others are Premium
  addFrequencies(SOLFEGGIO_FREQUENCIES, FrequencyCategory.SOLFEGGIO, true, ['healing', 'transformation'], ['morning', 'evening']);
  // Chakra: Premium
  addFrequencies(CHAKRA_FREQUENCIES, FrequencyCategory.CHAKRA, true, ['energy', 'balance', 'chakra'], ['morning', 'afternoon']);
  // Binaural: Premium
  addFrequencies(BINAURAL_BEATS, FrequencyCategory.BINAURAL, true, ['focus', 'meditation'], ['afternoon', 'night']);
  // Healing: 432, 528 are free, others Premium
  addFrequencies(HEALING_FREQUENCIES, FrequencyCategory.HEALING, true, ['healing', 'recovery'], ['morning', 'evening']);
  // Sleep: 8 Hz is free, others Premium
  addFrequencies(SLEEP_FREQUENCIES, FrequencyCategory.SLEEP, true, ['sleep', 'relaxation'], ['night']);
  // Wealth: 432 Hz free, others Premium
  addFrequencies(WEALTH_FREQUENCIES, FrequencyCategory.WEALTH, true, ['abundance', 'manifestation'], ['morning', 'afternoon']);
  // Scientific: 7.83 Hz free, others Premium
  addFrequencies(SCIENTIFIC_FREQUENCIES, FrequencyCategory.SCIENTIFIC, true, ['cognition', 'science'], ['morning', 'afternoon']);

  return frequencies;
}
