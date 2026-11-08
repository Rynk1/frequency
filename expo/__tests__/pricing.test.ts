import { describe, it, expect } from 'vitest';
import {
  PREMIUM_PLANS,
  PREMIUM_PRODUCT_IDS,
  PREMIUM_TRIAL_DAYS,
  formatPrice,
  getPlanBillingNote,
  getYearlyMonthlyPrice,
  getYearlySavingsPercent,
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
});
