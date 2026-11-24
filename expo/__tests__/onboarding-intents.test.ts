import { describe, it, expect } from 'vitest';
import {
  ONBOARDING_INTENTS,
  defaultOnboardingIntent,
  onboardingIntentById,
} from '../lib/onboarding/intents';
import { INTENT_CATEGORIES } from '../lib/catalogue/intent-taxonomy';

describe('onboarding intents', () => {
  it('offers six needs, not frequency techniques', () => {
    expect(ONBOARDING_INTENTS).toHaveLength(6);
  });

  it('uses unique intent ids that exist in the taxonomy', () => {
    const ids = ONBOARDING_INTENTS.map((intent) => intent.id);
    expect(new Set(ids).size).toBe(ids.length);
    const known = new Set(INTENT_CATEGORIES.map((category) => category.id));
    for (const id of ids) {
      expect(known.has(id), `${id} is not a known intent`).toBe(true);
    }
  });

  it('maps every intent to a stored goal value that existing profiles accept', () => {
    const storedGoals = ['focus', 'sleep', 'meditation', 'healing'];
    for (const intent of ONBOARDING_INTENTS) {
      expect(storedGoals).toContain(intent.goal);
    }
  });

  it('leads with sleep, the largest search intent', () => {
    expect(defaultOnboardingIntent().id).toBe('sleep');
  });

  it('uses plain, claim-free wording', () => {
    for (const intent of ONBOARDING_INTENTS) {
      const text = `${intent.title} ${intent.description}`;
      expect(text).not.toMatch(/healing|heals|cures|treats|proven|guaranteed/i);
      expect(text).not.toContain('!');
    }
  });

  it('resolves an intent by id', () => {
    expect(onboardingIntentById('focus')?.title).toBe('Focus and study');
    expect(onboardingIntentById('sleep')?.goal).toBe('sleep');
  });
});
