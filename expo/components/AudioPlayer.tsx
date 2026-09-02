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

const { width, height } = Dimensions.get('window');

// Pre-computed deterministic waveform bar heights — avoids Math.random() in render.
const WAVEFORM_BAR_HEIGHTS = Array.from({ length: 40 }, (_, i) =>
  10 + ((i * 73) % 30)
);

interface Frequency {
  hz: number;
  name: string;
  duration: number;
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
  const [duration, setDuration] = useState<number>(20); // minutes
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
  const [customDuration, setCustomDuration] = useState<number>(20);
  const [fadeOutEnabled, setFadeOutEnabled] = useState<boolean>(true);
  const [autoRepeat, setAutoRepeat] = useState<boolean>(false);
  const [sessionIntensity, setSessionIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  
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
  const { isPremium, trackUsage, userProfile } = useAuth();
  const { toggleFavorite: toggleFavoriteStore, isFavorite: isFavoriteInStore } = useFavorites();
  const { settings, updateSetting } = useSettings();
  const { colors, gradients, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, gradients, isDark), [colors, gradients, isDark]);
  
  // Quick duration presets for easy selection
  const durationPresets = isPremium ? 
    [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240] : // Premium users get more options
    [5, 10, 15, 20]; // Free users limited to 20 minutes max
  
  const maxFreeDuration = 20; // minutes
  const maxSessionLength = isPremium ? 240 : 20; // 4 hours for premium, 20 min for free
  
  // Sync local volume state with global settings volume when the player opens
  // and when settings.volume changes (e.g. from the Settings screen slider).
  // The player's own slider writes a transient override that takes precedence
  // for the active session and also writes back to settings.volume so it persists.
  useEffect(() => {
    if (visible) {
      setVolume(settings.volume);
      setPlayerVolumeOverride(null);
    }
  }, [visible, settings.volume]);

  // The effective volume is the player override if set, otherwise settings.volume.
  // The player slider overrides the settings baseline for the active session.
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
        // Persist the chosen volume to global settings so it survives across sessions
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
        if (!isSessionMode) {
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
  
  // Pulse animation for playing state
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
  
  // Rotate animation for visualizer mode
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

  // Single unified tick — drives BOTH the standalone timer and session timer.
  // Uses refs so the interval is set up ONCE and never torn down per tick.
  const tickStateRef = useRef({
    isTimerActive, isSessionActive, isSessionMode, isPlaying,
    timeLeft, sessionTimeLeft, fadeOutEnabled, autoRepeat, isPremium,
    duration, currentFrequencyIndex, sessionFrequencies, effectiveVolume,
  });
  tickStateRef.current = {
    isTimerActive, isSessionActive, isSessionMode, isPlaying,
    timeLeft, sessionTimeLeft, fadeOutEnabled, autoRepeat, isPremium,
    duration, currentFrequencyIndex, sessionFrequencies, effectiveVolume,
  };
  const tickRaf = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setAudioVolume(isMuted ? 0 : effectiveVolume);
  }, [effectiveVolume, isMuted, setAudioVolume]);

  // Initialize session when sessionFrequencies change
  useEffect(() => {
    if (isSessionMode && sessionFrequencies.length > 0) {
      const totalDuration = sessionFrequencies.reduce((sum, freq) => sum + freq.duration, 0);
      setSessionTimeLeft(totalDuration * 60);
      setCurrentFrequencyIndex(0);
      setSessionProgress(0);
    }
  }, [isSessionMode, sessionFrequencies]);

  // Unified single-second tick effect — only re-subscribes when play/pause state changes, not every tick.
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

          // Frequency transition detection
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
          if (st.fadeOutEnabled && st.isPremium && prev <= 10) {
            setAudioVolume(st.effectiveVolume * (prev / 10));
          }
          if (prev <= 1) {
            setIsTimerActive(false);
            stopFrequency();
            // Track usage for standalone playback (session mode already tracks on completion)
            if (frequency) {
              trackUsage(st.duration, frequency.name || `${frequency.hz} Hz`).catch(() => {});
            }
            if (st.autoRepeat && st.isPremium && frequency) {
              setTimeout(() => {
                setTimeLeft(st.duration * 60);
                playFrequency(frequency, frequency.name);
                setIsTimerActive(true);
              }, 2000);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isTimerActive, isSessionActive, isSessionMode]);

  // Update timeLeft when duration changes (no tick dependency).
  useEffect(() => {
    setTimeLeft(duration * 60);
  }, [duration]);

  // Apply premium restrictions.
  useEffect(() => {
    if (!isPremium && duration > maxFreeDuration) {
      setDuration(maxFreeDuration);
      setTimeLeft(maxFreeDuration * 60);
    }
  }, [isPremium, duration, maxFreeDuration]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = useCallback(() => {
    if (isSessionMode) {
      if (isPlaying && isSessionActive) {
        stopFrequency();
        setIsSessionActive(false);
      } else {
        const currentFreq = sessionFrequencies[currentFrequencyIndex];
        if (currentFreq && sessionTimeLeft > 0) {
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
          playFrequency(frequency, frequency.name);
          if (timeLeft > 0) {
            setIsTimerActive(true);
          }
        }
      }
    }
  }, [isSessionMode, isPlaying, isSessionActive, sessionFrequencies, currentFrequencyIndex, frequency, sessionTimeLeft, timeLeft, playFrequency, stopFrequency, currentFrequency]);

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

  // Favorite toggle — connected to the favorites store (needs displayFrequency)
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

  // Sync favorite state from the store whenever the displayed frequency changes
  useEffect(() => {
    if (displayFrequency) {
      setIsFavorite(isFavoriteInStore(displayFrequency.hz));
    }
  }, [displayFrequency, isFavoriteInStore]);

  // Use the shared GlassCard — iOS BlurView, Android gradient glass, web translucent.
  // Wrap in useMemo so the reference is stable and children don't remount every render.
  const GlassCard = useMemo(() => {
    const MemoCard = React.memo(SharedGlassCard);
    const Wrapped = ({ children, style, intensity }: { children: React.ReactNode; style?: any; intensity?: number }) => (
      <MemoCard style={[styles.glassEffect, style]} intensity={intensity}>
        {children}
      </MemoCard>
    );
    return Wrapped;
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
                  <TouchableOpacity style={styles.headerButton} onPress={onClose}>
                    <ChevronDown color="#FFFFFF" size={28} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>{displayTitle}</Text>
                  <TouchableOpacity style={styles.headerButton} onPress={() => setShowMoreMenu(true)}>
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
                      <Text style={styles.frequencyHz}>{displayFrequency?.hz || 0} Hz</Text>
                      <Text style={styles.frequencyName}>{displayFrequency?.name || 'No Frequency'}</Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Waveform Indicator — static decorative bars (no per-render Math.random) */}
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
                  
                  {/* Smart Allocation Info for Sessions */}
                  {isSessionMode && sessionFrequencies.length > 0 && (
                    <View style={styles.allocationInfo}>
                      <Text style={styles.allocationTitle}>Smart Duration Allocation:</Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.allocationScroll}
                      >
                        {sessionFrequencies.map((freq, index) => (
                          <View 
                            key={`${freq.hz}-${index}`} 
                            style={[
                              styles.allocationItem,
                              index === currentFrequencyIndex && styles.activeAllocationItem
                            ]}
                          >
                            <Text style={[
                              styles.allocationFreq,
                              index === currentFrequencyIndex && styles.activeAllocationText
                            ]}>
                              {freq.hz} Hz
                            </Text>
                            <Text style={[
                              styles.allocationDuration,
                              index === currentFrequencyIndex && styles.activeAllocationText
                            ]}>
                              {freq.duration}m
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                      <Text style={styles.allocationNote}>
                        💡 Durations are intelligently allocated based on frequency research and healing properties
                      </Text>
                    </View>
                  )}
                  
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
                              alert('Upgrade to Premium for longer sessions!');
                              return;
                            }
                            setDuration(preset);
                            setTimeLeft(preset * 60);
                          }}
                          disabled={isLocked}
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
                    <View style={styles.premiumPrompt}>
                      <Text style={styles.premiumPromptText}>
                        🔓 Unlock unlimited session lengths with Premium
                      </Text>
                    </View>
                  )}
                </GlassCard>

                {/* Session Intensity Control (Premium Feature) */}
                {isPremium && (
                  <GlassCard style={styles.intensityCard} intensity={60}>
                    <Text style={styles.intensityTitle}>Session Intensity</Text>
                    <View style={styles.intensityControls}>
                      {(['low', 'medium', 'high'] as const).map((intensity) => (
                        <TouchableOpacity
                          key={intensity}
                          style={[
                            styles.intensityButton,
                            sessionIntensity === intensity && styles.selectedIntensityButton
                          ]}
                          onPress={() => setSessionIntensity(intensity)}
                        >
                          <Text style={[
                            styles.intensityButtonText,
                            sessionIntensity === intensity && styles.selectedIntensityButtonText
                          ]}>
                            {intensity.charAt(0).toUpperCase() + intensity.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.intensityDescription}>
                      {sessionIntensity === 'low' && 'Gentle, relaxing frequencies for meditation'}
                      {sessionIntensity === 'medium' && 'Balanced frequencies for focus and healing'}
                      {sessionIntensity === 'high' && 'Powerful frequencies for deep transformation'}
                    </Text>
                  </GlassCard>
                )}

                {/* Advanced Settings (Premium Feature) */}
                {isPremium && (
                  <GlassCard style={styles.advancedCard} intensity={60}>
                    <Text style={styles.advancedTitle}>Advanced Settings</Text>
                    
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>Fade Out</Text>
                      <TouchableOpacity
                        style={[styles.toggle, fadeOutEnabled && styles.toggleActive]}
                        onPress={() => setFadeOutEnabled(!fadeOutEnabled)}
                      >
                        <View style={[styles.toggleThumb, fadeOutEnabled && styles.toggleThumbActive]} />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.settingRow}>
                      <Text style={styles.settingLabel}>Auto Repeat</Text>
                      <TouchableOpacity
                        style={[styles.toggle, autoRepeat && styles.toggleActive]}
                        onPress={() => setAutoRepeat(!autoRepeat)}
                      >
                        <View style={[styles.toggleThumb, autoRepeat && styles.toggleThumbActive]} />
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                )}



                {/* Session Playlist (shown when toggled) */}
                {showPlaylist && isSessionMode && sessionFrequencies.length > 0 && (
                  <GlassCard style={styles.playlistContainer} intensity={70}>
                    <Text style={styles.playlistTitle}>Session Playlist</Text>
                    <ScrollView style={styles.playlistScroll} showsVerticalScrollIndicator={false}>
                      {sessionFrequencies.map((freq, index) => (
                        <TouchableOpacity
                          key={`${freq.hz}-${index}`}
                          style={[
                            styles.playlistItem,
                            index === currentFrequencyIndex && styles.activePlaylistItem
                          ]}
                          onPress={() => {
                            setCurrentFrequencyIndex(index);
                            if (isPlaying) {
                              playFrequency(freq, freq.name);
                            }
                          }}
                        >
                          <View style={styles.playlistItemLeft}>
                            <Text style={styles.playlistNumber}>{index + 1}</Text>
                            {index === currentFrequencyIndex && isPlaying && (
                              <Waves color={colors.primary} size={16} style={styles.playingIcon} />
                            )}
                          </View>
                          <View style={styles.playlistItemCenter}>
                            <Text style={[
                              styles.playlistItemTitle,
                              index === currentFrequencyIndex && styles.activePlaylistText
                            ]}>
                              {freq.name}
                            </Text>
                            <Text style={styles.playlistItemSubtitle}>
                              {freq.hz} Hz • {freq.duration} min
                            </Text>
                          </View>
                          <Radio color={index === currentFrequencyIndex ? colors.primary : colors.textMuted} size={16} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </GlassCard>
                )}

                {/* Duration Picker Modal */}
                <Modal
                  visible={showDurationPicker}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowDurationPicker(false)}
                >
                  <View style={styles.modalOverlay}>
                    <GlassCard style={styles.durationPickerModal} intensity={90}>
                      <Text style={styles.modalTitle}>Custom Duration</Text>
                      
                      <View style={styles.durationInputContainer}>
                        <TouchableOpacity
                          style={styles.durationAdjustButton}
                          onPress={() => {
                            const newDuration = Math.max(1, customDuration - 5);
                            setCustomDuration(newDuration);
                          }}
                        >
                          <Text style={styles.durationAdjustText}>-5</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.durationDisplay}>
                          <Text style={styles.durationValue}>{customDuration}</Text>
                          <Text style={styles.durationUnit}>minutes</Text>
                        </View>
                        
                        <TouchableOpacity
                          style={styles.durationAdjustButton}
                          onPress={() => {
                            const maxDuration = isPremium ? 240 : maxFreeDuration;
                            const newDuration = Math.min(maxDuration, customDuration + 5);
                            if (newDuration > maxFreeDuration && !isPremium) {
                              alert('Upgrade to Premium for longer sessions!');
                              return;
                            }
                            setCustomDuration(newDuration);
                          }}
                        >
                          <Text style={styles.durationAdjustText}>+5</Text>
                        </TouchableOpacity>
                      </View>
                      
                      {!isPremium && customDuration > maxFreeDuration && (
                        <Text style={styles.premiumWarning}>
                          ⚠️ Duration limited to {maxFreeDuration} minutes for free users
                        </Text>
                      )}
                      
                      <View style={styles.modalButtons}>
                        <TouchableOpacity
                          style={styles.modalCancelButton}
                          onPress={() => setShowDurationPicker(false)}
                        >
                          <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.modalConfirmButton}
                          onPress={() => {
                            const finalDuration = isPremium ? customDuration : Math.min(customDuration, maxFreeDuration);
                            setDuration(finalDuration);
                            setTimeLeft(finalDuration * 60);
                            setShowDurationPicker(false);
                          }}
                        >
                          <Text style={styles.modalConfirmText}>Set Duration</Text>
                        </TouchableOpacity>
                      </View>
                    </GlassCard>
                  </View>
                </Modal>

                {/* More Menu Modal */}
                <Modal
                  visible={showMoreMenu}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setShowMoreMenu(false)}
                >
                  <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1}
                    onPress={() => setShowMoreMenu(false)}
                  >
                    <TouchableOpacity 
                      style={styles.moreMenuContainer}
                      activeOpacity={1}
                      onPress={(e) => e.stopPropagation()}
                    >
                      <GlassCard style={styles.moreMenuCard} intensity={95}>
                        <View style={styles.moreMenuHeader}>
                          <Text style={styles.moreMenuTitle}>Options</Text>
                          <TouchableOpacity 
                            style={styles.moreMenuClose}
                            onPress={() => setShowMoreMenu(false)}
                          >
                            <X color="#FFFFFF" size={24} />
                          </TouchableOpacity>
                        </View>
                        
                        <View style={styles.moreMenuGrid}>
                          <TouchableOpacity 
                            style={styles.moreMenuItem}
                            onPress={() => {
                              setShowMoreMenu(false);
                              setShowInfo(true);
                            }}
                          >
                            <View style={styles.moreMenuIconContainer}>
                              <Info color={colors.primary} size={24} />
                            </View>
                            <Text style={styles.moreMenuItemText}>Info</Text>
                            <Text style={styles.moreMenuItemSubtext}>Frequency details</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={styles.moreMenuItem}
                            onPress={() => {
                              setShowMoreMenu(false);
                              setShowStats(true);
                            }}
                          >
                            <View style={styles.moreMenuIconContainer}>
                              <BarChart3 color={colors.primary} size={24} />
                            </View>
                            <Text style={styles.moreMenuItemText}>Stats</Text>
                            <Text style={styles.moreMenuItemSubtext}>Session analytics</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={styles.moreMenuItem}
                            onPress={() => {
                              setShowMoreMenu(false);
                              setShowTimerSettings(true);
                            }}
                          >
                            <View style={styles.moreMenuIconContainer}>
                              <Timer color={colors.primary} size={24} />
                            </View>
                            <Text style={styles.moreMenuItemText}>Timer</Text>
                            <Text style={styles.moreMenuItemSubtext}>Duration settings</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={styles.moreMenuItem}
                            onPress={() => {
                              setShowMoreMenu(false);
                              setShowSettings(true);
                            }}
                          >
                            <View style={styles.moreMenuIconContainer}>
                              <Settings color={colors.primary} size={24} />
                            </View>
                            <Text style={styles.moreMenuItemText}>Settings</Text>
                            <Text style={styles.moreMenuItemSubtext}>Audio preferences</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={styles.moreMenuItem}
                            onPress={() => {
                              setShowMoreMenu(false);
                              setShowPlaylist(!showPlaylist);
                            }}
                          >
                            <View style={styles.moreMenuIconContainer}>
                              <List color={colors.primary} size={24} />
                            </View>
                            <Text style={styles.moreMenuItemText}>Playlist</Text>
                            <Text style={styles.moreMenuItemSubtext}>Session tracks</Text>
                          </TouchableOpacity>
                        </View>
                      </GlassCard>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Modal>

                {/* Info Modal */}
                <Modal
                  visible={showInfo}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowInfo(false)}
                >
                  <View style={styles.modalOverlay}>
                    <GlassCard style={styles.infoModal} intensity={90}>
                      <Text style={styles.modalTitle}>Frequency Information</Text>
                      
                      <View style={styles.infoSection}>
                        <Text style={styles.infoLabel}>Current Frequency</Text>
                        <Text style={styles.infoValue}>{displayFrequency?.hz || 0} Hz - {displayFrequency?.name || 'No Frequency'}</Text>
                      </View>
                      
                      {isSessionMode && (
                        <View style={styles.infoSection}>
                          <Text style={styles.infoLabel}>Session Progress</Text>
                          <Text style={styles.infoValue}>Track {currentFrequencyIndex + 1} of {sessionFrequencies.length}</Text>
                        </View>
                      )}
                      
                      <View style={styles.infoSection}>
                        <Text style={styles.infoLabel}>Benefits</Text>
                        <Text style={styles.infoDescription}>
                          This frequency promotes healing, balance, and spiritual alignment. Regular listening can enhance meditation and overall well-being.
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setShowInfo(false)}
                      >
                        <Text style={styles.modalCloseText}>Close</Text>
                      </TouchableOpacity>
                    </GlassCard>
                  </View>
                </Modal>

                {/* Stats Modal */}
                <Modal
                  visible={showStats}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowStats(false)}
                >
                  <View style={styles.modalOverlay}>
                    <GlassCard style={styles.statsModal} intensity={90}>
                      <Text style={styles.modalTitle}>Session Statistics</Text>
                      
                      <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                          <Text style={styles.statNumber}>{Math.floor((duration * 60 - timeLeft) / 60)}</Text>
                          <Text style={styles.statLabel}>Minutes Played</Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statNumber}>{isSessionMode ? sessionFrequencies.length : 1}</Text>
                          <Text style={styles.statLabel}>Total Tracks</Text>
                        </View>
                      </View>
                      
                      <View style={styles.statsProgress}>
                        <Text style={styles.statsProgressLabel}>Completion</Text>
                        <View style={styles.statsProgressBar}>
                          <View style={[styles.statsProgressFill, { width: `${progress}%` }]} />
                        </View>
                        <Text style={styles.statsProgressText}>{Math.round(progress)}%</Text>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setShowStats(false)}
                      >
                        <Text style={styles.modalCloseText}>Close</Text>
                      </TouchableOpacity>
                    </GlassCard>
                  </View>
                </Modal>

                {/* Settings Modal */}
                <Modal
                  visible={showSettings}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowSettings(false)}
                >
                  <View style={styles.modalOverlay}>
                    <GlassCard style={styles.settingsModal} intensity={90}>
                      <Text style={styles.modalTitle}>Audio Settings</Text>
                      
                      <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Visualizer Mode</Text>
                        <TouchableOpacity
                          style={styles.settingOption}
                          onPress={cycleVisualizerMode}
                        >
                          <Text style={styles.settingOptionText}>{visualizerMode}</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Auto-Repeat</Text>
                        <TouchableOpacity
                          style={[styles.toggle, isRepeat && styles.toggleActive]}
                          onPress={toggleRepeat}
                        >
                          <View style={[styles.toggleThumb, isRepeat && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.settingItem}>
                        <Text style={styles.settingLabel}>Shuffle</Text>
                        <TouchableOpacity
                          style={[styles.toggle, isShuffle && styles.toggleActive]}
                          onPress={toggleShuffle}
                        >
                          <View style={[styles.toggleThumb, isShuffle && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setShowSettings(false)}
                      >
                        <Text style={styles.modalCloseText}>Close</Text>
                      </TouchableOpacity>
                    </GlassCard>
                  </View>
                </Modal>

                {/* Timer Settings Modal */}
                <Modal
                  visible={showTimerSettings}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setShowTimerSettings(false)}
                >
                  <View style={styles.modalOverlay}>
                    <GlassCard style={styles.timerSettingsModal} intensity={90}>
                      <Text style={styles.modalTitle}>Timer Settings</Text>
                      
                      <View style={styles.timerOption}>
                        <Text style={styles.timerOptionLabel}>Current Session</Text>
                        <Text style={styles.timerOptionValue}>{formatTime(displayTimeLeft)}</Text>
                      </View>
                      
                      <View style={styles.timerOption}>
                        <Text style={styles.timerOptionLabel}>Total Duration</Text>
                        <Text style={styles.timerOptionValue}>
                          {isSessionMode ? 
                            formatTime(sessionFrequencies.reduce((sum, freq) => sum + freq.duration * 60, 0)) :
                            formatTime(duration * 60)
                          }
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.timerActionButton}
                        onPress={() => {
                          handleStop();
                          setShowTimerSettings(false);
                        }}
                      >
                        <Text style={styles.timerActionText}>Reset Timer</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setShowTimerSettings(false)}
                      >
                        <Text style={styles.modalCloseText}>Close</Text>
                      </TouchableOpacity>
                    </GlassCard>
                  </View>
                </Modal>
              </ScrollView>
            </LinearGradient>
        </Animated.View>
      </Animated.View>
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
  },
  shareButton: {
    padding: 8,
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
  },
  actionText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },
  playlistContainer: {
    marginTop: 20,
    padding: 20,
  },
  playlistTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 15,
  },
  playlistScroll: {
    height: 240,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  activePlaylistItem: {
    backgroundColor: colors.primary + '14',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  playlistItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
  },
  playlistNumber: {
    fontSize: 14,
    color: colors.textMuted,
    marginRight: 8,
  },
  playingIcon: {
    position: 'absolute',
    left: 20,
  },
  playlistItemCenter: {
    flex: 1,
    marginLeft: 10,
  },
  playlistItemTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 2,
  },
  activePlaylistText: {
    color: colors.primary,
  },
  playlistItemSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  
  // Duration Control Styles
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
    alignItems: 'center',
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
  },
  premiumPromptText: {
    color: colors.gold,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Session Intensity Styles
  intensityCard: {
    marginBottom: 10,
    padding: 14,
  },
  intensityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  intensityControls: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 4,
    backgroundColor: colors.glass,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
  },
  selectedIntensityButton: {
    backgroundColor: colors.primary + '33',
    borderColor: colors.primary,
  },
  intensityButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedIntensityButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  intensityDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Advanced Settings Styles
  advancedCard: {
    marginBottom: 10,
    padding: 14,
  },
  advancedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.glassMid,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textPrimary,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.87)' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  durationPickerModal: {
    width: '100%',
    maxWidth: 320,
    padding: 22,
    backgroundColor: isDark ? 'rgba(8, 8, 22, 0.98)' : 'rgba(255, 255, 255, 0.98)',
  },
  timerSettingsModal: {
    width: '100%',
    maxWidth: 320,
    padding: 22,
    backgroundColor: isDark ? 'rgba(8, 8, 22, 0.98)' : 'rgba(255, 255, 255, 0.98)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 18,
  },
  durationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  durationAdjustButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '12',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationAdjustText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  durationDisplay: {
    alignItems: 'center',
    marginHorizontal: 30,
  },
  durationValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  durationUnit: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  premiumWarning: {
    color: colors.gold,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: colors.glassMid,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  modalConfirmText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  timerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  timerOptionLabel: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  timerOptionValue: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  timerActionButton: {
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  timerActionText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    paddingVertical: 12,
    backgroundColor: colors.glassMid,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  playIcon: {
    marginLeft: 4,
  },
  
  // More Menu Styles
  moreMenuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  moreMenuCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 0,
    paddingBottom: 28,
    backgroundColor: isDark ? 'rgba(8, 8, 22, 0.98)' : 'rgba(255, 255, 255, 0.98)',
  },
  moreMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  moreMenuTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  moreMenuClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.glassMid,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreMenuGrid: {
    padding: 14,
  },
  moreMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.glass,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  moreMenuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '25',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  moreMenuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
    flex: 1,
  },
  moreMenuItemSubtext: {
    fontSize: 12,
    color: colors.textMuted,
    position: 'absolute',
    bottom: 18,
    left: 80,
  },
  
  // Info Modal Styles
  infoModal: {
    width: '100%',
    maxWidth: 360,
    padding: 22,
    backgroundColor: isDark ? 'rgba(8, 8, 22, 0.98)' : 'rgba(255, 255, 255, 0.98)',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  infoDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  // Stats Modal Styles
  statsModal: {
    width: '100%',
    maxWidth: 360,
    padding: 22,
    backgroundColor: isDark ? 'rgba(8, 8, 22, 0.98)' : 'rgba(255, 255, 255, 0.98)',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  statsProgress: {
    marginBottom: 20,
  },
  statsProgressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  statsProgressBar: {
    height: 8,
    backgroundColor: colors.glassMid,
    borderRadius: 4,
    marginBottom: 8,
  },
  statsProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  statsProgressText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'right',
  },
  
  // Settings Modal Styles
  settingsModal: {
    width: '100%',
    maxWidth: 360,
    padding: 22,
    backgroundColor: isDark ? 'rgba(8, 8, 22, 0.98)' : 'rgba(255, 255, 255, 0.98)',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary + '12',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  settingOptionText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  
  // Smart Allocation Styles
  allocationInfo: {
    marginTop: 15,
    padding: 15,
    backgroundColor: 'rgba(0, 212, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '1A',
  },
  allocationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  allocationScroll: {
    marginBottom: 10,
  },
  allocationItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: colors.glass,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minWidth: 60,
  },
  activeAllocationItem: {
    backgroundColor: colors.primary + '25',
    borderColor: colors.primary,
  },
  allocationFreq: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  allocationDuration: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activeAllocationText: {
    color: colors.primary,
    fontWeight: '600',
  },
  allocationNote: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});