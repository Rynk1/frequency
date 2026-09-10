export interface CommercialPolicy {
  freeSessionMaxDuration: number; // 15 minutes (900 seconds)
  dailyFreeSessionsLimit: number; // 3 sessions per day
  premiumPreviewDuration: number; // 3 minutes (180 seconds)
  offlineGracePeriodHours: number; // 72 hours
}

export const CANONICAL_PREMIUM_POLICY: CommercialPolicy = {
  freeSessionMaxDuration: 15 * 60,
  dailyFreeSessionsLimit: 3,
  premiumPreviewDuration: 180,
  offlineGracePeriodHours: 72,
};

export const TRUST_TRIANGLE_FREQUENCIES = [432, 528, 639, 7.83, 8];

export type CapabilityName =
  | 'premiumFrequencies'
  | 'extendedSessions'
  | 'binaural'
  | 'chakra'
  | 'offlineDownloads'
  | 'advancedAnalytics'
  | 'customMixing';

export class CapabilityRegistry {
  /**
   * Determines required capability for a frequency record or modality
   */
  public static getRequiredCapability(hz: number, modality: string, category?: string): CapabilityName | null {
    if (modality === 'binaural_beat' || category === 'brainwave') {
      return 'binaural';
    }

    if (category === 'chakra') {
      return 'chakra';
    }

    if (TRUST_TRIANGLE_FREQUENCIES.includes(hz)) {
      return null; // Free Trust Triangle frequency
    }

    // Advanced Solfeggio or specialized healing frequencies
    return 'premiumFrequencies';
  }
}
