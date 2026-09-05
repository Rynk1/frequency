import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  Platform,
  ScrollView,
  PanResponder,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard as SharedGlassCard } from '@/components/GlassCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  ChevronDown,
  Repeat,
  Shuffle,
  Heart,
  Share2,
  MoreVertical,
  Waves,
  Activity,
  Radio,
  Timer,
  Settings,
  List,
  Info,
  X,
  BarChart3
} from 'lucide-react-native';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { FrequencyVisualizer } from './FrequencyVisualizer';
import { Share } from 'react-native';
import { DEFAULT_PREMIUM_POLICY } from '@/lib/subscription-service';
import { PremiumModal, PremiumTrigger } from './PremiumModal';

const { width, height } = Dimensions.get('window');

// Pre-computed deterministic waveform bar heights — avoids Math.random() in render.
const WAVEFORM_BAR_HEIGHTS = Array.from({ length: 40 }, (_, i) =>
  10 + ((i * 73) % 30)
);

interface Frequency {
  hz: number;
  name: string;
  duration: number;
  isPremium?: boolean;
  category?: string;
}

interface AudioPlayerProps {
  visible: boolean;
  onClose: () => void;
  frequency?: any;
  sessionFrequencies?: Frequency[];
  sessionName?: string;
  isSessionMode?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  visible,
  onClose,
  frequency,
  sessionFrequencies = [],
  sessionName = '',
  isSessionMode = false,
}) => {
  const [duration, setDuration] = useState<number>(15); // minutes
  const [timeLeft, setTimeLeft] = useState<number>(duration * 60); // seconds
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [playerVolumeOverride, setPlayerVolumeOverride] = useState<number | null>(null);
  const [slideAnim] = useState(new Animated.Value(height));
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [visualizerMode, setVisualizerMode] = useState<'waves' | 'bars' | 'circle'>('waves');
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);
  const [showDurationPicker, setShowDurationPicker] = useState<boolean>(false);
  const [showTimerSettings, setShowTimerSettings] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);
  const [customDuration, setCustomDuration] = useState<number>(15);
  const [fadeOutEnabled, setFadeOutEnabled] = useState<boolean>(true);
  const [autoRepeat, setAutoRepeat] = useState<boolean>(false);
  const [sessionIntensity, setSessionIntensity] = useState<'low' | 'medium' | 'high'>('medium');

  // Preview & Paywall Modal states
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [premiumModalTrigger, setPremiumModalTrigger] = useState<PremiumTrigger>('preview_complete');
  const [isPreviewActive, setIsPreviewActive] = useState<boolean>(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const volumeSlideAnim = useRef(new Animated.Value(0)).current;

  // Session mode states
  const [currentFrequencyIndex, setCurrentFrequencyIndex] = useState<number>(0);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [sessionProgress, setSessionProgress] = useState<number>(0);

  const { isPlaying, currentFrequency, playFrequency, stopFrequency, setVolume: setAudioVolume } = useAudioPlayer();
  const { isPremium, capabilities, trackUsage } = useAuth();
  const { toggleFavorite: toggleFavoriteStore, isFavorite: isFavoriteInStore } = useFavorites();
  const { settings, updateSetting } = useSettings();
  const { colors, gradients, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, gradients, isDark), [colors, gradients, isDark]);

  // Quick duration presets for easy selection
  const durationPresets = isPremium ?
    [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240] :
    [5, 10, 15]; // Free users limited to policy free max duration

  const maxFreeDuration = Math.floor(DEFAULT_PREMIUM_POLICY.freeSessionMaxDuration / 60); // 15 minutes

  // Sync local volume state with global settings
  useEffect(() => {
    if (visible) {
      setVolume(settings.volume);
      setPlayerVolumeOverride(null);
    }
  }, [visible, settings.volume]);

  const effectiveVolume = playerVolumeOverride !== null ? playerVolumeOverride : volume;

  // Volume slider pan responder
  const volumePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newVolume = Math.max(0, Math.min(1, (gestureState.moveX - 40) / (width - 120)));
        setVolume(newVolume);
        setPlayerVolumeOverride(newVolume);
        if (!isMuted) {
          setAudioVolume(newVolume);
        }
      },
      onPanResponderRelease: () => {
        updateSetting('volume', playerVolumeOverride !== null ? playerVolumeOverride : volume);
      },
    })
  ).current;

  // Progress slider pan responder
  const progressPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (!isSessionMode && !isPreviewActive) {
          const progress = Math.max(0, Math.min(1, (gestureState.moveX - 40) / (width - 80)));
          const newTimeLeft = Math.round((1 - progress) * duration * 60);
          setTimeLeft(newTimeLeft);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: height,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isPlaying]);

  // Single unified tick
  const tickStateRef = useRef({
    isTimerActive, isSessionActive, isSessionMode, isPlaying,
    timeLeft, sessionTimeLeft, fadeOutEnabled, autoRepeat, isPremium,
    duration, currentFrequencyIndex, sessionFrequencies, effectiveVolume,
    isPreviewActive,
  });
  tickStateRef.current = {
    isTimerActive, isSessionActive, isSessionMode, isPlaying,
    timeLeft, sessionTimeLeft, fadeOutEnabled, autoRepeat, isPremium,
    duration, currentFrequencyIndex, sessionFrequencies, effectiveVolume,
    isPreviewActive,
  };
  const tickRaf = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setAudioVolume(isMuted ? 0 : effectiveVolume);
  }, [effectiveVolume, isMuted, setAudioVolume]);

  useEffect(() => {
    if (isSessionMode && sessionFrequencies.length > 0) {
      const totalDuration = sessionFrequencies.reduce((sum, freq) => sum + freq.duration, 0);
      setSessionTimeLeft(totalDuration * 60);
      setCurrentFrequencyIndex(0);
      setSessionProgress(0);
    }
  }, [isSessionMode, sessionFrequencies]);

  // Unified single-second tick effect
  useEffect(() => {
    const s = tickStateRef.current;
    const shouldTick = s.isPlaying && ((s.isSessionMode && s.isSessionActive && s.sessionTimeLeft > 0) || (!s.isSessionMode && s.isTimerActive && s.timeLeft > 0));
    if (!shouldTick) return;

    tickRaf.current = setInterval(() => {
      const st = tickStateRef.current;
      if (st.isSessionMode && st.isSessionActive) {
        setSessionTimeLeft(prev => {
          if (prev <= 0) return 0;
          const newTime = prev - 1;
          const totalDuration = st.sessionFrequencies.reduce((sum, freq) => sum + freq.duration, 0) * 60 || 1;
          const elapsedTime = totalDuration - newTime;
          setSessionProgress(Math.min(100, (elapsedTime / totalDuration) * 100));

          let acc = 0;
          for (let i = 0; i < st.sessionFrequencies.length; i++) {
            const fd = st.sessionFrequencies[i].duration * 60;
            if (elapsedTime >= acc && elapsedTime < acc + fd) {
              if (i !== st.currentFrequencyIndex) {
                const nf = st.sessionFrequencies[i];
                setCurrentFrequencyIndex(i);
                setTimeout(() => playFrequency(nf, nf.name), 100);
              }
              break;
            }
            acc += fd;
          }

          if (newTime <= 0) {
            setIsSessionActive(false);
            stopFrequency();
            setSessionProgress(100);
            const totalMinutes = st.sessionFrequencies.reduce((sum, f) => sum + f.duration, 0);
            trackUsage(totalMinutes, st.sessionFrequencies[st.currentFrequencyIndex]?.name || 'session').catch(() => {});
            return 0;
          }
          return newTime;
        });
      } else if (st.isTimerActive && !st.isSessionMode) {
        setTimeLeft(prev => {
          if (prev <= 0) return 0;
          // Smooth gain fade out in final 10 seconds of preview or timer
          if ((st.fadeOutEnabled || st.isPreviewActive) && prev <= 10) {
            setAudioVolume(st.effectiveVolume * (prev / 10));
          }
          if (prev <= 1) {
            setIsTimerActive(false);
            stopFrequency();
            if (st.isPreviewActive) {
              // Preview complete! Present post-preview conversion modal
              setIsPreviewActive(false);
              setPremiumModalTrigger('preview_complete');
              setShowPremiumModal(true);
            } else if (frequency) {
              trackUsage(st.duration, frequency.name || `${frequency.hz} Hz`).catch(() => {});
            }
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (tickRaf.current) {
        clearInterval(tickRaf.current);
        tickRaf.current = null;
      }
    };
  }, [isPlaying, isTimerActive, isSessionActive, isSessionMode]);

  useEffect(() => {
    if (!isPreviewActive) {
      setTimeLeft(duration * 60);
    }
  }, [duration, isPreviewActive]);

  useEffect(() => {
    if (!isPremium && duration > maxFreeDuration && !isPreviewActive) {
      setDuration(maxFreeDuration);
      setTimeLeft(maxFreeDuration * 60);
    }
  }, [isPremium, duration, maxFreeDuration, isPreviewActive]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = useCallback(() => {
    // Layer 2 Authorization Check
    const targetFreq = isSessionMode ? sessionFrequencies[currentFrequencyIndex] : frequency;
    const isFreqLocked = targetFreq?.isPremium || targetFreq?.category === 'Chakra' || targetFreq?.category === 'Binaural';
    const isLockedForUser = isFreqLocked && !capabilities?.premiumFrequencies;

    if (isSessionMode) {
      if (isPlaying && isSessionActive) {
        stopFrequency();
        setIsSessionActive(false);
      } else {
        const currentFreq = sessionFrequencies[currentFrequencyIndex];
        if (currentFreq && sessionTimeLeft > 0) {
          if (isLockedForUser) {
            setIsPreviewActive(true);
            setTimeLeft(DEFAULT_PREMIUM_POLICY.premiumPreviewDuration);
          }
          playFrequency(currentFreq, currentFreq.name);
          setIsSessionActive(true);
        }
      }
    } else {
      if (isPlaying && currentFrequency === frequency?.hz) {
        stopFrequency();
        setIsTimerActive(false);
      } else {
        if (frequency) {
          if (isLockedForUser) {
            setIsPreviewActive(true);
            setDuration(3);
            setTimeLeft(DEFAULT_PREMIUM_POLICY.premiumPreviewDuration);
          }
          playFrequency(frequency, frequency.name);
          if (timeLeft > 0) {
            setIsTimerActive(true);
          }
        }
      }
    }
  }, [isSessionMode, isPlaying, isSessionActive, sessionFrequencies, currentFrequencyIndex, frequency, sessionTimeLeft, timeLeft, playFrequency, stopFrequency, currentFrequency, capabilities]);

  const handleSkipNext = useCallback(() => {
    if (isSessionMode && currentFrequencyIndex < sessionFrequencies.length - 1) {
      const nextIndex = currentFrequencyIndex + 1;
      const nextFreq = sessionFrequencies[nextIndex];
      setCurrentFrequencyIndex(nextIndex);
      if (isPlaying) {
        playFrequency(nextFreq, nextFreq.name);
      }
    }
  }, [isSessionMode, currentFrequencyIndex, sessionFrequencies, isPlaying, playFrequency]);

  const handleSkipPrevious = useCallback(() => {
    if (isSessionMode && currentFrequencyIndex > 0) {
      const prevIndex = currentFrequencyIndex - 1;
      const prevFreq = sessionFrequencies[prevIndex];
      setCurrentFrequencyIndex(prevIndex);
      if (isPlaying) {
        playFrequency(prevFreq, prevFreq.name);
      }
    }
  }, [isSessionMode, currentFrequencyIndex, sessionFrequencies, isPlaying, playFrequency]);

  const handleStop = useCallback(() => {
    stopFrequency();
    setIsPreviewActive(false);
    if (isSessionMode) {
      setIsSessionActive(false);
      setCurrentFrequencyIndex(0);
      const totalDuration = sessionFrequencies.reduce((sum, freq) => sum + freq.duration, 0);
      setSessionTimeLeft(totalDuration * 60);
      setSessionProgress(0);
    } else {
      setIsTimerActive(false);
      setTimeLeft(duration * 60);
    }
  }, [isSessionMode, sessionFrequencies, stopFrequency, duration]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setIsRepeat(prev => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => !prev);
  }, []);

  const cycleVisualizerMode = useCallback(() => {
    setVisualizerMode(prev => {
      if (prev === 'waves') return 'bars';
      if (prev === 'bars') return 'circle';
      return 'waves';
    });
  }, []);

  const progress = isSessionMode ? sessionProgress : ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const isCurrentlyPlaying = isSessionMode ?
    (isPlaying && isSessionActive) :
    (isPlaying && currentFrequency === frequency?.hz);

  const displayFrequency = isSessionMode && sessionFrequencies.length > 0 ?
    sessionFrequencies[currentFrequencyIndex] : frequency;

  const displayTimeLeft = isSessionMode ? sessionTimeLeft : timeLeft;
  const displayTitle = isSessionMode ? sessionName : 'Audio Player';

  const toggleFavorite = useCallback(() => {
    if (displayFrequency) {
      toggleFavoriteStore({
        hz: displayFrequency.hz,
        name: displayFrequency.name,
        description: displayFrequency.description || '',
      });
    }
    setIsFavorite(prev => !prev);
  }, [displayFrequency, toggleFavoriteStore]);

  useEffect(() => {
    if (displayFrequency) {
      setIsFavorite(isFavoriteInStore(displayFrequency.hz));
    }
  }, [displayFrequency, isFavoriteInStore]);

  const GlassCard = useMemo(() => {
    const MemoCard = React.memo(SharedGlassCard);
    const Wrapped = ({ children, style, intensity }: { children: React.ReactNode; style?: any; intensity?: number }) => (
      <MemoCard style={[styles.glassEffect, style]} intensity={intensity}>
        {children}
      </MemoCard>
    );
    return Wrapped;
  }, [styles]);

  const renderVisualizer = () => {
    const spin = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View
        style={[
          styles.visualizerWrapper,
          visualizerMode === 'circle' && {
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <FrequencyVisualizer
          frequency={currentFrequency || displayFrequency?.hz || 0}
          isPlaying={isCurrentlyPlaying}
          color={colors.primary}
        />
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            }
          ]}
        >
          <LinearGradient
            colors={['#1a1a2e', '#0f0f1e', '#16213e'] as const}
            style={styles.gradient}
          >
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}
                showsVerticalScrollIndicator={false}
              >
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close player"
                    accessibilityHint="Double tap to close audio player"
                  >
                    <ChevronDown color="#FFFFFF" size={28} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>{displayTitle}</Text>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setShowMoreMenu(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Player options"
                    accessibilityHint="Double tap for more options"
                  >
                    <MoreVertical color="#FFFFFF" size={24} />
                  </TouchableOpacity>
                </View>

                {/* Main Visualizer Card */}
                <GlassCard style={styles.mainCard} intensity={60}>
                  <TouchableOpacity
                    style={styles.visualizerContainer}
                    onPress={cycleVisualizerMode}
                    activeOpacity={0.9}
                  >
                    <Animated.View style={[
                      styles.visualizerGlow,
                      {
                        transform: [{ scale: pulseAnim }],
                        opacity: isCurrentlyPlaying ? 0.3 : 0.1,
                      }
                    ]} />
                    {renderVisualizer()}
                    <View style={styles.visualizerOverlay}>
                      {isPreviewActive && (
                        <View style={styles.previewBadge}>
                          <Text style={styles.previewBadgeText}>3-MINUTE PREVIEW</Text>
                        </View>
                      )}
                      <Text style={styles.frequencyHz}>{displayFrequency?.hz || 0} Hz</Text>
                      <Text style={styles.frequencyName}>{displayFrequency?.name || 'No Frequency'}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Waveform Indicator */}
                  <View style={styles.waveformContainer} pointerEvents="none">
                    {WAVEFORM_BAR_HEIGHTS.map((h, i) => (
                      <View
                        key={i}
                        style={[
                          styles.waveformBar,
                          { height: isCurrentlyPlaying ? h : 5, backgroundColor: isCurrentlyPlaying ? colors.primary : colors.textMuted },
                        ]}
                      />
                    ))}
                  </View>
                </GlassCard>

                {/* Track Info */}
                <View style={styles.trackInfo}>
                  <View style={styles.trackDetails}>
                    <Text style={styles.trackTitle}>{displayFrequency?.name || 'No Frequency'}</Text>
                    <Text style={styles.trackSubtitle}>
                      {isSessionMode ? (
                        <>
                          <Text>Session: {sessionName} • Track {currentFrequencyIndex + 1}/{sessionFrequencies.length}</Text>
                          {sessionFrequencies[currentFrequencyIndex] && (
                            <Text style={styles.frequencyDuration}>
                              {' • '}{sessionFrequencies[currentFrequencyIndex].duration}min allocated
                            </Text>
                          )}
                        </>
                      ) : (
                        `${displayFrequency?.category || 'Healing'} • ${displayFrequency?.hz || 0} Hz`
                      )}
                    </Text>
                  </View>
                  <View style={styles.trackActions}>
                    <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
                      <Heart
                        color={isFavorite ? '#FF3B30' : colors.textMuted}
                        size={24}
                        fill={isFavorite ? '#FF3B30' : 'transparent'}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={async () => {
                        const freqName = displayFrequency?.name || 'frequency';
                        const hz = displayFrequency?.hz || 0;
                        try {
                          await Share.share({
                            message: `I'm listening to ${freqName} (${hz} Hz) on Harmony Frequency. Join me on this healing journey!`,
                          });
                        } catch (e) {
                          console.warn('Share failed:', e);
                        }
                      }}
                      style={styles.shareButton}
                    >
                      <Share2
                        color="#666"
                        size={24}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressSection}>
                  <View style={styles.timeDisplay}>
                    <Text style={styles.timeText}>{formatTime(displayTimeLeft)}</Text>
                    <Text style={styles.timeDuration}>
                      {isSessionMode ?
                        formatTime(sessionFrequencies.reduce((sum, freq) => sum + freq.duration * 60, 0)) :
                        formatTime(duration * 60)
                      }
                    </Text>
                  </View>

                  <View style={styles.progressContainer} {...progressPanResponder.panHandlers}>
                    <View style={styles.progressTrack}>
                      <LinearGradient
                        colors={[colors.primary, colors.primaryDark] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.progressFill,
                          { width: `${progress}%` }
                        ]}
                      />
                      <View
                        style={[
                          styles.progressThumb,
                          { left: `${progress}%` }
                        ]}
                      />
                    </View>
                  </View>
                </View>

                {/* Main Controls */}
                <View style={styles.mainControls}>
                  <TouchableOpacity
                    style={styles.secondaryControl}
                    onPress={toggleShuffle}
                  >
                    <Shuffle color={isShuffle ? colors.primary : colors.textMuted} size={20} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleSkipPrevious}
                    disabled={!isSessionMode || currentFrequencyIndex === 0}
                  >
                    <SkipBack color={isSessionMode && currentFrequencyIndex > 0 ? colors.textPrimary : colors.textMuted} size={24} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={handlePlayPause}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={isCurrentlyPlaying ? 'Pause audio' : 'Play audio'}
                    accessibilityHint="Double tap to toggle playback"
                  >
                    <LinearGradient
                      colors={isCurrentlyPlaying ? ['#FF3B30', '#FF6B6B'] : [colors.primary, colors.primaryDark] as const}
                      style={styles.playButtonGradient}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause color="#FFFFFF" size={32} fill="#FFFFFF" />
                      ) : (
                        <Play color="#FFFFFF" size={32} fill="#FFFFFF" style={styles.playIcon} />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleSkipNext}
                    disabled={!isSessionMode || currentFrequencyIndex === sessionFrequencies.length - 1}
                  >
                    <SkipForward color={isSessionMode && currentFrequencyIndex < sessionFrequencies.length - 1 ? colors.textPrimary : colors.textMuted} size={24} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryControl}
                    onPress={toggleRepeat}
                  >
                    <Repeat color={isRepeat ? colors.primary : colors.textMuted} size={20} />
                  </TouchableOpacity>
                </View>

                {/* Volume Control */}
                <View style={styles.volumeSection}>
                  <TouchableOpacity onPress={toggleMute} style={styles.volumeIcon}>
                    {isMuted ? (
                      <VolumeX color="#666" size={20} />
                    ) : (
                      <Volume2 color="#FFFFFF" size={20} />
                    )}
                  </TouchableOpacity>

                  <View style={styles.volumeSlider} {...volumePanResponder.panHandlers}>
                    <View style={styles.volumeTrack}>
                      <LinearGradient
                        colors={[colors.primary, colors.primaryDark] as const}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.volumeFill,
                          { width: `${isMuted ? 0 : effectiveVolume * 100}%` }
                        ]}
                      />
                      <View
                        style={[
                          styles.volumeThumb,
                          { left: `${isMuted ? 0 : effectiveVolume * 100}%` }
                        ]}
                      />
                    </View>
                  </View>

                  <Text style={styles.volumeText}>{Math.round((isMuted ? 0 : effectiveVolume) * 100)}%</Text>
                </View>

                {/* Duration Control Section */}
                <GlassCard style={styles.durationCard} intensity={60}>
                  <View style={styles.durationHeader}>
                    <Text style={styles.durationTitle}>
                      {isSessionMode ? 'Session Duration (Smart Allocated)' : 'Session Duration'}
                    </Text>
                    <TouchableOpacity
                      style={styles.customDurationButton}
                      onPress={() => setShowDurationPicker(true)}
                    >
                      <Timer color={colors.primary} size={16} />
                      <Text style={styles.customDurationText}>Custom</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.durationPresets}
                    contentContainerStyle={styles.durationPresetsContent}
                  >
                    {durationPresets.map((preset) => {
                      const isSelected = duration === preset;
                      const isLocked = !isPremium && preset > maxFreeDuration;

                      return (
                        <TouchableOpacity
                          key={preset}
                          style={[
                            styles.durationPreset,
                            isSelected && styles.selectedDurationPreset,
                            isLocked && styles.lockedDurationPreset
                          ]}
                          onPress={() => {
                            if (isLocked) {
                              setPremiumModalTrigger('duration_limit');
                              setShowPremiumModal(true);
                              return;
                            }
                            setDuration(preset);
                            setTimeLeft(preset * 60);
                          }}
                        >
                          <Text style={[
                            styles.durationPresetText,
                            isSelected && styles.selectedDurationPresetText,
                            isLocked && styles.lockedDurationPresetText
                          ]}>
                            {preset}m
                          </Text>
                          {isLocked && (
                            <View style={styles.lockIcon}>
                              <Text style={styles.lockText}>🔒</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {!isPremium && (
                    <TouchableOpacity
                      style={styles.premiumPrompt}
                      onPress={() => {
                        setPremiumModalTrigger('duration_limit');
                        setShowPremiumModal(true);
                      }}
                    >
                      <Text style={styles.premiumPromptText}>
                        🔓 Unlock unlimited session lengths with Premium
                      </Text>
                    </TouchableOpacity>
                  )}
                </GlassCard>

              </ScrollView>
            </LinearGradient>
        </Animated.View>
      </Animated.View>

      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        trigger={premiumModalTrigger}
      />
    </Modal>
  );
};

const createStyles = (colors: any, gradients: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width,
    height: height,
    borderRadius: 0,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  glassEffect: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(14, 14, 32, 0.92)' : 'transparent',
    borderWidth: 1,
    borderColor: colors.glassBorderBright,
    borderRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  mainCard: {
    marginBottom: 14,
    padding: 0,
    overflow: 'hidden',
  },
  visualizerContainer: {
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  visualizerGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.primary,
  },
  visualizerWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visualizerOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  previewBadge: {
    backgroundColor: 'rgba(212,175,55,0.2)',
    borderColor: '#D4AF37',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  previewBadgeText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  frequencyHz: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  frequencyName: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  waveformContainer: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  waveformBar: {
    width: 2,
    borderRadius: 1,
    marginHorizontal: 1,
  },
  trackInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  trackDetails: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  trackSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  frequencyDuration: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    marginBottom: 18,
  },
  timeDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  timeDuration: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  progressContainer: {
    height: 44,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.glassMid,
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.textPrimary,
    top: -6,
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  controlButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryControl: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  playButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  playButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 10,
  },
  volumeIcon: {
    marginRight: 15,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeSlider: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  volumeTrack: {
    height: 4,
    backgroundColor: colors.glassMid,
    borderRadius: 2,
    position: 'relative',
  },
  volumeFill: {
    height: '100%',
    borderRadius: 2,
  },
  volumeThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.textPrimary,
    top: -6,
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  volumeText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 15,
    minWidth: 35,
  },
  durationCard: {
    marginBottom: 10,
    padding: 14,
  },
  durationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  durationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  customDurationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary + '12',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    minHeight: 44,
  },
  customDurationText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  durationPresets: {
    marginBottom: 15,
  },
  durationPresetsContent: {
    paddingHorizontal: 5,
  },
  durationPreset: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 4,
    backgroundColor: colors.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minWidth: 50,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedDurationPreset: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary + '80',
  },
  lockedDurationPreset: {
    backgroundColor: colors.glass,
    borderColor: colors.divider,
  },
  durationPresetText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDurationPresetText: {
    color: colors.primary,
    fontWeight: '600',
  },
  lockedDurationPresetText: {
    color: colors.textMuted,
  },
  lockIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  lockText: {
    fontSize: 12,
  },
  premiumPrompt: {
    padding: 12,
    backgroundColor: colors.gold + '1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gold + '4D',
    minHeight: 44,
    justifyContent: 'center',
  },
  premiumPromptText: {
    color: colors.gold,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  playIcon: {
    marginLeft: 4,
  },
});
