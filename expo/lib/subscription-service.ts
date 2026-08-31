import { auth } from './firebase';
import { getIdToken } from 'firebase/auth';

/**
 * Client-side subscription service.
 * Calls the Hono backend (Vercel serverless) which talks to Stripe.
 *
 * Flow:
 *  1. createCheckoutSession(plan)  → returns Stripe Checkout URL → redirect
 *  2. createBillingPortalSession() → manage/cancel subscription
 *  3. getSubscriptionStatus()      → server-verified entitlement
 *
 * The backend webhook (POST /api/webhook) receives Stripe events and
 * writes subscriptionStatus to Firestore via firebase-admin. The client
 * NEVER mutates subscription fields — only the server does.
 */

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_RORK_API_BASE_URL || '';

export type Plan = 'monthly' | 'yearly';

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
}

async function getIdTokenSafe(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated. Please sign in to manage your subscription.');
  return await getIdToken(user, true);
}

async function apiCall<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!API_BASE) {
    throw new Error('API base URL not configured. Set EXPO_PUBLIC_API_BASE_URL.');
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
 * Create a Stripe Checkout Session for a subscription plan.
 * Returns a URL the client redirects to (expo-web-browser).
 */
export async function createCheckoutSession(
  plan: Plan,
  options?: { trialEnabled?: boolean }
): Promise<{ url: string }> {
  return apiCall<{ url: string }>('/api/subscription/checkout', {
    method: 'POST',
    body: JSON.stringify({
      plan,
      trialEnabled: options?.trialEnabled ?? true,
    }),
  });
}

/**
 * Create a Stripe Customer Portal session so the user can
 * manage / cancel their subscription.
 */
export async function createBillingPortalSession(): Promise<{ url: string }> {
  return apiCall<{ url: string }>('/api/subscription/portal', {
    method: 'POST',
  });
}

/**
 * Get the server-verified subscription status.
 * This is the source of truth for entitlements — not client state.
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return apiCall<SubscriptionStatus>('/api/subscription/status');
}

/**
 * Cancel the active subscription at period end.
 */
export async function cancelSubscription(): Promise<{ success: boolean; cancelAtPeriodEnd: boolean }> {
  return apiCall<{ success: boolean; cancelAtPeriodEnd: boolean }>('/api/subscription/cancel', {
    method: 'POST',
  });
}

/**
 * Resume a cancelled subscription (remove cancellation).
 */
export async function resumeSubscription(): Promise<{ success: boolean; cancelAtPeriodEnd: boolean }> {
  return apiCall<{ success: boolean; cancelAtPeriodEnd: boolean }>('/api/subscription/resume', {
    method: 'POST',
  });
}
