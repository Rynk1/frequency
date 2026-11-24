import { describe, it, expect } from 'vitest';
import { getProgramsSeed } from '../seed/programs';
import { isProgramLocked } from '../lib/catalogue/program-access';

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

  it('keeps the starter programs free', () => {
    const starters = getProgramsSeed().filter((program) => ['session-1', 'session-2', 'session-3'].includes(program.id));
    expect(starters.length).toBe(3);
    for (const program of starters) {
      expect(program.isPremium, `${program.name} became premium`).toBe(false);
    }
  });
});
