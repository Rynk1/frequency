import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Easing,
  BackHandler,
  PanResponder,
  Platform,
  ScrollView,
  useWindowDimensions,
  LayoutChangeEvent,
} from 'react-native';
import { ChevronDown, Pause, Play, SkipBack, SkipForward, Heart, Volume2, VolumeX } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlayerVisualizer, VisualizerStyle, VISUALIZER_LABELS } from './PlayerVisualizer';
import { useResponsive } from '@/lib/ui/responsive';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ImmersiveStageProps {
  visible: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  isPlaying: boolean;
  isPaused?: boolean;
  hz: number;
  title: string;
  subtitle?: string;
  visualizerStyle: VisualizerStyle;
  onCycleStyle: () => void;
  colors: any;
  /** Elapsed fraction of the current run, 0-1. */
  progress?: number;
  elapsedSeconds?: number;
  totalSeconds?: number;
  /** Supplied only when the run can be repositioned; omit to render read-only. */
  onSeekRatio?: (ratio: number) => void;
  isSessionMode?: boolean;
  currentTrackIndex?: number;
  totalTracks?: number;
  onSkipPrevious?: () => void;
  onSkipNext?: () => void;
  volume?: number;
  isMuted?: boolean;
  onVolumeChange?: (v: number) => void;
  onToggleMute?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  const mm = mins.toString().padStart(hours > 0 ? 2 : 1, '0');
  const ss = secs.toString().padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * A thin, tap-and-drag slider that owns its measured width.
 *
 * Deliberately avoids `Animated`: position derives from the `value` prop, so
 * there is no native/JS driver mismatch to get wrong, and the bar stays correct
 * through rotation, tablets and split-screen.
 */
const StageSlider: React.FC<{
  value: number;
  onChange?: (v: number) => void;
  disabled?: boolean;
  trackColor: string;
  fillColor: string;
  thumbColor: string;
  height?: number;
  label: string;
  valueText: string;
}> = ({ value, onChange, disabled, trackColor, fillColor, thumbColor, height = 4, label, valueText }) => {
  const [width, setWidth] = useState(0);

  const emit = useCallback(
    (locationX: number) => {
      if (!onChange || disabled || width <= 0) return;
      onChange(Math.max(0, Math.min(1, locationX / width)));
    },
    [onChange, disabled, width]
  );

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (evt) => emit(evt.nativeEvent.locationX),
        onPanResponderMove: (evt) => emit(evt.nativeEvent.locationX),
      }),
    [emit, disabled]
  );

  const clamped = Math.max(0, Math.min(1, value));
  const thumbSize = Math.max(12, height * 3.4);
  // Leave room for the thumb at both ends so it never clips the track.
  const travel = Math.max(0, width - thumbSize);

  return (
    <View
      style={[sliderStyles.hitArea, { height: Math.max(28, height * 6) }]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: valueText }}
      {...(disabled ? {} : responder.panHandlers)}
    >
      <View style={[sliderStyles.track, { height, backgroundColor: trackColor, borderRadius: height }]}>
        <View
          style={{
            width: clamped * width,
            height,
            borderRadius: height,
            backgroundColor: fillColor,
            opacity: disabled ? 0.5 : 1,
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          left: clamped * travel,
          width: thumbSize,
          height: thumbSize,
          borderRadius: thumbSize / 2,
          backgroundColor: thumbColor,
          opacity: disabled ? 0.5 : 1,
          shadowColor: thumbColor,
          shadowOpacity: 0.9,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        }}
      />
    </View>
  );
};

const sliderStyles = StyleSheet.create({
  hitArea: { justifyContent: 'center' },
  track: { width: '100%', overflow: 'hidden' },
});

/**
 * Full-screen listening view.
 *
 * The design intent is that a user closes their eyes, and when they open them
 * the only thing on screen is the tone and a shape moving at breathing pace.
 * Controls are therefore hidden while playing and revealed by a tap, then fade
 * out again after a few seconds of no interaction.
 *
 * Unlike a bare visualiser, the chrome carries the full media-player contract:
 * elapsed/remaining time, a seek or progress bar, previous/next for sessions,
 * volume and the visual style. A listener never has to leave full screen just to
 * change something.
 */
export const ImmersiveStage: React.FC<ImmersiveStageProps> = ({
  visible,
  onClose,
  onTogglePlay,
  isPlaying,
  isPaused = false,
  hz,
  title,
  subtitle,
  visualizerStyle,
  onCycleStyle,
  colors,
  progress = 0,
  elapsedSeconds = 0,
  totalSeconds = 0,
  onSeekRatio,
  isSessionMode = false,
  currentTrackIndex = 0,
  totalTracks = 0,
  onSkipPrevious,
  onSkipNext,
  volume = 0.7,
  isMuted = false,
  onVolumeChange,
  onToggleMute,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const { width, height } = useWindowDimensions();
  const { contentWidth, isTablet } = useResponsive();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();

  const [chromeVisible, setChromeVisible] = useState(true);
  const [chromeOpacity] = useState(() => new Animated.Value(1));
  const [glow] = useState(() => new Animated.Value(0));
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The stage column mirrors the app's content cap, minus its own padding, so
  // the artwork never outgrows the rest of the UI on a tablet.
  const columnWidth = Math.min(width, contentWidth) - 40;
  const stageWidth = Math.min(columnWidth, isTablet ? 420 : columnWidth);
  const stageHeight = Math.min(stageWidth * (isTablet ? 0.78 : 0.86), height * 0.42);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    // Never hide the controls out from under a paused listener: the play button
    // is the only way back to audio, and a hidden one reads as a frozen app.
    if (reducedMotion || !isPlaying) return;
    hideTimer.current = setTimeout(() => setChromeVisible(false), 4000);
  }, [reducedMotion, isPlaying, clearHideTimer]);

  // Reopening the stage must always show the controls, even if the previous
  // visit auto-hid them. Adjusting during render (rather than in an effect)
  // avoids an extra commit where the chrome would flash at opacity 0.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setChromeVisible(true);
  }

  useEffect(() => {
    if (!visible) {
      clearHideTimer();
      return;
    }
    scheduleHide();
    return clearHideTimer;
  }, [visible, scheduleHide, clearHideTimer]);

  useEffect(() => {
    Animated.timing(chromeOpacity, {
      toValue: chromeVisible ? 1 : 0,
      duration: chromeVisible ? 220 : 700,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [chromeVisible, chromeOpacity]);

  // Slow ambient breathing behind the artwork. Transform-only, so it stays on
  // the native driver safely.
  useEffect(() => {
    if (!visible || reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 4200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, reducedMotion, glow]);

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

  const remaining = Math.max(0, totalSeconds - elapsedSeconds);
  const seekable = !!onSeekRatio;
  const canGoPrevious = isSessionMode && currentTrackIndex > 0 && !!onSkipPrevious;
  const canGoNext = isSessionMode && currentTrackIndex < totalTracks - 1 && !!onSkipNext;
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <LinearGradient
        colors={[colors.bg, colors.bgSecondary] as const}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.ambientGlow, { backgroundColor: colors.primary, transform: [{ scale: glowScale }] }]}
      />

      {/* Tap anywhere to bring the controls back. */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={revealChrome}
        accessibilityRole="button"
        accessibilityLabel="Show playback controls"
      />

      <Animated.View
        style={[styles.chrome, { opacity: chromeOpacity }]}
        pointerEvents={chromeVisible ? 'auto' : 'none'}
      >
        {/* A landscape phone cannot fit artwork, metadata and transport at once.
            Scrolling beats clipping: nothing becomes unreachable. */}
        <ScrollView
          contentContainerStyle={[
            styles.chromeContent,
            { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel="Exit full screen"
            >
              <ChevronDown color={colors.textPrimary} size={28} />
            </Pressable>

            <View style={styles.topBarCopy} pointerEvents="none">
              <Text style={[styles.topEyebrow, { color: colors.textMuted }]} numberOfLines={1}>
                {isSessionMode ? 'Now playing - Session' : 'Now playing'}
              </Text>
              <Text style={[styles.topTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {title}
              </Text>
            </View>

            {onToggleFavorite ? (
              <Pressable
                onPress={onToggleFavorite}
                hitSlop={12}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
              >
                <Heart
                  color={isFavorite ? colors.accent : colors.textSecondary}
                  fill={isFavorite ? colors.accent : 'transparent'}
                  size={22}
                />
              </Pressable>
            ) : (
              <View style={styles.iconButton} />
            )}
          </View>

          {/* Artwork */}
          <View style={styles.artworkWrap}>
            <View
              style={[
                styles.artwork,
                {
                  width: stageWidth,
                  height: stageHeight,
                  borderColor: colors.primary + '33',
                  backgroundColor: colors.glass || 'rgba(255,255,255,0.03)',
                },
              ]}
            >
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
          </View>

          {/* Metadata */}
          <View style={styles.meta}>
            <View style={[styles.hzChip, { backgroundColor: colors.primary + '1F', borderColor: colors.primary + '3D' }]}>
              <Text style={[styles.hzChipText, { color: colors.primary }]}>{Math.round(hz)} Hz</Text>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
              {title}
            </Text>
            {!!subtitle && (
              <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>

          {/* Seek / progress */}
          <View style={styles.seekBlock}>
            <StageSlider
              value={progress}
              onChange={seekable ? onSeekRatio : undefined}
              disabled={!seekable}
              trackColor={colors.glassBorder}
              fillColor={colors.primary}
              thumbColor={colors.primary}
              label={seekable ? 'Adjust session length' : 'Session progress'}
              valueText={`${formatClock(elapsedSeconds)} elapsed, ${formatClock(remaining)} remaining`}
            />
            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatClock(elapsedSeconds)}</Text>
              <Text style={[styles.timeText, { color: colors.textMuted }]}>-{formatClock(remaining)}</Text>
            </View>
          </View>

          {/* Transport */}
          <View style={styles.transport}>
            {isSessionMode ? (
              <Pressable
                onPress={canGoPrevious ? onSkipPrevious : undefined}
                disabled={!canGoPrevious}
                hitSlop={10}
                style={styles.sideButton}
                accessibilityRole="button"
                accessibilityLabel="Previous track"
                accessibilityState={{ disabled: !canGoPrevious }}
              >
                <SkipBack
                  color={canGoPrevious ? colors.textPrimary : colors.textMuted}
                  fill={canGoPrevious ? colors.textPrimary : 'transparent'}
                  size={26}
                  opacity={canGoPrevious ? 1 : 0.35}
                />
              </Pressable>
            ) : (
              <View style={styles.sideButton} />
            )}

            <Pressable
              onPress={onTogglePlay}
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause color="#FFFFFF" size={34} fill="#FFFFFF" />
              ) : (
                <Play color="#FFFFFF" size={34} fill="#FFFFFF" style={{ marginLeft: 4 }} />
              )}
            </Pressable>

            {isSessionMode ? (
              <Pressable
                onPress={canGoNext ? onSkipNext : undefined}
                disabled={!canGoNext}
                hitSlop={10}
                style={styles.sideButton}
                accessibilityRole="button"
                accessibilityLabel="Next track"
                accessibilityState={{ disabled: !canGoNext }}
              >
                <SkipForward
                  color={canGoNext ? colors.textPrimary : colors.textMuted}
                  fill={canGoNext ? colors.textPrimary : 'transparent'}
                  size={26}
                  opacity={canGoNext ? 1 : 0.35}
                />
              </Pressable>
            ) : (
              <View style={styles.sideButton} />
            )}
          </View>

          {/* Volume + style */}
          <View style={styles.bottomRow}>
            <Pressable
              onPress={onToggleMute}
              hitSlop={10}
              style={styles.volumeIcon}
              accessibilityRole="button"
              accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX color={colors.textSecondary} size={20} />
              ) : (
                <Volume2 color={colors.textSecondary} size={20} />
              )}
            </Pressable>

            <View style={styles.volumeSlider}>
              <StageSlider
                value={isMuted ? 0 : volume}
                onChange={onVolumeChange}
                trackColor={colors.glassBorder}
                fillColor={colors.textSecondary}
                thumbColor={colors.textSecondary}
                height={3}
                label="Volume"
                valueText={`${Math.round((isMuted ? 0 : volume) * 100)} percent`}
              />
            </View>

            <Pressable
              onPress={onCycleStyle}
              hitSlop={10}
              style={[styles.stylePill, { borderColor: colors.glassBorder }]}
              accessibilityRole="button"
              accessibilityLabel={`Visual style: ${visualizerStyle}. Double tap to change`}
            >
              <Text style={[styles.styleText, { color: colors.textSecondary }]}>
                {VISUALIZER_LABELS[visualizerStyle]}
              </Text>
            </Pressable>
          </View>

          {!isPlaying && (
            <Text style={[styles.pausedHint, { color: colors.textMuted }]}>
              {isPaused ? 'Paused' : 'Ready'}
            </Text>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 },
  ambientGlow: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    opacity: 0.1,
    alignSelf: 'center',
    top: '18%',
  },
  chrome: { flex: 1 },
  chromeContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    gap: 18,
  },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topBarCopy: { flex: 1, alignItems: 'center' },
  topEyebrow: { fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: '700' },
  topTitle: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  artworkWrap: { alignItems: 'center', justifyContent: 'center' },
  artwork: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { alignItems: 'center', paddingHorizontal: 8 },
  hzChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 10,
  },
  hzChipText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', letterSpacing: 0.2 },
  subtitle: { fontSize: 13, marginTop: 6, textAlign: 'center' },
  seekBlock: { paddingHorizontal: 4 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  timeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 36 },
  sideButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  playButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  volumeIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  volumeSlider: { flex: 1 },
  stylePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  styleText: { fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '700' },
  pausedHint: { textAlign: 'center', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
});
