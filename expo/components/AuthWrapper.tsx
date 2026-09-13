import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Animated, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from './AuthScreen';
import { FONTS } from '@/constants/theme';

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * Auth gate component with explicit application state management.
 * Resolves loading smoothly once Firebase Auth & profile bootstrap complete.
 * Renders user-friendly offline status banner when operating with cached state.
 * Strictly requires registration/authentication before entering application routes.
 */
export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const {
    isAuthenticated,
    bootstrapState,
    profileSource,
    syncStatus,
    retryProfileSync,
    userProfile,
  } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showLoader, setShowLoader] = useState(true);

  const isAuthLoading = bootstrapState === 'AUTH_LOADING' || bootstrapState === 'AUTHENTICATED';

  // Fade out loading overlay when auth and initial profile state resolve
  useEffect(() => {
    if (!isAuthLoading && showLoader) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowLoader(false));
    }
  }, [isAuthLoading, showLoader, fadeAnim]);

  if (isAuthLoading || showLoader) {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <LinearGradient
          colors={['#080B16', '#0F1324', '#141A33']}
          style={styles.loading}
        >
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#A78BFA" />
            <Text style={styles.loadingTitle}>Your Sanctuary</Text>
            <Text style={styles.loadingText}>Preparing your experience...</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  if (!isAuthenticated || bootstrapState === 'SIGNED_OUT') {
    return (
      <AuthScreen
        mode={authMode}
        onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
      />
    );
  }

  if (userProfile && !userProfile.onboardingCompleted) {
    return <Redirect href={'/onboarding' as any} />;
  }

  const isOfflineCache = profileSource === 'CACHED_LOCAL' && syncStatus !== 'synchronized';

  return (
    <View style={styles.container}>
      {isOfflineCache && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            You&apos;re offline. Some information may be unavailable until your connection is restored.
          </Text>
          <Pressable onPress={() => retryProfileSync()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontFamily: FONTS.heading,
    color: '#fff',
    fontSize: 28,
    marginTop: 20,
    fontWeight: '400' as const,
    letterSpacing: 0.3,
  },
  loadingText: {
    fontFamily: FONTS.body,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 8,
  },
  offlineBanner: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(234, 179, 8, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 999,
  },
  offlineBannerText: {
    color: '#FDE047',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
    marginRight: 8,
  },
  retryButton: {
    backgroundColor: 'rgba(234, 179, 8, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  retryButtonText: {
    color: '#FDE047',
    fontSize: 11,
    fontWeight: '600',
  },
});
