import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PAYWALL_COPY,
  PAYWALL_INTENT_COPY,
  paywallCopyForIntent,
  paywallCopyForTrigger,
} from '../lib/catalogue/paywall-copy';
import {
  autoRenewNote,
  manageSubscriptionHint,
  secureCheckoutLabel,
  storeName,
} from '../lib/billing/platform-copy';
import { INTENT_CATEGORIES } from '../lib/catalogue/intent-taxonomy';

const FORBIDDEN = [
  /\bcures?\b/i,
  /\bheals?\b/i,
  /\btreats?\b/i,
  /\bproven\b/i,
  /\bguaranteed\b/i,
  /\bwill make you rich\b/i,
  /\battract (wealth|money)\b/i,
];

describe('paywall intent copy', () => {
  it('covers every visible intent category', () => {
    for (const category of INTENT_CATEGORIES) {
      expect(PAYWALL_INTENT_COPY[category.id], `${category.id} has no paywall copy`).toBeDefined();
    }
  });

  it('keeps headlines short and bodies readable', () => {
    for (const [id, copy] of Object.entries(PAYWALL_INTENT_COPY)) {
      expect(copy.headline.length, `${id} headline`).toBeLessThanOrEqual(60);
      expect(copy.body.length, `${id} body`).toBeLessThanOrEqual(150);
    }
  });

  it('contains no forbidden claim language', () => {
    for (const [id, copy] of Object.entries(PAYWALL_INTENT_COPY)) {
      const text = `${copy.headline} ${copy.body}`;
      for (const pattern of FORBIDDEN) {
        expect(text, `${id} matches ${pattern}`).not.toMatch(pattern);
      }
      expect(text, `${id} has an exclamation mark`).not.toContain('!');
    }
  });

  it('keeps abundance copy on mindset and intention, not money outcomes', () => {
    const copy = PAYWALL_INTENT_COPY.abundance;
    expect(`${copy.headline} ${copy.body}`).not.toMatch(/rich|wealth|income|profit/i);
  });

  it('falls back to neutral copy for unknown or missing intents', () => {
    expect(paywallCopyForIntent(undefined)).toBe(DEFAULT_PAYWALL_COPY);
    expect(paywallCopyForIntent('not-a-real-intent')).toBe(DEFAULT_PAYWALL_COPY);
    expect(paywallCopyForIntent('sleep').headline).toBe(PAYWALL_INTENT_COPY.sleep.headline);
  });
});

describe('paywall trigger copy', () => {
  const limits = { freeMinutes: 15, freeSessions: 3 };

  it('names the exact free limit in the duration trigger', () => {
    const copy = paywallCopyForTrigger('duration_limit', limits);
    expect(copy?.headline).toContain('15 minutes');
    expect(copy?.body).toContain('15 minutes');
  });

  it('names the daily session cap in the session-limit trigger', () => {
    const copy = paywallCopyForTrigger('session_limit', limits);
    expect(copy?.body).toContain('3 sessions');
  });

  it('returns null for a generic trigger so intent copy can lead', () => {
    expect(paywallCopyForTrigger('premium_content', limits)).toBeNull();
    expect(paywallCopyForTrigger(undefined, limits)).toBeNull();
  });
});

describe('platform billing copy', () => {
  it('names a real store for the current platform', () => {
    expect(['Google Play', 'the App Store', 'the store']).toContain(storeName());
  });

  it('never tells the user to manage billing somewhere generic', () => {
    expect(manageSubscriptionHint()).toMatch(/cancel your subscription/i);
    expect(secureCheckoutLabel()).toContain('Secure checkout');
    expect(autoRenewNote()).toContain('auto-renew');
  });
});
