import { describe, it, expect } from 'vitest';
import {
  hashSeed,
  seededRandom,
  getLocalDateString,
  getDailyAlignment,
  getDailyChallenge,
} from '../lib/recommendation';

describe('Recommendation Engine Tests', () => {
  it('hashSeed produces deterministic hashes', () => {
    const seed1 = hashSeed('user123_2026-09-01');
    const seed2 = hashSeed('user123_2026-09-01');
    const seed3 = hashSeed('user456_2026-09-01');

    expect(seed1).toEqual(seed2);
    expect(seed1).not.toEqual(seed3);
    expect(typeof seed1).toBe('number');
  });

  it('getDailyAlignment produces stable daily selections for the same user and date', () => {
    const align1 = getDailyAlignment('user123', '2026-09-01');
    const align2 = getDailyAlignment('user123', '2026-09-01');
    const alignUser2 = getDailyAlignment('user999', '2026-09-01');

    expect(align1.dateStr).toBe('2026-09-01');
    expect(align1.frequencies.length).toBe(3);
    expect(align1.frequencies).toEqual(align2.frequencies);
    expect(align1.label).toEqual(align2.label);

    // Different user gets different selection
    expect(align1.frequencies).not.toEqual(alignUser2.frequencies);
  });

  it('getDailyChallenge is time-aware and stable', () => {
    // Morning challenge (7 AM)
    const morning1 = getDailyChallenge('user123', '2026-09-01', 7);
    const morning2 = getDailyChallenge('user123', '2026-09-01', 7);

    expect(morning1.id).toBe('challenge-2026-09-01');
    expect(morning1.title).toEqual(morning2.title);
    expect([528, 741, 432]).toContain(morning1.frequency);

    // Afternoon challenge (2 PM)
    const afternoon = getDailyChallenge('user123', '2026-09-01', 14);
    expect([40, 528, 888]).toContain(afternoon.frequency);

    // Night challenge (10 PM)
    const night = getDailyChallenge('user123', '2026-09-01', 22);
    expect([2, 6, 285]).toContain(night.frequency);
  });

  it('getLocalDateString returns valid YYYY-MM-DD string', () => {
    const d = new Date(2026, 8, 1); // Sept 1, 2026
    const str = getLocalDateString(d);
    expect(str).toBe('2026-09-01');
  });
});
