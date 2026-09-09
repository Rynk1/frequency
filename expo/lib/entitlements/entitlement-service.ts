import {
  EntitlementCapabilities,
  EntitlementPolicy,
  EntitlementState,
  EntitlementStatus,
} from './entitlement-types';

export const DEFAULT_ENTITLEMENT_POLICY: EntitlementPolicy = {
  freeSessionMaxDuration: 15 * 60, // 15 minutes
  dailyFreeSessionsLimit: 3,
  premiumPreviewDuration: 180, // 3 minutes preview
  offlineGracePeriodHours: 72, // 72 hours max offline grace
};

export const TRUST_TRIANGLE_HZ = [432, 528, 639, 7.83, 8];

/**
 * Derives capability matrix from premium status
 */
export function computeCapabilities(isPremiumOrTrial: boolean): EntitlementCapabilities {
  if (isPremiumOrTrial) {
    return {
      premiumFrequencies: true,
      extendedSessions: true,
      binaural: true,
      chakra: true,
      offlineDownloads: true,
      advancedAnalytics: true,
      customMixing: true,
    };
  }
  return {
    premiumFrequencies: false,
    extendedSessions: false,
    binaural: false,
    chakra: false,
    offlineDownloads: false,
    advancedAnalytics: false,
    customMixing: false,
  };
}

export class EntitlementEngine {
  private policy: EntitlementPolicy;

  constructor(policy: EntitlementPolicy = DEFAULT_ENTITLEMENT_POLICY) {
    this.policy = policy;
  }

  /**
   * Evaluates user profile / raw entitlement fields with bounded offline grace period enforcement.
   * If lastVerifiedAt is older than offlineGracePeriodHours (e.g. 72h), entitlement fails closed to free status.
   */
  public evaluateEntitlement(rawState: {
    subscriptionStatus?: 'free' | 'premium' | 'trial';
    subscriptionEndsAt?: Date | string;
    trialEndsAt?: Date | string;
    lastVerifiedAt?: Date | string;
    isOffline?: boolean;
  }): EntitlementState {
    const now = new Date();
    const lastVerified = rawState.lastVerifiedAt ? new Date(rawState.lastVerifiedAt) : undefined;

    // Bounded offline grace check
    let offlineGraceValid = true;
    if (rawState.isOffline && lastVerified) {
      const hoursSinceVerification = (now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60);
      if (hoursSinceVerification > this.policy.offlineGracePeriodHours) {
        offlineGraceValid = false;
      }
    }

    const subStatus = rawState.subscriptionStatus || 'free';
    const trialEnds = rawState.trialEndsAt ? new Date(rawState.trialEndsAt) : undefined;
    const subEnds = rawState.subscriptionEndsAt ? new Date(rawState.subscriptionEndsAt) : undefined;

    const isTrialActive = Boolean(subStatus === 'trial' && trialEnds && now < trialEnds);
    const isPremiumActive = Boolean(subStatus === 'premium' && (!subEnds || now < subEnds));

    const isVerifiedAndActive = (isPremiumActive || isTrialActive) && offlineGraceValid;

    let status: EntitlementStatus = 'free';
    if (!offlineGraceValid) {
      status = 'expired';
    } else if (isPremiumActive) {
      status = 'active';
    } else if (isTrialActive) {
      status = 'trial';
    } else if (subStatus === 'trial' && trialEnds && now >= trialEnds) {
      status = 'expired';
    }

    const capabilities = computeCapabilities(isVerifiedAndActive);

    return {
      isPremium: isVerifiedAndActive,
      status,
      expiresAt: subEnds,
      trialEndsAt: trialEnds,
      lastVerifiedAt: lastVerified,
      capabilities,
    };
  }
}

export const globalEntitlementEngine = new EntitlementEngine();
