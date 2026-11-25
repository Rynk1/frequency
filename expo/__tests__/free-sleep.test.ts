import { describe, it, expect } from 'vitest';
import { CANONICAL_PREMIUM_POLICY } from '../lib/usage/PremiumPolicy';
import { canUseLongSleepSession, freeDurationLimitMinutes } from '../lib/usage/free-tier';
import { normalizeLedger } from '../lib/usage/SessionLedger';

describe('free sleep allowance', () => {
  it('gives sleep one 30-minute session before the normal 15-minute limit', () => {
    expect(CANONICAL_PREMIUM_POLICY.freeSleepSessionMaxDuration).toBe(30 * 60);
    expect(freeDurationLimitMinutes({ isSleep: true, sleepLongUsed: false })).toBe(30);
    expect(freeDurationLimitMinutes({ isSleep: true, sleepLongUsed: true })).toBe(15);
    expect(freeDurationLimitMinutes({ isSleep: false, sleepLongUsed: false })).toBe(15);
  });

  it('marks the long sleep allowance as used only once', () => {
    expect(canUseLongSleepSession({ isSleep: true, sleepLongUsed: false })).toBe(true);
    expect(canUseLongSleepSession({ isSleep: true, sleepLongUsed: true })).toBe(false);
    expect(canUseLongSleepSession({ isSleep: false, sleepLongUsed: false })).toBe(false);
  });

  it('resets the sleep allowance on a new local day', () => {
    const monday = new Date(2026, 10, 23, 22, 0, 0);
    const tuesday = new Date(2026, 10, 24, 8, 0, 0);
    expect(normalizeLedger({ date: '2026-11-23', starts: 2, sleepLongStarts: 1 }, monday)).toEqual({
      date: '2026-11-23',
      starts: 2,
      sleepLongStarts: 1,
    });
    expect(normalizeLedger({ date: '2026-11-23', starts: 2, sleepLongStarts: 1 }, tuesday)).toEqual({
      date: '2026-11-24',
      starts: 0,
      sleepLongStarts: 0,
    });
  });

  it('treats an old ledger without the sleep field as unused', () => {
    expect(normalizeLedger({ date: '2026-11-24', starts: 1 } as any, new Date(2026, 10, 24))).toEqual({
      date: '2026-11-24',
      starts: 1,
      sleepLongStarts: 0,
    });
  });
});
