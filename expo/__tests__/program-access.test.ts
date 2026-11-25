import { describe, it, expect } from 'vitest';
import { getProgramsSeed } from '../seed/programs';
import { isProgramLocked } from '../lib/catalogue/program-access';
import { getFrequenciesSeed } from '../seed/frequencies';

describe('program access', () => {
  it('locks only programs the seed marks premium', () => {
    expect(isProgramLocked(true, false)).toBe(true);
    expect(isProgramLocked(true, true)).toBe(false);
    expect(isProgramLocked(false, false)).toBe(false);
    expect(isProgramLocked(undefined, false)).toBe(false);
  });

  it('gates every premium program in the seed', () => {
    const programs = getProgramsSeed();
    const premium = programs.filter((program) => program.isPremium);
    expect(premium.length).toBeGreaterThan(0);
    for (const program of premium) {
      expect(isProgramLocked(program.isPremium, false), `${program.name} is not locked`).toBe(true);
      expect(isProgramLocked(program.isPremium, true), `${program.name} is locked for a member`).toBe(false);
    }
  });

  it('keeps exactly one free starter, with free-only tracks', () => {
    const programs = getProgramsSeed();
    const free = programs.filter((program) => !program.isPremium);
    expect(free).toHaveLength(1);
    expect(free[0].id).toBe('session-16');

    const freeIds = new Set(
      getFrequenciesSeed().filter((frequency) => !frequency.isPremium).map((frequency) => frequency.id)
    );
    for (const id of free[0].frequencies) {
      expect(freeIds.has(id), `${id} is premium but sits in the free starter`).toBe(true);
    }
  });

  it('keeps every free-program track free and every premium program locked', () => {
    const frequencies = getFrequenciesSeed();
    const byId = new Map(frequencies.map((frequency) => [frequency.id, frequency]));
    for (const program of getProgramsSeed()) {
      if (program.isPremium) {
        expect(isProgramLocked(program.isPremium, false), `${program.name} should be locked`).toBe(true);
        continue;
      }
      for (const id of program.frequencies) {
        expect(byId.get(id)?.isPremium, `${program.name} leaks premium track ${id}`).toBe(false);
      }
    }
  });
});
