import {
  SOLFEGGIO_FREQUENCIES,
  CHAKRA_FREQUENCIES,
  BINAURAL_BEATS,
  HEALING_FREQUENCIES,
  SLEEP_FREQUENCIES,
  WEALTH_FREQUENCIES,
  SCIENTIFIC_FREQUENCIES,
} from '../constants/frequencies';

export interface FrequencySeed {
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

const createFrequencyId = (category: string, hz: number) => `${category}-${hz}`;

export function getFrequenciesSeed(): FrequencySeed[] {
  const frequencies: FrequencySeed[] = [];

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
}
