import { BinauralBeatSpec } from './AudioTypes';
import { GeneratedAudioData } from './PureToneGenerator';
import { computeLoopBufferParams } from './LoopGenerator';

export class BinauralGenerator {
  static generate(
    spec: BinauralBeatSpec,
    sampleRate: number = 44100,
    targetDurationSeconds: number = 1.0
  ): GeneratedAudioData {
    const carrier = spec.carrierFrequency;
    const beat = spec.beatFrequency;
    const amp = spec.amplitude ?? 0.2;

    const leftFreq = carrier;
    const rightFreq = carrier + beat;

    // Determine loop sample count phase-aligned to carrier
    const leftLoop = computeLoopBufferParams(leftFreq, sampleRate, targetDurationSeconds);
    const rightLoop = computeLoopBufferParams(rightFreq, sampleRate, targetDurationSeconds);

    // Use a common buffer length that accommodates both frequencies with minimal phase error
    const numSamples = leftLoop.numSamples;
    const actualLeftFreq = leftLoop.actualFrequency;
    const actualRightFreq = rightLoop.actualFrequency;

    const samplesLeft = new Float32Array(numSamples);
    const samplesRight = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      samplesLeft[i] = amp * Math.sin(2 * Math.PI * actualLeftFreq * t);
      samplesRight[i] = amp * Math.sin(2 * Math.PI * actualRightFreq * t);
    }

    return {
      samplesLeft,
      samplesRight,
      sampleRate,
      numSamples,
      actualFrequencyLeft: actualLeftFreq,
      actualFrequencyRight: actualRightFreq,
      numChannels: 2,
    };
  }
}
