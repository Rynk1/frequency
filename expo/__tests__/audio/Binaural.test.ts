import { describe, it, expect } from 'vitest';
import { BinauralGenerator } from '../../lib/audio/BinauralGenerator';
import { AudioValidator } from '../../lib/audio/AudioValidator';

function estimateFrequency(samples: Float32Array, sampleRate: number): number {
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

describe('BinauralGenerator', () => {
  it('validates binaural beat specs correctly', () => {
    const validSpec = {
      modality: 'binaural_beat' as const,
      carrierFrequency: 200,
      beatFrequency: 1.5,
    };
    expect(AudioValidator.validate(validSpec).isValid).toBe(true);

    const invalidCarrier = {
      modality: 'binaural_beat' as const,
      carrierFrequency: 0,
      beatFrequency: 1.5,
    };
    expect(AudioValidator.validate(invalidCarrier).isValid).toBe(false);

    const invalidBeat = {
      modality: 'binaural_beat' as const,
      carrierFrequency: 200,
      beatFrequency: -5,
    };
    expect(AudioValidator.validate(invalidBeat).isValid).toBe(false);
  });

  it('generates independent stereo channels for binaural beat (200 Hz carrier, 1.5 Hz beat)', () => {
    const spec = {
      modality: 'binaural_beat' as const,
      carrierFrequency: 200,
      beatFrequency: 1.5,
    };

    const data = BinauralGenerator.generate(spec);
    expect(data.numChannels).toBe(2);

    const leftHz = estimateFrequency(data.samplesLeft, data.sampleRate);
    const rightHz = estimateFrequency(data.samplesRight, data.sampleRate);

    expect(Math.abs(leftHz - 200)).toBeLessThan(0.2);
    expect(Math.abs(rightHz - 201.5)).toBeLessThan(0.2);

    const beatDifference = rightHz - leftHz;
    expect(Math.abs(beatDifference - 1.5)).toBeLessThan(0.1);

    // Channels must be distinct (stereo)
    expect(data.samplesLeft).not.toEqual(data.samplesRight);
  });
});
