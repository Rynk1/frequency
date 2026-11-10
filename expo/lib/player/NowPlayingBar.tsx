import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Pause, X, Waves } from 'lucide-react-native';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useTheme } from '@/hooks/useTheme';
import { usePlayer } from './PlayerContext';

/** Tab bar height, mirrored from the tabs layout so the bar never overlaps it. */
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 72;

/**
 * Persistent, minimized now-playing bar.
 *
 * Shown whenever a track is loaded but the full player is dismissed, so the
 * listener keeps a single, always-visible handle on what is playing — including
 * while scrolling other screens. Tapping it expands the full player.
 */
export const NowPlayingBar: React.FC = () => {
  const { isMinimized, currentTrack, expand, stopAndClose } = usePlayer();
  const { isPlaying, currentName, currentFrequency, stopFrequency } = useAudioPlayer();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  if (!isMinimized || !currentTrack) return null;

  const label = currentName || currentTrack.name || 'Now playing';
  const hz = currentFrequency ?? currentTrack.hz;

  return (
    <View
      style={[styles.wrapper, { bottom: TAB_BAR_HEIGHT + insets.bottom + 8 }]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={styles.bar}
        activeOpacity={0.9}
        onPress={expand}
        accessibilityRole="button"
        accessibilityLabel={`Now playing ${label}. Double tap to open the player`}
      >
        <LinearGradient
          colors={[colors.glassStrong || 'rgba(30,30,50,0.92)', colors.glass || 'rgba(20,20,40,0.92)'] as const}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.artwork, { borderColor: colors.primary + '55' }]}>
          <Waves color={colors.primary} size={18} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>{label}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {isPlaying ? 'Playing' : 'Paused'} · {Math.round(hz)} Hz
          </Text>
        </View>

        <TouchableOpacity
          style={styles.control}
          onPress={() => { if (isPlaying) stopFrequency(); else expand(); }}
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Resume in player'}
        >
          {isPlaying ? (
            <Pause color={colors.textPrimary} size={20} fill={colors.textPrimary} />
          ) : (
            <Play color={colors.textPrimary} size={20} fill={colors.textPrimary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.control}
          onPress={stopAndClose}
          accessibilityRole="button"
          accessibilityLabel="Stop and dismiss"
        >
          <X color={colors.textMuted} size={18} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: 12,
      right: 12,
      zIndex: 50,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 18,
      paddingVertical: 8,
      paddingHorizontal: 10,
      gap: 10,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.glassBorderBright || colors.glassBorder,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    artwork: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      backgroundColor: colors.glass,
    },
    copy: { flex: 1 },
    title: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      letterSpacing: 0.1,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 1,
    },
    control: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
