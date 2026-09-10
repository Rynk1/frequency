import { auth, db } from './firebase';
import { getIdToken } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  EntitlementCapabilities,
  EntitlementState,
} from './entitlements/entitlement-types';
import { computeCapabilities } from './entitlements/entitlement-service';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || '';

export type Plan = 'monthly' | 'yearly';

export interface PremiumPolicyConfig {
  freeSessionMaxDuration: number; // in seconds (e.g. 15 * 60)
  dailyFreeSessionsLimit: number; // e.g. 3
  premiumPreviewDuration: number; // in seconds (e.g. 180 = 3 minutes)
  offlineGracePeriodHours: number; // e.g. 72
}

export const DEFAULT_PREMIUM_POLICY: PremiumPolicyConfig = {
  freeSessionMaxDuration: 15 * 60, // 15 minutes in seconds
  dailyFreeSessionsLimit: 3,
  premiumPreviewDuration: 180, // 3 minutes
  offlineGracePeriodHours: 72,
};

export interface SubscriptionStatus {
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  subscriptionStatus: 'free' | 'premium' | 'trial';
  subscriptionType?: 'monthly' | 'yearly';
  subscriptionEndsAt?: string;
  trialEndsAt?: string;
  willRenew: boolean;
  cancelAtPeriodEnd: boolean;
  source?: 'google_play' | 'revenuecat' | 'stripe';
  lastVerifiedAt?: string;
}

export { computeCapabilities };

async function getIdTokenSafe(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated. Please sign in to manage your subscription.');
  return await getIdToken(user, true);
}

async function apiCall<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE) {
    throw new Error('API base URL not configured.');
  }

  const token = await getIdTokenSafe();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.error || body.detail || body.message || detail;
    } catch {
      // ignore parse error
    }
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

/**
 * Reconcile subscription state with trusted server.
 * Reads entitlements/{uid} and subscriptions/{uid} to synchronize local app state.
 */
export async function reconcileSubscription(): Promise<{
  isPremium: boolean;
  subscriptionStatus: 'free' | 'premium' | 'trial';
  entitlement?: any;
}> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { isPremium: false, subscriptionStatus: 'free' };
  }

  if (API_BASE) {
    try {
      const data = await apiCall<{ success: boolean; entitlement?: any }>('/reconcileSubscription', { method: 'POST' });
      if (data?.entitlement) {
        return {
          isPremium: Boolean(data.entitlement.isPremium),
          subscriptionStatus: data.entitlement.isPremium ? 'premium' : 'free',
          entitlement: data.entitlement,
        };
      }
    } catch (e) {
      console.warn('API reconciliation failed, checking Firestore entitlement doc:', e);
    }
  }

  // Direct Firestore Entitlement Read Fallback
  try {
    const entRef = doc(db, 'entitlements', currentUser.uid);
    const snap = await getDoc(entRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        isPremium: Boolean(data.isPremium),
        subscriptionStatus: data.isPremium ? 'premium' : 'free',
        entitlement: data,
      };
    }
  } catch (err) {
    console.warn('Firestore entitlement lookup failed:', err);
  }

  return { isPremium: false, subscriptionStatus: 'free' };
}

/**
 * Restore purchases workflow:
 * Triggers server-side reconciliation to verify current platform subscription state.
 */
export async function restorePurchases(): Promise<{
  success: boolean;
  isPremium: boolean;
  message: string;
}> {
  const result = await reconcileSubscription();
  return {
    success: true,
    isPremium: result.isPremium,
    message: result.isPremium
      ? 'Your premium subscription has been verified and restored.'
      : 'No active premium subscription found for your account.',
  };
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const reconciled = await reconcileSubscription();
  return {
    isPremium: reconciled.isPremium,
    isTrialActive: false,
    trialDaysLeft: 0,
    subscriptionStatus: reconciled.subscriptionStatus,
    willRenew: reconciled.isPremium,
    cancelAtPeriodEnd: false,
    source: 'revenuecat',
    lastVerifiedAt: new Date().toISOString(),
  };
}
