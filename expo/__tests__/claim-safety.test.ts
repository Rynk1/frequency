import { describe, it, expect } from 'vitest';
import { getFrequenciesSeed } from '../seed/frequencies';
import { getProgramsSeed } from '../seed/programs';
import { getArticlesSeed } from '../seed/articles';
import {
  FREQUENCY_COPY,
  MEDICAL_DISCLAIMER,
  PULSING_TONE_SAFETY_NOTE,
  SAFETY_NOTE,
} from '../lib/catalogue/copy';
import { DEFAULT_PAYWALL_COPY, PAYWALL_INTENT_COPY } from '../lib/catalogue/paywall-copy';
import { PREMIUM_BENEFITS } from '../lib/premium-benefits';
import { STRINGS } from '../lib/copy/strings';

type Source = { where: string; text: string };

const NEGATION = /\b(not|no|never|cannot|without|rather than|instead of|isn't|aren't|doesn't|does not)\b/i;

const FORBIDDEN: { pattern: RegExp; allowNegated: boolean; label: string }[] = [
  { pattern: /\bcures?\b/gi, allowNegated: true, label: 'cure' },
  { pattern: /\bheals?\b/gi, allowNegated: true, label: 'heal' },
  { pattern: /\btreats?\b/gi, allowNegated: true, label: 'treats' },
  { pattern: /\bproven\b/gi, allowNegated: true, label: 'proven' },
  { pattern: /\bguaranteed\b/gi, allowNegated: true, label: 'guaranteed' },
  { pattern: /\brepairs? DNA\b/gi, allowNegated: true, label: 'DNA repair' },
  { pattern: /\bwill make you rich\b/gi, allowNegated: false, label: 'rich promise' },
  { pattern: /\battract (wealth|money)\b/gi, allowNegated: true, label: 'attract wealth' },
  { pattern: /\beliminates? (anxiety|depression|pain)\b/gi, allowNegated: false, label: 'eliminates condition' },
  { pattern: /\breplaces? medication\b/gi, allowNegated: false, label: 'replaces medication' },
  { pattern: /\balzheimer/gi, allowNegated: false, label: 'Alzheimer reference' },
  { pattern: /\bcancer\b/gi, allowNegated: true, label: 'cancer reference' },
];

function isNegated(text: string, index: number): boolean {
  return NEGATION.test(text.slice(Math.max(0, index - 60), index));
}

function violationsIn(text: string): string[] {
  const found: string[] = [];
  for (const { pattern, allowNegated, label } of FORBIDDEN) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      if (allowNegated && isNegated(text, match.index)) continue;
      found.push(`${label}: "${match[0]}"`);
    }
  }
  return found;
}

function promotionalStrings(): Source[] {
  const out: Source[] = [];
  for (const frequency of getFrequenciesSeed()) {
    out.push({ where: `${frequency.id} name`, text: frequency.name });
    out.push({ where: `${frequency.id} description`, text: frequency.description });
    for (const benefit of frequency.benefits ?? []) {
      out.push({ where: `${frequency.id} benefit`, text: benefit });
    }
    out.push({ where: `${frequency.id} purpose`, text: frequency.purpose ?? '' });
    out.push({ where: `${frequency.id} scientific basis`, text: frequency.scientificBasis ?? '' });
    out.push({ where: `${frequency.id} background`, text: frequency.background ?? '' });
  }
  for (const program of getProgramsSeed()) {
    out.push({ where: `program ${program.id} name`, text: program.name });
    out.push({ where: `program ${program.id} description`, text: program.description });
  }
  for (const article of getArticlesSeed()) {
    out.push({ where: `article ${article.id} title`, text: article.title });
    for (const point of article.keyPoints ?? []) {
      out.push({ where: `article ${article.id} key point`, text: point });
    }
    for (const tip of article.practicalTips ?? []) {
      out.push({ where: `article ${article.id} practical tip`, text: tip });
    }
    out.push({ where: `article ${article.id} scientific basis`, text: article.scientificBasis ?? '' });
    out.push({ where: `article ${article.id} historical context`, text: article.historicalContext ?? '' });
  }
  for (const [id, copy] of Object.entries(FREQUENCY_COPY)) {
    out.push({ where: `copy ${id} display name`, text: copy.displayName });
    out.push({ where: `copy ${id} hook`, text: copy.hook });
    out.push({ where: `copy ${id} use case`, text: copy.useCaseLine });
    out.push({ where: `copy ${id} why`, text: copy.whyPeopleUseIt });
    out.push({ where: `copy ${id} about`, text: copy.aboutThisSound });
    out.push({ where: `copy ${id} evidence note`, text: copy.evidenceNote });
  }
  for (const [id, copy] of Object.entries(PAYWALL_INTENT_COPY)) {
    out.push({ where: `paywall ${id} headline`, text: copy.headline });
    out.push({ where: `paywall ${id} body`, text: copy.body });
  }
  out.push({ where: 'paywall default headline', text: DEFAULT_PAYWALL_COPY.headline });
  out.push({ where: 'paywall default body', text: DEFAULT_PAYWALL_COPY.body });
  for (const benefit of PREMIUM_BENEFITS) {
    out.push({ where: `premium benefit ${benefit.id}`, text: benefit.text });
  }
  for (const [key, value] of Object.entries(STRINGS)) {
    out.push({ where: `string ${key}`, text: value });
  }
  return out;
}

describe('claim safety scan', () => {
  it('finds no forbidden claim in any promotional string', () => {
    const violations: string[] = [];
    for (const { where, text } of promotionalStrings()) {
      for (const violation of violationsIn(text)) {
        violations.push(`${where} -> ${violation}`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('scans a meaningful number of strings', () => {
    expect(promotionalStrings().length).toBeGreaterThan(200);
  });

  it('keeps a plain medical disclaimer and safety note available', () => {
    expect(MEDICAL_DISCLAIMER).toContain('not medical advice');
    expect(MEDICAL_DISCLAIMER).toContain('not a substitute for professional care');
    expect(MEDICAL_DISCLAIMER).toContain('Individual experience varies');
    expect(SAFETY_NOTE).toContain('Do not listen while driving');
    expect(PULSING_TONE_SAFETY_NOTE).toContain('epilepsy');
    expect(PULSING_TONE_SAFETY_NOTE).toContain('pregnant');
  });

  it('keeps healing out of primary names and titles', () => {
    const primary = [
      ...getFrequenciesSeed().map((frequency) => frequency.name),
      ...getProgramsSeed().map((program) => program.name),
      ...getArticlesSeed().map((article) => article.title),
      ...Object.values(FREQUENCY_COPY).map((copy) => copy.displayName),
    ];
    for (const text of primary) {
      expect(text, `"${text}" still says healing`).not.toMatch(/healing/i);
    }
  });
});
