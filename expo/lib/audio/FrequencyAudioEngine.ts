import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { FrequencyAudioSpec, AudioPlaybackState } from './AudioTypes';
import { AudioValidator } from './AudioValidator';
import { WebAudioRenderer } from './platform/WebAudioRenderer';
import { NativeAudioRenderer } from './platform/NativeAudioRenderer';

export class FrequencyAudioEngine {
  private webRenderer: WebAudioRenderer | null = null;
  private nativeRenderer: NativeAudioRenderer | null = null;

  private state: AudioPlaybackState = {
    isPlaying: false,
    spec: null,
    name: '',
    volume: 0.5,
    error: null,
  };

  private listeners: Set<(state: AudioPlaybackState) => void> = new Set();

  constructor() {
    if (Platform.OS === 'web') {
      this.webRenderer = new WebAudioRenderer();
    } else if (Constants.appOwnership !== 'expo') {
      this.nativeRenderer = new NativeAudioRenderer();
    }
  }

  public subscribe(listener: (state: AudioPlaybackState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<AudioPlaybackState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((listener) => listener(this.state));
  }

  public getState(): AudioPlaybackState {
    return this.state;
  }

  /**
   * Atomic playback transition:
   * Validates spec -> Prepares renderer -> Stops old sound -> Starts new sound -> Updates state
   */
  public async play(spec: FrequencyAudioSpec, name: string = ''): Promise<void> {
    const validation = AudioValidator.validate(spec);
    if (!validation.isValid) {
      const errorMsg = `Invalid audio specification: ${validation.error}`;
      this.updateState({ error: errorMsg, isPlaying: false });
      throw new Error(errorMsg);
    }

    try {
      // Stop currently active sound before starting new sound
      await this.stop();

      const volume = this.state.volume;

      if (Platform.OS === 'web' && this.webRenderer) {
        await this.webRenderer.play(spec, volume);
      } else if (this.nativeRenderer) {
        await this.nativeRenderer.play(spec, volume);
      } else {
        throw new Error('Native audio requires an Expo development build. Expo Go does not include expo-av.');
      }

      this.updateState({
        isPlaying: true,
        spec,
        name,
        error: null,
      });
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to start frequency audio playback';
      this.updateState({ isPlaying: false, error: errorMsg });
      throw err;
    }
  }

  public async setVolume(volume: number): Promise<void> {
    const validVolume = Math.max(0, Math.min(1, volume));
    this.updateState({ volume: validVolume });

    if (Platform.OS === 'web' && this.webRenderer) {
      this.webRenderer.setVolume(validVolume);
    } else if (this.nativeRenderer) {
      await this.nativeRenderer.setVolume(validVolume);
    }
  }

  public async stop(): Promise<void> {
    try {
      if (Platform.OS === 'web' && this.webRenderer) {
        await this.webRenderer.stop();
      } else if (this.nativeRenderer) {
        await this.nativeRenderer.stop();
      }
    } finally {
      this.updateState({
        isPlaying: false,
        spec: null,
        name: '',
        error: null,
      });
    }
  }

  public async destroy(): Promise<void> {
    if (Platform.OS === 'web' && this.webRenderer) {
      await this.webRenderer.destroy();
      this.webRenderer = null;
    } else if (this.nativeRenderer) {
      await this.nativeRenderer.destroy();
      this.nativeRenderer = null;
    }
    this.listeners.clear();
  }
}

// Singleton Engine Instance
export const globalAudioEngine = new FrequencyAudioEngine();
