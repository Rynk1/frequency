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
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  usageStats: {
    sessionsCompleted: number;
    totalListeningTime: number;
    favoriteFrequencies: string[];
    streakDays: number;
    lastSessionDate?: Date;
    sessionHistory: string[]; // ISO date strings for weekly tracking
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
      onboardingCompleted: data.onboardingCompleted === undefined ? true : Boolean(data.onboardingCompleted),
      onboardingPreferences: data.onboardingPreferences,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
      stripeCustomerId: data.stripeCustomerId || undefined,
      stripeSubscriptionId: data.stripeSubscriptionId || undefined,
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

  const toFirestoreProfile = useCallback((profile: UserProfile) => ({
    ...profile,
    createdAt: Timestamp.fromDate(profile.createdAt),
    lastLoginAt: Timestamp.fromDate(profile.lastLoginAt),
    trialEndsAt: profile.trialEndsAt ? Timestamp.fromDate(profile.trialEndsAt) : null,
    subscriptionEndsAt: profile.subscriptionEndsAt ? Timestamp.fromDate(profile.subscriptionEndsAt) : null,
    usageStats: {
      ...profile.usageStats,
      lastSessionDate: profile.usageStats.lastSessionDate
        ? Timestamp.fromDate(profile.usageStats.lastSessionDate)
        : null,
    },
  }), []);

  const loadUserProfile = useCallback(async (uid: string, currentAuthUser?: AuthUser | null) => {
    if (!uid?.trim()) return;

    const email = currentAuthUser?.email || user?.email || '';
    const displayName = currentAuthUser?.displayName || user?.displayName || null;

    const localProfile = createUserProfile({
      uid,
      email,
      displayName,
    });

    setUserProfile(localProfile);

    if (!shouldUseFirestore) return;

    try {
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(() => timeoutController.abort(), 8000);

      try {
        const userRef = doc(db, 'users', uid);
        const snapshot = await getDoc(userRef);
        clearTimeout(timeoutId);

        if (snapshot.exists()) {
          const profile = mapProfileFromFirestore(snapshot.data());
          const updatedProfile = { ...profile, lastLoginAt: new Date() };
          setUserProfile(updatedProfile);
          updateDoc(userRef, { lastLoginAt: Timestamp.fromDate(updatedProfile.lastLoginAt) }).catch(() => {});
          return;
        }

        setDoc(userRef, toFirestoreProfile(localProfile), { merge: true }).catch(() => {});
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error: any) {
      if (isCloudStrict) {
        setCloudError(`Failed to load user profile: ${error?.message || error}`);
        throw error;
      }
      console.warn('Firestore unavailable, using local profile only');
    }
  }, [createUserProfile, mapProfileFromFirestore, toFirestoreProfile, user, shouldUseFirestore, isCloudStrict, setCloudError]);

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

  const saveUserProfile = useCallback(async (profile: UserProfile) => {
    if (!profile?.uid?.trim()) return;
    if (!shouldUseFirestore) return;

    try {
      const userRef = doc(db, 'users', profile.uid);
      await setDoc(userRef, toFirestoreProfile(profile), { merge: true });
    } catch (error: any) {
      if (isCloudStrict) {
        setCloudError(`Failed to save user profile: ${error?.message || error}`);
        throw error;
      }
    }
  }, [toFirestoreProfile, shouldUseFirestore, isCloudStrict, setCloudError]);

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
      if (shouldUseFirestore) {
        await saveUserProfile(profile);
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, [createUserProfile, saveUserProfile, shouldUseFirestore]);

  const signOut = useCallback(async (options?: { clearLocalData?: boolean }) => {
    try {
      await authService.signOut();
      if (options?.clearLocalData) {
        await AsyncStorage.multiRemove([USAGE_EVENTS_STORAGE_KEY]).catch(() => {});
      }
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      throw error;
    }
  }, []);

  /**
   * Update profile using strict field allowlisting.
   * Client-side code CANNOT modify subscriptionStatus, trial/subscription dates, customer IDs, or admin roles.
   */
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;

    // Filter out subscription or server-authoritative fields
    const {
      subscriptionStatus,
      subscriptionType,
      subscriptionEndsAt,
      trialEndsAt,
      stripeCustomerId,
      stripeSubscriptionId,
      cancelAtPeriodEnd,
      ...allowedUpdates
    } = updates;

    const updatedProfile = { ...userProfile, ...allowedUpdates };
    setUserProfile(updatedProfile);
    await saveUserProfile(updatedProfile);
  }, [userProfile, saveUserProfile]);

  const refreshSubscriptionStatus = useCallback(async () => {
    if (!user) return;
    try {
      const { getSubscriptionStatus } = await import('@/lib/subscription-service');
      const status = await getSubscriptionStatus();
      setUserProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          subscriptionStatus: status.subscriptionStatus,
          subscriptionType: status.subscriptionType || prev.subscriptionType,
          subscriptionEndsAt: status.subscriptionEndsAt ? new Date(status.subscriptionEndsAt) : prev.subscriptionEndsAt,
          trialEndsAt: status.trialEndsAt ? new Date(status.trialEndsAt) : prev.trialEndsAt,
          cancelAtPeriodEnd: status.cancelAtPeriodEnd,
        };
      });
    } catch (error: any) {
      console.warn('Subscription status refresh failed:', error?.message || error);
    }
  }, [user]);

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
