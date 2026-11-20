import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
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
  Maximize2,
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
  BarChart3,
  RotateCcw
} from 'lucide-react-native';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites } from '@/hooks/useFavorites';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { usePlayer } from '@/lib/player/PlayerContext';
import { clampResumePosition, isResumeUsable } from '@/lib/audio/playback-history';
import { globalAudioEngine } from '@/lib/audio/FrequencyAudioEngine';
import { useResponsive } from '@/lib/ui/responsive';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PlayerVisualizer, VISUALIZER_LABELS, VisualizerStyle, nextVisualizerStyle } from './PlayerVisualizer';
import { ImmersiveStage } from './ImmersiveStage';
import { Share } from 'react-native';
import { DEFAULT_PREMIUM_POLICY } from '@/lib/subscription-service';
import { PremiumModal, PremiumTrigger } from './PremiumModal';
import { usePremiumUsage } from '@/hooks/usePremiumUsage';
import { AffirmationStreamCard } from './AffirmationStreamCard';
import { AffirmationVideoStage } from './AffirmationVideoStage';
import { Affirmation, AffirmationMode } from '@/types/affirmation';


// Pre-computed deterministic waveform bar heights — avoids Math.random() in render.
// Visualiser stage height. Tall enough for the wave crests to breathe without
// pushing the transport controls below the fold on a small phone.
const VISUALIZER_HEIGHT = 190;


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
  sessionId?: string;
  onSessionComplete?: (sessionId: string, durationSeconds: number) => Promise<void>;
  isSessionMode?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  visible,
  onClose,
  frequency,
  sessionFrequencies = [],
  sessionName = '',
  sessionId,
  onSessionComplete,
  isSessionMode = false,
}) => {
  const { width, height } = useWindowDimensions();
  const { isTablet, contentWidth } = useResponsive();
  const reducedMotion = useReducedMotion();
  // The visualiser is drawn as SVG, so it needs an exact pixel width rather
  // than flex sizing. The player column is capped at `contentWidth` and padded
  // by `styles.content` on both sides, so the SVG must fit inside that padding
  // or it overflows the column on a phone.
  const PLAYER_CONTENT_PADDING = 20;
  const visualizerWidth = Math.max(0, Math.min(width, contentWidth) - PLAYER_CONTENT_PADDING * 2);
  const [duration, setDuration] = useState<number>(15); // minutes
  const [timeLeft, setTimeLeft] = useState<number>(duration * 60); // seconds
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [playerVolumeOverride, setPlayerVolumeOverride] = useState<number | null>(null);
  const [slideAnim] = useState(new Animated.Value(height));
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [visualizerStyle, setVisualizerStyle] = useState<VisualizerStyle>('wave');
  const [isImmersive, setIsImmersive] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showPlaylist, setShowPlaylist] = useState<boolean>(false);
  const [showTimerSettings, setShowTimerSettings] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);
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
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const volumeSlideAnim = useRef(new Animated.Value(0)).current;

  // Affirmation stream states
  const [affirmationMode, setAffirmationMode] = useState<AffirmationMode>('off');
  const [speechVolume, setSpeechVolume] = useState<number>(0.8);
  const [activeAffirmation, setActiveAffirmation] = useState<Affirmation | null>(null);

  // Session mode states
  const [currentFrequencyIndex, setCurrentFrequencyIndex] = useState<number>(0);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [sessionProgress, setSessionProgress] = useState<number>(0);

  // Resume / history states
  const [resumeOffer, setResumeOffer] = useState<{ seconds: number } | null>(null);
  const pendingRef = useRef<{ hz: number; name: string; category?: string; seconds: number } | null>(null);
  const resumeCheckedRef = useRef<string>('');
  const persistedResumeRef = useRef<string>('');

  const { isPlaying, isPaused, currentFrequency, playFrequency, stopFrequency, pauseFrequency, resumeFrequency, setVolume: setAudioVolume } = useAudioPlayer();
  const { resumeFor, saveResume, recordPlay, history } = usePlayer();
  const { isPremium, capabilities, trackUsage } = useAuth();
  const { attemptStartSession } = usePremiumUsage();
  const { toggleFavorite: toggleFavoriteStore, isFavorite: isFavoriteInStore } = useFavorites();
  const { settings, updateSetting } = useSettings();
  const { colors, gradients, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, gradients, isDark, width, height), [colors, gradients, isDark, width, height]);

  /**
   * Persists a "left off" point for the current track. Only meaningful for
   * single-frequency playback — session mode is already driven by its own
   * progress state and is not resumable across visits.
   */
  const persistResume = useCallback(() => {
    if (isSessionMode || !frequency) return;
    const total = duration * 60;
    const elapsed = Math.max(0, total - timeLeft);
    if (elapsed < 5) return;
    saveResume({
      hz: frequency.hz,
      name: frequency.name,
      positionSeconds: elapsed,
      totalSeconds: total,
    });
  }, [isSessionMode, frequency, duration, timeLeft, saveResume]);

  /**
   * Commits the pending listening time into play history. Guarded so a glance at
   * the player (no real listening) does not pollute the history.
   */
  const flushHistory = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending || pending.seconds < 5) {
      pendingRef.current = null;
      return;
    }
    recordPlay({
      hz: pending.hz,
      name: pending.name,
      category: pending.category,
      listenedSeconds: pending.seconds,
    });
    pendingRef.current = null;
  }, [recordPlay]);

  /**
   * Accumulates real listening time for the current track. Called on every tick
   * and flushed into play history when the listener leaves the track (pauses,
   * switches track, or dismisses the player) so a single visit counts once.
   */
  const trackListeningTick = useCallback(() => {
    const target = isSessionMode && sessionFrequencies.length > 0
      ? sessionFrequencies[currentFrequencyIndex]
      : frequency;
    if (!target) return;
    const pending = pendingRef.current;
    if (pending && pending.hz === target.hz && pending.name === target.name) {
      pending.seconds += 1;
    } else {
      if (pending) flushHistory();
      pendingRef.current = { hz: target.hz, name: target.name, category: target.category, seconds: 1 };
    }
  }, [isSessionMode, sessionFrequencies, currentFrequencyIndex, frequency, flushHistory]);

  // Quick duration presets for easy selection
  const durationPresets = isPremium ?
    [5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240] :
    [5, 10, 15]; // Free users limited to policy free max duration

  const maxFreeDuration = Math.floor(DEFAULT_PREMIUM_POLICY.freeSessionMaxDuration / 60); // 15 minutes

  // Popover Volume Controller states
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const volumeAnim = useRef(new Animated.Value(0)).current;
  const volumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetVolumeTimer = useCallback(() => {
    if (volumeTimerRef.current) {
      clearTimeout(volumeTimerRef.current);
    }
    volumeTimerRef.current = setTimeout(() => {
      Animated.timing(volumeAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => setShowVolumeSlider(false));
    }, 3500);
  }, [volumeAnim]);

  const toggleVolumeSlider = useCallback(() => {
    if (showVolumeSlider) {
      if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current);
      Animated.timing(volumeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowVolumeSlider(false));
    } else {
      setShowVolumeSlider(true);
      Animated.spring(volumeAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 90,
        friction: 8,
      }).start();
      resetVolumeTimer();
    }
  }, [showVolumeSlider, volumeAnim, resetVolumeTimer]);

  // Sync local volume state with global settings
  useEffect(() => {
    if (visible) {
      setVolume(settings.volume);
      setPlayerVolumeOverride(null);
    }
  }, [visible, settings.volume]);

  // Apply the background-audio preference to the native audio session.
  useEffect(() => {
    globalAudioEngine.setBackgroundPlayback(settings.backgroundAudio);
  }, [settings.backgroundAudio]);

  const effectiveVolume = playerVolumeOverride !== null ? playerVolumeOverride : volume;

  // Volume slider pan responder
  const volumePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const trackWidth = Math.max(100, width - 140);
        const newVolume = Math.max(0, Math.min(1, (gestureState.moveX - 70) / trackWidth));
        setVolume(newVolume);
        setPlayerVolumeOverride(newVolume);
        if (!isMuted) {
          setAudioVolume(newVolume);
        }
        resetVolumeTimer();
      },
      onPanResponderRelease: () => {
        updateSetting('volume', playerVolumeOverride !== null ? playerVolumeOverride : volume);
        resetVolumeTimer();
      },
    })
  ).current;

  // Progress slider pan responder
  // The scrubber is a *remaining-time* control, not an audio seek: a tone has no
  // timeline to jump within. It therefore needs its own measured width, since
  // the track is centred inside a max-width column on tablets.
  const scrubWidthRef = useRef(0);
  const seekToTouch = useCallback(
    (locationX: number) => {
      if (isSessionMode || isPreviewActive || scrubWidthRef.current <= 0) return;
      const ratio = Math.max(0, Math.min(1, locationX / scrubWidthRef.current));
      setTimeLeft(Math.round((1 - ratio) * duration * 60));
    },
    [isSessionMode, isPreviewActive, duration]
  );

  /**
   * Ratio-based seek shared by the scrubber and the full-screen stage. In
   * session mode the bar reports progress only, so seeking is a no-op there.
   */
  const seekToRatio = useCallback(
    (ratio: number) => {
      if (isSessionMode || isPreviewActive) return;
      const clamped = Math.max(0, Math.min(1, ratio));
      setTimeLeft(Math.round((1 - clamped) * duration * 60));
    },
    [isSessionMode, isPreviewActive, duration]
  );

  const handleImmersiveVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      setVolume(clamped);
      setPlayerVolumeOverride(clamped);
      if (!isMuted) setAudioVolume(clamped);
    },
    [isMuted, setAudioVolume]
  );

  const progressPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => seekToTouch(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => seekToTouch(evt.nativeEvent.locationX),
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

  // Single unified tick
  const tickStateRef = useRef({
    isTimerActive, isSessionActive, isSessionMode, isPlaying, isPaused,
    timeLeft, sessionTimeLeft, fadeOutEnabled, autoRepeat, isPremium,
    duration, currentFrequencyIndex, sessionFrequencies, effectiveVolume,
    isPreviewActive, autoStopEnabled: settings.autoStop,
  });
  tickStateRef.current = {
    isTimerActive, isSessionActive, isSessionMode, isPlaying, isPaused,
    timeLeft, sessionTimeLeft, fadeOutEnabled, autoRepeat, isPremium,
    duration, currentFrequencyIndex, sessionFrequencies, effectiveVolume,
    isPreviewActive, autoStopEnabled: settings.autoStop,
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
    const shouldTick = s.isPlaying && !s.isPaused && ((s.isSessionMode && s.isSessionActive && s.sessionTimeLeft > 0) || (!s.isSessionMode && s.isTimerActive && s.timeLeft > 0));
    if (!shouldTick) return;

    tickRaf.current = setInterval(() => {
      const st = tickStateRef.current;
      // Track real listening time (excluding previews) for the play history.
      if (st.isPlaying && !st.isPaused && !st.isPreviewActive) {
        trackListeningTick();
      }
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
                const nfCat = String(nf?.category || '').toLowerCase();
                const nfLocked = (nf?.isPremium || nfCat === 'chakra' || nfCat === 'binaural') && !capabilities?.premiumFrequencies;
                setCurrentFrequencyIndex(i);
                setTimeout(() => playFrequency(nf, nf.name, nfLocked ? 'preview' : 'full'), 100);
              }
              break;
            }
            acc += fd;
          }

          if (newTime <= 0) {
            setIsSessionActive(false);
            setSessionProgress(100);
            const totalMinutes = st.sessionFrequencies.reduce((sum, f) => sum + f.duration, 0);
            if (sessionId && onSessionComplete) {
              onSessionComplete(sessionId, totalMinutes * 60).catch(() => {});
            } else {
              trackUsage(totalMinutes, st.sessionFrequencies[st.currentFrequencyIndex]?.name || 'session').catch(() => {});
            }

            if (st.autoRepeat) {
              // Restart the same session from the top without re-asking the user.
              setCurrentFrequencyIndex(0);
              setSessionProgress(0);
              setTimeout(() => {
                const first = st.sessionFrequencies[0];
                if (!first) return;
                const firstCat = String(first?.category || '').toLowerCase();
                const firstLocked =
                  (first?.isPremium || firstCat === 'chakra' || firstCat === 'binaural') &&
                  !capabilities?.premiumFrequencies;
                playFrequency(first, first.name, firstLocked ? 'preview' : 'full');
                setIsSessionActive(true);
              }, 400);
              return totalDuration;
            }

            if (st.autoStopEnabled) stopFrequency();
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
            if (st.autoRepeat && !st.isPreviewActive && frequency) {
              // Loop the same tone: the engine is still playing, so only the
              // countdown and any fade need resetting.
              setAudioVolume(st.effectiveVolume);
              return st.duration * 60;
            }
            setIsTimerActive(false);
            if (st.autoStopEnabled) stopFrequency();
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
  }, [isPlaying, isPaused, isTimerActive, isSessionActive, isSessionMode, onSessionComplete, sessionId, trackUsage, trackListeningTick, frequency]);

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

  // Offer to resume where the listener left off. Checked once per track so the
  // prompt does not reappear after it is dismissed.
  useEffect(() => {
    if (!visible || isSessionMode || !frequency) return;
    const key = `${frequency.hz}:${frequency.name}`;
    if (resumeCheckedRef.current === key) return;
    resumeCheckedRef.current = key;

    const stored = resumeFor(frequency.hz, frequency.name);
    if (!isResumeUsable(stored) || !stored) return;

    // Restore the track length the listener was working with, then seek to the
    // saved position within it.
    const restoredMinutes = stored.totalSeconds
      ? Math.max(1, Math.round(stored.totalSeconds / 60))
      : duration;
    const total = restoredMinutes * 60;
    const position = clampResumePosition(stored.positionSeconds, total);
    if (restoredMinutes !== duration) setDuration(restoredMinutes);
    setResumeOffer({ seconds: position });
    setTimeLeft(Math.max(0, total - position));
  }, [visible, isSessionMode, frequency, duration, resumeFor]);

  // Persist the left-off point periodically while listening (single-frequency mode).
  useEffect(() => {
    if (!visible || isSessionMode || !frequency || !isPlaying) return;
    const total = duration * 60;
    const elapsed = total - timeLeft;
    if (elapsed < 5) return;
    const bucket = Math.floor(elapsed / 15);
    const key = `${frequency.hz}:${frequency.name}:${bucket}`;
    if (persistedResumeRef.current === key) return;
    persistedResumeRef.current = key;
    saveResume({ hz: frequency.hz, name: frequency.name, positionSeconds: elapsed, totalSeconds: total });
  }, [visible, isSessionMode, frequency, isPlaying, timeLeft, duration, saveResume]);

  // Record the visit into play history when a track runs to completion.
  useEffect(() => {
    if (isSessionMode || isTimerActive || timeLeft !== 0 || !frequency) return;
    flushHistory();
  }, [isSessionMode, isTimerActive, timeLeft, frequency, flushHistory]);

  // Commit history and the left-off point when the player is dismissed.
  const prevVisibleRef = useRef<boolean>(false);
  useEffect(() => {
    if (prevVisibleRef.current && !visible) {
      persistResume();
      flushHistory();
    }
    prevVisibleRef.current = visible;
  }, [visible, persistResume, flushHistory]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Free listeners get a bounded number of sessions per day and a maximum
   * session length. The gate runs before any audio starts so an exhausted
   * allowance cannot be bypassed by pressing play repeatedly.
   */
  const isTrackLoaded = isSessionMode
    ? isPlaying && isSessionActive
    : isPlaying && currentFrequency === frequency?.hz;
  const isCurrentlyPlaying = isTrackLoaded && !isPaused;

  const handlePlayPause = useCallback(async () => {
    // Layer 2 Authorization Check
    const targetFreq = isSessionMode ? sessionFrequencies[currentFrequencyIndex] : frequency;
    const targetCategory = String(targetFreq?.category || '').toLowerCase();
    const isFreqLocked = targetFreq?.isPremium || targetCategory === 'chakra' || targetCategory === 'binaural';
    const isLockedForUser = isFreqLocked && !capabilities?.premiumFrequencies;
    const playbackMode: 'full' | 'preview' = (isLockedForUser || isPreviewActive) ? 'preview' : 'full';

    // A paused track is still loaded, so the button must resume it rather than
    // restart the authorisation, preview and timer setup below.
    if (isTrackLoaded && isPaused) {
      await resumeFrequency();
      return;
    }

    const isStarting = isSessionMode
      ? !(isPlaying && isSessionActive)
      : !(isPlaying && currentFrequency === frequency?.hz);

    if (isStarting) {
      const requestedMinutes = isSessionMode
        ? Math.ceil(sessionTimeLeft / 60)
        : duration;
      const auth = await attemptStartSession(
        String(targetFreq?.name || 'session'),
        requestedMinutes,
      );
      if (!auth.allowed) {
        if (auth.reason === 'session_limit') {
          setPremiumModalTrigger('session_limit');
          setShowPremiumModal(true);
        } else if (auth.reason === 'duration_limit') {
          setPremiumModalTrigger('duration_limit');
          setShowPremiumModal(true);
        }
        return;
      }
    }

    if (isSessionMode) {
      if (isPlaying && isSessionActive) {
        await pauseFrequency();
      } else {
        const currentFreq = sessionFrequencies[currentFrequencyIndex];
        if (currentFreq && sessionTimeLeft > 0) {
          // Cap the free allowance so session mode cannot play premium-length
          // audio indefinitely — the preview countdown only governs single-track
          // playback, so the cap is applied to the session clock itself.
          if (!isPremium) {
            const capSeconds = maxFreeDuration * 60;
            if (sessionTimeLeft > capSeconds) {
              setSessionTimeLeft(capSeconds);
            }
          }
          if (isLockedForUser) {
            setIsPreviewActive(true);
            setTimeLeft(DEFAULT_PREMIUM_POLICY.premiumPreviewDuration);
          }
          playFrequency(currentFreq, currentFreq.name, playbackMode);
          setIsSessionActive(true);
        }
      }
    } else {
      if (isPlaying && currentFrequency === frequency?.hz) {
        await pauseFrequency();
      } else {
        if (frequency) {
          if (isLockedForUser) {
            setIsPreviewActive(true);
            setDuration(3);
            setTimeLeft(DEFAULT_PREMIUM_POLICY.premiumPreviewDuration);
          }
          playFrequency(frequency, frequency.name, playbackMode);
          if (timeLeft > 0) {
            setIsTimerActive(true);
          }
        }
      }
    }
  }, [isSessionMode, isPlaying, isPaused, isTrackLoaded, isSessionActive, sessionFrequencies, currentFrequencyIndex, frequency, sessionTimeLeft, timeLeft, playFrequency, stopFrequency, pauseFrequency, resumeFrequency, currentFrequency, capabilities, isPreviewActive, attemptStartSession, isPremium, maxFreeDuration]);

  const handleSkipNext = useCallback(() => {
    if (isSessionMode && currentFrequencyIndex < sessionFrequencies.length - 1) {
      const nextIndex = currentFrequencyIndex + 1;
      const nextFreq = sessionFrequencies[nextIndex];
      const nextCat = String(nextFreq?.category || '').toLowerCase();
      const nextLocked = (nextFreq?.isPremium || nextCat === 'chakra' || nextCat === 'binaural') && !capabilities?.premiumFrequencies;
      setCurrentFrequencyIndex(nextIndex);
      if (isPlaying) {
        playFrequency(nextFreq, nextFreq.name, nextLocked ? 'preview' : 'full');
      }
    }
  }, [isSessionMode, currentFrequencyIndex, sessionFrequencies, isPlaying, playFrequency, capabilities]);

  const handleSkipPrevious = useCallback(() => {
    if (isSessionMode && currentFrequencyIndex > 0) {
      const prevIndex = currentFrequencyIndex - 1;
      const prevFreq = sessionFrequencies[prevIndex];
      const prevCat = String(prevFreq?.category || '').toLowerCase();
      const prevLocked = (prevFreq?.isPremium || prevCat === 'chakra' || prevCat === 'binaural') && !capabilities?.premiumFrequencies;
      setCurrentFrequencyIndex(prevIndex);
      if (isPlaying) {
        playFrequency(prevFreq, prevFreq.name, prevLocked ? 'preview' : 'full');
      }
    }
  }, [isSessionMode, currentFrequencyIndex, sessionFrequencies, isPlaying, playFrequency, capabilities]);

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

  const cycleVisualizerStyle = useCallback(() => {
    setVisualizerStyle(nextVisualizerStyle);
  }, []);

  const openPremiumFeature = useCallback((trigger: PremiumTrigger) => {
    setShowMoreMenu(false);
    setPremiumModalTrigger(trigger);
    setShowPremiumModal(true);
  }, []);

  const closePlayerPanel = useCallback(() => {
    setShowMoreMenu(false);
    setShowInfo(false);
    setShowSettings(false);
    setShowPlaylist(false);
    setShowTimerSettings(false);
    setShowStats(false);
  }, []);

  const showPanel = showMoreMenu || showInfo || showSettings || showPlaylist || showTimerSettings || showStats;

  const progress = isSessionMode ? sessionProgress : ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const displayFrequency = isSessionMode && sessionFrequencies.length > 0 ?
    sessionFrequencies[currentFrequencyIndex] : frequency;

  const displayTimeLeft = isSessionMode ? sessionTimeLeft : timeLeft;
  const displayTitle = isSessionMode ? sessionName : 'Audio Player';

  const immersiveTotalSeconds = isSessionMode
    ? sessionFrequencies.reduce((sum, freq) => sum + freq.duration * 60, 0)
    : duration * 60;

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

  const renderVisualizer = () => (
    <View style={styles.visualizerWrapper}>
      <PlayerVisualizer
        style={visualizerStyle}
        hz={currentFrequency || displayFrequency?.hz || 0}
        isPlaying={isCurrentlyPlaying}
        width={visualizerWidth}
        height={VISUALIZER_HEIGHT}
        color={colors.primary}
        accent={isCurrentlyPlaying ? colors.accent : colors.primary}
        reducedMotion={reducedMotion}
      />
    </View>
  );

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
            // On a tablet a full-bleed phone sheet wastes the display and makes
            // controls sit far apart; present it as a centred panel instead.
            isTablet && styles.containerTablet,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            }
          ]}
        >
          <LinearGradient
            colors={gradients.bg}
            style={styles.gradient}
          >
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16, maxWidth: contentWidth, width: '100%', alignSelf: 'center' }]}
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
                    <ChevronDown color={colors.textPrimary} size={28} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>{displayTitle}</Text>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => setShowMoreMenu(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Player options"
                    accessibilityHint="Double tap for more options"
                  >
                    <MoreVertical color={colors.textPrimary} size={24} />
                  </TouchableOpacity>
                </View>

                {/* Main Visualizer Card — swaps to the immersive affirmation
                    video stage while the affirmation stream is in a visual mode. */}
                <GlassCard style={styles.mainCard} intensity={60}>
                  {(affirmationMode === 'visual' || affirmationMode === 'both') ? (
                    <View style={styles.videoStageContainer}>
                      <AffirmationVideoStage
                        affirmation={activeAffirmation}
                        isPlaying={isCurrentlyPlaying}
                        hz={displayFrequency?.hz || 0}
                        isPremium={isPremium}
                        onUnlock={() => openPremiumFeature('premium_content')}
                      />
                      {isPreviewActive && (
                        <View style={[styles.previewBadge, styles.videoPreviewBadge]}>
                          <Text style={styles.previewBadgeText}>3-MINUTE PREVIEW</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                  <TouchableOpacity
                    style={styles.visualizerContainer}
                    onPress={() => setIsImmersive(true)}
                    activeOpacity={0.9}
                    accessibilityRole="button"
                    accessibilityLabel="Open full screen visual"
                  >
                    <LinearGradient
                      colors={[colors.primary + '26', colors.glowSoft, colors.bgTertiary + 'CC'] as const}
                      style={styles.visualizerSurface}
                    />
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
                  )}
                </GlassCard>

                {/* Track Info — the visualiser already shows the name and Hz,
                    so this row carries only the context it cannot show. */}
                <View style={styles.trackInfo}>
                  <View style={styles.trackDetails}>
                    <Text style={styles.trackSubtitle}>
                      {isSessionMode
                        ? `Track ${currentFrequencyIndex + 1} of ${sessionFrequencies.length}`
                        : displayFrequency?.category || 'Healing'}
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
                        color={colors.textSecondary}
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

                  {resumeOffer && (
                    <View style={styles.resumeRow}>
                      <RotateCcw color={colors.primary} size={14} />
                      <Text style={styles.resumeText}>
                        Resumed from {formatTime(resumeOffer.seconds)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setResumeOffer(null);
                          setTimeLeft(duration * 60);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Start from the beginning instead"
                      >
                        <Text style={styles.resumeResetText}>Start over</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View
                    style={styles.progressContainer}
                    {...progressPanResponder.panHandlers}
                    onLayout={(e) => {
                      scrubWidthRef.current = e.nativeEvent.layout.width;
                    }}
                    accessibilityRole="adjustable"
                    accessibilityLabel="Session length"
                    accessibilityValue={{
                      text: `${formatTime(displayTimeLeft)} remaining`,
                    }}
                  >
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

                {/* Popover Volume Control (Non-disruptive, Premium Glass Overlay) */}
                {showVolumeSlider && (
                  <Animated.View
                    style={[
                      styles.volumePopoverWrapper,
                      {
                        opacity: volumeAnim,
                        transform: [
                          {
                            translateY: volumeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [8, 0],
                            }),
                          },
                          {
                            scale: volumeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.96, 1],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <GlassCard style={styles.volumePopoverCard} intensity={80}>
                      <TouchableOpacity onPress={toggleMute} style={styles.volumePopoverIcon}>
                        {isMuted ? (
                          <VolumeX color={colors.textSecondary} size={18} />
                        ) : (
                          <Volume2 color={colors.textPrimary} size={18} />
                        )}
                      </TouchableOpacity>

                      <View style={styles.volumePopoverSlider} {...volumePanResponder.panHandlers}>
                        <View style={styles.volumePopoverTrack}>
                          <LinearGradient
                            colors={[colors.primary, colors.primaryDark] as const}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                              styles.volumePopoverFill,
                              { width: `${isMuted ? 0 : effectiveVolume * 100}%` }
                            ]}
                          />
                          <View
                            style={[
                              styles.volumePopoverThumb,
                              { left: `${isMuted ? 0 : effectiveVolume * 100}%` }
                            ]}
                          />
                        </View>
                      </View>

                      <Text style={styles.volumePopoverText}>{Math.round((isMuted ? 0 : effectiveVolume) * 100)}%</Text>
                    </GlassCard>
                  </Animated.View>
                )}

                {/* Main Controls */}
                <View style={styles.mainControls}>
                  <TouchableOpacity
                    style={styles.secondaryControl}
                    onPress={() => setIsImmersive(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Open full screen"
                    accessibilityHint="Hides all controls and shows only the visual"
                  >
                    <Maximize2 color={colors.textPrimary} size={20} />
                  </TouchableOpacity>

                  {/* Track skip only exists inside a multi-track session; in
                      single-tone mode these buttons had nothing to act on. */}
                  {isSessionMode && (
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={handleSkipPrevious}
                      disabled={currentFrequencyIndex === 0}
                      accessibilityRole="button"
                      accessibilityLabel="Previous track"
                    >
                      <SkipBack
                        color={currentFrequencyIndex > 0 ? colors.textPrimary : colors.textMuted}
                        size={24}
                      />
                    </TouchableOpacity>
                  )}

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

                  {isSessionMode && (
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={handleSkipNext}
                      disabled={currentFrequencyIndex === sessionFrequencies.length - 1}
                      accessibilityRole="button"
                      accessibilityLabel="Next track"
                    >
                      <SkipForward
                        color={
                          currentFrequencyIndex < sessionFrequencies.length - 1
                            ? colors.textPrimary
                            : colors.textMuted
                        }
                        size={24}
                      />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.secondaryControl, showVolumeSlider && styles.secondaryControlActive]}
                    onPress={toggleVolumeSlider}
                    accessibilityRole="button"
                    accessibilityLabel="Adjust volume"
                    accessibilityHint="Double tap to open volume slider"
                  >
                    {isMuted ? (
                      <VolumeX color={colors.textSecondary} size={20} />
                    ) : (
                      <Volume2 color={showVolumeSlider ? colors.primary : colors.textPrimary} size={20} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Affirmation Stream Section */}
                <AffirmationStreamCard
                  frequencyId={displayFrequency?.id || `solfeggio-${displayFrequency?.hz || 528}`}
                  sessionContext={isSessionMode ? 'session' : 'reflection'}
                  isPlaying={isCurrentlyPlaying}
                  mode={affirmationMode}
                  onModeChange={setAffirmationMode}
                  speechVolume={speechVolume}
                  onSpeechVolumeChange={setSpeechVolume}
                  onActiveAffirmationChange={setActiveAffirmation}
                  onOpenPremiumModal={openPremiumFeature}
                />

                {/* Duration Control Section */}
                <GlassCard style={styles.durationCard} intensity={60}>
                  <View style={styles.durationHeader}>
                    <Text style={styles.durationTitle}>
                      {isSessionMode ? 'Session Duration (Smart Allocated)' : 'Session Duration'}
                    </Text>
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

          <ImmersiveStage
            visible={isImmersive}
            onClose={() => setIsImmersive(false)}
            onTogglePlay={handlePlayPause}
            isPlaying={isCurrentlyPlaying}
            isPaused={isPaused}
            hz={displayFrequency?.hz || 0}
            title={displayFrequency?.name || 'No Frequency'}
            subtitle={isSessionMode ? `${sessionName} · Track ${currentFrequencyIndex + 1}/${sessionFrequencies.length}` : displayFrequency?.category}
            visualizerStyle={visualizerStyle}
            onCycleStyle={cycleVisualizerStyle}
            colors={colors}
            progress={Math.max(0, Math.min(1, progress / 100))}
            elapsedSeconds={isSessionMode ? immersiveTotalSeconds - sessionTimeLeft : duration * 60 - timeLeft}
            totalSeconds={isSessionMode ? immersiveTotalSeconds : duration * 60}
            onSeekRatio={isSessionMode || isPreviewActive ? undefined : seekToRatio}
            isSessionMode={isSessionMode}
            currentTrackIndex={currentFrequencyIndex}
            totalTracks={sessionFrequencies.length}
            onSkipPrevious={handleSkipPrevious}
            onSkipNext={handleSkipNext}
            volume={effectiveVolume}
            isMuted={isMuted}
            onVolumeChange={handleImmersiveVolume}
            onToggleMute={toggleMute}
            isFavorite={isFavoriteInStore(displayFrequency?.hz || 0)}
            onToggleFavorite={toggleFavorite}
          />
        </Animated.View>
      </Animated.View>

      <Modal
        visible={showPanel}
        transparent
        animationType="slide"
        onRequestClose={closePlayerPanel}
      >
        <View style={styles.panelBackdrop}>
          <TouchableOpacity style={styles.panelDismissArea} onPress={closePlayerPanel} />
          <View style={[styles.panel, { paddingBottom: insets.bottom + 18 }]}>
            <View style={styles.panelHandle} />
            {showMoreMenu && (
              <>
                <Text style={styles.panelTitle}>Player controls</Text>
                <TouchableOpacity style={styles.menuRow} onPress={() => { setShowMoreMenu(false); setShowInfo(true); }}>
                  <Info color={colors.accent} size={20} />
                  <View style={styles.menuCopy}><Text style={styles.menuTitle}>Frequency details</Text><Text style={styles.menuSubtitle}>Learn about this tone and how it is used</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow} onPress={() => { setShowMoreMenu(false); setShowSettings(true); }}>
                  <Settings color={colors.accent} size={20} />
                  <View style={styles.menuCopy}><Text style={styles.menuTitle}>Playback settings</Text><Text style={styles.menuSubtitle}>Repeat and visual style</Text></View>
                </TouchableOpacity>
                {isSessionMode && (
                  <TouchableOpacity style={styles.menuRow} onPress={() => { setShowMoreMenu(false); setShowPlaylist(true); }}>
                    <List color={colors.accent} size={20} />
                    <View style={styles.menuCopy}><Text style={styles.menuTitle}>Session playlist</Text><Text style={styles.menuSubtitle}>{sessionFrequencies.length} frequencies in this session</Text></View>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.menuRow} onPress={() => { setShowMoreMenu(false); setShowTimerSettings(true); }}>
                  <Timer color={colors.accent} size={20} />
                  <View style={styles.menuCopy}><Text style={styles.menuTitle}>Timer and fade</Text><Text style={styles.menuSubtitle}>Session length and fade-out</Text></View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow} onPress={() => {
                  if (!capabilities?.advancedAnalytics) {
                    openPremiumFeature('advanced_analytics');
                    return;
                  }
                  setShowMoreMenu(false);
                  setShowStats(true);
                }}>
                  <BarChart3 color={capabilities?.advancedAnalytics ? colors.accent : colors.gold} size={20} />
                  <View style={styles.menuCopy}><Text style={styles.menuTitle}>Listening insights{!capabilities?.advancedAnalytics ? ' · Premium' : ''}</Text><Text style={styles.menuSubtitle}>Review your listening patterns and progress</Text></View>
                </TouchableOpacity>
              </>
            )}

            {showInfo && (
              <>
                <Text style={styles.panelEyebrow}>FREQUENCY PROFILE</Text>
                <Text style={styles.panelTitle}>{displayFrequency?.name || 'Frequency details'}</Text>
                <Text style={styles.detailFrequency}>{displayFrequency?.hz || 0} Hz</Text>
                <Text style={styles.panelBody}>{displayFrequency?.description || 'A focused frequency for mindful listening and a calmer audio environment.'}</Text>
                <View style={styles.detailGrid}>
                  <View><Text style={styles.detailLabel}>CATEGORY</Text><Text style={styles.detailValue}>{displayFrequency?.category || 'Healing'}</Text></View>
                  <View><Text style={styles.detailLabel}>VISUAL STYLE</Text><Text style={styles.detailValue}>{VISUALIZER_LABELS[visualizerStyle]}</Text></View>
                </View>
                <TouchableOpacity style={styles.panelButton} onPress={closePlayerPanel}><Text style={styles.panelButtonText}>Done</Text></TouchableOpacity>
              </>
            )}

            {showSettings && (
              <>
                <Text style={styles.panelTitle}>Playback settings</Text>
                <TouchableOpacity style={styles.settingRow} onPress={() => setAutoRepeat(value => !value)}><Text style={styles.menuTitle}>Repeat when finished</Text><Text style={styles.settingValue}>{autoRepeat ? 'On' : 'Off'}</Text></TouchableOpacity>
                <TouchableOpacity style={styles.settingRow} onPress={cycleVisualizerStyle}><Text style={styles.menuTitle}>Visual style</Text><Text style={styles.settingValue}>{VISUALIZER_LABELS[visualizerStyle]}</Text></TouchableOpacity>
                <Text style={styles.panelBody}>Fade-out and session length live under “Timer and fade”.</Text>
                <TouchableOpacity style={styles.panelButton} onPress={closePlayerPanel}><Text style={styles.panelButtonText}>Done</Text></TouchableOpacity>
              </>
            )}

            {showTimerSettings && (
              <>
                <Text style={styles.panelTitle}>Timer and fade</Text>
                <Text style={styles.panelBody}>Your current session is set to {isSessionMode ? formatTime(sessionTimeLeft) : formatTime(duration * 60)}. Free listening is available for up to {maxFreeDuration} minutes.</Text>
                <TouchableOpacity style={styles.settingRow} onPress={() => setFadeOutEnabled(value => !value)}><Text style={styles.menuTitle}>Fade out in final 10 seconds</Text><Text style={styles.settingValue}>{fadeOutEnabled ? 'On' : 'Off'}</Text></TouchableOpacity>
                {!isPremium && (<TouchableOpacity style={styles.panelButton} onPress={() => { closePlayerPanel(); openPremiumFeature('duration_limit'); }}><Text style={styles.panelButtonText}>Unlock extended timer</Text></TouchableOpacity>)}
              </>
            )}

            {showPlaylist && (
              <>
                <Text style={styles.panelTitle}>Session playlist</Text>
                {sessionFrequencies.map((item, index) => (
                  <TouchableOpacity key={`${item.hz}-${index}`} style={[styles.playlistRow, index === currentFrequencyIndex && styles.playlistRowActive]} onPress={() => { setCurrentFrequencyIndex(index); closePlayerPanel(); }}>
                    <Text style={styles.playlistIndex}>{String(index + 1).padStart(2, '0')}</Text><Text style={styles.menuTitle}>{item.name}</Text><Text style={styles.playlistDuration}>{item.duration}m</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {showStats && (
              <>
                <Text style={styles.panelTitle}>Listening insights</Text>
                <Text style={styles.panelBody}>Your session insights are available while you listen. Keep building a consistent practice to see more meaningful trends here.</Text>
                <View style={styles.statsCard}><Activity color={colors.accent} size={22} /><Text style={styles.statsText}>Current session: {formatTime(displayTimeLeft)} remaining</Text></View>

                <Text style={[styles.panelEyebrow, styles.historyHeading]}>RECENTLY PLAYED</Text>
                {history.length === 0 ? (
                  <Text style={styles.panelBody}>Your play history will appear here after your first session.</Text>
                ) : (
                  history.slice(0, 8).map((entry) => (
                    <TouchableOpacity
                      key={entry.id}
                      style={styles.historyRow}
                      onPress={() => {
                        closePlayerPanel();
                        playFrequency({ hz: entry.hz, name: entry.name, category: entry.category }, entry.name);
                        if (!isSessionMode) {
                          setIsTimerActive(true);
                        }
                      }}
                    >
                      <View style={styles.historyIcon}>
                        <RotateCcw color={colors.primary} size={15} />
                      </View>
                      <View style={styles.historyCopy}>
                        <Text style={styles.menuTitle} numberOfLines={1}>{entry.name}</Text>
                        <Text style={styles.menuSubtitle}>
                          {entry.hz} Hz · {Math.max(1, Math.round(entry.totalListenedSeconds / 60))} min listened · {entry.playCount}×
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
                <TouchableOpacity style={styles.panelButton} onPress={closePlayerPanel}><Text style={styles.panelButtonText}>Done</Text></TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        trigger={premiumModalTrigger}
      />
    </Modal>
  );
};

const createStyles = (colors: any, gradients: any, isDark: boolean, width: number, height: number) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(26, 29, 46, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width,
    height: height,
    borderRadius: 0,
    overflow: 'hidden',
  },
  containerTablet: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    borderRadius: 28,
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
    backgroundColor: Platform.OS === 'web' ? colors.glassStrong : 'transparent',
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
  videoStageContainer: {
    height: 260,
    position: 'relative',
  },
  videoPreviewBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    marginBottom: 0,
  },
  visualizerSurface: {
    ...StyleSheet.absoluteFill,
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
    backgroundColor: colors.goldGlow,
    borderColor: colors.gold,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  previewBadgeText: {
    color: colors.gold,
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
  trackSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
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
  resumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  resumeText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  resumeResetText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  historyHeading: {
    marginTop: 8,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
  },
  historyCopy: {
    flex: 1,
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
  secondaryControlActive: {
    backgroundColor: colors.primary + '25',
    borderColor: colors.primary + '80',
  },
  volumePopoverWrapper: {
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  volumePopoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: isDark ? colors.glassStrong : 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: colors.glassBorderBright,
  },
  volumePopoverIcon: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumePopoverSlider: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  volumePopoverTrack: {
    height: 4,
    backgroundColor: colors.glassMid,
    borderRadius: 2,
    position: 'relative',
  },
  volumePopoverFill: {
    height: '100%',
    borderRadius: 2,
  },
  volumePopoverThumb: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.textPrimary,
    top: -5,
    marginLeft: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  volumePopoverText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: 32,
    textAlign: 'right',
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
  panelBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
  panelDismissArea: {
    flex: 1,
  },
  panel: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: colors.glassBorderBright,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  panelHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    marginBottom: 18,
  },
  panelEyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  panelTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
  },
  panelBody: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 14,
  },
  menuCopy: {
    flex: 1,
  },
  menuTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  menuSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  detailFrequency: {
    color: colors.accent,
    fontSize: 38,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailGrid: {
    flexDirection: 'row',
    gap: 42,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 16,
    marginBottom: 20,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 5,
  },
  detailValue: {
    color: colors.textPrimary,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  settingValue: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  panelButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  panelButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 12,
    paddingHorizontal: 8,
  },
  playlistRowActive: {
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
  },
  playlistIndex: {
    color: colors.textMuted,
    fontSize: 12,
    width: 24,
  },
  playlistDuration: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: 'auto',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.accentSoft,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
  },
  statsText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  playIcon: {
    marginLeft: 4,
  },
});
