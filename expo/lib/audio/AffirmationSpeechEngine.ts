import { Platform } from 'react-native';

export interface SpeechOptions {
  volume?: number;
  pitch?: number;
  rate?: number;
  language?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

export class AffirmationSpeechEngine {
  private static instance: AffirmationSpeechEngine | null = null;
  private currentUtterance: any = null;
  private isSpeakingState: boolean = false;
  private speechVolume: number = 0.8;

  private constructor() {}

  public static getInstance(): AffirmationSpeechEngine {
    if (!AffirmationSpeechEngine.instance) {
      AffirmationSpeechEngine.instance = new AffirmationSpeechEngine();
    }
    return AffirmationSpeechEngine.instance;
  }

  private getNativeSpeechModule(): any {
    try {
      const Speech = require('expo-speech');
      return Speech;
    } catch {
      return null;
    }
  }

  public speak(text: string, options: SpeechOptions = {}): void {
    this.stop();

    if (!text || text.trim().length === 0) return;

    const targetVolume = options.volume !== undefined ? Math.max(0, Math.min(1, options.volume)) : this.speechVolume;
    this.speechVolume = targetVolume;

    if (targetVolume === 0) {
      if (options.onStart) options.onStart();
      if (options.onEnd) options.onEnd();
      return;
    }

    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const SpeechClass = (window as any).SpeechSynthesisUtterance;
          if (SpeechClass) {
            const utterance = new SpeechClass(text);
            utterance.volume = targetVolume;
            utterance.rate = options.rate || 0.9;
            utterance.pitch = options.pitch || 1.0;
            if (options.language) utterance.lang = options.language;

            utterance.onstart = () => {
              this.isSpeakingState = true;
              if (options.onStart) options.onStart();
            };

            utterance.onend = () => {
              this.isSpeakingState = false;
              this.currentUtterance = null;
              if (options.onEnd) options.onEnd();
            };

            utterance.onerror = (e: any) => {
              this.isSpeakingState = false;
              this.currentUtterance = null;
              if (options.onError) options.onError(e);
            };

            this.currentUtterance = utterance;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
            return;
          }
        }
      } else {
        const NativeSpeech = this.getNativeSpeechModule();
        if (NativeSpeech && typeof NativeSpeech.speak === 'function') {
          this.isSpeakingState = true;
          if (options.onStart) options.onStart();

          NativeSpeech.speak(text, {
            volume: targetVolume,
            pitch: options.pitch || 1.0,
            rate: options.rate || 0.9,
            language: options.language || 'en-US',
            onDone: () => {
              this.isSpeakingState = false;
              if (options.onEnd) options.onEnd();
            },
            onStopped: () => {
              this.isSpeakingState = false;
            },
            onError: (err: any) => {
              this.isSpeakingState = false;
              if (options.onError) options.onError(err);
            },
          });
          return;
        }
      }

      if (options.onStart) options.onStart();
      if (options.onEnd) options.onEnd();
    } catch (err) {
      console.warn('[AffirmationSpeechEngine] Speech playback error (isolated):', err);
      this.isSpeakingState = false;
      if (options.onError) options.onError(err);
    }
  }

  public setVolume(volume: number): void {
    const validVol = Math.max(0, Math.min(1, volume));
    this.speechVolume = validVol;
    if (validVol === 0) {
      this.stop();
    }
  }

  public stop(): void {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } else {
        const NativeSpeech = this.getNativeSpeechModule();
        if (NativeSpeech && typeof NativeSpeech.stop === 'function') {
          NativeSpeech.stop();
        }
      }
    } catch {}
    this.currentUtterance = null;
    this.isSpeakingState = false;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }
}

export const globalSpeechEngine = AffirmationSpeechEngine.getInstance();
