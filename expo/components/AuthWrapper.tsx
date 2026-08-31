import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from './AuthScreen';
import { FONTS, COLORS } from '@/constants/theme';

interface AuthWrapperProps {
  children: React.ReactNode;
}

/**
 * Auth gate component. Shows a loading screen only while Firebase auth state
 * is being resolved. Once resolved (user or no-user), immediately renders
 * children or the auth screen.
 *
 * Profile loading happens in the background after this point — the app is
 * fully interactive while profile data is fetched from Firestore.
 */
export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showLoader, setShowLoader] = useState(true);

  // Fade out the loading screen smoothly when auth resolves
  useEffect(() => {
    if (!isLoading && showLoader) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowLoader(false));
    }
  }, [isLoading, showLoader, fadeAnim]);

  if (isLoading || showLoader) {
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

  if (!isAuthenticated) {
    return (
      <AuthScreen
        mode={authMode}
        onToggleMode={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
      />
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
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
});