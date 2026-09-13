import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { authService, AuthUser } from '@/lib/firebase-auth';
import createContextHook from '@nkzw/create-context-hook';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDataMode } from './useDataMode';
import {
  EntitlementCapabilities,
  EntitlementState,
} from '@/lib/entitlements/entitlement-types';
import { globalEntitlementEngine } from '@/lib/entitlements/entitlement-service';
import { getLocalDateString } from '@/lib/recommendation';
import { USAGE_EVENTS_STORAGE_KEY } from './useUsageAnalytics';
import { sanitizeForFirestore } from '@/lib/validation';

export type BootstrapState =
  | 'AUTH_LOADING'
  | 'AUTHENTICATED'
  | 'PROFILE_LOADING'
  | 'READY'
  | 'OFFLINE_WITH_CACHE'
  | 'PROFILE_ERROR'
  | 'SIGNED_OUT';

export type ProfileSource = 'AUTHORITATIVE_FIRESTORE' | 'CACHED_LOCAL' | 'UNAVAILABLE';
export type SyncStatus = 'pending' | 'synchronized' | 'retrying' | 'error';
export type ProfileFreshness = 'current' | 'stale' | 'none';

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

interface AuthContextType {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  bootstrapState: BootstrapState;
  profileSource: ProfileSource;
  syncStatus: SyncStatus;
  profileFreshness: ProfileFreshness;
  lastSyncErrorCode: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  capabilities: EntitlementCapabilities;
  entitlementState: EntitlementState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: (options?: { clearLocalData?: boolean }) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  retryProfileSync: () => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
  startTrial: (options?: { hasAcceptedAutoRenew: boolean }) => Promise<void>;
  upgradeToPremium: (type: 'monthly' | 'yearly') => Promise<void>;
  trackUsage: (sessionDuration: number, frequency: string) => Promise<void>;
}

const getUserProfileStorageKey = (uid: string) => `userProfile:${uid}`;

export const [AuthProvider, useAuth] = createContextHook((): AuthContextType => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Bootstrap state machine and profile metadata
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>('AUTH_LOADING');
  const [profileSource, setProfileSource] = useState<ProfileSource>('UNAVAILABLE');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('pending');
  const [profileFreshness, setProfileFreshness] = useState<ProfileFreshness>('none');
  const [lastSyncErrorCode, setLastSyncErrorCode] = useState<string | null>(null);

  const { shouldUseFirestore, isCloudStrict, setCloudError } = useDataMode();
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);

  // Entitlement Security Isolation: Cache cannot grant paid capabilities
  const entitlementState: EntitlementState = useMemo(() => {
    const isAuthoritative = profileSource === 'AUTHORITATIVE_FIRESTORE';
    return globalEntitlementEngine.evaluateEntitlement({
      subscriptionStatus: isAuthoritative ? userProfile?.subscriptionStatus : 'free',
      subscriptionEndsAt: isAuthoritative ? userProfile?.subscriptionEndsAt : undefined,
      trialEndsAt: isAuthoritative ? userProfile?.trialEndsAt : undefined,
      lastVerifiedAt: isAuthoritative ? userProfile?.lastLoginAt : undefined,
    });
  }, [userProfile, profileSource]);

  const isAuthenticated = !!user;
  const isPremium = entitlementState.isPremium;
  const isTrialActive = entitlementState.status === 'trial';
  const capabilities = entitlementState.capabilities;

  const isLoading = bootstrapState === 'AUTH_LOADING' || bootstrapState === 'AUTHENTICATED' || (bootstrapState === 'PROFILE_LOADING' && !userProfile);

  const trialDaysLeft = (profileSource === 'AUTHORITATIVE_FIRESTORE' && userProfile?.trialEndsAt)
    ? Math.max(0, Math.ceil((userProfile.trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const createUserProfile = useCallback((authUser: AuthUser): UserProfile => {
    const now = new Date();
    return {
      uid: authUser.uid,
      email: authUser.email || '',
      displayName: authUser.displayName || undefined,
      subscriptionStatus: 'free',
      createdAt: now,
      lastLoginAt: now,
      onboardingCompleted: false,
      usageStats: {
        sessionsCompleted: 0,
        totalListeningTime: 0,
        favoriteFrequencies: [],
        streakDays: 0,
        sessionHistory: [],
      },
    };
  }, []);

  /**
   * Reads and validates cached profile with UID matching & schema versioning.
   */
  const parseCachedProfile = useCallback((jsonStr: string, expectedUid: string): UserProfile | null => {
    try {
      const parsed = JSON.parse(jsonStr);
      let data: Record<string, any>;

      // Check if wrapped with schema versioning
      if (parsed && typeof parsed === 'object' && 'schemaVersion' in parsed && 'profile' in parsed) {
        const wrapper = parsed as CachedProfileWrapper;
        if (wrapper.schemaVersion !== CURRENT_CACHE_SCHEMA_VERSION) {
          return null;
        }
        if (wrapper.uid !== expectedUid) {
          // Strict UID mismatch guard: User A cache cannot hydrate for User B
          return null;
        }
        data = wrapper.profile;
      } else {
        // Legacy unwrapped cache fallback (strictly check uid)
        data = parsed;
        if (!data || data.uid !== expectedUid) {
          return null;
        }
      }

      return {
        ...data,
        uid: expectedUid,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : new Date(),
        trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : undefined,
        subscriptionEndsAt: data.subscriptionEndsAt ? new Date(data.subscriptionEndsAt) : undefined,
        onboardingCompleted: Boolean(data.onboardingCompleted),
        usageStats: {
          ...data.usageStats,
          sessionsCompleted: data.usageStats?.sessionsCompleted || 0,
          totalListeningTime: data.usageStats?.totalListeningTime || 0,
          favoriteFrequencies: data.usageStats?.favoriteFrequencies || [],
          streakDays: data.usageStats?.streakDays || 0,
          lastSessionDate: data.usageStats?.lastSessionDate ? new Date(data.usageStats.lastSessionDate) : undefined,
          sessionHistory: data.usageStats?.sessionHistory || [],
        },
      } as UserProfile;
    } catch {
      return null;
    }
  }, []);

  const writeCacheProfile = useCallback(async (profile: UserProfile) => {
    if (!profile?.uid?.trim()) return;
    try {
      const nowIso = new Date().toISOString();
      const wrapper: CachedProfileWrapper = {
        schemaVersion: CURRENT_CACHE_SCHEMA_VERSION,
        uid: profile.uid,
        cachedAt: nowIso,
        updatedAt: nowIso,
        profile,
      };
      await AsyncStorage.setItem(getUserProfileStorageKey(profile.uid), JSON.stringify(wrapper));
    } catch (e) {
      console.warn('Failed to write profile to AsyncStorage cache:', e);
    }
  }, []);

  const mapProfileFromFirestore = useCallback((data: Record<string, any>): UserProfile => {
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
    const lastLoginAt = data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : new Date();
    const trialEndsAt = data.trialEndsAt?.toDate ? data.trialEndsAt.toDate() : undefined;
    const subscriptionEndsAt = data.subscriptionEndsAt?.toDate ? data.subscriptionEndsAt.toDate() : undefined;

    return {
      uid: data.uid || '',
      email: data.email || '',
      displayName: data.displayName || undefined,
      subscriptionStatus: data.subscriptionStatus || 'free',
      subscriptionType: data.subscriptionType || undefined,
      trialEndsAt,
      subscriptionEndsAt,
      createdAt,
      lastLoginAt,
      onboardingCompleted: Boolean(data.onboardingCompleted),
      onboardingPreferences: data.onboardingPreferences,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
      usageStats: {
        sessionsCompleted: data.usageStats?.sessionsCompleted || 0,
        totalListeningTime: data.usageStats?.totalListeningTime || 0,
        favoriteFrequencies: data.usageStats?.favoriteFrequencies || [],
        streakDays: data.usageStats?.streakDays || 0,
        lastSessionDate: data.usageStats?.lastSessionDate?.toDate ? data.usageStats.lastSessionDate.toDate() : undefined,
        sessionHistory: data.usageStats?.sessionHistory || [],
      },
    };
  }, []);

  /**
   * Constructs rule-compliant Firestore initial document payload.
   * Omits server-authoritative fields (subscriptionType, trialEndsAt, subscriptionEndsAt, cancelAtPeriodEnd, role, admin)
   * to ensure compatibility with strict CEL rules during initial create.
   */
  const toFirestoreInitialProfile = useCallback((profile: UserProfile) => {
    const raw: Record<string, any> = {
      uid: profile.uid,
      email: profile.email ?? null,
      displayName: profile.displayName ?? null,
      createdAt: Timestamp.fromDate(profile.createdAt),
      lastLoginAt: Timestamp.fromDate(profile.lastLoginAt),
      onboardingCompleted: Boolean(profile.onboardingCompleted),
      onboardingPreferences: profile.onboardingPreferences ?? null,
      subscriptionStatus: profile.subscriptionStatus || 'free',
      usageStats: {
        ...profile.usageStats,
        lastSessionDate: profile.usageStats.lastSessionDate
          ? Timestamp.fromDate(profile.usageStats.lastSessionDate)
          : null,
      },
    };

    return sanitizeForFirestore(raw);
  }, []);

  const saveUserProfile = useCallback(async (profile: UserProfile, isNewProfile = false) => {
    if (!profile?.uid?.trim()) return;

    // 1. Update cache first for local UI response
    await writeCacheProfile(profile);

    // 2. Persist to Firestore if cloud sync is enabled
    if (!shouldUseFirestore) {
      setProfileSource('CACHED_LOCAL');
      setSyncStatus('synchronized');
      return;
    }

    const userRef = doc(db, 'users', profile.uid);

    if (isNewProfile) {
      const initialData = toFirestoreInitialProfile(profile);
      try {
        await setDoc(userRef, initialData, { merge: true });
        setProfileSource('AUTHORITATIVE_FIRESTORE');
        setSyncStatus('synchronized');
        setProfileFreshness('current');
        setLastSyncErrorCode(null);
        if (userProfile && userProfile.uid === profile.uid) {
          setBootstrapState('READY');
        }
      } catch (error: any) {
        const errCode = error?.code || 'unknown';
        const errMsg = error?.message || String(error);
        console.error('[PROFILE_FIRESTORE_CREATE_FAILURE]', {
          operation: 'create/setDoc',
          uid: profile.uid,
          documentPath: userRef.path,
          code: errCode,
          message: errMsg,
          timestamp: new Date().toISOString(),
        });
        setSyncStatus('error');
        setLastSyncErrorCode(errCode);
        setCloudError(`Failed to create user profile [${errCode}]: ${errMsg}`);
        throw error;
      }
    } else {
      // Patch update for existing profile: send strictly client-writable fields only
      const patchData: Record<string, any> = {};
      if (profile.displayName !== undefined) patchData.displayName = profile.displayName ?? null;
      if (profile.onboardingCompleted !== undefined) patchData.onboardingCompleted = Boolean(profile.onboardingCompleted);
      if (profile.onboardingPreferences !== undefined) patchData.onboardingPreferences = profile.onboardingPreferences ?? null;
      if (profile.lastLoginAt !== undefined) patchData.lastLoginAt = Timestamp.fromDate(profile.lastLoginAt);
      if (profile.usageStats !== undefined) {
        patchData.usageStats = {
          ...profile.usageStats,
          lastSessionDate: profile.usageStats.lastSessionDate
            ? Timestamp.fromDate(profile.usageStats.lastSessionDate)
            : null,
        };
      }

      const sanitizedPatch = sanitizeForFirestore(patchData);

      try {
        await updateDoc(userRef, sanitizedPatch);
        setProfileSource('AUTHORITATIVE_FIRESTORE');
        setSyncStatus('synchronized');
        setProfileFreshness('current');
        setLastSyncErrorCode(null);
        if (userProfile && userProfile.uid === profile.uid) {
          setBootstrapState('READY');
        }
      } catch (error: any) {
        const errCode = error?.code || 'unknown';
        const errMsg = error?.message || String(error);
        console.error('[PROFILE_FIRESTORE_WRITE_FAILURE]', {
          operation: 'updateDoc',
          uid: profile.uid,
          documentPath: userRef.path,
          code: errCode,
          message: errMsg,
          timestamp: new Date().toISOString(),
          payloadKeys: Object.keys(sanitizedPatch),
        });
        setSyncStatus('error');
        setLastSyncErrorCode(errCode);
        setCloudError(`Failed to save user profile [${errCode}]: ${errMsg}`);
        throw error;
      }
    }
  }, [toFirestoreInitialProfile, shouldUseFirestore, setCloudError, writeCacheProfile, userProfile]);

  const loadUserProfile = useCallback(async (uid: string, currentAuthUser?: AuthUser | null, isRetry = false) => {
    if (!uid?.trim()) return;

    const email = currentAuthUser?.email || user?.email || '';
    const displayName = currentAuthUser?.displayName || user?.displayName || null;

    if (!isRetry) {
      setBootstrapState('PROFILE_LOADING');
      setSyncStatus('pending');
    } else {
      setSyncStatus('retrying');
    }

    // 1. Check local AsyncStorage cache first with strict UID validation
    let cachedProfile: UserProfile | null = null;
    try {
      const cachedRaw = await AsyncStorage.getItem(getUserProfileStorageKey(uid));
      if (cachedRaw) {
        cachedProfile = parseCachedProfile(cachedRaw, uid);
      }
    } catch (e) {
      console.warn('Failed reading cached user profile:', e);
    }

    if (cachedProfile) {
      setUserProfile(cachedProfile);
      setProfileSource('CACHED_LOCAL');
      setProfileFreshness('stale');
      if (!shouldUseFirestore) {
        setBootstrapState('READY');
        setSyncStatus('synchronized');
        setProfileFreshness('current');
        return;
      }
      setBootstrapState('OFFLINE_WITH_CACHE');
    } else {
      // Create provisional profile in memory if no cache exists
      const provisional = createUserProfile({ uid, email, displayName });
      setUserProfile(provisional);
      setProfileSource('UNAVAILABLE');
      setProfileFreshness('none');
    }

    if (!shouldUseFirestore) return;

    // 2. Fetch remote profile from Firestore (authoritative)
    try {
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 8000);

      try {
        const userRef = doc(db, 'users', uid);
        const snapshot = await getDoc(userRef);
        clearTimeout(timeoutId);

        if (snapshot.exists()) {
          const remoteProfile = mapProfileFromFirestore(snapshot.data());
          // Merge local onboarding completed state if set locally
          const localOnboarding = cachedProfile?.onboardingCompleted || false;
          const mergedProfile: UserProfile = {
            ...remoteProfile,
            onboardingCompleted: remoteProfile.onboardingCompleted || localOnboarding,
            onboardingPreferences: remoteProfile.onboardingPreferences || cachedProfile?.onboardingPreferences,
            lastLoginAt: new Date(),
          };

          setUserProfile(mergedProfile);
          setProfileSource('AUTHORITATIVE_FIRESTORE');
          setSyncStatus('synchronized');
          setProfileFreshness('current');
          setBootstrapState('READY');
          setLastSyncErrorCode(null);
          retryCountRef.current = 0;

          await writeCacheProfile(mergedProfile);
          return;
        }

        // New profile in Firestore -> save authoritative initial state
        const initialProfile = createUserProfile({ uid, email, displayName });
        await saveUserProfile(initialProfile, true);
        setUserProfile(initialProfile);
        setProfileSource('AUTHORITATIVE_FIRESTORE');
        setSyncStatus('synchronized');
        setProfileFreshness('current');
        setBootstrapState('READY');
        setLastSyncErrorCode(null);
        retryCountRef.current = 0;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error: any) {
      const errCode = error?.code || 'unknown';
      const errMsg = error?.message || String(error);

      // Safe structured observability logging (no secrets/tokens)
      console.error('[PROFILE_FIRESTORE_LOAD_FAILURE]', {
        operation: 'read/getDoc',
        uid,
        documentPath: `users/${uid}`,
        code: errCode,
        message: errMsg,
        timestamp: new Date().toISOString(),
      });

      setLastSyncErrorCode(errCode);
      setCloudError(`Failed to load user profile [${errCode}]: ${errMsg}`);

      if (cachedProfile) {
        setProfileSource('CACHED_LOCAL');
        setSyncStatus('retrying');
        setBootstrapState('OFFLINE_WITH_CACHE');
      } else {
        setProfileSource('UNAVAILABLE');
        setSyncStatus('error');
        setBootstrapState('PROFILE_ERROR');
      }

      if (isCloudStrict) {
        throw error;
      }

      // Bounded automatic retry logic
      if (retryCountRef.current < 3) {
        retryCountRef.current += 1;
        const delay = Math.pow(2, retryCountRef.current) * 1000; // 2s, 4s, 8s
        retryTimerRef.current = setTimeout(() => {
          loadUserProfile(uid, currentAuthUser, true).catch(() => {});
        }, delay);
      }
    }
  }, [createUserProfile, parseCachedProfile, mapProfileFromFirestore, saveUserProfile, user, shouldUseFirestore, isCloudStrict, setCloudError, writeCacheProfile]);

  const retryProfileSync = useCallback(async () => {
    if (!user?.uid) return;
    retryCountRef.current = 0;
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    await loadUserProfile(user.uid, user, true);
  }, [user, loadUserProfile]);

  useEffect(() => {
    let mounted = true;
    let resolved = false;

    const safetyTimeout = setTimeout(() => {
      if (mounted && !resolved) {
        resolved = true;
        console.warn('Auth safety timeout fired — forcing bootstrap state resolution');
        if (!user) {
          setBootstrapState('SIGNED_OUT');
        }
      }
    }, 5000);

    try {
      const unsubscribe = authService.onAuthStateChanged((authUser) => {
        if (!mounted) return;

        if (!resolved) {
          resolved = true;
          clearTimeout(safetyTimeout);
        }

        if (!authUser?.uid?.trim()) {
          setUser(null);
          setUserProfile(null);
          setBootstrapState('SIGNED_OUT');
          setProfileSource('UNAVAILABLE');
          setSyncStatus('synchronized');
          setProfileFreshness('none');
          setLastSyncErrorCode(null);
          return;
        }

        setUser(authUser);
        setBootstrapState('AUTHENTICATED');

        loadUserProfile(authUser.uid, authUser, false).catch(() => {});
      });

      return () => {
        mounted = false;
        clearTimeout(safetyTimeout);
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
        unsubscribe();
      };
    } catch {
      if (mounted && !resolved) {
        resolved = true;
        clearTimeout(safetyTimeout);
        setBootstrapState('SIGNED_OUT');
      }
      return () => {
        mounted = false;
        clearTimeout(safetyTimeout);
        if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      };
    }
  }, [loadUserProfile, user]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email?.trim() || !password?.trim()) {
      throw new Error('Email and password are required');
    }

    try {
      setBootstrapState('AUTH_LOADING');
      await authService.signIn(email.trim(), password);
    } catch (error) {
      setBootstrapState('SIGNED_OUT');
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    if (!email?.trim() || !password?.trim()) {
      throw new Error('Email and password are required');
    }

    try {
      setBootstrapState('AUTH_LOADING');
      const authUser = await authService.signUp(email.trim(), password);

      const profile = createUserProfile({
        ...authUser,
        displayName: displayName?.trim() || authUser.displayName,
      });

      setUserProfile(profile);
      await saveUserProfile(profile, true);
    } catch (error) {
      setBootstrapState('SIGNED_OUT');
      throw error;
    }
  }, [createUserProfile, saveUserProfile]);

  const signOut = useCallback(async (options?: { clearLocalData?: boolean }) => {
    try {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      const currentUid = userProfile?.uid || user?.uid;
      await authService.signOut();

      if (options?.clearLocalData && currentUid) {
        await AsyncStorage.multiRemove([
          USAGE_EVENTS_STORAGE_KEY,
          getUserProfileStorageKey(currentUid),
        ]).catch(() => {});
      }

      setUser(null);
      setUserProfile(null);
      setBootstrapState('SIGNED_OUT');
      setProfileSource('UNAVAILABLE');
      setSyncStatus('synchronized');
      setProfileFreshness('none');
      setLastSyncErrorCode(null);
    } catch (error) {
      throw error;
    }
  }, [userProfile?.uid, user?.uid]);

  /**
   * Update profile using strict field allowlisting and patch-based dual storage persistence.
   */
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const currentProfile = userProfile || (user ? createUserProfile(user) : null);
    if (!currentProfile) return;

    // Filter out subscription or server-authoritative fields
    const {
      subscriptionStatus,
      subscriptionType,
      subscriptionEndsAt,
      trialEndsAt,
      cancelAtPeriodEnd,
      ...allowedUpdates
    } = updates;

    const updatedProfile = { ...currentProfile, ...allowedUpdates };
    setUserProfile(updatedProfile);
    await saveUserProfile(updatedProfile, false);
  }, [userProfile, user, createUserProfile, saveUserProfile]);

  const refreshSubscriptionStatus = useCallback(async () => {
    if (!user) return;
    try {
      const { getSubscriptionStatus } = await import('@/lib/subscription-service');
      const status = await getSubscriptionStatus();
      setUserProfile((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          subscriptionStatus: status.subscriptionStatus,
          subscriptionType: status.subscriptionType || prev.subscriptionType,
          subscriptionEndsAt: status.subscriptionEndsAt ? new Date(status.subscriptionEndsAt) : prev.subscriptionEndsAt,
          trialEndsAt: status.trialEndsAt ? new Date(status.trialEndsAt) : prev.trialEndsAt,
          cancelAtPeriodEnd: status.cancelAtPeriodEnd,
        };
        saveUserProfile(updated, false).catch(() => {});
        return updated;
      });
    } catch (error: any) {
      console.warn('Subscription status refresh failed:', error?.message || error);
    }
  }, [user, saveUserProfile]);

  const startTrial = useCallback(async (_options?: { hasAcceptedAutoRenew: boolean }) => {
    throw new Error('Trial must be started through checkout.');
  }, []);

  const upgradeToPremium = useCallback(async (_type: 'monthly' | 'yearly') => {
    throw new Error('Upgrades must go through checkout.');
  }, []);

  const trackUsage = useCallback(async (sessionDuration: number, frequency: string) => {
    if (!userProfile || !frequency?.trim()) return;

    const sanitizedFrequency = frequency.trim();
    const now = new Date();
    const todayISO = getLocalDateString(now);
    const lastSessionDate = userProfile.usageStats.lastSessionDate;

    let streakDays = userProfile.usageStats.streakDays;
    if (lastSessionDate) {
      const daysDiff = Math.floor((now.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 0) {
        streakDays = Math.max(1, streakDays);
      } else if (daysDiff === 1) {
        streakDays += 1;
      } else if (daysDiff > 1) {
        streakDays = 1;
      }
    } else {
      streakDays = 1;
    }

    const favoriteFrequencies = [...userProfile.usageStats.favoriteFrequencies];
    if (!favoriteFrequencies.includes(sanitizedFrequency)) {
      favoriteFrequencies.push(sanitizedFrequency);
    }

    const sessionHistory = [...userProfile.usageStats.sessionHistory, todayISO]
      .filter((date, idx, arr) => arr.indexOf(date) === idx)
      .filter(date => {
        const d = new Date(date);
        return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 30;
      });

    const usageEvent = {
      id: `${todayISO}-${Date.now()}`,
      date: todayISO,
      durationMinutes: Math.max(0, sessionDuration),
      frequency: sanitizedFrequency,
      createdAt: now.toISOString(),
    };

    const storedEvents = await AsyncStorage.getItem(USAGE_EVENTS_STORAGE_KEY);
    const usageEvents = [...(storedEvents ? JSON.parse(storedEvents) : []), usageEvent]
      .filter((event) => event.date >= new Date(now.getTime() - 31 * 86400000).toISOString().split('T')[0]);
    await AsyncStorage.setItem(USAGE_EVENTS_STORAGE_KEY, JSON.stringify(usageEvents));

    if (shouldUseFirestore && userProfile.uid) {
      setDoc(doc(db, 'userUsage', userProfile.uid, 'events', usageEvent.id), usageEvent).catch(() => {});
    }

    await updateProfile({
      usageStats: {
        ...userProfile.usageStats,
        sessionsCompleted: userProfile.usageStats.sessionsCompleted + 1,
        totalListeningTime: userProfile.usageStats.totalListeningTime + sessionDuration,
        favoriteFrequencies,
        streakDays,
        lastSessionDate: now,
        sessionHistory,
      },
    });
  }, [shouldUseFirestore, userProfile, updateProfile]);

  return useMemo(() => ({
    user,
    userProfile,
    bootstrapState,
    profileSource,
    syncStatus,
    profileFreshness,
    lastSyncErrorCode,
    isLoading,
    isAuthenticated,
    isPremium,
    isTrialActive,
    trialDaysLeft,
    capabilities,
    entitlementState,
    signIn,
    signUp,
    signOut,
    updateProfile,
    retryProfileSync,
    refreshSubscriptionStatus,
    startTrial,
    upgradeToPremium,
    trackUsage,
  }), [
    user,
    userProfile,
    bootstrapState,
    profileSource,
    syncStatus,
    profileFreshness,
    lastSyncErrorCode,
    isLoading,
    isAuthenticated,
    isPremium,
    isTrialActive,
    trialDaysLeft,
    capabilities,
    entitlementState,
    signIn,
    signUp,
    signOut,
    updateProfile,
    retryProfileSync,
    refreshSubscriptionStatus,
    startTrial,
    upgradeToPremium,
    trackUsage,
  ]);
});
