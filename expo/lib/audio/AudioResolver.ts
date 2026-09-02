import { FrequencyAudioSpec } from './AudioTypes';

export class AudioResolver {
  /**
   * Resolves a raw frequency record, object, or number into a FrequencyAudioSpec.
   * Ensures binaural records have valid carrier and beat parameters, avoiding silent misrepresentation.
   */
  static resolve(item: any): FrequencyAudioSpec {
    if (typeof item === 'number') {
      return {
        modality: 'pure_tone',
        frequency: item,
      };
    }

    if (!item || typeof item !== 'object') {
      throw new Error(`Cannot resolve audio spec from invalid item: ${JSON.stringify(item)}`);
    }

    // Explicit modality if provided
    if (item.modality === 'binaural_beat') {
      const carrier = item.carrierFrequency ?? item.baseFreq;
      const beat = item.beatFrequency ?? item.beatFreq ?? item.hz;
      if (typeof carrier === 'number' && typeof beat === 'number' && carrier > 0 && beat > 0) {
        return {
          id: item.id,
          modality: 'binaural_beat',
          carrierFrequency: carrier,
          beatFrequency: beat,
        };
      }
      throw new Error(`Binaural beat record missing valid carrier or beat frequency: ${item.id || item.name}`);
    }

    if (item.modality === 'pure_tone') {
      const freq = item.frequency ?? item.hz;
      if (typeof freq === 'number' && freq > 0) {
        return {
          id: item.id,
          modality: 'pure_tone',
          frequency: freq,
        };
      }
      throw new Error(`Pure tone record missing valid frequency: ${item.id || item.name}`);
    }

    // Inspect category or fields to detect Binaural Beats
    const category = (item.category || '').toLowerCase();
    const isBinauralCategory = category === 'binaural' || category === 'binaural_beats';
    const hasBaseFreq = typeof item.baseFreq === 'number' && item.baseFreq > 0;
    const hasBeatFreq = typeof item.beatFreq === 'number' && item.beatFreq > 0;

    if (hasBaseFreq && (hasBeatFreq || typeof item.hz === 'number')) {
      const carrier = item.baseFreq;
      const beat = item.beatFreq || item.hz;
      return {
        id: item.id,
        modality: 'binaural_beat',
        carrierFrequency: carrier,
        beatFrequency: beat,
      };
    }

    if (isBinauralCategory) {
      // It is categorized as binaural, but has no carrier frequency (baseFreq).
      // Do not invent a carrier parameter! Fail resolution so it won't be misrepresented.
      throw new Error(
        `Binaural record '${item.name || item.id}' missing required carrier frequency parameter (baseFreq)`
      );
    }

    // Default to pure tone if numerical hz is present
    const hz = typeof item.hz === 'number' ? item.hz : typeof item.frequency === 'number' ? item.frequency : null;
    if (hz !== null && hz > 0) {
      return {
        id: item.id,
        modality: 'pure_tone',
        frequency: hz,
      };
    }

    throw new Error(`Unable to resolve frequency parameter for item: ${item.name || item.id}`);
  }
}
