import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import { Platform, View, ActivityIndicator, StatusBar } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SessionManagerProvider } from '@/hooks/useSessionManager';
import { BackendDataProvider } from '@/hooks/useBackendData';
import { AuthProvider } from '@/hooks/useAuth';
import { LearningContentProvider } from '@/hooks/useLearningContent';
import { DataModeProvider } from '@/hooks/useDataMode';
import { SettingsProvider } from '@/hooks/useSettings';
import { ThemeProvider, useTheme } from '@/hooks/useTheme';
import { useFonts } from 'expo-font';
import {
  DMSerifDisplay_400Regular,
  DMSerifDisplay_400Regular_Italic,
} from '@expo-google-fonts/dm-serif-display';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: 1000 * 60 * 5,
      networkMode: 'online',
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      gcTime: 1000 * 60 * 10,
    },
    mutations: {
      retry: 1,
      networkMode: 'online',
    },
  },
});

function ThemedStatusBar() {
  const { colors } = useTheme();
  return (
    <StatusBar barStyle={colors.statusBarStyle} translucent backgroundColor="transparent" />
  );
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="setup" options={{ title: "Admin Setup" }} />
      <Stack.Screen name="subscription-result" options={{ headerShown: false, animation: 'fade' }} />
    </Stack>
  );
}

// Configure notification handler globally
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'DM Serif Display': DMSerifDisplay_400Regular,
    'DM Serif Display Italic': DMSerifDisplay_400Regular_Italic,
    Satoshi: require('@/assets/fonts/Satoshi-Variable.ttf'),
    SatoshiItalic: require('@/assets/fonts/Satoshi-VariableItalic.ttf'),
  });

  // Request notification permissions on mount for native platforms
  useEffect(() => {
    if (Platform.OS !== 'web') {
      Notifications.getPermissionsAsync().then(({ status }) => {
        if (status !== 'granted') {
          Notifications.requestPermissionsAsync().catch(() => {});
        }
      }).catch(() => {});
    }
  }, []);

  // Hide splash once fonts are loaded (or errored)
  useEffect(() => {
    if (fontsLoaded || fontError) {
      const timer = setTimeout(() => {
        SplashScreen.hideAsync();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, fontError]);

  // Show a minimal loader while fonts are still loading (after splash fades)
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color="#6C63FF" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <DataModeProvider>
            <AuthProvider>
              <SettingsProvider>
                <BackendDataProvider>
                  <LearningContentProvider>
                    <SessionManagerProvider>
                      <GestureHandlerRootView style={styles.container}>
                        <ThemedStatusBar />
                        <RootLayoutNav />
                      </GestureHandlerRootView>
                    </SessionManagerProvider>
                  </LearningContentProvider>
                </BackendDataProvider>
              </SettingsProvider>
            </AuthProvider>
          </DataModeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0E1A',
  },
});
