import { describe, it, expect } from 'vitest';
import { globalEntitlementEngine } from '../lib/entitlements/entitlement-service';
import { EntitlementValidator } from '../lib/entitlements/entitlement-validator';
import { CapabilityRegistry } from '../lib/usage/PremiumPolicy';
import { FrequencyAudioSpec } from '../lib/audio/AudioTypes';

describe('Entitlement Engine & State Machine', () => {
  it('correctly evaluates free tier capabilities', () => {
    const entitlement = globalEntitlementEngine.evaluateEntitlement({
      subscriptionStatus: 'free',
    });

    expect(entitlement.isPremium).toBe(false);
    expect(entitlement.status).toBe('free');
    expect(entitlement.capabilities.premiumFrequencies).toBe(false);
    expect(entitlement.capabilities.binaural).toBe(false);
  });

  it('evaluates active premium subscription capabilities', () => {
    const entitlement = globalEntitlementEngine.evaluateEntitlement({
      subscriptionStatus: 'premium',
      subscriptionEndsAt: new Date(Date.now() + 86400000),
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
  });

  it('CapabilityRegistry accurately maps modalities and categories', () => {
    expect(CapabilityRegistry.getRequiredCapability(432, 'pure_tone')).toBe(null); // Trust triangle
    expect(CapabilityRegistry.getRequiredCapability(10, 'binaural_beat')).toBe('binaural');
    expect(CapabilityRegistry.getRequiredCapability(528, 'pure_tone', 'chakra')).toBe('chakra');
    expect(CapabilityRegistry.getRequiredCapability(963, 'pure_tone')).toBe('premiumFrequencies');
  });

  it('isolated preview mode grants playback permission without changing isPremium state', () => {
    const entitlement = globalEntitlementEngine.evaluateEntitlement({
      subscriptionStatus: 'free',
    });

    const binauralSpec: FrequencyAudioSpec = {
      beatFrequency: 10,
      carrierFrequency: 200,
      modality: 'binaural_beat',
      waveform: 'sine',
      targetCarrierFrequency: 200,
    };

    // Full playback attempt without entitlement -> denied
    const fullCheck = EntitlementValidator.validatePlayback(binauralSpec, entitlement, 300, 'full');
    expect(fullCheck.allowed).toBe(false);
    expect(fullCheck.reason).toBe('requires_premium');

    // Isolated preview mode attempt -> allowed preview
    const previewCheck = EntitlementValidator.validatePlayback(binauralSpec, entitlement, 300, 'preview');
    expect(previewCheck.allowed).toBe(true);
    expect(previewCheck.reason).toBe('preview_allowed');
    expect(previewCheck.maxAllowedDurationSeconds).toBe(180);
    expect(entitlement.isPremium).toBe(false); // Entitlement remains strictly free
  });
});
