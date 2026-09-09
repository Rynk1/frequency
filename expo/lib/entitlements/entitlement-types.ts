export type EntitlementStatus =
  | 'free'
  | 'trial'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export interface EntitlementCapabilities {
  premiumFrequencies: boolean;
  extendedSessions: boolean;
  binaural: boolean;
  chakra: boolean;
  offlineDownloads: boolean;
  advancedAnalytics: boolean;
  customMixing: boolean;
}

export interface EntitlementState {
  isPremium: boolean;
  status: EntitlementStatus;
  expiresAt?: Date;
  trialEndsAt?: Date;
  source?: 'google_play' | 'revenuecat' | 'stripe';
  lastVerifiedAt?: Date;
  capabilities: EntitlementCapabilities;
}

export interface EntitlementPolicy {
  freeSessionMaxDuration: number; // e.g. 900 seconds (15 min)
  dailyFreeSessionsLimit: number; // e.g. 3
  premiumPreviewDuration: number; // e.g. 180 seconds (3 min)
  offlineGracePeriodHours: number; // e.g. 72 hours
}

export interface AudioPlaybackEntitlementCheck {
  allowed: boolean;
  reason?: 'granted' | 'preview_allowed' | 'requires_premium' | 'duration_exceeded' | 'offline_grace_expired';
  maxAllowedDurationSeconds?: number;
}
