import { describe, it, expect } from 'vitest';
import { freezesLeft, resolveStreakWithFreezes, WEEKLY_FREEZE_LIMIT } from '../lib/streak/freeze';
import { isNightTime, nightsThisWeek, weekKey } from '../lib/streak/nights';

describe('nights this week', () => {
  const now = new Date(2026, 10, 25, 10, 0, 0); // Wednesday 25 November 2026

  it('starts the week on Monday', () => {
    expect(weekKey(now)).toBe('2026-11-23');
    expect(weekKey(new Date(2026, 10, 22, 23, 0, 0))).toBe('2026-11-16');
  });

  it('counts unique nights in the current week only', () => {
    expect(nightsThisWeek(['2026-11-23', '2026-11-24', '2026-11-24', '2026-11-16'], now)).toBe(2);
  });

  it('uses 6pm to 4am as the night window', () => {
    expect(isNightTime(new Date(2026, 10, 25, 18, 0, 0))).toBe(true);
    expect(isNightTime(new Date(2026, 10, 25, 2, 0, 0))).toBe(true);
    expect(isNightTime(new Date(2026, 10, 25, 12, 0, 0))).toBe(false);
  });
});

describe('streak freeze', () => {
  it('allows two missed days per week', () => {
    expect(WEEKLY_FREEZE_LIMIT).toBe(2);
    const result = resolveStreakWithFreezes({ streakDays: 4, daysSinceLastSession: 3, freezesUsed: 0 });
    expect(result.streakDays).toBe(5);
    expect(result.freezesUsed).toBe(2);
    expect(result.usedFreeze).toBe(true);
  });

  it('resets when the gap is larger than the remaining freezes', () => {
    const result = resolveStreakWithFreezes({ streakDays: 4, daysSinceLastSession: 3, freezesUsed: 1 });
    expect(result.streakDays).toBe(1);
    expect(result.freezesUsed).toBe(0);
  });

  it('does not use a freeze for a consecutive day', () => {
    const result = resolveStreakWithFreezes({ streakDays: 4, daysSinceLastSession: 1, freezesUsed: 1 });
    expect(result.streakDays).toBe(5);
    expect(result.freezesUsed).toBe(1);
    expect(result.usedFreeze).toBe(false);
  });

  it('reports the freezes left for free and premium alike', () => {
    expect(freezesLeft(0)).toBe(2);
    expect(freezesLeft(2)).toBe(0);
    expect(freezesLeft(9)).toBe(0);
  });
});
