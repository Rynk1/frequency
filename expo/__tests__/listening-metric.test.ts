import { describe, it, expect } from 'vitest';
import { isListeningSession, MIN_LISTENING_SECONDS } from '../lib/metrics/listening';

describe('listening session definition', () => {
  it('counts five minutes or more', () => {
    expect(MIN_LISTENING_SECONDS).toBe(300);
    expect(isListeningSession(299, false)).toBe(false);
    expect(isListeningSession(300, false)).toBe(true);
  });

  it('counts a timer-ended session even if it was shorter', () => {
    expect(isListeningSession(120, true)).toBe(true);
  });

  it('does not count a preview', () => {
    expect(isListeningSession(180, false)).toBe(false);
  });
});
