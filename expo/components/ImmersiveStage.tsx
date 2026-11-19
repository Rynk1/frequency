import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
  BackHandler,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { ChevronDown, Pause, Play } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlayerVisualizer, VisualizerStyle, VISUALIZER_LABELS } from './PlayerVisualizer';
import { useResponsive } from '@/lib/ui/responsive';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ImmersiveStageProps {
  visible: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  isPlaying: boolean;
  hz: number;
  title: string;
  subtitle?: string;
  visualizerStyle: VisualizerStyle;
  onCycleStyle: () => void;
  colors: any;
}

/**
 * Full-screen listening view.
 *
 * The design intent is that a user closes their eyes, and when they open them
 * the only thing on screen is the tone and a shape moving at breathing pace.
 * Controls are therefore hidden by default and revealed by a tap, then fade
 * out again after a few seconds of no interaction. Nothing here competes with
 * the sound for attention.
 */
export const ImmersiveStage: React.FC<ImmersiveStageProps> = ({
  visible,
  onClose,
  onTogglePlay,
  isPlaying,
  hz,
  title,
  subtitle,
  visualizerStyle,
  onCycleStyle,
  colors,
}) => {
  const { width, height } = useWindowDimensions();
  const { contentWidth } = useResponsive();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();

  const [chromeVisible, setChromeVisible] = useState(true);
  const chromeOpacity = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stageWidth = Math.min(width, contentWidth + 120);
  // Leave room for the header and title without the stage filling the screen.
  const stageHeight = Math.min(height * 0.52, 460);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (reducedMotion) return;
    hideTimer.current = setTimeout(() => {
      setChromeVisible(false);
    }, 4000);
  }, [reducedMotion]);

  useEffect(() => {
    if (!visible) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      return;
    }
    setChromeVisible(true);
    scheduleHide();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [visible, scheduleHide]);

  useEffect(() => {
    Animated.timing(chromeOpacity, {
      toValue: chromeVisible ? 1 : 0,
      duration: chromeVisible ? 220 : 700,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [chromeVisible, chromeOpacity]);

  // Android back closes full screen rather than the whole player, which is the
  // layer the user is actually looking at.
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const revealChrome = useCallback(() => {
    setChromeVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  if (!visible) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      {/* Tap anywhere to bring the controls back. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={revealChrome}
        accessibilityRole="button"
        accessibilityLabel="Show playback controls"
      />

      <View style={styles.stageWrap} pointerEvents="none">
        <PlayerVisualizer
          style={visualizerStyle}
          hz={hz}
          isPlaying={isPlaying}
          width={stageWidth}
          height={stageHeight}
          color={colors.primary}
          accent={colors.accent}
          reducedMotion={reducedMotion}
        />
      </View>

      <View style={styles.copy} pointerEvents="none">
        <Text style={[styles.hz, { color: colors.textPrimary }]}>{hz} Hz</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {isPlaying && (
          <Text style={[styles.breath, { color: colors.textMuted }]}>
            {reducedMotion ? 'Playing' : 'Breathe with the wave'}
          </Text>
        )}
      </View>

      <Animated.View style={[styles.chrome, { opacity: chromeOpacity }]} pointerEvents={chromeVisible ? 'auto' : 'none'}>
        <View style={[styles.chromeTop, { paddingTop: insets.top + 12 }]}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Exit full screen"
          >
            <ChevronDown color={colors.textPrimary} size={30} />
          </Pressable>
          <Pressable
            onPress={onCycleStyle}
            hitSlop={12}
            style={styles.styleButton}
            accessibilityRole="button"
            accessibilityLabel={`Visual style: ${visualizerStyle}. Double tap to change`}
          >
            <Text style={[styles.styleText, { color: colors.textSecondary }]}>
              {VISUALIZER_LABELS[visualizerStyle]}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.chromeBottom, { paddingBottom: insets.bottom + 40 }]}>
          <Pressable
            onPress={onTogglePlay}
            style={[styles.playButton, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause color="#FFFFFF" size={30} fill="#FFFFFF" />
            ) : (
              <Play color="#FFFFFF" size={30} fill="#FFFFFF" style={{ marginLeft: 3 }} />
            )}
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, justifyContent: 'center' },
  stageWrap: { alignItems: 'center', justifyContent: 'center' },
  copy: { alignItems: 'center', paddingHorizontal: 32, marginTop: 8 },
  hz: { fontSize: 13, fontWeight: '700', letterSpacing: 3, opacity: 0.55 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginTop: 6, letterSpacing: 0.2 },
  subtitle: { fontSize: 13, marginTop: 6, textAlign: 'center' },
  breath: { fontSize: 11, marginTop: 18, letterSpacing: 2.4, textTransform: 'uppercase' },
  chrome: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' },
  chromeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  chromeBottom: { alignItems: 'center' },
  iconButton: { padding: 8 },
  styleButton: { paddingHorizontal: 14, paddingVertical: 8 },
  styleText: { fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: '600' },
  playButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
