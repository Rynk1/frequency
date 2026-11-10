import { describe, it, expect } from 'vitest';
import { redirectSystemPath } from '../app/+native-intent';

/**
 * The Google Play / App Store return URLs carry `?subscription=success|cancelled`
 * (and optionally `session_id`). If the deep-link normaliser drops those params,
 * the user returns from payment to a blank root route and never sees the
 * confirmation screen — so this behaviour is locked down here.
 */
describe('redirectSystemPath', () => {
  it('preserves subscription return deep links so the result screen is reachable', () => {
    expect(redirectSystemPath({ path: 'myapp://?subscription=success', initial: false }))
      .toBe('/?subscription=success');
    expect(redirectSystemPath({ path: 'myapp://?subscription=cancelled&session_id=abc', initial: true }))
      .toBe('/?subscription=cancelled&session_id=abc');
    // Universal-link shape must also survive.
    expect(redirectSystemPath({ path: 'https://harmonyfrequency.app/?subscription=success', initial: true }))
      .toBe('/?subscription=success');
  });

  it('funnels unrelated deep links to the root (Journey landing)', () => {
    expect(redirectSystemPath({ path: 'myapp://some/other/path', initial: false })).toBe('/');
    expect(redirectSystemPath({ path: '/', initial: true })).toBe('/');
  });
});
