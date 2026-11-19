export type AudioModality = 'pure_tone' | 'binaural_beat';

export interface PureToneSpec {
  id?: string;
  modality: 'pure_tone';
  frequency: number;
  amplitude?: number; // 0.0 to 1.0 (default 0.2 safe max)
}

export interface BinauralBeatSpec {
  id?: string;
  modality: 'binaural_beat';
  carrierFrequency: number;
  beatFrequency: number;
  amplitude?: number; // 0.0 to 1.0 (default 0.2 safe max)
  /**
   * Set when a catalogue entry declared a sub-audible rate and was promoted to
   * a binaural beat for audibility. Entitlement checks use this value so the
   * carrier never changes which tier the content belongs to.
   */
  declaredFrequency?: number;
}

export type FrequencyAudioSpec = PureToneSpec | BinauralBeatSpec;

export interface AudioPlaybackState {
  isPlaying: boolean;
  spec: FrequencyAudioSpec | null;
  name: string;
  volume: number; // 0.0 to 1.0
  error: string | null;
}
