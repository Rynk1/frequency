import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import {
  darkColors,
  lightColors,
  darkGradients,
  lightGradients,
  darkGlass,
  lightGlass,
  type ThemeColors,
  type ThemeGradients,
  type ThemeGlass,
} from '@/constants/theme';

export type ThemeMode = 'dark' | 'light';

const THEME_KEY = 'app_theme_mode';

interface ThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  gradients: ThemeGradients;
  glass: ThemeGlass;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export const [ThemeProvider, useTheme] = createContextHook<ThemeContextValue>(() => {
  const [mode, setMode] = useState<ThemeMode>('dark');

  // Load saved theme preference on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_KEY);
        if (stored && mounted && (stored === 'dark' || stored === 'light')) {
          setMode(stored);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    AsyncStorage.setItem(THEME_KEY, newMode).catch((e) =>
      console.error('Error saving theme:', e)
    );
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_KEY, next).catch((e) =>
        console.error('Error saving theme:', e)
      );
      return next;
    });
  }, []);

  const isDark = mode === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const gradients = isDark ? darkGradients : lightGradients;
  const glass = isDark ? darkGlass : lightGlass;

  return useMemo(() => ({
    mode,
    colors,
    gradients,
    glass,
    isDark,
    toggleTheme,
    setTheme,
  }), [mode, colors, gradients, glass, isDark, toggleTheme, setTheme]);
});
