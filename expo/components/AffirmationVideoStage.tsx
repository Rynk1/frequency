import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Crown, Lock } from 'lucide-react-native';
import { Affirmation } from '@/types/affirmation';
import { useTheme } from '@/hooks/useTheme';

interface AffirmationVideoStageProps {
  affirmation: Affirmation | null;
  isPlaying: boolean;
  hz: number;
  isPremium: boolean;
  onUnlock: () => void;
}

/**
 * Immersive, cinematic stage for the affirmation stream.
 *
 * Replaces the plain overlaid caption with a full-bleed gradient "video" that
 * cross-fades between affirmations as they rotate, so the visual mode reads as
 * a continuous stream rather than a static label. Free listeners see a tasteful
 * locked preview; premium unlocks the full experience.
 */
export const AffirmationVideoStage: React.FC<AffirmationVideoStageProps> = ({
  affirmation,
  isPlaying,
  hz,
  isPremium,
  onUnlock,
}) => {
  const { colors, gradients, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // Cross-fade the affirmation text whenever the active affirmation changes.
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(12)).current;
  const aura = useRef(new Animated.Value(0)).current;
  const drift = useRef(new Animated.Value(0)).current;

  const affirmationId = affirmation?.id;

  useEffect(() => {
    fade.setValue(0);
    rise.setValue(12);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [affirmationId, fade, rise]);

  // Slow ambient drift + breathing aura while playing — native-driven only.
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isPlaying) {
      loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(aura, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(aura, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(drift, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            Animated.timing(drift, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          ]),
        ])
      );
      loop.start();
    } else {
      aura.setValue(0);
      drift.setValue(0);
    }
    return () => {
      loop?.stop();
    };
  }, [isPlaying, aura, drift]);

  const auraScale = aura.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const auraOpacity = aura.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.5] });
  const driftX = drift.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] });

  const category = affirmation?.title || affirmation?.category?.replace(/_/g, ' ') || 'Affirmation';

  return (
    <View style={styles.stage}>
      <LinearGradient
        colors={[colors.primary + '33', gradients.bg?.[1] || colors.bgTertiary, colors.bgTertiary + 'E6'] as const}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Breathing aura */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.aura,
          {
            backgroundColor: colors.primary,
            opacity: auraOpacity,
            transform: [{ scale: auraScale }, { translateX: driftX }],
          },
        ]}
      />

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <Sparkles color={colors.accent} size={13} />
          <Text style={styles.badgeText}>{category.toUpperCase()}</Text>
          {isPremium && (
            <View style={styles.liveDot}>
              <View style={[styles.liveDotInner, { backgroundColor: isPlaying ? colors.accent : colors.textMuted }]} />
              <Text style={styles.liveText}>{isPlaying ? 'STREAMING' : 'PAUSED'}</Text>
            </View>
          )}
        </View>

        {affirmation ? (
          <Animated.View
            style={[
              styles.textWrap,
              { opacity: fade, transform: [{ translateY: rise }] },
            ]}
          >
            <Text style={styles.quoteMark}>“</Text>
            <Text style={styles.affirmationText} numberOfLines={4}>
              {affirmation.text}
            </Text>
            {affirmation.tone && (
              <Text style={styles.tone}>{affirmation.tone} tone</Text>
            )}
          </Animated.View>
        ) : (
          <Text style={styles.placeholderText}>
            Choose an intention below to begin your affirmation stream.
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.hzText}>{Math.round(hz)} Hz</Text>
          <Text style={styles.footerDivider}>•</Text>
          <Text style={styles.footerText}>Affirmation video</Text>
        </View>
      </View>

      {!isPremium && (
        <TouchableOpacity
          style={styles.lockOverlay}
          activeOpacity={0.9}
          onPress={onUnlock}
          accessibilityRole="button"
          accessibilityLabel="Unlock the immersive affirmation stream with Premium"
        >
          <View style={styles.lockPill}>
            <Lock color={colors.gold} size={13} />
            <Crown color={colors.gold} size={13} />
            <Text style={styles.lockText}>Unlock the immersive stream</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    stage: {
      flex: 1,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    aura: {
      position: 'absolute',
      width: 240,
      height: 240,
      borderRadius: 120,
      alignSelf: 'center',
      top: '12%',
    },
    content: {
      paddingHorizontal: 22,
      paddingVertical: 20,
      justifyContent: 'center',
      flex: 1,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 14,
    },
    badgeText: {
      color: colors.accent,
      fontSize: 10,
      fontWeight: '700' as const,
      letterSpacing: 1.4,
    },
    liveDot: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 'auto',
    },
    liveDotInner: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    liveText: {
      color: colors.textMuted,
      fontSize: 9,
      fontWeight: '700' as const,
      letterSpacing: 1,
    },
    textWrap: {
      flex: 1,
      justifyContent: 'center',
    },
    quoteMark: {
      color: colors.primary + 'AA',
      fontSize: 44,
      fontWeight: '700' as const,
      lineHeight: 44,
      marginBottom: -14,
    },
    affirmationText: {
      color: colors.textPrimary,
      fontSize: 22,
      lineHeight: 32,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
    },
    tone: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 14,
      textTransform: 'capitalize',
    },
    placeholderText: {
      color: colors.textSecondary,
      fontSize: 16,
      lineHeight: 24,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },
    hzText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700' as const,
    },
    footerDivider: {
      color: colors.textMuted,
      fontSize: 12,
    },
    footerText: {
      color: colors.textMuted,
      fontSize: 12,
    },
    lockOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(8,11,22,0.72)' : 'rgba(255,255,255,0.7)',
    },
    lockPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.goldGlow,
      borderColor: colors.gold,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    lockText: {
      color: colors.gold,
      fontSize: 13,
      fontWeight: '700' as const,
    },
  });
