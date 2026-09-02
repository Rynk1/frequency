import { FrequencyAudioSpec } from './AudioTypes';
import { PureToneGenerator, GeneratedAudioData } from './PureToneGenerator';
import { BinauralGenerator } from './BinauralGenerator';

export class SignalGenerator {
  /**
   * Computes a deterministic cache key for the audio specification.
   * Key distinguishes pure tones from binaural beats (e.g. pure-tone-528, binaural-200-1.5).
   */
  static getCacheKey(spec: FrequencyAudioSpec): string {
    if (spec.modality === 'pure_tone') {
      const freq = Math.round(spec.frequency * 100) / 100;
      return `pure-tone-${freq}`;
    }
    const carrier = Math.round(spec.carrierFrequency * 100) / 100;
    const beat = Math.round(spec.beatFrequency * 100) / 100;
    return `binaural-${carrier}-${beat}`;
  }

  /**
   * Synthesizes audio samples for a given spec.
   */
  static synthesize(
    spec: FrequencyAudioSpec,
    sampleRate: number = 44100,
    targetDurationSeconds: number = 1.0
  ): GeneratedAudioData {
    if (spec.modality === 'pure_tone') {
      return PureToneGenerator.generate(spec, sampleRate, targetDurationSeconds);
    }
    return BinauralGenerator.generate(spec, sampleRate, targetDurationSeconds);
  }

  /**
   * Encodes GeneratedAudioData into a 16-bit PCM WAV binary ArrayBuffer.
   * Supports 1 (mono) or 2 (stereo) channels.
   */
  static encodeWavBuffer(audioData: GeneratedAudioData): ArrayBuffer {
    const { samplesLeft, samplesRight, sampleRate, numSamples, numChannels } = audioData;
    const bytesPerSample = 2; // 16-bit PCM
    const dataSize = numSamples * numChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i++) {
        view.setUint8(offset + i, value.charCodeAt(i));
      }
    };

    // RIFF Header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');

    // fmt Chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true); // NumChannels (1 or 2)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // ByteRate
    view.setUint16(32, numChannels * bytesPerSample, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample (16)

    // data Chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Sample Interleaving
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      // Clamp float values to [-1.0, 1.0] before converting to int16
      const sampleL = Math.max(-1.0, Math.min(1.0, samplesLeft[i]));
      const int16L = Math.round(sampleL * 32767);
      view.setInt16(offset, int16L, true);
      offset += 2;

      if (numChannels === 2) {
        const sampleR = Math.max(-1.0, Math.min(1.0, samplesRight[i]));
        const int16R = Math.round(sampleR * 32767);
        view.setInt16(offset, int16R, true);
        offset += 2;
      }
    }

    return buffer;
  }

  /**
   * Encodes ArrayBuffer to base64 string.
   */
  static bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let base64 = '';
    const len = bytes.length;

    for (let i = 0; i < len; i += 3) {
      const a = bytes[i];
      const b = bytes[i + 1];
      const c = bytes[i + 2];

      const b1 = a >> 2;
      const b2 = ((a & 3) << 4) | (b !== undefined ? b >> 4 : 0);
      const b3 = b !== undefined ? ((b & 15) << 2) | (c !== undefined ? c >> 6 : 0) : 64;
      const b4 = c !== undefined ? c & 63 : 64;

      base64 += chars[b1] + chars[b2] + (b3 === 64 ? '=' : chars[b3]) + (b4 === 64 ? '=' : chars[b4]);
    }

    return base64;
  }
}
