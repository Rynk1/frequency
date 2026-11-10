import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Playback persistence: resume positions and play history.
 *
 * The audio engine is a process-wide singleton, so playback survives the player
 * UI being dismissed. This module keeps the small amount of state the UI needs
 * to feel continuous: where the listener left off in each track, and what they
 * have played recently.
 */

export interface PlaybackHistoryEntry {
  /** Stable id for the played item (`hz:name` — a frequency may repeat by name). */
  id: string;
  hz: number;
  name: string;
  category?: string;
  /** ISO timestamp of the most recent play. */
  playedAt: string;
  /** Seconds actually listened in the most recent play of this item. */
  listenedSeconds: number;
  /** Total seconds listened across all plays of this item. */
  totalListenedSeconds: number;
  /** Number of times this item has been started. */
  playCount: number;
}

export interface ResumePosition {
  hz: number;
  name: string;
  /** Seconds elapsed in the track when the listener left off. */
  positionSeconds: number;
  /** Total track length in seconds, when known. */
  totalSeconds?: number;
  updatedAt: string;
}

export const MAX_HISTORY_ENTRIES = 50;
/** Resume points older than this are considered stale and are not offered. */
export const RESUME_FRESH_MS = 1000 * 60 * 60 * 24 * 7;

const HISTORY_KEY = 'hf:audio:history';
const RESUME_KEY = 'hf:audio:resume';

const scopedKey = (base: string, uid?: string | null) => (uid ? `${base}:${uid}` : base);

export const playbackItemId = (hz: number, name: string): string => `${hz}:${name}`;

/**
 * Merges a new play into the existing history: increments counters, refreshes
 * the timestamp, and moves the entry to the front. History is bounded so the
 * stored payload cannot grow without limit.
 */
export function mergeHistory(
  existing: PlaybackHistoryEntry[],
  entry: {
    id: string;
    hz: number;
    name: string;
    category?: string;
    listenedSeconds: number;
    playedAt?: string;
  },
  maxEntries = MAX_HISTORY_ENTRIES
): PlaybackHistoryEntry[] {
  const playedAt = entry.playedAt || new Date().toISOString();
  const listenedSeconds = Math.max(0, Math.round(entry.listenedSeconds));
  const prior = existing.find((item) => item.id === entry.id);

  const merged: PlaybackHistoryEntry = prior
    ? {
        ...prior,
        hz: entry.hz,
        name: entry.name,
        category: entry.category ?? prior.category,
        playedAt,
        listenedSeconds,
        totalListenedSeconds: prior.totalListenedSeconds + listenedSeconds,
        playCount: prior.playCount + 1,
      }
    : {
        id: entry.id,
        hz: entry.hz,
        name: entry.name,
        category: entry.category,
        playedAt,
        listenedSeconds,
        totalListenedSeconds: listenedSeconds,
        playCount: 1,
      };

  const rest = existing.filter((item) => item.id !== entry.id);
  return [merged, ...rest]
    .sort((a, b) => b.playedAt.localeCompare(a.playedAt))
    .slice(0, maxEntries);
}

/** A resume point is only offered while it is recent and meaningfully into the track. */
export function isResumeUsable(
  resume: ResumePosition | null,
  now: number = Date.now(),
  maxAgeMs = RESUME_FRESH_MS,
  minSeconds = 5
): boolean {
  if (!resume) return false;
  if (resume.positionSeconds < minSeconds) return false;
  const updated = Date.parse(resume.updatedAt);
  if (Number.isNaN(updated)) return false;
  if (now - updated > maxAgeMs) return false;
  if (resume.totalSeconds && resume.positionSeconds >= resume.totalSeconds - 2) return false;
  return true;
}

/** Clamps a resume position into a valid range for a track of the given length. */
export function clampResumePosition(positionSeconds: number, totalSeconds?: number): number {
  const floor = Math.max(0, Math.round(positionSeconds));
  if (!totalSeconds || totalSeconds <= 0) return floor;
  return Math.min(floor, Math.max(0, Math.round(totalSeconds) - 1));
}

export async function loadHistory(uid?: string | null): Promise<PlaybackHistoryEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(scopedKey(HISTORY_KEY, uid));
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? (parsed as PlaybackHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export async function saveHistory(entries: PlaybackHistoryEntry[], uid?: string | null): Promise<void> {
  try {
    await AsyncStorage.setItem(scopedKey(HISTORY_KEY, uid), JSON.stringify(entries));
  } catch {
    // History is a convenience feature; a storage failure must never break playback.
  }
}

export async function loadResumePositions(uid?: string | null): Promise<Record<string, ResumePosition>> {
  try {
    const stored = await AsyncStorage.getItem(scopedKey(RESUME_KEY, uid));
    if (!stored) return {};
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, ResumePosition>) : {};
  } catch {
    return {};
  }
}

export async function saveResumePositions(
  positions: Record<string, ResumePosition>,
  uid?: string | null
): Promise<void> {
  try {
    await AsyncStorage.setItem(scopedKey(RESUME_KEY, uid), JSON.stringify(positions));
  } catch {
    // Non-fatal — see saveHistory.
  }
}

export async function clearPlaybackPersistence(uid?: string | null): Promise<void> {
  try {
    await AsyncStorage.multiRemove([scopedKey(HISTORY_KEY, uid), scopedKey(RESUME_KEY, uid)]);
  } catch {
    // Non-fatal.
  }
}
