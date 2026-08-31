import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type DataMode = 'auto' | 'local' | 'cloud';

interface DataModeState {
  /** Current data mode */
  mode: DataMode;
  /** Human-readable label for the current mode */
  modeLabel: string;
  /** Set the data mode */
  setMode: (mode: DataMode) => Promise<void>;
  /** Whether we should attempt Firestore operations */
  shouldUseFirestore: boolean;
  /** Whether Firestore is the ONLY allowed source (fail hard if unavailable) */
  isCloudStrict: boolean;
  /** Whether we should ONLY use local data (never touch Firestore) */
  isLocalOnly: boolean;
  /** Last error from a cloud-mode operation */
  lastCloudError: string | null;
  setCloudError: (error: string | null) => void;
  /** True while the initial mode is loading from storage */
  isLoading: boolean;
}

const STORAGE_KEY = 'dataMode';

const MODE_LABELS: Record<DataMode, string> = {
  auto: 'Auto (Cloud → Local)',
  local: 'Local Only',
  cloud: 'Cloud Only',
};

export const [DataModeProvider, useDataMode] = createContextHook<DataModeState>(() => {
  const [mode, setModeState] = useState<DataMode>('auto');
  const [lastCloudError, setCloudError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted mode on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'local' || stored === 'cloud' || stored === 'auto') {
          setModeState(stored);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const setMode = useCallback(async (newMode: DataMode) => {
    setModeState(newMode);
    setCloudError(null);
    await AsyncStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  const shouldUseFirestore = mode !== 'local';
  const isCloudStrict = mode === 'cloud';
  const isLocalOnly = mode === 'local';
  const modeLabel = MODE_LABELS[mode];

  return useMemo(() => ({
    mode,
    modeLabel,
    setMode,
    shouldUseFirestore,
    isCloudStrict,
    isLocalOnly,
    lastCloudError,
    setCloudError,
    isLoading,
  }), [mode, modeLabel, setMode, shouldUseFirestore, isCloudStrict, isLocalOnly, lastCloudError, isLoading]);
});
