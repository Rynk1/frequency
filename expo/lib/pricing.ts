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
  /** Cadence copy shown next to the price, e.g. "/month". */
  period: string;
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
    period: '/month',
  },
  yearly: {
    id: 'yearly',
    productId: PREMIUM_PRODUCT_IDS.yearly,
    label: 'Yearly',
    price: 59.99,
    currency: 'USD',
    period: '/month',
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

/** Percentage saved by paying annually versus twelve monthly payments. */
export function getYearlySavingsPercent(): number {
  const monthlyAnnualized = PREMIUM_PLANS.monthly.price * 12;
  if (monthlyAnnualized <= 0) return 0;
  const saved = monthlyAnnualized - PREMIUM_PLANS.yearly.price;
  return Math.round((saved / monthlyAnnualized) * 100);
}
