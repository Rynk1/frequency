import { describe, it, expect } from 'vitest';
import { getFrequenciesSeed } from '../seed/frequencies';
import {
  EVIDENCE_TIER_LABELS,
  FREQUENCY_COPY,
  PULSING_TONE_SAFETY_NOTE,
  SAFETY_NOTE,
  displayNameForFrequency,
  evidenceTierLabel,
} from '../lib/catalogue/copy';

const catalogue = getFrequenciesSeed();
const catalogueIds = new Set(catalogue.map((frequency) => frequency.id));
const entries = Object.entries(FREQUENCY_COPY);

const FORBIDDEN = [
  /\bcures?\b/i,
  /\bheals?\b/i,
  /\btreats?\b/i,
  /\bproven\b/i,
  /\bguaranteed\b/i,
  /\brepairs? DNA\b/i,
  /\battract (wealth|money)\b/i,
  /\bwill make you rich\b/i,
  /\beliminates? (anxiety|depression|pain)\b/i,
];

describe('frequency copy', () => {
  it('covers every record in the catalogue', () => {
    expect(entries).toHaveLength(catalogue.length);
    const missing = [...catalogueIds].filter((id) => !FREQUENCY_COPY[id]);
    expect(missing).toEqual([]);
  });

  it('only targets ids that exist in the catalogue', () => {
    const unknown = Object.keys(FREQUENCY_COPY).filter((id) => !catalogueIds.has(id));
    expect(unknown).toEqual([]);
  });

  it('keeps display names to five words or fewer and unique', () => {
    const names = entries.map(([, copy]) => copy.displayName);
    for (const name of names) {
      expect(name.trim().split(/\s+/).length, `${name} is too long`).toBeLessThanOrEqual(5);
    }
    expect(new Set(names).size).toBe(names.length);
  });

  it('keeps hooks under 90 characters and free of exclamation marks', () => {
    for (const [id, copy] of entries) {
      expect(copy.hook.length, `${id} hook is ${copy.hook.length} chars`).toBeLessThanOrEqual(90);
      expect(copy.hook, `${id} has an exclamation mark`).not.toContain('!');
    }
  });

  it('contains no forbidden claim language', () => {
    for (const [id, copy] of entries) {
      const text = [
        copy.displayName,
        copy.hook,
        copy.useCaseLine,
        copy.whyPeopleUseIt,
        copy.aboutThisSound,
        copy.evidenceNote,
      ].join(' ');
      for (const pattern of FORBIDDEN) {
        expect(text, `${id} matches ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it('keeps the technical Hz detail in the honest layer', () => {
    for (const [id, copy] of entries) {
      expect(copy.aboutThisSound, `${id} lost its Hz detail`).toMatch(/\d+(\.\d+)?\s?Hz/);
    }
  });

  it('states an evidence tier and note for every entry', () => {
    for (const [id, copy] of entries) {
      expect(EVIDENCE_TIER_LABELS[copy.evidenceTier], `${id} tier`).toBeTruthy();
      expect(copy.evidenceNote.trim().length, `${id} note`).toBeGreaterThan(0);
    }
  });

  it('gives practical guidance for every entry', () => {
    for (const [id, copy] of entries) {
      expect(copy.recommendedLength, `${id} length`).toMatch(/minute/);
      expect(copy.bestTimeOfDay.trim().length, `${id} best time`).toBeGreaterThan(0);
      expect(['required', 'recommended', 'optional']).toContain(copy.headphones);
      expect(copy.keywords.length, `${id} keywords`).toBeGreaterThanOrEqual(4);
    }
  });

  it('does not use "healing" in primary names or hooks', () => {
    for (const [id, copy] of entries) {
      expect(`${copy.displayName} ${copy.hook}`, `${id} uses healing`).not.toMatch(/healing/i);
    }
  });

  it('falls back to the seed name when no copy exists', () => {
    expect(displayNameForFrequency('not-a-record', 'Seed Name')).toBe('Seed Name');
    expect(displayNameForFrequency('solfeggio-528', 'Love & Harmony Pure')).toBe('Heart Calm');
  });

  it('exposes readable evidence labels and safety notes', () => {
    expect(evidenceTierLabel('popular-practice')).toBe('Popular practice');
    expect(SAFETY_NOTE).toContain('Do not listen while driving');
    expect(PULSING_TONE_SAFETY_NOTE).toContain('epilepsy');
    expect(PULSING_TONE_SAFETY_NOTE).toContain('pregnant');
  });
});
