import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  PlaybackHistoryEntry,
  clearPlaybackPersistence,
  loadHistory,
  loadResumePositions,
  mergeHistory,
  playbackItemId,
  ResumePosition,
  saveHistory,
  saveResumePositions,
} from '@/lib/audio/playback-history';

export interface PlayerFrequency {
  hz: number;
  name: string;
  description?: string;
  category?: string;
  isPremium?: boolean;
  id?: string;
  [key: string]: any;
}

export interface PlayerSessionTrack {
  frequencies: { hz: number; name: string; duration: number }[];
  name: string;
  sessionId?: string;
}

export interface OpenPlayerOptions {
  frequency?: PlayerFrequency;
  session?: PlayerSessionTrack;
  onSessionComplete?: (sessionId: string, durationSeconds: number) => Promise<void>;
}

interface PlayerContextValue {
  isOpen: boolean;
  isMinimized: boolean;
  /** Full options for the loaded track, used to render the player host. */
  activeOptions: OpenPlayerOptions;
  currentTrack: PlayerFrequency | null;
  history: PlaybackHistoryEntry[];
  open: (options: OpenPlayerOptions) => void;
  minimize: () => void;
  expand: () => void;
  stopAndClose: () => void;
  recordPlay: (entry: {
    hz: number;
    name: string;
    category?: string;
    listenedSeconds: number;
  }) => void;
  saveResume: (resume: Omit<ResumePosition, 'updatedAt'>) => void;
  resumeFor: (hz: number, name: string) => ResumePosition | null;
  clearHistory: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

/**
 * Playback controller shared by the whole app.
 *
 * The audio engine is a process-wide singleton, so playback already survives
 * screen changes. This provider keeps the *UI* state aligned with it: which
 * track is loaded, whether the player is open or minimized, and the persisted
 * resume positions and play history. Screens describe what to play; the root
 * owns the single player instance (see PlayerHost).
 */
export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const uid = user?.uid || null;

  const [isOpen, setIsOpen] = useState(false);
  const [track, setTrack] = useState<OpenPlayerOptions>({});
  const [history, setHistory] = useState<PlaybackHistoryEntry[]>([]);
  const resumeRef = useRef<Record<string, ResumePosition>>({});
  const historyRef = useRef<PlaybackHistoryEntry[]>([]);

  // Load persisted history and resume positions for the signed-in account.
  // Loading replaces (rather than merges) local state, so history never leaks
  // across accounts when the signed-in user changes.
  useEffect(() => {
    let mounted = true;
    resumeRef.current = {};
    historyRef.current = [];
    setHistory([]);
    (async () => {
      const [loadedHistory, loadedResume] = await Promise.all([
        loadHistory(uid),
        loadResumePositions(uid),
      ]);
      if (!mounted) return;
      setHistory(loadedHistory);
      historyRef.current = loadedHistory;
      resumeRef.current = loadedResume;
    })();
    return () => {
      mounted = false;
    };
  }, [uid]);

  const open = useCallback((options: OpenPlayerOptions) => {
    setTrack(options);
    setIsOpen(true);
  }, []);

  const minimize = useCallback(() => setIsOpen(false), []);
  const expand = useCallback(() => setIsOpen(true), []);

  const stopAndClose = useCallback(() => {
    setIsOpen(false);
    setTrack({});
  }, []);

  const recordPlay = useCallback(
    (entry: { hz: number; name: string; category?: string; listenedSeconds: number }) => {
      const id = playbackItemId(entry.hz, entry.name);
      const next = mergeHistory(historyRef.current, {
        id,
        hz: entry.hz,
        name: entry.name,
        category: entry.category,
        listenedSeconds: entry.listenedSeconds,
      });
      historyRef.current = next;
      setHistory(next);
      saveHistory(next, uid);
    },
    [uid]
  );

  const saveResume = useCallback(
    (resume: Omit<ResumePosition, 'updatedAt'>) => {
      const id = playbackItemId(resume.hz, resume.name);
      const next = {
        ...resumeRef.current,
        [id]: { ...resume, updatedAt: new Date().toISOString() },
      };
      resumeRef.current = next;
      saveResumePositions(next, uid);
    },
    [uid]
  );

  const resumeFor = useCallback((hz: number, name: string): ResumePosition | null => {
    return resumeRef.current[playbackItemId(hz, name)] || null;
  }, []);

  const clearHistory = useCallback(async () => {
    setHistory([]);
    historyRef.current = [];
    resumeRef.current = {};
    await clearPlaybackPersistence(uid);
  }, [uid]);

  const currentTrack = useMemo<PlayerFrequency | null>(
    () => track.frequency || (track.session?.frequencies?.[0] as PlayerFrequency) || null,
    [track]
  );

  const value = useMemo<PlayerContextValue>(
    () => ({
      isOpen,
      isMinimized: !isOpen && Boolean(track.frequency || track.session),
      activeOptions: track,
      currentTrack,
      history,
      open,
      minimize,
      expand,
      stopAndClose,
      recordPlay,
      saveResume,
      resumeFor,
      clearHistory,
    }),
    [
      isOpen,
      track,
      currentTrack,
      history,
      open,
      minimize,
      expand,
      stopAndClose,
      recordPlay,
      saveResume,
      resumeFor,
      clearHistory,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
};

export const usePlayer = (): PlayerContextValue => {
  const ctx = useContext(PlayerContext);
  if (!ctx) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return ctx;
};
