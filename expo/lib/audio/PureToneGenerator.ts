import { PureToneSpec } from './AudioTypes';
import { computeLoopBufferParams } from './LoopGenerator';

export interface GeneratedAudioData {
  samplesLeft: Float32Array;
  samplesRight: Float32Array;
  sampleRate: number;
  numSamples: number;
  actualFrequencyLeft: number;
  actualFrequencyRight: number;
  numChannels: 1 | 2;
}

export class PureToneGenerator {
  static generate(
    spec: PureToneSpec,
    sampleRate: number = 44100,
    targetDurationSeconds: number = 1.0
  ): GeneratedAudioData {
    const freq = spec.frequency;
    const amp = spec.amplitude ?? 0.2;

    const loopParams = computeLoopBufferParams(freq, sampleRate, targetDurationSeconds);
    const numSamples = loopParams.numSamples;
    const actualFreq = loopParams.actualFrequency;

    const samplesLeft = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      samplesLeft[i] = amp * Math.sin(2 * Math.PI * actualFreq * t);
    }

    return {
      samplesLeft,
      samplesRight: samplesLeft, // Duplicated mono for stereo compatibility
      sampleRate,
      numSamples,
      actualFrequencyLeft: actualFreq,
      actualFrequencyRight: actualFreq,
      numChannels: 1,
    };
  }
}
