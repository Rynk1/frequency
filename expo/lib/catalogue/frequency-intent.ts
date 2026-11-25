import { primaryIntentForFrequency } from './intent-taxonomy';

export interface FrequencyIntentShape {
  id?: string;
  category?: string;
  categoryId?: string;
}

/** Sleep records drive the one longer free session per day. */
export function isSleepFrequency(frequency?: FrequencyIntentShape | null): boolean {
  if (!frequency) return false;
  const id = String(frequency.id ?? '');
  if (id) {
    return id.startsWith('sleep-') || primaryIntentForFrequency(id) === 'sleep';
  }
  const category = String(frequency.categoryId ?? frequency.category ?? '').toLowerCase();
  return category === 'sleep';
}
