/**
 * Pure helpers for turning the server's subscription document into the exact
 * fields the paywall, settings card and result screen render.
 *
 * Kept free of Firebase / React Native imports so it is trivially testable and
 * can never pull the native stack into a unit test.
 */

export interface SubscriptionDetails {
  subscriptionType?: 'monthly' | 'yearly';
  subscriptionEndsAt?: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  willRenew: boolean;
  subscriptionStatus?: string;
}

function toIso(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000).toISOString();
  return undefined;
}

/**
 * Maps the server subscription document onto the fields the UI renders.
 *
 * A trial's single `expirationAt` is surfaced as `trialEndsAt` (not a renewal
 * date) so the paywall never claims a trial is a paid, auto-renewing period.
 */
export function normalizeSubscriptionDetails(subscription: any): SubscriptionDetails | undefined {
  if (!subscription) return undefined;
  const expiresAt = toIso(subscription.expirationAt) || toIso(subscription.subscriptionEndsAt);
  const isTrial = subscription.subscriptionStatus === 'trial';
  return {
    subscriptionType: subscription.subscriptionType,
    subscriptionEndsAt: isTrial ? undefined : expiresAt,
    trialEndsAt: isTrial ? expiresAt : undefined,
    cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd),
    willRenew: Boolean(subscription.willRenew),
    subscriptionStatus: subscription.subscriptionStatus,
  };
}
