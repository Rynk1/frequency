import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  // React Native modules read the global __DEV__ flag at import time.
  define: {
    __DEV__: 'true',
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'expo-speech': 'react-native-web',
    },
  },
});
