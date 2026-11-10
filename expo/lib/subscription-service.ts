import { Platform } from 'react-native';
import { auth, db } from './firebase';
import { getIdToken } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { computeCapabilities } from './entitlements/entitlement-service';
import { getTrialDaysLeft } from './pricing';
import { normalizeSubscriptionDetails, type SubscriptionDetails } from './subscription-details';

export { normalizeSubscriptionDetails };
export type { SubscriptionDetails };

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
  /** Store that owns the subscription. Google Play for this mobile app. */
  source?: 'google_play' | 'revenuecat';
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
  details?: SubscriptionDetails;
}> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { isPremium: false, subscriptionStatus: 'free' };
  }

  if (API_BASE) {
    try {
      const data = await apiCall<{ success: boolean; entitlement?: any; subscription?: any }>('/reconcileSubscription', { method: 'POST' });
      if (data?.entitlement) {
        const isPremium = Boolean(data.entitlement.isPremium);
        const isTrial = data.entitlement.status === 'trial';
        return {
          isPremium,
          subscriptionStatus: isPremium ? (isTrial ? 'trial' : 'premium') : 'free',
          entitlement: data.entitlement,
          details: normalizeSubscriptionDetails(data.subscription),
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
      const isPremium = Boolean(data.isPremium);
      const isTrial = data.status === 'trial';

      // Pull the subscription document too so the plan type, renewal date and
      // auto-renew state match what the user sees in Google Play.
      let details: SubscriptionDetails | undefined;
      try {
        const subSnap = await getDoc(doc(db, 'subscriptions', currentUser.uid));
        if (subSnap.exists()) details = normalizeSubscriptionDetails(subSnap.data());
      } catch (subErr) {
        console.warn('Firestore subscription lookup failed:', subErr);
      }

      return {
        isPremium,
        subscriptionStatus: isPremium ? (isTrial ? 'trial' : 'premium') : 'free',
        entitlement: data,
        details,
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

/**
 * Deep link to the store subscription management surface.
 *
 * On mobile the store (Google Play) is the billing authority — cancellation,
 * payment method updates and plan changes must happen there, never through a
 * third-party web portal.
 */
export function getManageSubscriptionUrl(): string {
  if (Platform.OS === 'ios') {
    return 'https://apps.apple.com/account/subscriptions';
  }
  return 'https://play.google.com/store/account/subscriptions';
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const reconciled = await reconcileSubscription();
  const details = reconciled.details;
  const isTrial = reconciled.subscriptionStatus === 'trial';
  return {
    isPremium: reconciled.isPremium,
    isTrialActive: isTrial,
    trialDaysLeft: getTrialDaysLeft(details?.trialEndsAt),
    subscriptionStatus: reconciled.subscriptionStatus,
    subscriptionType: details?.subscriptionType,
    subscriptionEndsAt: details?.subscriptionEndsAt,
    trialEndsAt: details?.trialEndsAt,
    willRenew: details?.willRenew ?? reconciled.isPremium,
    cancelAtPeriodEnd: details?.cancelAtPeriodEnd ?? false,
    source: 'google_play',
    lastVerifiedAt: new Date().toISOString(),
  };
}
