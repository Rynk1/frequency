import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import {
  documentDirectory,
  cacheDirectory,
  makeDirectoryAsync,
  writeAsStringAsync,
  getInfoAsync,
} from 'expo-file-system/legacy';
import { FrequencyAudioSpec } from '../AudioTypes';
import { SignalGenerator } from '../SignalGenerator';

export class NativeAudioRenderer {
  private sound: Audio.Sound | null = null;
  private isLoaded: boolean = false;
  private cacheMap: Map<string, string> = new Map();

  private async getToneFileUri(spec: FrequencyAudioSpec): Promise<string> {
    const cacheKey = SignalGenerator.getCacheKey(spec);
    const cached = this.cacheMap.get(cacheKey);
    if (cached) {
      return cached;
    }

    const audioData = SignalGenerator.synthesize(spec);
    const wavBuffer = SignalGenerator.encodeWavBuffer(audioData);
    const base64 = SignalGenerator.bufferToBase64(wavBuffer);

    const baseDirectory = documentDirectory ?? cacheDirectory;
    let fileUri: string | null = null;

    if (baseDirectory) {
      try {
        const tonesDirectory = `${baseDirectory}tones/`;
        const uri = `${tonesDirectory}${cacheKey}.wav`;
        const info = await getInfoAsync(uri);
        if (!info.exists) {
          await makeDirectoryAsync(tonesDirectory, { intermediates: true });
          await writeAsStringAsync(uri, base64, { encoding: 'base64' });
        }
        fileUri = uri;
      } catch (fsError) {
        console.warn('Tone file filesystem caching failed, using data URI fallback:', fsError);
      }
    }

    const finalUri = fileUri ?? `data:audio/wav;base64,${base64}`;
    this.cacheMap.set(cacheKey, finalUri);
    return finalUri;
  }

  async play(spec: FrequencyAudioSpec, volume: number = 0.5): Promise<void> {
    await this.stop();

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      playThroughEarpieceAndroid: false,
    });

    const uri = await this.getToneFileUri(spec);
    const soundObject = new Audio.Sound();
    const safeVolume = Math.max(0, Math.min(1, volume)) * 0.5; // Cap at 0.5 for safety

    await soundObject.loadAsync(
      { uri },
      { shouldPlay: true, isLooping: true, volume: safeVolume }
    );

    this.sound = soundObject;
    this.isLoaded = true;
  }

  async setVolume(volume: number): Promise<void> {
    if (this.sound && this.isLoaded) {
      const safeVolume = Math.max(0, Math.min(1, volume)) * 0.5;
      try {
        await this.sound.setVolumeAsync(safeVolume);
      } catch (err) {
        console.warn('Error setting volume:', err);
      }
    }
  }

  async stop(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch {}
      this.sound = null;
      this.isLoaded = false;
    }
  }

  async destroy(): Promise<void> {
    await this.stop();
  }
}
