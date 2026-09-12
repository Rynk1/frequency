import { useState, useEffect, useCallback, useMemo } from 'react';
import { authService, AuthUser } from '@/lib/firebase-auth';
import createContextHook from '@nkzw/create-context-hook';
import { db } from '@/lib/firebase';
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
  refreshSubscriptionStatus: () => Promise<void>;
  startTrial: (options?: { hasAcceptedAutoRenew: boolean }) => Promise<void>;
  upgradeToPremium: (type: 'monthly' | 'yearly') => Promise<void>;
  trackUsage: (sessionDuration: number, frequency: string) => Promise<void>;
}

const getUserProfileStorageKey = (uid: string) => `userProfile:${uid}`;

export const [AuthProvider, useAuth] = createContextHook((): AuthContextType => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { shouldUseFirestore, isCloudStrict, setCloudError } = useDataMode();

  const entitlementState: EntitlementState = useMemo(() => {
    return globalEntitlementEngine.evaluateEntitlement({
      subscriptionStatus: userProfile?.subscriptionStatus,
      subscriptionEndsAt: userProfile?.subscriptionEndsAt,
      trialEndsAt: userProfile?.trialEndsAt,
      lastVerifiedAt: userProfile?.lastLoginAt,
    });
  }, [userProfile]);

  const isAuthenticated = !!user;
  const isPremium = entitlementState.isPremium;
  const isTrialActive = entitlementState.status === 'trial';
  const capabilities = entitlementState.capabilities;

  const trialDaysLeft = userProfile?.trialEndsAt
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

  const parseCachedProfile = useCallback((jsonStr: string): UserProfile | null => {
    try {
      const data = JSON.parse(jsonStr);
      return {
        ...data,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : new Date(),
        trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : undefined,
        subscriptionEndsAt: data.subscriptionEndsAt ? new Date(data.subscriptionEndsAt) : undefined,
        onboardingCompleted: Boolean(data.onboardingCompleted),
        usageStats: {
          ...data.usageStats,
          lastSessionDate: data.usageStats?.lastSessionDate ? new Date(data.usageStats.lastSessionDate) : undefined,
        },
      };
    } catch {
      return null;
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

  const toFirestoreProfile = useCallback((profile: UserProfile, isNewProfile = false) => {
    const raw: Record<string, any> = {
      uid: profile.uid,
      email: profile.email ?? null,
      displayName: profile.displayName ?? null,
      createdAt: Timestamp.fromDate(profile.createdAt),
      lastLoginAt: Timestamp.fromDate(profile.lastLoginAt),
      onboardingCompleted: Boolean(profile.onboardingCompleted),
      onboardingPreferences: profile.onboardingPreferences ?? null,
      usageStats: {
        ...profile.usageStats,
        lastSessionDate: profile.usageStats.lastSessionDate
          ? Timestamp.fromDate(profile.usageStats.lastSessionDate)
          : null,
      },
    };

    if (isNewProfile) {
      raw.subscriptionStatus = profile.subscriptionStatus || 'free';
      raw.subscriptionType = profile.subscriptionType ?? null;
      raw.trialEndsAt = profile.trialEndsAt ? Timestamp.fromDate(profile.trialEndsAt) : null;
      raw.subscriptionEndsAt = profile.subscriptionEndsAt ? Timestamp.fromDate(profile.subscriptionEndsAt) : null;
      raw.cancelAtPeriodEnd = profile.cancelAtPeriodEnd ?? null;
    }

    return sanitizeForFirestore(raw);
  }, []);

  const saveUserProfile = useCallback(async (profile: UserProfile, isNewProfile = false) => {
    if (!profile?.uid?.trim()) return;

    // 1. Always persist profile to AsyncStorage for instant local retrieval
    try {
      await AsyncStorage.setItem(getUserProfileStorageKey(profile.uid), JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile to AsyncStorage:', e);
    }

    // 2. Persist to Firestore if cloud sync is enabled
    if (!shouldUseFirestore) return;

    const userRef = doc(db, 'users', profile.uid);
    const dataToSave = toFirestoreProfile(profile, isNewProfile);

    if (__DEV__) {
      const currentUser = auth.currentUser;
      console.log('[Firestore Profile Save Diagnostics]', {
        authCurrentUserExists: Boolean(currentUser),
        authCurrentUserUid: currentUser?.uid || null,
        authCurrentUserEmail: currentUser?.email || null,
        targetFirestorePath: userRef.path,
        operationType: isNewProfile ? 'create/set' : 'update/setMerge',
        payloadFields: Object.keys(dataToSave),
      });
    }

    try {
      await setDoc(userRef, dataToSave, { merge: true });
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      setCloudError(`Failed to save user profile: ${errMsg}`);
      if (isCloudStrict) {
        throw error;
      }
      console.warn('Firestore profile save warning:', errMsg);
      throw new Error(`Profile write failed (${error?.code || 'error'}): ${errMsg}`);
    }
  }, [toFirestoreProfile, shouldUseFirestore, isCloudStrict, setCloudError]);

  const loadUserProfile = useCallback(async (uid: string, currentAuthUser?: AuthUser | null) => {
    if (!uid?.trim()) return;

    const email = currentAuthUser?.email || user?.email || '';
    const displayName = currentAuthUser?.displayName || user?.displayName || null;

    // 1. Check local AsyncStorage cache first
    let cachedProfile: UserProfile | null = null;
    try {
      const cachedRaw = await AsyncStorage.getItem(getUserProfileStorageKey(uid));
      if (cachedRaw) {
        cachedProfile = parseCachedProfile(cachedRaw);
      }
    } catch (e) {
      console.warn('Failed reading cached user profile:', e);
    }

    const fallbackProfile = cachedProfile || createUserProfile({ uid, email, displayName });
    setUserProfile(fallbackProfile);

    if (!shouldUseFirestore) return;

    // 2. Fetch remote profile from Firestore
    try {
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 8000);

      try {
        const userRef = doc(db, 'users', uid);
        const snapshot = await getDoc(userRef);
        clearTimeout(timeoutId);

        if (snapshot.exists()) {
          const remoteProfile = mapProfileFromFirestore(snapshot.data());
          // Merge local onboardingCompleted status if completed locally but not yet synced to remote
          const mergedProfile: UserProfile = {
            ...remoteProfile,
            onboardingCompleted: remoteProfile.onboardingCompleted || fallbackProfile.onboardingCompleted,
            onboardingPreferences: remoteProfile.onboardingPreferences || fallbackProfile.onboardingPreferences,
            lastLoginAt: new Date(),
          };
          setUserProfile(mergedProfile);
          await saveUserProfile(mergedProfile, false);
          return;
        }

        // New profile -> save default
        await saveUserProfile(fallbackProfile, true);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error: any) {
      if (isCloudStrict) {
        setCloudError(`Failed to load user profile: ${error?.message || error}`);
        throw error;
      }
      console.warn('Firestore unavailable, using local profile cache');
    }
  }, [createUserProfile, parseCachedProfile, mapProfileFromFirestore, saveUserProfile, user, shouldUseFirestore, isCloudStrict, setCloudError]);

  useEffect(() => {
    let mounted = true;
    let resolved = false;

    const safetyTimeout = setTimeout(() => {
      if (mounted && !resolved) {
        resolved = true;
        console.warn('Auth safety timeout fired — forcing loading state off');
        setIsLoading(false);
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
          setIsLoading(false);
          return;
        }

        setUser(authUser);
        setIsLoading(false);

        loadUserProfile(authUser.uid, authUser).catch(() => {
          console.warn('Background profile load failed, using fallback');
        });
      });

      return () => {
        mounted = false;
        clearTimeout(safetyTimeout);
        unsubscribe();
      };
    } catch {
      if (mounted && !resolved) {
        resolved = true;
        clearTimeout(safetyTimeout);
        setIsLoading(false);
      }
      return () => {
        mounted = false;
        clearTimeout(safetyTimeout);
      };
    }
  }, [loadUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!email?.trim() || !password?.trim()) {
      throw new Error('Email and password are required');
    }

    try {
      setIsLoading(true);
      await authService.signIn(email.trim(), password);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    if (!email?.trim() || !password?.trim()) {
      throw new Error('Email and password are required');
    }

    try {
      setIsLoading(true);
      const authUser = await authService.signUp(email.trim(), password);

      const profile = createUserProfile({
        ...authUser,
        displayName: displayName?.trim() || authUser.displayName,
      });

      setUserProfile(profile);
      await saveUserProfile(profile, true);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, [createUserProfile, saveUserProfile]);

  const signOut = useCallback(async (options?: { clearLocalData?: boolean }) => {
    try {
      await authService.signOut();
      if (options?.clearLocalData && userProfile?.uid) {
        await AsyncStorage.multiRemove([
          USAGE_EVENTS_STORAGE_KEY,
          getUserProfileStorageKey(userProfile.uid),
        ]).catch(() => {});
      }
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      throw error;
    }
  }, [userProfile?.uid]);

  /**
   * Update profile using strict field allowlisting and dual storage persistence.
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
    refreshSubscriptionStatus,
    startTrial,
    upgradeToPremium,
    trackUsage,
  }), [
    user,
    userProfile,
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
    refreshSubscriptionStatus,
    startTrial,
    upgradeToPremium,
    trackUsage,
  ]);
});
