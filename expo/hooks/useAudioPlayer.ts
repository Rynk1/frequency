import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import {
  documentDirectory,
  cacheDirectory,
  makeDirectoryAsync,
  writeAsStringAsync,
  getInfoAsync,
} from 'expo-file-system/legacy';

interface AudioContextType {
  audioContext: AudioContext | null;
  oscillator: OscillatorNode | null;
  gainNode: GainNode | null;
}

interface MobileAudioType {
  sound: Audio.Sound | null;
  isLoaded: boolean;
}

export const useAudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);
  const [currentName, setCurrentName] = useState<string>('');
  const audioRef = useRef<AudioContextType>({
    audioContext: null,
    oscillator: null,
    gainNode: null,
  });
  
  const mobileAudioRef = useRef<MobileAudioType>({
    sound: null,
    isLoaded: false,
  });

  const toneCacheRef = useRef<Map<number, string>>(new Map());

  const createAudioContext = useCallback(() => {
    if (Platform.OS === 'web') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          console.error('Web Audio API not supported');
          return null;
        }
        const context = new AudioContextClass();
        console.log('AudioContext created successfully');
        return context;
      } catch (error) {
        console.error('Failed to create AudioContext:', error);
        return null;
      }
    }
    console.log('Not on web platform, using mock audio');
    return null;
  }, []);

  const generateToneFile = useCallback(async (frequency: number): Promise<string> => {
    const cached = toneCacheRef.current.get(frequency);
    if (cached) {
      return cached;
    }

    const sampleRate = 44100;
    const durationSeconds = 1;
    const amplitude = 0.8;
    const numSamples = sampleRate * durationSeconds;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, value: string) => {
      for (let i = 0; i < value.length; i++) {
        view.setUint8(offset + i, value.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = Math.sin(2 * Math.PI * frequency * t);
      view.setInt16(44 + i * 2, sample * amplitude * 32767, true);
    }

    const bytes = new Uint8Array(buffer);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let base64 = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const a = bytes[i];
      const b = bytes[i + 1];
      const c = bytes[i + 2];
      const b1 = a >> 2;
      const b2 = ((a & 3) << 4) | (b !== undefined ? b >> 4 : 0);
      const b3 = b !== undefined ? ((b & 15) << 2) | (c !== undefined ? c >> 6 : 0) : 64;
      const b4 = c !== undefined ? c & 63 : 64;
      base64 += chars[b1] + chars[b2] + (b3 === 64 ? '=' : chars[b3]) + (b4 === 64 ? '=' : chars[b4]);
    }

    // Try to persist the generated WAV to a file. If the device has no writable
    // directory (rare, but possible in Expo Go or heavily restricted Android
    // contexts), fall back to an in-memory data URI. Either way expo-av can load
    // and loop the tone, so playback continues to work.
    const baseDirectory = documentDirectory ?? cacheDirectory;
    let fileUri: string | null = null;

    if (baseDirectory) {
      try {
        const tonesDirectory = `${baseDirectory}tones/`;
        const uri = `${tonesDirectory}tone-${frequency}.wav`;
        // Check if the file already exists and is valid before re-writing.
        const info = await getInfoAsync(uri);
        if (!info.exists) {
          await makeDirectoryAsync(tonesDirectory, { intermediates: true });
          await writeAsStringAsync(uri, base64, { encoding: 'base64' });
        }
        fileUri = uri;
        console.log(`Cached tone file for ${frequency} Hz at ${uri}`);
      } catch (fsError) {
        console.warn('Tone file caching failed, will use data URI:', fsError);
      }
    }

    const finalUri = fileUri ?? `data:audio/wav;base64,${base64}`;
    toneCacheRef.current.set(frequency, finalUri);
    return finalUri;
  }, []);

  const stopFrequency = useCallback(async () => {
    try {
      console.log('Stopping frequency playback...');
      
      if (Platform.OS === 'web') {
        if (audioRef.current.oscillator) {
          try {
            audioRef.current.oscillator.stop();
            audioRef.current.oscillator.disconnect();
          } catch {
            console.log('Oscillator already stopped');
          }
        }
        
        if (audioRef.current.gainNode) {
          try {
            audioRef.current.gainNode.disconnect();
          } catch {
            console.log('GainNode already disconnected');
          }
        }
        
        audioRef.current.oscillator = null;
        audioRef.current.gainNode = null;
      } else {
        // Mobile: Stop expo-av sound
        if (mobileAudioRef.current.sound) {
          try {
            await mobileAudioRef.current.sound.stopAsync();
            await mobileAudioRef.current.sound.unloadAsync();
          } catch {
            console.log('Sound already stopped or unloaded');
          }
          mobileAudioRef.current.sound = null;
          mobileAudioRef.current.isLoaded = false;
        }
      }

      setIsPlaying(false);
      setCurrentFrequency(null);
      setCurrentName('');

      console.log('Stopped frequency playback successfully');
    } catch (error) {
      console.error('Error stopping frequency:', error);
      setIsPlaying(false);
      setCurrentFrequency(null);
      setCurrentName('');
    }
  }, []);



  const playFrequency = useCallback(async (frequency: number, name: string) => {
    try {
      console.log(`Attempting to play frequency: ${frequency} Hz (${name})`);
      
      // Stop any currently playing frequency
      if (isPlaying) {
        await stopFrequency();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (Platform.OS === 'web') {
        // Web: Use Web Audio API
        let audioContext = audioRef.current.audioContext;
        
        if (!audioContext) {
          audioContext = createAudioContext();
          if (!audioContext) {
            console.error('AudioContext not supported');
            alert('Audio playback is not supported in your browser');
            return;
          }
          audioRef.current.audioContext = audioContext;
        }

        if (audioContext.state === 'suspended') {
          console.log('Resuming suspended audio context...');
          await audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(audioContext.currentTime);

        audioRef.current.oscillator = oscillator;
        audioRef.current.gainNode = gainNode;

        setIsPlaying(true);
        setCurrentFrequency(frequency);
        setCurrentName(name);

        console.log(`Successfully playing frequency: ${frequency} Hz (${name})`);
      } else {
        // Mobile: Generate and loop a real tone file
        console.log(`Playing frequency: ${frequency} Hz (${name}) on mobile`);

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
        });

        const toneUri = await generateToneFile(frequency);
        const soundObject = new Audio.Sound();
        await soundObject.loadAsync({ uri: toneUri }, { shouldPlay: true, isLooping: true, volume: 0.5 });

        if (mobileAudioRef.current.sound) {
          await mobileAudioRef.current.sound.unloadAsync();
        }

        mobileAudioRef.current.sound = soundObject;
        mobileAudioRef.current.isLoaded = true;

        setIsPlaying(true);
        setCurrentFrequency(frequency);
        setCurrentName(name);

        console.log(`Mobile tone playback started: ${frequency} Hz (${name})`);
      }
    } catch (error) {
      console.error('Error playing frequency:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      alert(`Error playing audio: ${errorMessage}`);
      setIsPlaying(false);
      setCurrentFrequency(null);
      setCurrentName('');
    }
  }, [createAudioContext, stopFrequency, isPlaying, generateToneFile]);



  const setVolume = useCallback(async (volume: number) => {
    const targetVolume = Math.max(0, Math.min(1, volume));
    
    if (Platform.OS === 'web') {
      if (audioRef.current.gainNode && audioRef.current.audioContext) {
        const safeVolume = targetVolume * 0.2; // Cap at 0.2 for safety
        audioRef.current.gainNode.gain.linearRampToValueAtTime(
          safeVolume,
          audioRef.current.audioContext.currentTime + 0.1
        );
        console.log(`Volume set to ${Math.round(volume * 100)}%`);
      }
    } else {
      if (mobileAudioRef.current.sound && mobileAudioRef.current.isLoaded) {
        try {
          await mobileAudioRef.current.sound.setVolumeAsync(targetVolume * 0.5); // Cap at 0.5 for safety
          console.log(`Mobile volume set to ${Math.round(volume * 100)}%`);
        } catch (error) {
          console.error('Error setting mobile volume:', error);
        }
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const audioRefCurrent = audioRef.current;
    const mobileAudioRefCurrent = mobileAudioRef.current;
    
    return () => {
      // Web cleanup
      const { oscillator, audioContext } = audioRefCurrent;
      if (oscillator) {
        try {
          oscillator.stop();
          oscillator.disconnect();
        } catch {
          // Already stopped
        }
      }
      if (audioContext) {
        try {
          audioContext.close();
        } catch {
          // Already closed
        }
      }
      
      // Mobile cleanup
      if (mobileAudioRefCurrent.sound) {
        mobileAudioRefCurrent.sound.unloadAsync().catch(() => {});
      }
    };
  }, []);

  return {
    isPlaying,
    currentFrequency,
    currentName,
    playFrequency,
    stopFrequency,
    setVolume,
  };
};