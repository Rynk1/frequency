import { describe, it, expect } from 'vitest';
import { PureToneGenerator } from '../../lib/audio/PureToneGenerator';
import { AudioValidator } from '../../lib/audio/AudioValidator';

/**
 * Calculates fundamental frequency using zero-crossing period analysis
 */
function estimateFundamentalFrequency(samples: Float32Array, sampleRate: number): number {
  let zeroCrossings = 0;
  let firstCrossingIndex = -1;
  let lastCrossingIndex = -1;

  for (let i = 0; i < samples.length - 1; i++) {
    if ((samples[i] <= 0 && samples[i + 1] > 0) || (samples[i] >= 0 && samples[i + 1] < 0)) {
      zeroCrossings++;
      if (firstCrossingIndex === -1) {
        firstCrossingIndex = i;
      }
      lastCrossingIndex = i;
    }
  }

  const numCycles = (zeroCrossings - 1) / 2;
  const durationInSamples = lastCrossingIndex - firstCrossingIndex;
  const durationInSeconds = durationInSamples / sampleRate;

  return numCycles / durationInSeconds;
}

describe('PureToneGenerator', () => {
  it('validates pure tone specs correctly', () => {
    expect(AudioValidator.validate({ modality: 'pure_tone', frequency: 528 }).isValid).toBe(true);
    expect(AudioValidator.validate({ modality: 'pure_tone', frequency: 0 }).isValid).toBe(false);
    expect(AudioValidator.validate({ modality: 'pure_tone', frequency: -100 }).isValid).toBe(false);
    expect(AudioValidator.validate({ modality: 'pure_tone', frequency: 30000 }).isValid).toBe(false); // exceeds Nyquist
  });

  it('generates accurate 528 Hz pure tone', () => {
    const data = PureToneGenerator.generate({ modality: 'pure_tone', frequency: 528 });
    expect(data.numSamples).toBe(44100);
    expect(data.numChannels).toBe(1);

    const estimatedHz = estimateFundamentalFrequency(data.samplesLeft, data.sampleRate);
    expect(Math.abs(estimatedHz - 528)).toBeLessThan(0.1);
  });

  it('generates accurate 432 Hz pure tone', () => {
    const data = PureToneGenerator.generate({ modality: 'pure_tone', frequency: 432 });
    const estimatedHz = estimateFundamentalFrequency(data.samplesLeft, data.sampleRate);
    expect(Math.abs(estimatedHz - 432)).toBeLessThan(0.1);
  });

  it('generates accurate 639 Hz pure tone', () => {
    const data = PureToneGenerator.generate({ modality: 'pure_tone', frequency: 639 });
    const estimatedHz = estimateFundamentalFrequency(data.samplesLeft, data.sampleRate);
    expect(Math.abs(estimatedHz - 639)).toBeLessThan(0.1);
  });

  it('generates accurate fractional frequency (194.18 Hz)', () => {
    const data = PureToneGenerator.generate({ modality: 'pure_tone', frequency: 194.18 });
    const estimatedHz = estimateFundamentalFrequency(data.samplesLeft, data.sampleRate);
    expect(Math.abs(estimatedHz - 194.18)).toBeLessThan(0.5);
  });
});
