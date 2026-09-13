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
  /** Whether content queries attempt Firestore operations */
  shouldUseFirestore: boolean;
  /** Whether Firestore is the ONLY allowed source for content */
  isCloudStrict: boolean;
  /** Whether local test mock mode is active (DEV/TEST ONLY) */
  isLocalOnly: boolean;
  /** Last error from a cloud-mode operation */
  lastCloudError: string | null;
  setCloudError: (error: string | null) => void;
  /** True while the initial mode is loading from storage */
  isLoading: boolean;
}

const STORAGE_KEY = 'dataMode';

const MODE_LABELS: Record<DataMode, string> = {
  auto: 'Cloud Primary (Firestore + Cache)',
  local: 'Local Test/Demo Mode',
  cloud: 'Cloud Only (Strict Firestore)',
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
          // In production builds, force local mode off if set erroneously
          if (process.env.NODE_ENV === 'production' && stored === 'local') {
            setModeState('auto');
          } else {
            setModeState(stored);
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const setMode = useCallback(async (newMode: DataMode) => {
    // In production builds, local mode is disabled as a profile authority alternative
    const targetMode = (process.env.NODE_ENV === 'production' && newMode === 'local') ? 'auto' : newMode;
    setModeState(targetMode);
    setCloudError(null);
    await AsyncStorage.setItem(STORAGE_KEY, targetMode);
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
