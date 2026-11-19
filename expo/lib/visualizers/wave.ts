/**
 * Geometry for the player's wave and equaliser visuals.
 *
 * Kept as pure functions so the shapes can be unit-tested without rendering,
 * and so the animated components only have to interpolate between two paths.
 */

export interface WaveOptions {
  width: number;
  height: number;
  /** Number of crests across the full width. */
  cycles: number;
  amplitude: number;
  phase: number;
  samples?: number;
}

/**
 * Points for a sine wave across `width`, vertically centred.
 *
 * Returns pairs rather than a path string so callers can build either a smooth
 * curve or a polyline without re-deriving the maths.
 */
export function wavePoints({
  width,
  height,
  cycles,
  amplitude,
  phase,
  samples = 64,
}: WaveOptions): Array<[number, number]> {
  const mid = height / 2;
  const count = Math.max(2, samples);
  const points: Array<[number, number]> = [];
  for (let i = 0; i < count; i += 1) {
    const x = (i / (count - 1)) * width;
    const y = mid + Math.sin((i / (count - 1)) * Math.PI * 2 * cycles + phase) * amplitude;
    points.push([x, y]);
  }
  return points;
}

/**
 * An SVG path string through `points`, using quadratic midpoints.
 *
 * A raw polyline looks like a saw at low sample counts; interpolating through
 * midpoints keeps the crests round, which is what makes the wave read as calm
 * rather than jagged.
 */
export function smoothPath(points: Array<[number, number]>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;

  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    d += ` Q ${x0} ${y0} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

/**
 * Bar heights for an equaliser, as 0..1 fractions.
 *
 * `seed` keeps each frequency's bar pattern stable between renders so the
 * visualiser does not reshuffle when an unrelated state changes.
 */
export function equalizerBars(count: number, phase: number, seed = 1): number[] {
  const bars: number[] = [];
  for (let i = 0; i < count; i += 1) {
    // Two incommensurate waves plus a per-bar offset read as organic rather
    // than a repeating pattern the eye can lock onto.
    const a = Math.sin(phase + i * 0.55);
    const b = Math.sin(phase * 1.7 + i * 0.23 + seed);
    bars.push(Math.min(1, Math.max(0.08, 0.42 + a * 0.28 + b * 0.2)));
  }
  return bars;
}

/**
 * Number of wave crests to draw for a given frequency.
 *
 * Maps 100 Hz → 2 crests up to 1000 Hz → 8, so a higher tone visibly looks
 * higher-pitched. Capped so the wave never turns into visual noise.
 */
export function cyclesForFrequency(hz: number): number {
  if (!Number.isFinite(hz) || hz <= 0) return 3;
  const scaled = 2 + (Math.log10(hz) - 2) * 6;
  return Math.min(8, Math.max(2, Math.round(scaled)));
}

/** Amplitude that shrinks on short stages so crests never clip. */
export function amplitudeForHeight(height: number): number {
  return Math.max(6, height * 0.22);
}
