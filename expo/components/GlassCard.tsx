import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/useTheme';

type GlassDepth = 'light' | 'normal' | 'deep';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  depth?: GlassDepth;
  /**
   * iOS BlurView intensity (overrides the depth default).
   * Only applies on iOS.
   */
  intensity?: number;
}

const DEPTH_INTENSITY: Record<GlassDepth, number> = {
  light: 40,
  normal: 60,
  deep: 80,
};

/**
 * Shared glassmorphism card component — theme-aware.
 *
 * - iOS:   Native BlurView for real frosted-glass blur (tint adapts to theme).
 * - Web:   Translucent View with the design-system glass styles.
 * - Android: Clean translucent surface with a subtle hairline border.
 */
function GlassCardInner({
  children,
  style,
  depth = 'normal',
  intensity,
}: GlassCardProps) {
  const { glass, isDark } = useTheme();
  const glassStyle = glass[depth];
  const blurIntensity = intensity ?? DEPTH_INTENSITY[depth];

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={blurIntensity}
        tint={isDark ? 'dark' : 'light'}
        style={[glassStyle, style]}
      >
        {children}
      </BlurView>
    );
  }

  // Android & web: single translucent surface. No extra overlay layers.
  return <View style={[glassStyle, style]}>{children}</View>;
}

export const GlassCard = React.memo(GlassCardInner);

export default GlassCard;
