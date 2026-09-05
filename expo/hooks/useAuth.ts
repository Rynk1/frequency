import { useState, useEffect, useCallback, useMemo } from 'react';
import { authService, AuthUser } from '@/lib/firebase-auth';
import createContextHook from '@nkzw/create-context-hook';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { useDataMode } from './useDataMode';
import {
  computeCapabilities,
  EntitlementCapabilities,
  EntitlementState,
} from '@/lib/subscription-service';

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  subscriptionStatus: 'free' | 'premium' | 'trial';
  subscriptionType?: 'monthly' | 'yearly';
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  createdAt: Date;
  lastLoginAt: Date;
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
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  /**
   * Refresh subscription entitlement from the server (Stripe / Google Play / RevenueCat via Firebase).
   * This is the source of truth — the client never mutates subscription fields.
   */
  refreshSubscriptionStatus: () => Promise<void>;
  /**
   * @deprecated Subscription is now managed via checkout. This is a no-op
   * kept for backwards compatibility — use createCheckoutSession from lib/subscription-service.
   */
  startTrial: (options?: { hasAcceptedAutoRenew: boolean }) => Promise<void>;
  /**
   * @deprecated Use checkout via lib/subscription-service instead.
   */
  upgradeToPremium: (type: 'monthly' | 'yearly') => Promise<void>;
  trackUsage: (sessionDuration: number, frequency: string) => Promise<void>;
}

const TRIAL_DURATION_DAYS = 7;

export const [AuthProvider, useAuth] = createContextHook((): AuthContextType => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { shouldUseFirestore, isCloudStrict, setCloudError } = useDataMode();

  const isAuthenticated = !!user;
  const isPremium = userProfile?.subscriptionStatus === 'premium';
  const isTrialActive = Boolean(userProfile?.subscriptionStatus === 'trial' &&
    userProfile?.trialEndsAt && new Date() < userProfile.trialEndsAt);

  const trialDaysLeft = userProfile?.trialEndsAt
    ? Math.max(0, Math.ceil((userProfile.trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const capabilities = useMemo(
    () => computeCapabilities(isPremium || isTrialActive),
    [isPremium, isTrialActive]
  );

  const entitlementState: EntitlementState = useMemo(() => {
    let status: EntitlementState['status'] = 'free';
    if (isPremium) status = 'active';
    else if (isTrialActive) status = 'trial';
    else if (userProfile?.subscriptionStatus === 'trial' && !isTrialActive) status = 'expired';

    return {
      isPremium: isPremium || isTrialActive,
      status,
      expiresAt: userProfile?.subscriptionEndsAt,
      trialEndsAt: userProfile?.trialEndsAt,
      source: 'stripe',
      lastVerifiedAt: userProfile?.lastLoginAt,
      capabilities,
    };
  }, [isPremium, isTrialActive, userProfile, capabilities]);

  const createUserProfile = useCallback((authUser: AuthUser): UserProfile => {
    const now = new Date();
    return {
      uid: authUser.uid,
      email: authUser.email || '',
      displayName: authUser.displayName || undefined,
      subscriptionStatus: 'free',
      createdAt: now,
      lastLoginAt: now,
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

    // Use the explicitly-passed auth user (fresh from callback) instead of
    // React state which may be stale due to batching.
    const email = currentAuthUser?.email || user?.email || '';
    const displayName = currentAuthUser?.displayName || user?.displayName || null;

    // Local-only fallback profile (works even without Firestore)
    const localProfile = createUserProfile({
      uid,
      email,
      displayName,
    });

    // Set local profile immediately — don't wait for Firestore
    setUserProfile(localProfile);

    // If in local mode, skip Firestore entirely
    if (!shouldUseFirestore) return;

    try {
      // 8-second timeout on Firestore operations to prevent hanging
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
          // Fire-and-forget: update lastLoginAt silently
          updateDoc(userRef, { lastLoginAt: Timestamp.fromDate(updatedProfile.lastLoginAt) }).catch(() => {});
          return;
        }

        // New user — persist to Firestore in background
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
      // Firestore unavailable — in-memory profile already set above, non-fatal
      console.warn('Firestore unavailable, using local profile only');
    }
  }, [createUserProfile, mapProfileFromFirestore, toFirestoreProfile, user, shouldUseFirestore, isCloudStrict, setCloudError]);

  // ── Auth initialization — production-grade with guaranteed resolution ──
  useEffect(() => {
    let mounted = true;
    let resolved = false;

    // Ultimate safety net: force isLoading to false after 5 seconds no matter what.
    // This prevents the app from being stuck on the loading screen forever.
    const safetyTimeout = setTimeout(() => {
      if (mounted && !resolved) {
        resolved = true;
        console.warn('Auth safety timeout fired — forcing loading state off');
        setIsLoading(false);
      }
    }, 5000);

    // Short backup timeout for cases where Firebase initializes quickly
    // but the callback fires synchronously before React can process
    const fastSafetyTimeout = setTimeout(() => {
      if (mounted && !resolved) {
        resolved = true;
        console.warn('Auth fast safety timeout fired — auth callback never arrived');
        setIsLoading(false);
      }
    }, 1500);

    try {
      const unsubscribe = authService.onAuthStateChanged((authUser) => {
        if (!mounted || resolved) return;
        resolved = true;

        // Clear safety timeouts — we got a response from Firebase
        clearTimeout(safetyTimeout);
        clearTimeout(fastSafetyTimeout);

        if (!authUser?.uid?.trim()) {
          // No signed-in user — resolve immediately, no Firestore needed
          setUser(null);
          setUserProfile(null);
          setIsLoading(false);
          return;
        }

        // User is signed in — set user state immediately so UI can render
        setUser(authUser);
        // Mark loading as done NOW — profile can load in the background
        setIsLoading(false);

        // Load profile asynchronously in the background — don't block the UI
        loadUserProfile(authUser.uid, authUser).catch(() => {
          // Profile load failure is non-fatal — user is already authenticated
          console.warn('Background profile load failed, using fallback');
        });
      });

      return () => {
        mounted = false;
        clearTimeout(safetyTimeout);
        clearTimeout(fastSafetyTimeout);
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
        clearTimeout(fastSafetyTimeout);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps — only run on mount
  }, []);

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
      // Firestore unavailable — in-memory state is authoritative
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
      // Only persist to Firestore if in cloud/auto mode
      if (shouldUseFirestore) {
        await saveUserProfile(profile);
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, [createUserProfile, saveUserProfile, shouldUseFirestore]);

  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
      // User state will be updated by the auth state listener
    } catch (error) {
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;

    const updatedProfile = { ...userProfile, ...updates };
    setUserProfile(updatedProfile);
    await saveUserProfile(updatedProfile);
  }, [userProfile, saveUserProfile]);

  // ── Subscription status refresh (server-verified) ──
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
      // Non-fatal — entitlement checks fall back to cached profile state
      console.warn('Subscription status refresh failed:', error?.message || error);
    }
  }, [user]);

  /**
   * @deprecated Trial now starts via checkout (lib/subscription-service).
   */
  const startTrial = useCallback(async (_options?: { hasAcceptedAutoRenew: boolean }) => {
    console.warn('startTrial() is deprecated. Use createCheckoutSession() from lib/subscription-service.');
    throw new Error('Trial must be started through checkout.');
  }, []);

  /**
   * @deprecated Upgrades now go through checkout.
   */
  const upgradeToPremium = useCallback(async (_type: 'monthly' | 'yearly') => {
    console.warn('upgradeToPremium() is deprecated. Use createCheckoutSession() from lib/subscription-service.');
    throw new Error('Upgrades must go through checkout.');
  }, []);

  const trackUsage = useCallback(async (sessionDuration: number, frequency: string) => {
    if (!userProfile || !frequency?.trim()) return;

    const sanitizedFrequency = frequency.trim();
    const now = new Date();
    const todayISO = now.toISOString().split('T')[0];
    const lastSessionDate = userProfile.usageStats.lastSessionDate;

    // Calculate streak
    let streakDays = userProfile.usageStats.streakDays;
    if (lastSessionDate) {
      const daysDiff = Math.floor((now.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        streakDays += 1;
      } else if (daysDiff > 1) {
        streakDays = 1;
      }
    } else {
      streakDays = 1;
    }

    // Update favorite frequencies
    const favoriteFrequencies = [...userProfile.usageStats.favoriteFrequencies];
    if (!favoriteFrequencies.includes(sanitizedFrequency)) {
      favoriteFrequencies.push(sanitizedFrequency);
    }

    // Track session history for weekly stats (keep last 30 days)
    const sessionHistory = [...userProfile.usageStats.sessionHistory, todayISO]
      .filter((date, idx, arr) => arr.indexOf(date) === idx) // dedupe
      .filter(date => {
        const d = new Date(date);
        return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 30; // keep 30 days
      });

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
  }, [userProfile, updateProfile]);

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
