import { describe, it, expect } from 'vitest';
import { getFrequenciesSeed } from '../seed/frequencies';
import { getProgramsSeed } from '../seed/programs';
import { getArticlesSeed } from '../seed/articles';

describe('Seed Content Dataset Integrity', () => {
  it('contains 46 canonical frequency definitions', () => {
    const frequencies = getFrequenciesSeed();
    expect(frequencies.length).toBe(46);

    frequencies.forEach((freq) => {
      expect(freq.id).toBeDefined();
      expect(freq.name).toBeDefined();
      expect(freq.hz).toBeGreaterThan(0);
      expect(typeof freq.isPremium).toBe('boolean');
    });
  });

  it('contains 15 curated audio programs with non-empty frequency sequences', () => {
    const programs = getProgramsSeed();
    expect(programs.length).toBe(15);

    programs.forEach((prog) => {
      expect(prog.id).toBeDefined();
      expect(prog.name).toBeDefined();
      expect(prog.frequencies.length).toBeGreaterThan(0);
      expect(prog.duration).toBeGreaterThan(0);
    });
  });

  it('contains 8 deep educational learning articles', () => {
    const articles = getArticlesSeed();
    expect(articles.length).toBe(8);

    articles.forEach((art) => {
      expect(art.id).toBeDefined();
      expect(art.title).toBeDefined();
      expect(art.content.length).toBeGreaterThan(200);
      expect(art.author).toBe('Frequency Lab');
    });
  });
});
