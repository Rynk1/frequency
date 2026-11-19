import { FrequencyAudioSpec } from './AudioTypes';

/**
 * Lowest frequency a typical phone speaker reproduces with usable output.
 * Below this the driver cannot move air fast enough, so a pure tone is silent.
 */
export const MIN_AUDIBLE_HZ = 20;

/** Carrier used to make a sub-audible rate perceivable as a binaural beat. */
export const DEFAULT_AUDIBLE_CARRIER_HZ = 200;

export function isSubAudible(hz: number): boolean {
  return Number.isFinite(hz) && hz > 0 && hz < MIN_AUDIBLE_HZ;
}

/**
 * A pure tone below ~20 Hz is inaudible on phone speakers. Such catalogue
 * content is delivered as a binaural beat instead: the listener hears the
 * carrier and perceives the intended rate as an amplitude modulation, rather
 * than receiving silence with a running timer.
 *
 * `declaredFrequency` keeps the catalogue's own `hz` so entitlement checks and
 * UI labels continue to reason about the rate the user selected, not the
 * carrier used to make it audible.
 */
export function ensureAudible(spec: FrequencyAudioSpec): FrequencyAudioSpec {
  if (spec.modality !== 'pure_tone') return spec;
  if (!isSubAudible(spec.frequency)) return spec;

  return {
    id: spec.id,
    modality: 'binaural_beat',
    carrierFrequency: DEFAULT_AUDIBLE_CARRIER_HZ,
    beatFrequency: spec.frequency,
    amplitude: spec.amplitude,
    declaredFrequency: spec.frequency,
  };
}
