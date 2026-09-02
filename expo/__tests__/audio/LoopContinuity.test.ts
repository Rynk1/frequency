import { describe, it, expect } from 'vitest';
import { PureToneGenerator } from '../../lib/audio/PureToneGenerator';
import { BinauralGenerator } from '../../lib/audio/BinauralGenerator';

describe('LoopContinuity', () => {
  it('ensures integer frequency (528 Hz) has zero boundary discontinuity', () => {
    const data = PureToneGenerator.generate({ modality: 'pure_tone', frequency: 528 });
    const samples = data.samplesLeft;
    const firstSample = samples[0];
    const lastSample = samples[samples.length - 1];

    // Predict next sample at loop wrap-around
    const dt = 1 / data.sampleRate;
    const predictedFirstFromLast =
      lastSample + (samples[samples.length - 1] - samples[samples.length - 2]);

    const stepDelta = Math.abs(firstSample - lastSample);
    expect(stepDelta).toBeLessThan(0.05);
  });

  it('ensures fractional frequency (194.18 Hz) computes phase-continuous loop buffer', () => {
    const data = PureToneGenerator.generate({ modality: 'pure_tone', frequency: 194.18 });
    const samples = data.samplesLeft;
    const firstSample = samples[0];
    const lastSample = samples[samples.length - 1];

    const stepDelta = Math.abs(firstSample - lastSample);
    expect(stepDelta).toBeLessThan(0.05);
  });

  it('ensures fractional frequency (7.83 Hz) computes phase-continuous loop buffer', () => {
    const data = PureToneGenerator.generate({ modality: 'pure_tone', frequency: 7.83 });
    const samples = data.samplesLeft;
    const firstSample = samples[0];
    const lastSample = samples[samples.length - 1];

    const stepDelta = Math.abs(firstSample - lastSample);
    expect(stepDelta).toBeLessThan(0.05);
  });

  it('ensures binaural beat loop buffers are continuous on both left and right channels', () => {
    const data = BinauralGenerator.generate({
      modality: 'binaural_beat',
      carrierFrequency: 200,
      beatFrequency: 1.5,
    });

    const leftDelta = Math.abs(data.samplesLeft[0] - data.samplesLeft[data.numSamples - 1]);
    const rightDelta = Math.abs(data.samplesRight[0] - data.samplesRight[data.numSamples - 1]);

    expect(leftDelta).toBeLessThan(0.05);
    expect(rightDelta).toBeLessThan(0.05);
  });
});
