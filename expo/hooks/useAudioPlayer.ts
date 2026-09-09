import { useState, useEffect, useCallback } from 'react';
import { FrequencyAudioSpec, AudioPlaybackState } from '../lib/audio/AudioTypes';
import { AudioResolver } from '../lib/audio/AudioResolver';
import { globalAudioEngine } from '../lib/audio/FrequencyAudioEngine';
import { useAuth } from './useAuth';

export const useAudioPlayer = () => {
  const [engineState, setEngineState] = useState<AudioPlaybackState>(
    globalAudioEngine.getState()
  );
  const { entitlementState } = useAuth();

  useEffect(() => {
    const unsubscribe = globalAudioEngine.subscribe((state) => {
      setEngineState(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const stopFrequency = useCallback(async () => {
    await globalAudioEngine.stop();
  }, []);

  const playAudioSpec = useCallback(async (spec: FrequencyAudioSpec, name: string = '') => {
    await globalAudioEngine.play(spec, name, entitlementState);
  }, [entitlementState]);

  /**
   * playFrequency supports legacy callers:
   *   playFrequency(528, "Love & Miracles Pure")
   * as well as full frequency objects:
   *   playFrequency(frequencyRecord, "Name")
   */
  const playFrequency = useCallback(
    async (itemOrHz: any, name: string = '') => {
      try {
        let spec: FrequencyAudioSpec;
        if (typeof itemOrHz === 'number') {
          spec = AudioResolver.resolve({ hz: itemOrHz, name });
        } else {
          spec = AudioResolver.resolve(itemOrHz);
        }
        const displayName = name || itemOrHz?.name || `${spec.modality === 'pure_tone' ? spec.frequency : spec.beatFrequency} Hz`;
        await globalAudioEngine.play(spec, displayName, entitlementState);
      } catch (error: any) {
        console.error('Error in playFrequency:', error);
        alert(`Error playing audio: ${error?.message || error}`);
      }
    },
    [entitlementState]
  );

  const setVolume = useCallback(async (volume: number) => {
    await globalAudioEngine.setVolume(volume);
  }, []);

  const currentHz =
    engineState.spec?.modality === 'pure_tone'
      ? engineState.spec.frequency
      : engineState.spec?.modality === 'binaural_beat'
      ? engineState.spec.beatFrequency
      : null;

  return {
    isPlaying: engineState.isPlaying,
    currentFrequency: currentHz,
    currentName: engineState.name,
    currentSpec: engineState.spec,
    error: engineState.error,
    playFrequency,
    playAudioSpec,
    stopFrequency,
    setVolume,
  };
};
