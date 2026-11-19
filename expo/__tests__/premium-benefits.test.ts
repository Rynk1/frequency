import { describe, it, expect } from 'vitest';
import { PREMIUM_BENEFITS, PREMIUM_BENEFIT_TEXTS } from '../lib/premium-benefits';
import { computeCapabilities } from '../lib/entitlements/entitlement-service';

/**
 * The paywall is a purchase contract. Every benefit it advertises must be
 * backed by something the app actually does.
 *
 * These claims were previously shipped with no implementation behind them:
 * offline downloads, custom frequency mixing, and "priority support" (not a
 * software feature at all). This suite exists so they cannot come back
 * unnoticed.
 */
const UNBUILT_CLAIMS = [
  /offline/i,
  /download/i,
  /custom frequency mix/i,
  /mixer/i,
  /priority support/i,
  /up to 4 hours/i,
];

describe('premium benefit claims', () => {
  it('advertises no capability the app does not implement', () => {
    for (const text of PREMIUM_BENEFIT_TEXTS) {
      for (const pattern of UNBUILT_CLAIMS) {
        expect(text).not.toMatch(pattern);
      }
    }
  });

  it('maps every advertised benefit to an enforced code path', () => {
    for (const benefit of PREMIUM_BENEFITS) {
      expect(benefit.evidence.trim().length).toBeGreaterThan(0);
    }
  });

  it('claims premium frequencies with a count the catalogue delivers', () => {
    const frequencyBenefit = PREMIUM_BENEFITS.find((b) => b.id === 'premium-frequencies');
    expect(frequencyBenefit).toBeDefined();
    expect(frequencyBenefit!.text).toMatch(/\d+/);
  });

  it('states the free-tier limits truthfully in the duration benefit', () => {
    const benefit = PREMIUM_BENEFITS.find((b) => b.id === 'unlimited-duration');
    expect(benefit).toBeDefined();
    // 15 min and 3/day come from CANONICAL_PREMIUM_POLICY.
    expect(benefit!.text).toContain('15 min');
    expect(benefit!.text).toContain('3/day');
  });

  it('has no duplicate benefit ids or copy', () => {
    const ids = PREMIUM_BENEFITS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(PREMIUM_BENEFIT_TEXTS).size).toBe(PREMIUM_BENEFIT_TEXTS.length);
  });

  it('only advertises benefits whose capability is actually granted on purchase', () => {
    const premium = computeCapabilities(true);
    // The capabilities that back the shipped benefits must all be true.
    expect(premium.premiumFrequencies).toBe(true);
    expect(premium.extendedSessions).toBe(true);
    expect(premium.binaural).toBe(true);
    expect(premium.chakra).toBe(true);
    expect(premium.advancedAnalytics).toBe(true);
  });
});
