import { describe, it, expect } from 'vitest';
import { getFrequenciesSeed } from '../seed/frequencies';
import {
  INTENT_CATEGORIES,
  FREQUENCY_INTENTS,
  INTENT_SEARCH_TERMS,
  frequencyIdsForIntent,
  frequencyMatchesIntentQuery,
  intentsForFrequency,
  intentsMatchingQuery,
  visibleIntentCategories,
} from '../lib/catalogue/intent-taxonomy';

const catalogue = getFrequenciesSeed();
const catalogueIds = catalogue.map((frequency) => frequency.id);

describe('intent taxonomy coverage', () => {
  it('maps every catalogue record to a primary intent', () => {
    for (const frequency of catalogue) {
      expect(FREQUENCY_INTENTS[frequency.id], `${frequency.id} has no intent`).toBeDefined();
      expect(intentsForFrequency(frequency.id).length).toBeGreaterThan(0);
    }
  });

  it('does not map ids that are not in the catalogue', () => {
    const unknown = Object.keys(FREQUENCY_INTENTS).filter((id) => !catalogueIds.includes(id));
    expect(unknown).toEqual([]);
  });

  it('assigns each record to exactly one primary category', () => {
    for (const mapping of Object.values(FREQUENCY_INTENTS)) {
      expect(INTENT_CATEGORIES.some((category) => category.id === mapping.primary)).toBe(true);
    }
  });

  it('covers all 46 records', () => {
    expect(catalogueIds).toHaveLength(46);
    expect(Object.keys(FREQUENCY_INTENTS)).toHaveLength(46);
  });
});

describe('intent category sizing', () => {
  it('never surfaces a category with fewer than three reachable tracks', () => {
    for (const category of visibleIntentCategories(catalogueIds)) {
      expect(
        frequencyIdsForIntent(category.id).length,
        `${category.name} is below the three-track minimum`
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it('surfaces all nine approved categories', () => {
    const visible = visibleIntentCategories(catalogueIds).map((category) => category.id);
    expect(visible).toEqual([
      'sleep',
      'calm',
      'focus',
      'meditation',
      'abundance',
      'connection',
      'body',
      'spiritual',
      'nature',
    ]);
  });

  it('gives connection three tracks through cross-listing', () => {
    expect(frequencyIdsForIntent('connection').sort()).toEqual([
      'chakra-341.3',
      'chakra-384',
      'solfeggio-639',
    ]);
  });

  it('returns no duplicate ids for a category', () => {
    for (const category of INTENT_CATEGORIES) {
      const ids = frequencyIdsForIntent(category.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('respects the available-record filter', () => {
    const onlySleep = visibleIntentCategories(['sleep-8', 'sleep-1.5', 'sleep-4.5']);
    expect(onlySleep.map((category) => category.id)).toEqual(['sleep']);
  });

  it('makes every catalogue record reachable from a visible category', () => {
    const visible = visibleIntentCategories(catalogueIds);
    const reachable = new Set(visible.flatMap((category) => frequencyIdsForIntent(category.id)));
    const unreachable = catalogueIds.filter((id) => !reachable.has(id));
    expect(unreachable).toEqual([]);
  });

  it('exposes the 13 records that Explore used to hide', () => {
    const previouslyHidden = catalogue
      .filter((frequency) => ['healing', 'sleep', 'wealth'].includes(frequency.category))
      .map((frequency) => frequency.id);
    expect(previouslyHidden).toHaveLength(13);
    const visible = visibleIntentCategories(catalogueIds);
    const reachable = new Set(visible.flatMap((category) => frequencyIdsForIntent(category.id)));
    for (const id of previouslyHidden) {
      expect(reachable.has(id), `${id} is still hidden`).toBe(true);
    }
  });
});

describe('intent search', () => {
  it('resolves the top intent queries', () => {
    expect(intentsMatchingQuery('help me sleep')).toContain('sleep');
    expect(intentsMatchingQuery('insomnia')).toContain('sleep');
    expect(intentsMatchingQuery('anxiety')).toContain('calm');
    expect(intentsMatchingQuery('stop overthinking')).toContain('calm');
    expect(intentsMatchingQuery('focus for study')).toContain('focus');
    expect(intentsMatchingQuery('adhd')).toContain('focus');
    expect(intentsMatchingQuery('money')).toContain('abundance');
    expect(intentsMatchingQuery('relationships')).toContain('connection');
    expect(intentsMatchingQuery('chakra')).toContain('spiritual');
    expect(intentsMatchingQuery('schumann')).toContain('nature');
  });

  it('matches whole words only, so "work" does not match "workout"', () => {
    expect(intentsMatchingQuery('work')).toContain('focus');
    expect(intentsMatchingQuery('workout')).not.toContain('focus');
  });

  it('returns nothing for an empty query', () => {
    expect(intentsMatchingQuery('   ')).toEqual([]);
  });

  it('maps a record to its intent when the query describes the need', () => {
    expect(frequencyMatchesIntentQuery('sleep-8', 'bedtime')).toBe(true);
    expect(frequencyMatchesIntentQuery('wealth-888', 'money')).toBe(true);
    expect(frequencyMatchesIntentQuery('solfeggio-528', 'money')).toBe(true);
    expect(frequencyMatchesIntentQuery('solfeggio-528', 'insomnia')).toBe(false);
  });

  it('gives every category a non-empty search vocabulary', () => {
    for (const category of INTENT_CATEGORIES) {
      expect(INTENT_SEARCH_TERMS[category.id].length).toBeGreaterThan(0);
    }
  });
});
