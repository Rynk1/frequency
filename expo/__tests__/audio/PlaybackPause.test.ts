import { describe, it, expect, vi } from 'vitest';

// The engine pulls in Expo platform bindings at import time. Those need a native
// runtime, so they are stubbed here; the pause/resume state machine under test is
// pure TypeScript and runs unchanged.
vi.mock('expo-constants', () => ({ default: { appOwnership: 'expo' } }));
vi.mock('expo-file-system/legacy', () => ({
  documentDirectory: null,
  cacheDirectory: null,
  makeDirectoryAsync: vi.fn(),
  writeAsStringAsync: vi.fn(),
  getInfoAsync: vi.fn(async () => ({ exists: false })),
}));

/**
 * Node has no Web Audio, so a minimal AudioContext is installed on the global.
 * This exercises the real WebAudioRenderer (gain ramp on pause/resume) instead
 * of replacing it with a stub.
 */
const param = () => ({ setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() });
class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  createGain() {
    return { gain: param(), connect: vi.fn(), disconnect: vi.fn() };
  }
  createOscillator() {
    return { type: '', frequency: param(), connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() };
  }
  createStereoPanner() {
    return { pan: param(), connect: vi.fn() };
  }
  async resume() {}
  async close() {}
}
(globalThis as any).window = { AudioContext: FakeAudioContext };

const { FrequencyAudioEngine } = await import('../../lib/audio/FrequencyAudioEngine');

/**
 * The player exposes a single Play/Pause control. These tests pin the contract
 * that "pause" holds the loaded tone instead of tearing it down, so resuming
 * keeps the track, its name and its place in the session.
 */

const pureTone = { modality: 'pure_tone' as const, frequency: 528 };

describe('FrequencyAudioEngine pause/resume', () => {
  it('starts unpaused with no track loaded', () => {
    const engine = new FrequencyAudioEngine();
    const state = engine.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.spec).toBeNull();
  });

  it('keeps the loaded spec when paused', async () => {
    const engine = new FrequencyAudioEngine();
    await engine.play(pureTone, '528 Hz', undefined, 'full');
    const before = engine.getState();

    await engine.pause();
    const paused = engine.getState();

    expect(paused.isPlaying).toBe(true);
    expect(paused.isPaused).toBe(true);
    expect(paused.spec).toEqual(before.spec);
    expect(paused.name).toBe('528 Hz');
  });

  it('restores the same track on resume', async () => {
    const engine = new FrequencyAudioEngine();
    await engine.play(pureTone, '528 Hz', undefined, 'full');
    await engine.pause();
    await engine.resume();

    const resumed = engine.getState();
    expect(resumed.isPlaying).toBe(true);
    expect(resumed.isPaused).toBe(false);
    expect(resumed.spec).toEqual(pureTone);
    expect(resumed.name).toBe('528 Hz');
  });

  it('pausing twice is a no-op rather than an error', async () => {
    const engine = new FrequencyAudioEngine();
    await engine.play(pureTone, '528 Hz', undefined, 'full');
    await engine.pause();
    await engine.pause();

    expect(engine.getState().isPaused).toBe(true);
    expect(engine.getState().error).toBeNull();
  });

  it('resuming a track that is not paused is a no-op', async () => {
    const engine = new FrequencyAudioEngine();
    await engine.play(pureTone, '528 Hz', undefined, 'full');
    await engine.resume();

    expect(engine.getState().isPaused).toBe(false);
    expect(engine.getState().error).toBeNull();
  });

  it('ignores pause when nothing is loaded', async () => {
    const engine = new FrequencyAudioEngine();
    await engine.pause();

    expect(engine.getState().isPlaying).toBe(false);
    expect(engine.getState().isPaused).toBe(false);
  });

  it('clears paused when stopped', async () => {
    const engine = new FrequencyAudioEngine();
    await engine.play(pureTone, '528 Hz', undefined, 'full');
    await engine.pause();
    await engine.stop();

    const stopped = engine.getState();
    expect(stopped.isPlaying).toBe(false);
    expect(stopped.isPaused).toBe(false);
    expect(stopped.spec).toBeNull();
    expect(stopped.name).toBe('');
  });

  it('playing a new track clears a previous pause', async () => {
    const engine = new FrequencyAudioEngine();
    await engine.play(pureTone, '528 Hz', undefined, 'full');
    await engine.pause();
    await engine.play({ modality: 'pure_tone', frequency: 432 }, '432 Hz', undefined, 'full');

    const state = engine.getState();
    expect(state.isPaused).toBe(false);
    expect(state.name).toBe('432 Hz');
  });

  it('silences the oscillator gain on pause and restores it on resume', async () => {
    const engine = new FrequencyAudioEngine();
    await engine.play(pureTone, '528 Hz', undefined, 'full');
    const renderer = (engine as any).webRenderer;
    const gain = renderer.gainNode;

    await engine.pause();
    expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));

    await engine.resume();
    expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number)
    );
    const restored = gain.gain.linearRampToValueAtTime.mock.calls[0][0];
    expect(restored).toBeGreaterThan(0);
  });

  it('does not ramp gain while already paused', async () => {
    const engine = new FrequencyAudioEngine();
    await engine.play(pureTone, '528 Hz', undefined, 'full');
    const gain = (engine as any).webRenderer.gainNode;

    await engine.pause();
    const callsAfterPause = gain.gain.setValueAtTime.mock.calls.length;
    await engine.pause();

    expect(gain.gain.setValueAtTime.mock.calls.length).toBe(callsAfterPause);
  });

  it('notifies subscribers of the paused transition', async () => {
    const engine = new FrequencyAudioEngine();
    const seen: boolean[] = [];
    const unsubscribe = engine.subscribe((state) => seen.push(state.isPaused));

    await engine.play(pureTone, '528 Hz', undefined, 'full');
    await engine.pause();
    unsubscribe();

    expect(seen).toContain(true);
    expect(seen[seen.length - 1]).toBe(true);
  });
});
