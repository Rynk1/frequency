import { describe, it, expect } from 'vitest';
import { freeTierRecords, getFreeToday } from '../lib/catalogue/free-today';
import { CANONICAL_PREMIUM_POLICY, PREMIUM_FREQUENCY_COUNT, TRUST_TRIANGLE_FREQUENCIES } from '../lib/usage/PremiumPolicy';

describe('free tier', () => {
  it('keeps exactly nine records free', () => {
    expect(freeTierRecords()).toHaveLength(9);
  });

  it('keeps the premium count in premium copy accurate', () => {
    expect(freeTierRecords()).toHaveLength(46 - PREMIUM_FREQUENCY_COUNT);
  });

  it('only frees trust-triangle frequencies', () => {
    for (const frequency of freeTierRecords()) {
      expect(TRUST_TRIANGLE_FREQUENCIES).toContain(frequency.hz);
    }
  });

  it('states the free limits the app enforces', () => {
    expect(CANONICAL_PREMIUM_POLICY.freeSessionMaxDuration).toBe(15 * 60);
    expect(CANONICAL_PREMIUM_POLICY.dailyFreeSessionsLimit).toBe(3);
  });
});

describe('free today', () => {
  it('is stable within a day', () => {
    const first = getFreeToday('2026-11-24');
    const second = getFreeToday('2026-11-24');
    expect(first?.id).toBe(second?.id);
  });

  it('always returns a free record', () => {
    for (const date of ['2026-01-01', '2026-06-15', '2026-12-31']) {
      const record = getFreeToday(date);
      expect(record).not.toBeNull();
      expect(record!.isPremium).toBe(false);
    }
  });

  it('rotates across the free set over time', () => {
    const ids = new Set(
      Array.from({ length: 30 }, (_, index) => getFreeToday(`2026-04-${String(index + 1).padStart(2, '0')}`)?.id)
    );
    expect(ids.size).toBeGreaterThan(1);
  });
});
