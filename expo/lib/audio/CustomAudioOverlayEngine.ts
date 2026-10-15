import { Platform } from 'react-native';

export interface CustomAudioOverlayOptions {
  volume?: number;
  isLooping?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

export class CustomAudioOverlayEngine {
  private static instance: CustomAudioOverlayEngine | null = null;
  private nativeSound: any = null;
  private webAudioElement: HTMLAudioElement | null = null;
  private isPlayingState: boolean = false;
  private overlayVolume: number = 0.8;

  private constructor() {}

  public static getInstance(): CustomAudioOverlayEngine {
    if (!CustomAudioOverlayEngine.instance) {
      CustomAudioOverlayEngine.instance = new CustomAudioOverlayEngine();
    }
    return CustomAudioOverlayEngine.instance;
  }

  private getAudioModule(): typeof import('expo-av') | null {
    try {
      return require('expo-av');
    } catch {
      return null;
    }
  }

  public async playOverlay(uri: string | null | undefined, options: CustomAudioOverlayOptions = {}): Promise<void> {
    await this.stop();

    if (!uri || uri.trim().length === 0) return;

    const volume = options.volume !== undefined ? Math.max(0, Math.min(1, options.volume)) : this.overlayVolume;
    this.overlayVolume = volume;

    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          const audio = new Audio(uri);
          audio.volume = volume;
          audio.loop = options.isLooping || false;

          audio.onplay = () => {
            this.isPlayingState = true;
            if (options.onStart) options.onStart();
          };

          audio.onended = () => {
            this.isPlayingState = false;
            this.webAudioElement = null;
            if (options.onEnd) options.onEnd();
          };

          audio.onerror = (e) => {
            this.isPlayingState = false;
            this.webAudioElement = null;
            if (options.onError) options.onError(e);
          };

          this.webAudioElement = audio;
          await audio.play();
          return;
        }
      } else {
        const expoAv = this.getAudioModule();
        if (expoAv && expoAv.Audio) {
          const { Audio, InterruptionModeIOS, InterruptionModeAndroid } = expoAv;

          // Non-ducking dual audio session mode so frequency tone isn't suppressed
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
            shouldDuckAndroid: false,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            playThroughEarpieceAndroid: false,
          });

          const soundObject = new Audio.Sound();
          if (options.onStart) options.onStart();

          soundObject.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded) {
              if (status.didJustFinish && !status.isLooping) {
                this.isPlayingState = false;
                this.nativeSound = null;
                if (options.onEnd) options.onEnd();
              }
            } else if (status.error) {
              this.isPlayingState = false;
              if (options.onError) options.onError(status.error);
            }
          });

          await soundObject.loadAsync(
            { uri },
            { shouldPlay: true, isLooping: options.isLooping || false, volume }
          );

          this.nativeSound = soundObject;
          this.isPlayingState = true;
          return;
        }
      }

      if (options.onStart) options.onStart();
      if (options.onEnd) options.onEnd();
    } catch (err) {
      console.warn('[CustomAudioOverlayEngine] Overlay audio play error:', err);
      this.isPlayingState = false;
      if (options.onError) options.onError(err);
    }
  }

  public async setVolume(volume: number): Promise<void> {
    const safeVol = Math.max(0, Math.min(1, volume));
    this.overlayVolume = safeVol;

    if (Platform.OS === 'web' && this.webAudioElement) {
      this.webAudioElement.volume = safeVol;
    } else if (this.nativeSound) {
      try {
        await this.nativeSound.setVolumeAsync(safeVol);
      } catch (err) {
        console.warn('[CustomAudioOverlayEngine] Volume update failed:', err);
      }
    }
  }

  public async stop(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (this.webAudioElement) {
          this.webAudioElement.pause();
          this.webAudioElement.currentTime = 0;
          this.webAudioElement = null;
        }
      } else if (this.nativeSound) {
        try {
          await this.nativeSound.stopAsync();
          await this.nativeSound.unloadAsync();
        } catch {}
        this.nativeSound = null;
      }
    } catch {}
    this.isPlayingState = false;
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }
}

export const globalCustomAudioOverlayEngine = CustomAudioOverlayEngine.getInstance();
