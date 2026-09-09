import { describe, it, expect } from 'vitest';
import { globalEntitlementEngine } from '../lib/entitlements/entitlement-service';
import { EntitlementValidator } from '../lib/entitlements/entitlement-validator';
import { FrequencyAudioSpec } from '../lib/audio/AudioTypes';

describe('Entitlement Engine & Audio Playback Validator', () => {
  it('correctly identifies free entitlement when no premium status is set', () => {
    const entitlement = globalEntitlementEngine.evaluateEntitlement({
      subscriptionStatus: 'free',
    });

    expect(entitlement.isPremium).toBe(false);
    expect(entitlement.status).toBe('free');
    expect(entitlement.capabilities.premiumFrequencies).toBe(false);
    expect(entitlement.capabilities.binaural).toBe(false);
  });

  it('grants full capabilities for active premium subscription', () => {
    const entitlement = globalEntitlementEngine.evaluateEntitlement({
      subscriptionStatus: 'premium',
      subscriptionEndsAt: new Date(Date.now() + 86400000), // 1 day in future
      lastVerifiedAt: new Date(),
    });

    expect(entitlement.isPremium).toBe(true);
    expect(entitlement.status).toBe('active');
    expect(entitlement.capabilities.premiumFrequencies).toBe(true);
    expect(entitlement.capabilities.binaural).toBe(true);
  });

  it('fails closed when offline grace period (> 72 hours) expires', () => {
    const ninetyHoursAgo = new Date(Date.now() - 90 * 60 * 60 * 1000);
    const entitlement = globalEntitlementEngine.evaluateEntitlement({
      subscriptionStatus: 'premium',
      lastVerifiedAt: ninetyHoursAgo,
      isOffline: true,
    });

    expect(entitlement.isPremium).toBe(false);
    expect(entitlement.status).toBe('expired');
    expect(entitlement.capabilities.binaural).toBe(false);
  });

  it('permits trust triangle pure tones for free users within duration limits', () => {
    const entitlement = globalEntitlementEngine.evaluateEntitlement({
      subscriptionStatus: 'free',
    });

    const pureTone528: FrequencyAudioSpec = {
      frequency: 528,
      modality: 'pure_tone',
      waveform: 'sine',
      targetCarrierFrequency: 528,
    };

    const check = EntitlementValidator.validatePlayback(pureTone528, entitlement, 600); // 10 min
    expect(check.allowed).toBe(true);
    expect(check.reason).toBe('granted');
  });

  it('denies binaural beats for free users', () => {
    const entitlement = globalEntitlementEngine.evaluateEntitlement({
      subscriptionStatus: 'free',
    });

    const binauralSpec: FrequencyAudioSpec = {
      beatFrequency: 10,
      modality: 'binaural_beat',
      waveform: 'sine',
      targetCarrierFrequency: 200,
    };

    const check = EntitlementValidator.validatePlayback(binauralSpec, entitlement, 300);
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe('requires_premium');
  });
});
