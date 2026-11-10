import { describe, it, expect } from 'vitest';
import {
  PREMIUM_PLANS,
  PREMIUM_PRODUCT_IDS,
  PREMIUM_TRIAL_DAYS,
  formatPrice,
  getPlanBillingNote,
  getTrialDaysLeft,
  getYearlyMonthlyPrice,
  getYearlySavingsPercent,
  getSavingsPercentForOfferings,
} from '../lib/pricing';

describe('canonical premium pricing', () => {
  it('uses the Google Play subscription product ids', () => {
    expect(PREMIUM_PRODUCT_IDS.monthly).toBe('monthly_premium');
    expect(PREMIUM_PRODUCT_IDS.yearly).toBe('yearly_premium');
    expect(PREMIUM_PLANS.monthly.productId).toBe(PREMIUM_PRODUCT_IDS.monthly);
    expect(PREMIUM_PLANS.yearly.productId).toBe(PREMIUM_PRODUCT_IDS.yearly);
  });

  it('exposes the single source of truth for the monthly and yearly figures', () => {
    expect(PREMIUM_PLANS.monthly.price).toBe(9.99);
    expect(PREMIUM_PLANS.yearly.price).toBe(59.99);
    expect(PREMIUM_TRIAL_DAYS).toBe(7);
  });

  it('derives the displayed labels from the canonical numbers', () => {
    expect(formatPrice(PREMIUM_PLANS.monthly.price)).toBe('$9.99');
    expect(formatPrice(PREMIUM_PLANS.yearly.price)).toBe('$59.99');
    expect(getYearlyMonthlyPrice()).toBeCloseTo(59.99 / 12, 5);
    expect(getPlanBillingNote('yearly')).toBe('Billed annually at $59.99');
    expect(getPlanBillingNote('monthly')).toContain('monthly');
  });

  it('reports the annual savings implied by the canonical numbers', () => {
    // 12 * 9.99 = 119.88 vs 59.99 => 50% saving.
    expect(getYearlySavingsPercent()).toBe(50);
  });

  it('derives savings from live store prices so the badge matches what users pay', () => {
    // Real store prices differ from the fallback constants (e.g. regional pricing).
    expect(getYearlySavingsPercent(10, 60)).toBe(50);
    expect(getYearlySavingsPercent(12, 60)).toBe(58);
    expect(getYearlySavingsPercent(0, 60)).toBe(0);
  });

  it('prefers live store offerings but falls back to the canonical constants', () => {
    expect(getSavingsPercentForOfferings({ monthly: { price: 12 }, yearly: { price: 60 } })).toBe(58);
    expect(getSavingsPercentForOfferings({ monthly: { price: 9.99 }, yearly: { price: 59.99 } })).toBe(50);
    // Missing / partial offerings fall back to the constants (50%).
    expect(getSavingsPercentForOfferings(null)).toBe(50);
    expect(getSavingsPercentForOfferings({ monthly: { price: 12 } })).toBe(50);
    expect(getSavingsPercentForOfferings({ yearly: { price: 60 } })).toBe(50);
  });

  it('reports trial days left as a single clamped source of truth', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z');
    // Full week ahead.
    expect(getTrialDaysLeft('2026-01-08T00:00:00.000Z', now)).toBe(7);
    // Final partial day is still "1 day left", never "0".
    expect(getTrialDaysLeft('2026-01-01T05:00:00.000Z', now)).toBe(1);
    // Ended / missing / invalid -> 0.
    expect(getTrialDaysLeft('2025-12-31T23:00:00.000Z', now)).toBe(0);
    expect(getTrialDaysLeft(undefined, now)).toBe(0);
    expect(getTrialDaysLeft('not-a-date', now)).toBe(0);
    // Accepts a Date instance (as the auth profile stores).
    expect(getTrialDaysLeft(new Date('2026-01-04T00:00:00.000Z'), now)).toBe(3);
  });
});
