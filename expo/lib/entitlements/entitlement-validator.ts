import { FrequencyAudioSpec } from '../audio/AudioTypes';
import { AudioValidator } from '../audio/AudioValidator';
import {
  AudioPlaybackEntitlementCheck,
  EntitlementState,
} from './entitlement-types';
import { CapabilityRegistry, CANONICAL_PREMIUM_POLICY } from '../usage/PremiumPolicy';

export class EntitlementValidator {
  /**
   * Validates whether an audio playback request is permitted under the given EntitlementState.
   * Explicitly isolates preview mode (mode: 'preview') from premium status mutation.
   */
  public static validatePlayback(
    spec: FrequencyAudioSpec,
    entitlement: EntitlementState,
    requestedDurationSeconds: number = 0,
    mode: 'full' | 'preview' = 'full'
  ): AudioPlaybackEntitlementCheck {
    const specCheck = AudioValidator.validate(spec);
    if (!specCheck.isValid) {
      return { allowed: false, reason: 'requires_premium' };
    }

    // Unrestricted access for active premium/trial entitlement
    if (entitlement.isPremium) {
      return { allowed: true, reason: 'granted' };
    }

    // Isolated preview mode check (does NOT grant isPremium = true)
    if (mode === 'preview') {
      return {
        allowed: true,
        reason: 'preview_allowed',
        maxAllowedDurationSeconds: CANONICAL_PREMIUM_POLICY.premiumPreviewDuration,
      };
    }

    // Capability evaluation using CapabilityRegistry
    const requiredCap = CapabilityRegistry.getRequiredCapability(
      spec.frequency || spec.targetCarrierFrequency || 0,
      spec.modality,
    );

    if (requiredCap && !entitlement.capabilities[requiredCap]) {
      return {
        allowed: false,
        reason: 'requires_premium',
        maxAllowedDurationSeconds: CANONICAL_PREMIUM_POLICY.premiumPreviewDuration,
      };
    }

    // Free Trust Triangle frequency requested
    if (requestedDurationSeconds > CANONICAL_PREMIUM_POLICY.freeSessionMaxDuration) {
      return {
        allowed: false,
        reason: 'duration_exceeded',
        maxAllowedDurationSeconds: CANONICAL_PREMIUM_POLICY.freeSessionMaxDuration,
      };
    }

    return {
      allowed: true,
      reason: 'granted',
      maxAllowedDurationSeconds: CANONICAL_PREMIUM_POLICY.freeSessionMaxDuration,
    };
  }
}
