import { describe, it, expect } from 'vitest';

interface SubscriptionStatus {
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  status: 'free' | 'premium' | 'trial';
}

function calculateEntitlement(
  status: 'free' | 'premium' | 'trial',
  trialEndsAtDate?: Date
): SubscriptionStatus {
  const isTrialActive = status === 'trial' && !!trialEndsAtDate && new Date() < trialEndsAtDate;
  const trialDaysLeft = trialEndsAtDate
    ? Math.max(0, Math.ceil((trialEndsAtDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    isPremium: status === 'premium',
    isTrialActive,
    trialDaysLeft,
    status: isTrialActive ? 'trial' : status === 'premium' ? 'premium' : 'free',
  };
}

describe('Subscription Entitlement Logic', () => {
  it('correctly locks premium features for free users', () => {
    const entitlement = calculateEntitlement('free');
    expect(entitlement.isPremium).toBe(false);
    expect(entitlement.isTrialActive).toBe(false);
    expect(entitlement.status).toBe('free');
  });

  it('correctly unlocks premium features for active premium subscribers', () => {
    const entitlement = calculateEntitlement('premium');
    expect(entitlement.isPremium).toBe(true);
    expect(entitlement.status).toBe('premium');
  });

  it('correctly calculates active trial days remaining', () => {
    const futureTrialEnd = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days in future
    const entitlement = calculateEntitlement('trial', futureTrialEnd);
    expect(entitlement.isTrialActive).toBe(true);
    expect(entitlement.trialDaysLeft).toBe(5);
  });

  it('reverts expired trials back to free state', () => {
    const pastTrialEnd = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day in past
    const entitlement = calculateEntitlement('trial', pastTrialEnd);
    expect(entitlement.isTrialActive).toBe(false);
    expect(entitlement.trialDaysLeft).toBe(0);
    expect(entitlement.status).toBe('free');
  });
});
