import { FrequencyAudioSpec } from '../audio/AudioTypes';
import { AudioValidator } from '../audio/AudioValidator';
import {
  AudioPlaybackEntitlementCheck,
  EntitlementState,
} from './entitlement-types';
import { TRUST_TRIANGLE_HZ } from './entitlement-service';

export class EntitlementValidator {
  /**
   * Validates whether an audio playback request is permitted under the given EntitlementState.
   */
  public static validatePlayback(
    spec: FrequencyAudioSpec,
    entitlement: EntitlementState,
    requestedDurationSeconds: number = 0
  ): AudioPlaybackEntitlementCheck {
    // 1. Audio spec structural validation
    const specCheck = AudioValidator.validate(spec);
    if (!specCheck.isValid) {
      return { allowed: false, reason: 'requires_premium' };
    }

    // 2. Premium / Active trial users have unrestricted access
    if (entitlement.isPremium) {
      return { allowed: true, reason: 'granted' };
    }

    // 3. Free User Logic:
    // Binaural beats require premium
    if (spec.modality === 'binaural_beat') {
      return {
        allowed: false,
        reason: 'requires_premium',
        maxAllowedDurationSeconds: 180, // 3 minute preview
      };
    }

    // Check if pure tone frequency is in Trust Triangle (432, 528, 639, 7.83, 8 Hz)
    const hz = spec.frequency;
    const isTrustTriangle = TRUST_TRIANGLE_HZ.includes(hz);

    if (!isTrustTriangle) {
      // Non-trust triangle frequencies require premium capability or preview
      return {
        allowed: false,
        reason: 'requires_premium',
        maxAllowedDurationSeconds: 180,
      };
    }

    // Trust Triangle frequency requested
    // Check duration limits for free user (15 minutes max = 900s)
    if (requestedDurationSeconds > 15 * 60) {
      return {
        allowed: false,
        reason: 'duration_exceeded',
        maxAllowedDurationSeconds: 15 * 60,
      };
    }

    return { allowed: true, reason: 'granted', maxAllowedDurationSeconds: 15 * 60 };
  }
}
