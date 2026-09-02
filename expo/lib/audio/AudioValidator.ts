import { FrequencyAudioSpec } from './AudioTypes';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const MAX_SAFE_AMPLITUDE = 0.5;
export const DEFAULT_SAMPLE_RATE = 44100;

export class AudioValidator {
  static validate(
    spec: FrequencyAudioSpec,
    sampleRate: number = DEFAULT_SAMPLE_RATE
  ): ValidationResult {
    const nyquist = sampleRate / 2;

    if (!spec || typeof spec !== 'object') {
      return { isValid: false, error: 'Specification must be a valid object' };
    }

    const amp = spec.amplitude ?? 0.2;
    if (typeof amp !== 'number' || isNaN(amp) || amp <= 0 || amp > 1.0) {
      return { isValid: false, error: `Invalid amplitude: ${amp}` };
    }

    if (spec.modality === 'pure_tone') {
      const freq = spec.frequency;
      if (typeof freq !== 'number' || isNaN(freq) || !isFinite(freq)) {
        return { isValid: false, error: `Pure tone frequency must be a finite number: ${freq}` };
      }
      if (freq <= 0) {
        return { isValid: false, error: `Pure tone frequency must be greater than 0: ${freq} Hz` };
      }
      if (freq >= nyquist) {
        return {
          isValid: false,
          error: `Pure tone frequency ${freq} Hz exceeds Nyquist limit (${nyquist} Hz)`,
        };
      }
      return { isValid: true };
    }

    if (spec.modality === 'binaural_beat') {
      const carrier = spec.carrierFrequency;
      const beat = spec.beatFrequency;

      if (typeof carrier !== 'number' || isNaN(carrier) || !isFinite(carrier)) {
        return {
          isValid: false,
          error: `Binaural carrier frequency must be a finite number: ${carrier}`,
        };
      }
      if (typeof beat !== 'number' || isNaN(beat) || !isFinite(beat)) {
        return {
          isValid: false,
          error: `Binaural beat frequency must be a finite number: ${beat}`,
        };
      }
      if (carrier <= 0) {
        return { isValid: false, error: `Binaural carrier frequency must be > 0: ${carrier} Hz` };
      }
      if (beat <= 0) {
        return { isValid: false, error: `Binaural beat frequency must be > 0: ${beat} Hz` };
      }

      const leftFreq = carrier;
      const rightFreq = carrier + beat;

      if (leftFreq >= nyquist || rightFreq >= nyquist) {
        return {
          isValid: false,
          error: `Binaural ear frequencies (${leftFreq} Hz / ${rightFreq} Hz) exceed Nyquist limit (${nyquist} Hz)`,
        };
      }

      return { isValid: true };
    }

    return { isValid: false, error: `Unknown audio modality: ${(spec as any).modality}` };
  }
}
