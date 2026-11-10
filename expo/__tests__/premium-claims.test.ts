import { describe, it, expect } from 'vitest';
import { getFrequenciesSeed } from '../seed/frequencies';
import { PREMIUM_FREQUENCY_COUNT, TOTAL_FREQUENCY_COUNT } from '../lib/usage/PremiumPolicy';

/**
 * Guards the "N premium frequencies" copy shown on the paywall and the
 * post-purchase confirmation. The advertised number must equal what the app
 * actually ships, otherwise users are told they are paying for content that
 * does not exist.
 */
describe('premium frequency claims', () => {
  it('advertises exactly the premium frequencies the catalogue delivers', () => {
    const seed = getFrequenciesSeed();
    const premium = seed.filter((f) => f.isPremium);
    expect(PREMIUM_FREQUENCY_COUNT).toBe(premium.length);
    expect(TOTAL_FREQUENCY_COUNT).toBe(seed.length);
    expect(PREMIUM_FREQUENCY_COUNT).toBeLessThanOrEqual(TOTAL_FREQUENCY_COUNT);
  });

  it('keeps the advertised count off the old "100+" marketing figure', () => {
    expect(PREMIUM_FREQUENCY_COUNT).toBeLessThan(100);
  });
});
