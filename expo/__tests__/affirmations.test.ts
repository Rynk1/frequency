import { describe, it, expect, beforeEach } from 'vitest';
import { AffirmationService } from '../lib/affirmations/affirmation-service';
import { globalSpeechEngine } from '../lib/audio/AffirmationSpeechEngine';
import { LAUNCH_AFFIRMATIONS } from '../seed/affirmations';
import { AffirmationCategory } from '../types/affirmation';

describe('Affirmation Domain & Service Tests', () => {
  beforeEach(() => {
    AffirmationService.setCatalog(LAUNCH_AFFIRMATIONS);
    globalSpeechEngine.stop();
  });

  describe('Launch Catalog Content Audit', () => {
    it('contains valid, unique IDs across all entries', () => {
      const ids = LAUNCH_AFFIRMATIONS.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('ensures all entries are published and have valid text', () => {
      LAUNCH_AFFIRMATIONS.forEach((item) => {
        expect(item.status).toBe('published');
        expect(item.text).toBeDefined();
        expect(item.text.length).toBeGreaterThan(10);
        expect(item.category).toBeDefined();
        expect(item.language).toBe('en');
      });
    });

    it('removes prohibited medical or supernatural claim patterns', () => {
      const prohibitedPatterns = [/heals body/i, /cures disease/i, /dna repair/i, /guarantees wealth/i];
      LAUNCH_AFFIRMATIONS.forEach((item) => {
        prohibitedPatterns.forEach((pattern) => {
          expect(item.text).not.toMatch(pattern);
        });
      });
    });
  });

  describe('Affirmation Matching & Eligibility Service', () => {
    it('returns candidate affirmations matching selected intention', () => {
      const results = AffirmationService.getEligibleAffirmations({
        intentionCategory: 'confidence',
      });

      expect(results.length).toBeGreaterThan(0);
      results.forEach((item) => {
        const matchesCategory = item.category === 'confidence';
        const matchesTag = item.intentTags.includes('confidence');
        expect(matchesCategory || matchesTag).toBe(true);
      });
    });

    it('prioritizes frequency compatibility without dropping valid intention candidates', () => {
      const results = AffirmationService.getEligibleAffirmations({
        intentionCategory: 'financial_mindset',
        frequencyId: 'wealth-888',
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].compatibleFrequencyIds).toContain('wealth-888');
    });

    it('returns empty array when no affirmations match intention', () => {
      const results = AffirmationService.getEligibleAffirmations({
        intentionCategory: 'non_existent_category_xyz' as AffirmationCategory,
      });

      expect(results).toEqual([]);
    });

    it('provides predictable default selection and sequential next navigation', () => {
      const query = { intentionCategory: 'self_care' as AffirmationCategory };
      const defaultItem = AffirmationService.getDefaultAffirmation(query);
      expect(defaultItem).not.toBeNull();

      const nextItem = AffirmationService.getNextAffirmation(defaultItem!.id, query);
      expect(nextItem).not.toBeNull();
      expect(nextItem!.id).not.toEqual(defaultItem!.id);
    });
  });

  describe('AffirmationSpeechEngine Isolated Playback Tests', () => {
    it('handles safe speech triggers without throwing in headless environments', () => {
      expect(() => {
        globalSpeechEngine.speak('I can take steady, practical steps today.', { volume: 0.8 });
      }).not.toThrow();
    });

    it('stops speech safely and clears active state', () => {
      globalSpeechEngine.speak('Test affirmation', { volume: 0.5 });
      globalSpeechEngine.stop();
      expect(globalSpeechEngine.isSpeaking()).toBe(false);
    });

    it('honors zero volume setting without attempting speech output', () => {
      let startCalled = false;
      let endCalled = false;

      globalSpeechEngine.speak('Zero volume test', {
        volume: 0,
        onStart: () => {
          startCalled = true;
        },
        onEnd: () => {
          endCalled = true;
        },
      });

      expect(startCalled).toBe(true);
      expect(endCalled).toBe(true);
      expect(globalSpeechEngine.isSpeaking()).toBe(false);
    });
  });
});
