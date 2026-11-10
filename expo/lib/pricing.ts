/**
 * Canonical subscription pricing for HarmonyFrequency.
 *
 * The authoritative price a user actually pays lives in Google Play Console
 * (surfaced through RevenueCat offerings at runtime). These constants are the
 * single in-repo fallback so the paywall, the subscription result screen and
 * the admin console never disagree with each other.
 *
 * When the store price is available the paywall renders the store value; keep
 * these numbers, the Google Play subscription products and the RevenueCat
 * entitlement aligned whenever a price changes.
 */

export type BillingPlanId = 'monthly' | 'yearly';

export interface BillingPlan {
  id: BillingPlanId;
  /** Store subscription product id (Google Play / App Store + RevenueCat). */
  productId: string;
  /** Human label shown on the plan card. */
  label: string;
  /** Fallback price amount in `currency`. */
  price: number;
  currency: string;
}

export const PREMIUM_PRODUCT_IDS: Record<BillingPlanId, string> = {
  monthly: 'monthly_premium',
  yearly: 'yearly_premium',
};

export const PREMIUM_TRIAL_DAYS = 7;

export const PREMIUM_PLANS: Record<BillingPlanId, BillingPlan> = {
  monthly: {
    id: 'monthly',
    productId: PREMIUM_PRODUCT_IDS.monthly,
    label: 'Monthly',
    price: 9.99,
    currency: 'USD',
  },
  yearly: {
    id: 'yearly',
    productId: PREMIUM_PRODUCT_IDS.yearly,
    label: 'Yearly',
    price: 59.99,
    currency: 'USD',
  },
};

export function formatPrice(amount: number, currency = 'USD'): string {
  const symbol = currency === 'USD' ? '$' : `${currency} `;
  return `${symbol}${amount.toFixed(2)}`;
}

/** Effective per-month price of the annual plan. */
export function getYearlyMonthlyPrice(): number {
  return PREMIUM_PLANS.yearly.price / 12;
}

/** Billing cadence note for a plan card, derived from the canonical price. */
export function getPlanBillingNote(plan: BillingPlanId): string {
  if (plan === 'yearly') {
    return `Billed annually at ${formatPrice(PREMIUM_PLANS.yearly.price)}`;
  }
  return 'Billed monthly · Cancel anytime';
}

/**
 * Whole days remaining in a trial, as the single source of truth for every
 * "N days left" label in the app.
 *
 * Clamped to a minimum of 1 while the trial is still running so a user on their
 * final day is never shown "0 days left", and 0 once it has ended.
 */
export function getTrialDaysLeft(
  trialEndsAt?: Date | string | number | null,
  nowMs: number = Date.now()
): number {
  if (!trialEndsAt) return 0;
  const end = trialEndsAt instanceof Date ? trialEndsAt.getTime() : new Date(trialEndsAt).getTime();
  if (!Number.isFinite(end) || end <= nowMs) return 0;
  return Math.max(1, Math.ceil((end - nowMs) / (1000 * 60 * 60 * 24)));
}

/** Percentage saved by paying annually versus twelve monthly payments. */
export function getYearlySavingsPercent(
  monthlyPrice: number = PREMIUM_PLANS.monthly.price,
  yearlyPrice: number = PREMIUM_PLANS.yearly.price
): number {
  const monthlyAnnualized = monthlyPrice * 12;
  if (monthlyAnnualized <= 0) return 0;
  const saved = monthlyAnnualized - yearlyPrice;
  return Math.max(0, Math.round((saved / monthlyAnnualized) * 100));
}

/**
 * Savings percentage computed from the live store prices when both are known,
 * falling back to the canonical constants. Keeps the paywall's "Save X%" badge
 * consistent with the prices the user is actually charged.
 */
export function getSavingsPercentForOfferings(offerings?: {
  monthly?: { price?: number };
  yearly?: { price?: number };
} | null): number {
  const monthly = offerings?.monthly?.price;
  const yearly = offerings?.yearly?.price;
  if (typeof monthly === 'number' && monthly > 0 && typeof yearly === 'number' && yearly > 0) {
    return getYearlySavingsPercent(monthly, yearly);
  }
  return getYearlySavingsPercent();
}
