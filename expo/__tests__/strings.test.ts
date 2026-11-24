import { describe, it, expect } from 'vitest';
import { STRINGS, pluralTracks, t } from '../lib/copy/strings';

const FORBIDDEN = [
  /\bcures?\b/i,
  /\bheals?\b/i,
  /\btreats?\b/i,
  /\bproven\b/i,
  /\bguaranteed\b/i,
  /\brepairs? DNA\b/i,
  /\beliminates? (anxiety|depression|pain)\b/i,
];

describe('shared strings', () => {
  it('has a non-empty value for every key', () => {
    for (const [key, value] of Object.entries(STRINGS)) {
      expect(value.trim().length, `${key} is empty`).toBeGreaterThan(0);
    }
  });

  it('contains no forbidden claim language', () => {
    for (const [key, value] of Object.entries(STRINGS)) {
      for (const pattern of FORBIDDEN) {
        expect(value, `${key} matches ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it('uses no exclamation marks and no double spaces', () => {
    for (const [key, value] of Object.entries(STRINGS)) {
      expect(value, `${key} has an exclamation mark`).not.toContain('!');
      expect(value, `${key} has a double space`).not.toContain('  ');
    }
  });

  it('fills placeholders', () => {
    expect(t('explore.category.explore', { name: 'Sleep & Rest' })).toBe('Explore Sleep & Rest');
    expect(t('explore.category.tracks', { count: 6 })).toBe('6 tracks');
  });

  it('leaves unknown placeholders intact rather than printing undefined', () => {
    expect(t('explore.category.explore', {})).toBe('Explore {name}');
  });

  it('pluralises track counts', () => {
    expect(pluralTracks(1)).toBe('1 track');
    expect(pluralTracks(0)).toBe('0 tracks');
    expect(pluralTracks(46)).toBe('46 tracks');
  });
});
