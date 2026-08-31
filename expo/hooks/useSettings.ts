import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

interface Settings {
  backgroundAudio: boolean;
  volume: number;
  autoStop: boolean;
  defaultSessionLength: number;
  notifications: boolean;
  streakAlerts: boolean;
}

const SETTINGS_KEY = 'app_settings';

const defaultSettings: Settings = {
  backgroundAudio: false,
  volume: 0.5,
  autoStop: true,
  defaultSessionLength: 20,
  notifications: true,
  streakAlerts: true,
};

/**
 * Global settings provider. Lives near the root of the app so that both the
 * Settings screen and the AudioPlayer share the same volume state.
 *
 * Volume contract:
 *  - `settings.volume` is the global baseline volume (persisted).
 *  - The Settings screen slider writes to `settings.volume` (the baseline).
 *  - The AudioPlayer has its own transient volume override for the active
 *    playback session; when the user changes volume in the player, it both
 *    applies immediately to playback AND writes back to `settings.volume`
 *    so the new level persists across sessions.
 */
export const [SettingsProvider, useSettings] = createContextHook(() => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load settings from storage once on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_KEY);
        if (stored && mounted) {
          const parsed = JSON.parse(stored) as Partial<Settings>;
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsLoaded(true);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const saveSettings = useCallback(async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, []);

  const updateSetting = useCallback(<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      saveSettings(newSettings);
      return newSettings;
    });
  }, [saveSettings]);

  const resetSettings = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
      setSettings(defaultSettings);
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  }, []);

  return useMemo(() => ({
    settings,
    isLoading,
    isLoaded,
    updateSetting,
    resetSettings,
  }), [settings, isLoading, isLoaded, updateSetting, resetSettings]);
});
