/**
 * Breathing guidance constants and helpers.
 *
 * The visuals are not decoration: a slow, steady pulse gives the user
 * something to pace their breath against. Six breaths per minute (one cycle
 * every 10 s) is the resonance rate used in HRV training and is the pace most
 * meditation apps settle on for a calming default. Faster cycles read as
 * stimulating, slower ones as sleepy, so 10 s is a deliberate middle.
 */
export const BREATH_CYCLE_SECONDS = 10;

/** A full inhale/exhale pair: the user breathes in for half, out for half. */
export function breathScale(elapsedSeconds: number, depth = 0.12): number {
  const phase = (elapsedSeconds % BREATH_CYCLE_SECONDS) / BREATH_CYCLE_SECONDS;
  // Ease in/out rather than a raw sine so the turnaround at the top and
  // bottom of the breath is gentle instead of mechanical.
  const eased = (1 - Math.cos(phase * Math.PI * 2)) / 2;
  return 1 + eased * depth;
}

/** 0 at the start of an inhale, 1 at the top, back to 0 at the end. */
export function breathProgress(elapsedSeconds: number): number {
  const phase = (elapsedSeconds % BREATH_CYCLE_SECONDS) / BREATH_CYCLE_SECONDS;
  return (1 - Math.cos(phase * Math.PI * 2)) / 2;
}

/** "Breathe in" / "Breathe out", so the pulse is legible without a legend. */
export function breathCue(elapsedSeconds: number): 'in' | 'out' {
  const phase = (elapsedSeconds % BREATH_CYCLE_SECONDS) / BREATH_CYCLE_SECONDS;
  return phase < 0.5 ? 'in' : 'out';
}
