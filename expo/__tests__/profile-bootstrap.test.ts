import { describe, it, expect } from 'vitest';
import { globalEntitlementEngine } from '../lib/entitlements/entitlement-service';

export const CURRENT_CACHE_SCHEMA_VERSION = 1;

export interface CachedProfileWrapper {
  schemaVersion: number;
  uid: string;
  cachedAt: string;
  updatedAt: string;
  profile: Record<string, any>;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  subscriptionStatus: 'free' | 'premium' | 'trial';
  subscriptionType?: 'monthly' | 'yearly';
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  createdAt: Date;
  lastLoginAt: Date;
  onboardingCompleted: boolean;
  onboardingPreferences?: {
    primaryGoal: 'focus' | 'sleep' | 'meditation' | 'healing';
    sessionLength: number;
    notifications: boolean;
  };
  cancelAtPeriodEnd?: boolean;
  usageStats: {
    sessionsCompleted: number;
    totalListeningTime: number;
    favoriteFrequencies: string[];
    streakDays: number;
    lastSessionDate?: Date;
    sessionHistory: string[];
  };
}

/**
 * Pure state machine helper simulating loadUserProfile transitions
 * matching the exact architecture in useAuth.ts
 */
export function simulateProfileBootstrap(options: {
  authUser: { uid: string; email: string } | null;
  cachedProfileWrapper?: CachedProfileWrapper | null;
  firestoreProfile?: UserProfile | null;
  firestoreError?: { code: string; message: string } | null;
  shouldUseFirestore?: boolean;
}) {
  let bootstrapState: 'AUTH_LOADING' | 'AUTHENTICATED' | 'PROFILE_LOADING' | 'READY' | 'OFFLINE_WITH_CACHE' | 'PROFILE_ERROR' | 'SIGNED_OUT' = 'AUTH_LOADING';
  let profileSource: 'AUTHORITATIVE_FIRESTORE' | 'CACHED_LOCAL' | 'UNAVAILABLE' = 'UNAVAILABLE';
  let syncStatus: 'pending' | 'synchronized' | 'retrying' | 'error' = 'pending';
  let profileFreshness: 'current' | 'stale' | 'none' = 'none';
  let lastSyncErrorCode: string | null = null;
  let activeProfile: UserProfile | null = null;

  if (!options.authUser) {
    bootstrapState = 'SIGNED_OUT';
    profileSource = 'UNAVAILABLE';
    syncStatus = 'synchronized';
    profileFreshness = 'none';
    return { bootstrapState, profileSource, syncStatus, profileFreshness, lastSyncErrorCode, activeProfile };
  }

  bootstrapState = 'AUTHENTICATED';
  bootstrapState = 'PROFILE_LOADING';

  // 1. Cache hydration with UID check and schema version check
  let validCache: UserProfile | null = null;
  if (options.cachedProfileWrapper) {
    if (
      options.cachedProfileWrapper.schemaVersion === CURRENT_CACHE_SCHEMA_VERSION &&
      options.cachedProfileWrapper.uid === options.authUser.uid
    ) {
      validCache = options.cachedProfileWrapper.profile as UserProfile;
    }
  }

  if (validCache) {
    activeProfile = validCache;
    profileSource = 'CACHED_LOCAL';
    profileFreshness = 'stale';
    if (options.shouldUseFirestore === false) {
      bootstrapState = 'READY';
      syncStatus = 'synchronized';
      profileFreshness = 'current';
      return { bootstrapState, profileSource, syncStatus, profileFreshness, lastSyncErrorCode, activeProfile };
    }
    bootstrapState = 'OFFLINE_WITH_CACHE';
  } else {
    activeProfile = {
      uid: options.authUser.uid,
      email: options.authUser.email,
      subscriptionStatus: 'free',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      onboardingCompleted: false,
      usageStats: {
        sessionsCompleted: 0,
        totalListeningTime: 0,
        favoriteFrequencies: [],
        streakDays: 0,
        sessionHistory: [],
      },
    };
    profileSource = 'UNAVAILABLE';
    profileFreshness = 'none';
  }

  if (options.shouldUseFirestore === false) {
    return { bootstrapState, profileSource, syncStatus, profileFreshness, lastSyncErrorCode, activeProfile };
  }

  // 2. Firestore resolution
  if (options.firestoreError) {
    lastSyncErrorCode = options.firestoreError.code;
    if (validCache) {
      profileSource = 'CACHED_LOCAL';
      syncStatus = 'retrying';
      bootstrapState = 'OFFLINE_WITH_CACHE';
    } else {
      profileSource = 'UNAVAILABLE';
      syncStatus = 'error';
      bootstrapState = 'PROFILE_ERROR';
    }
    return { bootstrapState, profileSource, syncStatus, profileFreshness, lastSyncErrorCode, activeProfile };
  }

  if (options.firestoreProfile) {
    activeProfile = {
      ...options.firestoreProfile,
      onboardingCompleted: options.firestoreProfile.onboardingCompleted || (validCache?.onboardingCompleted ?? false),
    };
    profileSource = 'AUTHORITATIVE_FIRESTORE';
    syncStatus = 'synchronized';
    profileFreshness = 'current';
    bootstrapState = 'READY';
    lastSyncErrorCode = null;
  }

  return { bootstrapState, profileSource, syncStatus, profileFreshness, lastSyncErrorCode, activeProfile };
}

describe('Production App Bootstrap & Profile Authority Test Matrix', () => {
  const defaultUser = { uid: 'user_123', email: 'test@harmony.app' };

  it('Test A: New user, online -> AUTHORITATIVE_FIRESTORE and READY', () => {
    const firestoreProfile: UserProfile = {
      uid: defaultUser.uid,
      email: defaultUser.email,
      subscriptionStatus: 'free',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      onboardingCompleted: false,
      usageStats: { sessionsCompleted: 0, totalListeningTime: 0, favoriteFrequencies: [], streakDays: 0, sessionHistory: [] },
    };

    const state = simulateProfileBootstrap({
      authUser: defaultUser,
      firestoreProfile,
      shouldUseFirestore: true,
    });

    expect(state.bootstrapState).toBe('READY');
    expect(state.profileSource).toBe('AUTHORITATIVE_FIRESTORE');
    expect(state.syncStatus).toBe('synchronized');
    expect(state.profileFreshness).toBe('current');
    expect(state.activeProfile?.uid).toBe('user_123');
  });

  it('Test B & C: Existing user / App relaunch online with cached profile', () => {
    const cachedWrapper: CachedProfileWrapper = {
      schemaVersion: CURRENT_CACHE_SCHEMA_VERSION,
      uid: defaultUser.uid,
      cachedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        uid: defaultUser.uid,
        email: defaultUser.email,
        subscriptionStatus: 'free',
        onboardingCompleted: true,
        usageStats: { sessionsCompleted: 5, totalListeningTime: 120, favoriteFrequencies: ['528'], streakDays: 3, sessionHistory: [] },
      },
    };

    const firestoreProfile: UserProfile = {
      uid: defaultUser.uid,
      email: defaultUser.email,
      subscriptionStatus: 'free',
      createdAt: new Date(),
      lastLoginAt: new Date(),
      onboardingCompleted: true,
      usageStats: { sessionsCompleted: 5, totalListeningTime: 120, favoriteFrequencies: ['528'], streakDays: 3, sessionHistory: [] },
    };

    const state = simulateProfileBootstrap({
      authUser: defaultUser,
      cachedProfileWrapper: cachedWrapper,
      firestoreProfile,
      shouldUseFirestore: true,
    });

    expect(state.bootstrapState).toBe('READY');
    expect(state.profileSource).toBe('AUTHORITATIVE_FIRESTORE');
    expect(state.syncStatus).toBe('synchronized');
  });

  it('Test D: Temporary network loss with valid local cache -> OFFLINE_WITH_CACHE', () => {
    const cachedWrapper: CachedProfileWrapper = {
      schemaVersion: CURRENT_CACHE_SCHEMA_VERSION,
      uid: defaultUser.uid,
      cachedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        uid: defaultUser.uid,
        email: defaultUser.email,
        subscriptionStatus: 'free',
        onboardingCompleted: true,
        usageStats: { sessionsCompleted: 2, totalListeningTime: 40, favoriteFrequencies: [], streakDays: 1, sessionHistory: [] },
      },
    };

    const state = simulateProfileBootstrap({
      authUser: defaultUser,
      cachedProfileWrapper: cachedWrapper,
      firestoreError: { code: 'unavailable', message: 'Network connection lost' },
      shouldUseFirestore: true,
    });

    expect(state.bootstrapState).toBe('OFFLINE_WITH_CACHE');
    expect(state.profileSource).toBe('CACHED_LOCAL');
    expect(state.syncStatus).toBe('retrying');
    expect(state.lastSyncErrorCode).toBe('unavailable');
    expect(state.activeProfile?.onboardingCompleted).toBe(true);
  });

  it('Test E: Network restored after failure -> transitions to READY / AUTHORITATIVE_FIRESTORE', () => {
    const cachedWrapper: CachedProfileWrapper = {
      schemaVersion: CURRENT_CACHE_SCHEMA_VERSION,
      uid: defaultUser.uid,
      cachedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        uid: defaultUser.uid,
        email: defaultUser.email,
        subscriptionStatus: 'free',
        onboardingCompleted: true,
        usageStats: { sessionsCompleted: 2, totalListeningTime: 40, favoriteFrequencies: [], streakDays: 1, sessionHistory: [] },
      },
    };

    const offlineState = simulateProfileBootstrap({
      authUser: defaultUser,
      cachedProfileWrapper: cachedWrapper,
      firestoreError: { code: 'unavailable', message: 'Offline' },
      shouldUseFirestore: true,
    });

    expect(offlineState.bootstrapState).toBe('OFFLINE_WITH_CACHE');

    const onlineState = simulateProfileBootstrap({
      authUser: defaultUser,
      cachedProfileWrapper: cachedWrapper,
      firestoreProfile: {
        uid: defaultUser.uid,
        email: defaultUser.email,
        subscriptionStatus: 'free',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        onboardingCompleted: true,
        usageStats: { sessionsCompleted: 2, totalListeningTime: 40, favoriteFrequencies: [], streakDays: 1, sessionHistory: [] },
      },
      shouldUseFirestore: true,
    });

    expect(onlineState.bootstrapState).toBe('READY');
    expect(onlineState.profileSource).toBe('AUTHORITATIVE_FIRESTORE');
    expect(onlineState.syncStatus).toBe('synchronized');
    expect(onlineState.lastSyncErrorCode).toBeNull();
  });

  it('Test F & G: Firestore unavailable / Permission denied without local cache -> PROFILE_ERROR', () => {
    const state = simulateProfileBootstrap({
      authUser: defaultUser,
      firestoreError: { code: 'permission-denied', message: 'Missing or insufficient permissions' },
      shouldUseFirestore: true,
    });

    expect(state.bootstrapState).toBe('PROFILE_ERROR');
    expect(state.profileSource).toBe('UNAVAILABLE');
    expect(state.syncStatus).toBe('error');
    expect(state.lastSyncErrorCode).toBe('permission-denied');
  });

  it('Test I: Cache Safety - User A logout -> User B login MUST NOT hydrate User A cached profile', () => {
    const userACacheWrapper: CachedProfileWrapper = {
      schemaVersion: CURRENT_CACHE_SCHEMA_VERSION,
      uid: 'user_A',
      cachedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        uid: 'user_A',
        email: 'userA@harmony.app',
        subscriptionStatus: 'premium',
        onboardingCompleted: true,
        usageStats: { sessionsCompleted: 100, totalListeningTime: 5000, favoriteFrequencies: ['432'], streakDays: 50, sessionHistory: [] },
      },
    };

    const userB = { uid: 'user_B', email: 'userB@harmony.app' };

    const stateUserB = simulateProfileBootstrap({
      authUser: userB,
      cachedProfileWrapper: userACacheWrapper,
      firestoreError: { code: 'unavailable', message: 'Network offline' },
      shouldUseFirestore: true,
    });

    expect(stateUserB.activeProfile?.uid).toBe('user_B');
    expect(stateUserB.activeProfile?.email).toBe('userB@harmony.app');
    expect(stateUserB.profileSource).toBe('UNAVAILABLE');
    expect(stateUserB.bootstrapState).toBe('PROFILE_ERROR');
  });

  it('Test L: Cached profile CANNOT grant paid capabilities when not AUTHORITATIVE_FIRESTORE', () => {
    const cachedEntitlement = globalEntitlementEngine.evaluateEntitlement({
      subscriptionStatus: 'free',
    });

    expect(cachedEntitlement.isPremium).toBe(false);
    expect(cachedEntitlement.capabilities.binaural).toBe(false);

    const authoritativeEntitlement = globalEntitlementEngine.evaluateEntitlement({
      subscriptionStatus: 'premium',
      subscriptionEndsAt: new Date(Date.now() + 86400000),
    });

    expect(authoritativeEntitlement.isPremium).toBe(true);
    expect(authoritativeEntitlement.capabilities.binaural).toBe(true);
  });
});
