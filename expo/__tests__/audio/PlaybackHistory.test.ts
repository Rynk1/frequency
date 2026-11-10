import { describe, it, expect } from 'vitest';
import {
  clampResumePosition,
  isResumeUsable,
  mergeHistory,
  playbackItemId,
  MAX_HISTORY_ENTRIES,
  RESUME_FRESH_MS,
  type PlaybackHistoryEntry,
  type ResumePosition,
} from '../../lib/audio/playback-history';

const now = Date.parse('2026-01-10T12:00:00.000Z');

const resume = (overrides: Partial<ResumePosition> = {}): ResumePosition => ({
  hz: 528,
  name: 'Love',
  positionSeconds: 120,
  totalSeconds: 900,
  updatedAt: new Date(now - 1000).toISOString(),
  ...overrides,
});

describe('playbackItemId', () => {
  it('is stable and distinguishes same hz with different names', () => {
    expect(playbackItemId(528, 'Love')).toBe('528:Love');
    expect(playbackItemId(528, 'Love')).toBe(playbackItemId(528, 'Love'));
    expect(playbackItemId(528, 'Love')).not.toBe(playbackItemId(528, 'Gratitude'));
  });
});

describe('mergeHistory', () => {
  it('creates a new entry on first play', () => {
    const result = mergeHistory([], {
      id: '528:Love',
      hz: 528,
      name: 'Love',
      listenedSeconds: 60,
      playedAt: new Date(now).toISOString(),
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '528:Love',
      playCount: 1,
      listenedSeconds: 60,
      totalListenedSeconds: 60,
    });
  });

  it('increments counters and moves the entry to the front on replay', () => {
    const existing: PlaybackHistoryEntry[] = [
      {
        id: '432:Focus',
        hz: 432,
        name: 'Focus',
        playedAt: new Date(now - 5000).toISOString(),
        listenedSeconds: 30,
        totalListenedSeconds: 30,
        playCount: 1,
      },
      {
        id: '528:Love',
        hz: 528,
        name: 'Love',
        playedAt: new Date(now - 10000).toISOString(),
        listenedSeconds: 45,
        totalListenedSeconds: 45,
        playCount: 1,
      },
    ];

    const result = mergeHistory(existing, {
      id: '528:Love',
      hz: 528,
      name: 'Love',
      listenedSeconds: 90,
      playedAt: new Date(now).toISOString(),
    });

    expect(result[0].id).toBe('528:Love');
    expect(result[0].playCount).toBe(2);
    expect(result[0].totalListenedSeconds).toBe(135);
    expect(result[0].listenedSeconds).toBe(90);
    expect(result).toHaveLength(2);
  });

  it('bounds the history to MAX_HISTORY_ENTRIES', () => {
    let history: PlaybackHistoryEntry[] = [];
    for (let i = 0; i < MAX_HISTORY_ENTRIES + 10; i++) {
      history = mergeHistory(history, {
        id: `${i}:Freq${i}`,
        hz: i,
        name: `Freq${i}`,
        listenedSeconds: 10,
        playedAt: new Date(now + i * 1000).toISOString(),
      });
    }
    expect(history).toHaveLength(MAX_HISTORY_ENTRIES);
    // Most recent play stays at the front.
    expect(history[0].name).toBe(`Freq${MAX_HISTORY_ENTRIES + 9}`);
  });

  it('rounds and never records negative listening time', () => {
    const result = mergeHistory([], {
      id: '1:A',
      hz: 1,
      name: 'A',
      listenedSeconds: -12.6,
    });
    expect(result[0].listenedSeconds).toBe(0);
  });
});

describe('isResumeUsable', () => {
  it('rejects null and too-early positions', () => {
    expect(isResumeUsable(null, now)).toBe(false);
    expect(isResumeUsable(resume({ positionSeconds: 3 }), now)).toBe(false);
  });

  it('accepts a recent, meaningful position', () => {
    expect(isResumeUsable(resume(), now)).toBe(true);
  });

  it('rejects stale positions older than the freshness window', () => {
    const stale = resume({ updatedAt: new Date(now - RESUME_FRESH_MS - 1000).toISOString() });
    expect(isResumeUsable(stale, now)).toBe(false);
  });

  it('rejects a position at the very end of the track', () => {
    const finished = resume({ positionSeconds: 900, totalSeconds: 900 });
    expect(isResumeUsable(finished, now)).toBe(false);
  });

  it('rejects an unparseable timestamp', () => {
    expect(isResumeUsable(resume({ updatedAt: 'not-a-date' }), now)).toBe(false);
  });
});

describe('clampResumePosition', () => {
  it('never exceeds one second before the track end', () => {
    expect(clampResumePosition(1200, 900)).toBe(899);
  });

  it('never goes negative', () => {
    expect(clampResumePosition(-50, 900)).toBe(0);
  });

  it('returns the position when the total is unknown', () => {
    expect(clampResumePosition(123.4)).toBe(123);
  });
});
