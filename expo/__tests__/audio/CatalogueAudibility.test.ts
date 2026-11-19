import { describe, it, expect } from 'vitest';
import { getFrequenciesSeed } from '../../seed/frequencies';
import { AudioResolver } from '../../lib/audio/AudioResolver';
import { AudioValidator } from '../../lib/audio/AudioValidator';
import { globalEntitlementEngine } from '../../lib/entitlements/entitlement-service';
import { EntitlementValidator } from '../../lib/entitlements/entitlement-validator';
import { MIN_AUDIBLE_HZ } from '../../lib/audio/audibility';

/**
 * Guards the defect this suite previously missed: the catalogue audit only
 * checked that specs were *representable*, so seven entries shipped as pure
 * tones below 20 Hz — inaudible on phone speakers. A green build coexisted with
 * a free tier where a third of the content produced no sound.
 *
 * These assertions test what the listener receives, not what the code accepts.
 */
describe('catalogue audibility', () => {
  const seed = getFrequenciesSeed();

  it('never ships a pure tone below the audible range', () => {
    const silent = seed.filter((entry) => {
      const spec = AudioResolver.resolve(entry);
      return spec.modality === 'pure_tone' && spec.frequency < MIN_AUDIBLE_HZ;
    });

    expect(
      silent.map((entry) => `${entry.name} (${entry.hz} Hz, ${entry.id})`),
      'These entries resolve to sub-audible pure tones and would be silent on a phone speaker',
    ).toEqual([]);
  });

  it('resolves every catalogue entry to a spec the audio engine accepts', () => {
    seed.forEach((entry) => {
      const spec = AudioResolver.resolve(entry);
      const result = AudioValidator.validate(spec);
      expect(result.isValid, `${entry.name} (${entry.id}): ${result.error}`).toBe(true);
    });
  });

  it('delivers sub-audible catalogue rates as an audible binaural beat', () => {
    const promoted = seed.filter((entry) => entry.hz < MIN_AUDIBLE_HZ);

    expect(promoted.length).toBeGreaterThan(0);
    promoted.forEach((entry) => {
      const spec = AudioResolver.resolve(entry);
      expect(spec.modality).toBe('binaural_beat');
      if (spec.modality !== 'binaural_beat') return;

      // The listener must actually hear the carrier...
      expect(spec.carrierFrequency).toBeGreaterThanOrEqual(MIN_AUDIBLE_HZ);
      // ...and the intended rate must survive as the perceived beat.
      expect(spec.beatFrequency).toBeCloseTo(entry.hz, 5);

      // Entries that shipped as binaural in source already carried their rate
      // in `beatFrequency`; only promoted pure tones record `declaredFrequency`.
      const wasPureToneInSource = !(entry as any).baseFreq;
      if (wasPureToneInSource) {
        expect(spec.declaredFrequency).toBeCloseTo(entry.hz, 5);
      }
    });
  });

  it('keeps audibility promotion from changing a free entry into premium content', () => {
    const promotedFree = seed.filter((entry) => entry.hz < MIN_AUDIBLE_HZ && !entry.isPremium);

    expect(promotedFree.length).toBeGreaterThan(0);
    // The gate that actually decides playback is EntitlementValidator, so assert
    // against it: promoting a sub-audible free tone to a binaural beat must not
    // turn it into premium content for a free listener.
    const freeEntitlement = globalEntitlementEngine.evaluateEntitlement({
      subscriptionStatus: 'free',
    });

    promotedFree.forEach((entry) => {
      const spec = AudioResolver.resolve(entry);
      const check = EntitlementValidator.validatePlayback(spec, freeEntitlement, 300, 'full');
      expect(check.allowed, `${entry.name} (${entry.id}) must stay free`).toBe(true);
    });
  });

  it('offers a free tier with more than one audible pitch', () => {
    const audibleFreePitches = new Set(
      seed
        .filter((entry) => !entry.isPremium)
        .map((entry) => {
          const spec = AudioResolver.resolve(entry);
          if (spec.modality === 'pure_tone') return spec.frequency;
          return spec.declaredFrequency ?? spec.beatFrequency;
        })
        .filter((hz) => hz >= MIN_AUDIBLE_HZ),
    );

    // A free tier built on a single tone gives new users nothing to compare,
    // which is what made the silent entries so damaging.
    expect(audibleFreePitches.size).toBeGreaterThanOrEqual(3);
  });
});
