import { describe, it, expect } from 'vitest';
import { normalizeSubscriptionDetails } from '../lib/subscription-details';

describe('normalizeSubscriptionDetails', () => {
  it('returns undefined when there is no subscription document', () => {
    expect(normalizeSubscriptionDetails(null)).toBeUndefined();
    expect(normalizeSubscriptionDetails(undefined)).toBeUndefined();
  });

  it('maps a paid monthly subscription to the exact figures the UI renders', () => {
    const details = normalizeSubscriptionDetails({
      subscriptionType: 'monthly',
      subscriptionStatus: 'active',
      expirationAt: '2026-12-01T00:00:00.000Z',
      cancelAtPeriodEnd: false,
      willRenew: true,
    });
    expect(details).toEqual({
      subscriptionType: 'monthly',
      subscriptionEndsAt: '2026-12-01T00:00:00.000Z',
      trialEndsAt: undefined,
      cancelAtPeriodEnd: false,
      willRenew: true,
      subscriptionStatus: 'active',
    });
  });

  it('surfaces a trial expiration as trialEndsAt, not a renewal date', () => {
    const details = normalizeSubscriptionDetails({
      subscriptionType: 'yearly',
      subscriptionStatus: 'trial',
      expirationAt: '2026-11-15T00:00:00.000Z',
      cancelAtPeriodEnd: false,
      willRenew: true,
    });
    expect(details?.trialEndsAt).toBe('2026-11-15T00:00:00.000Z');
    expect(details?.subscriptionEndsAt).toBeUndefined();
  });

  it('accepts Firestore timestamps and epoch-second objects', () => {
    const fromTimestamp = normalizeSubscriptionDetails({
      subscriptionStatus: 'active',
      expirationAt: { toDate: () => new Date('2026-12-01T00:00:00.000Z') },
    });
    expect(fromTimestamp?.subscriptionEndsAt).toBe('2026-12-01T00:00:00.000Z');

    const fromSeconds = normalizeSubscriptionDetails({
      subscriptionStatus: 'active',
      expirationAt: { seconds: 1798761600 },
    });
    expect(fromSeconds?.subscriptionEndsAt).toBe(new Date(1798761600 * 1000).toISOString());
  });

  it('reflects a cancelled renewal', () => {
    const details = normalizeSubscriptionDetails({
      subscriptionType: 'monthly',
      subscriptionStatus: 'cancelled',
      expirationAt: '2026-12-01T00:00:00.000Z',
      cancelAtPeriodEnd: true,
      willRenew: false,
    });
    expect(details?.cancelAtPeriodEnd).toBe(true);
    expect(details?.willRenew).toBe(false);
  });
});
