import type { CanonicalFrequency } from '../../types/content';
import { getFrequenciesSeed } from '../../seed/frequencies';
import { getLocalDateString, hashSeed } from '../recommendation';

/**
 * The free tier is the nine records on the trust-triangle frequencies. The
 * "Free today" tile rotates within that set so a free listener always has one
 * obvious, playable track without a paywall in the way.
 */
export function freeTierRecords(): CanonicalFrequency[] {
  return getFrequenciesSeed().filter((frequency) => frequency.isPremium === false);
}

export function getFreeToday(dateStr: string = getLocalDateString()): CanonicalFrequency | null {
  const free = freeTierRecords();
  if (free.length === 0) return null;
  const index = hashSeed(`free-today-${dateStr}`) % free.length;
  return free[index];
}
