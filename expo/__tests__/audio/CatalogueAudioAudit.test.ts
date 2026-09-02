import { describe, it, expect } from 'vitest';
import { getFrequenciesSeed } from '../../seed/frequencies';
import { AudioResolver } from '../../lib/audio/AudioResolver';
import { AudioValidator } from '../../lib/audio/AudioValidator';

describe('CatalogueAudioAudit', () => {
  it('enumerates and validates every frequency record in the authoritative seed catalog', () => {
    const seedFrequencies = getFrequenciesSeed();
    expect(seedFrequencies.length).toBeGreaterThan(0);

    const auditResults: Array<{
      id: string;
      name: string;
      category: string;
      modality: string;
      signal: string;
      isValid: boolean;
      error?: string;
    }> = [];

    seedFrequencies.forEach((item) => {
      let spec;
      let isValid = false;
      let error: string | undefined;

      try {
        spec = AudioResolver.resolve(item);
        const val = AudioValidator.validate(spec);
        isValid = val.isValid;
        error = val.error;
      } catch (err: any) {
        isValid = false;
        error = err?.message || String(err);
      }

      const signalDesc =
        spec?.modality === 'pure_tone'
          ? `${spec.frequency} Hz`
          : spec?.modality === 'binaural_beat'
          ? `Carrier ${spec.carrierFrequency} Hz / Beat ${spec.beatFrequency} Hz`
          : 'Unknown';

      auditResults.push({
        id: item.id,
        name: item.name,
        category: item.category,
        modality: spec?.modality || 'unresolved',
        signal: signalDesc,
        isValid,
        error,
      });

      expect(isValid, `Catalogue item '${item.name}' (${item.id}) failed audio validation: ${error}`).toBe(true);
    });

    console.log(`Successfully audited ${auditResults.length} catalogue frequency entries.`);
  });
});
