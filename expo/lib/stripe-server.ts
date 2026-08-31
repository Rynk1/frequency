import Stripe from 'stripe';

/**
 * Server-side Stripe client.
 * Used by Hono backend routes (Vercel serverless functions).
 *
 * Required environment variables:
 *  - STRIPE_SECRET_KEY      (sk_live_... or sk_test_...)
 *  - STRIPE_WEBHOOK_SECRET  (whsec_...)
 *  - STRIPE_PRICE_MONTHLY   (price_... for monthly plan)
 *  - STRIPE_PRICE_YEARLY    (price_... for yearly plan)
 *
 * Public (client-safe) variables:
 *  - EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_...)
 *  - EXPO_PUBLIC_API_BASE_URL           (where the Hono backend lives)
 */

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set on the server.');
  }

  // Use the latest stable API version bundled with the installed Stripe SDK.
  // Subscription trials, promo codes, and customer portal are all supported.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stripeInstance = new Stripe(secretKey, {
    apiVersion: '2025-01-27.basil' as any,
    typescript: true,
    appInfo: { name: 'HarmonyFrequency', version: '1.0.0' },
  });

  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getPriceIdForPlan(plan: 'monthly' | 'yearly'): string {
  const key = plan === 'monthly' ? 'STRIPE_PRICE_MONTHLY' : 'STRIPE_PRICE_YEARLY';
  const priceId = process.env[key];
  if (!priceId) {
    throw new Error(`${key} environment variable is not set.`);
  }
  return priceId;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set.');
  }
  return secret;
}

export const SUBSCRIPTION_PLANS = {
  monthly: { priceId: () => getPriceIdForPlan('monthly'), trialDays: 7 },
  yearly: { priceId: () => getPriceIdForPlan('yearly'), trialDays: 7 },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

export default getStripe;
