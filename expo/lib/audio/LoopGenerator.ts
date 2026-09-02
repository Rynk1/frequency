/**
 * LoopGenerator
 *
 * Computes cycle-exact phase-aligned buffer sample counts and adjusted frequencies
 * to eliminate phase discontinuities (clicks/pops) at loop boundaries.
 */

export interface LoopBufferParams {
  numSamples: number;
  actualFrequency: number;
}

export function computeLoopBufferParams(
  targetFrequency: number,
  sampleRate: number = 44100,
  targetDurationSeconds: number = 1.0
): LoopBufferParams {
  if (targetFrequency <= 0) {
    throw new Error(`Invalid target frequency: ${targetFrequency}`);
  }

  // Determine nominal cycle count N for target duration
  const nominalCycles = Math.round(targetFrequency * targetDurationSeconds);
  const N = Math.max(1, nominalCycles);

  // Exact sample count S for N cycles at targetFrequency
  const exactSamples = N * (sampleRate / targetFrequency);
  const S = Math.round(exactSamples);

  // Adjusted frequency ensuring exact phase completion at sample S
  // phase(S) = 2 * PI * actualFrequency * (S / sampleRate) = 2 * PI * N
  const actualFrequency = N * (sampleRate / S);

  return {
    numSamples: S,
    actualFrequency,
  };
}
