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
}

export type FrequencyAudioSpec = PureToneSpec | BinauralBeatSpec;

export interface AudioPlaybackState {
  isPlaying: boolean;
  spec: FrequencyAudioSpec | null;
  name: string;
  volume: number; // 0.0 to 1.0
  error: string | null;
}
