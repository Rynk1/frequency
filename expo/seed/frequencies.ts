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

      frequencies.push({
        id: createFrequencyId(category, freq.hz),
        name: freq.name,
        hz: freq.hz,
        baseFreq: freq.baseFreq,
        beatFreq: freq.beatFreq,
        frequency: `${freq.hz} Hz`,
        description: freq.description,
        category,
        color: freq.color || freq.gradient?.[0] || '#8B5CF6',
        gradient: freq.gradient || [freq.color || '#8B5CF6', '#6C63FF'],
        benefits: guide?.benefits || freq.benefits || [],
        isPremium,
        status: ContentStatus.PUBLISHED,
        intentTags,
        timeOfDayTags,
        background: guide?.background || '',
        purpose: guide?.purpose || freq.description,
        scientificBasis: guide?.scientificBasis || freq.research || '',
        usageInstructions: guide?.usage || {
          duration: freq.duration || '15-20 minutes',
          frequency: 'Daily or as needed',
          bestTime: timeOfDayTags[0] || 'Anytime',
          environment: 'Quiet, comfortable space',
          preparation: 'Deep breathing for 2 minutes',
        },
        disclaimer: guide?.disclaimer || 'Sound therapy complements relaxation and meditation but is not a substitute for professional medical treatment.',
        research: freq.research || guide?.scientificBasis || '',
        tags: intentTags,
        provenance: 'system_seed',
        seedVersion: 1,
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
