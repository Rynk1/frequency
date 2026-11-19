import { describe, it, expect } from 'vitest';
import { VISUALIZER_LABELS, nextVisualizerStyle } from '../lib/visualizers/styles';
import type { VisualizerStyle } from '../lib/visualizers/styles';
import {
  wavePoints,
  smoothPath,
  equalizerBars,
  cyclesForFrequency,
  amplitudeForHeight,
} from '../lib/visualizers/wave';
import { breathScale, breathProgress, breathCue, BREATH_CYCLE_SECONDS } from '../lib/motion';

describe('wavePoints', () => {
  it('spans the full width from edge to edge', () => {
    const pts = wavePoints({ width: 300, height: 120, cycles: 2, amplitude: 20, phase: 0 });
    expect(pts[0][0]).toBe(0);
    expect(pts[pts.length - 1][0]).toBe(300);
  });

  it('stays inside the stage vertically', () => {
    const height = 120;
    const amplitude = 20;
    const pts = wavePoints({ width: 300, height, cycles: 3, amplitude, phase: 1.1 });
    for (const [, y] of pts) {
      expect(y).toBeGreaterThanOrEqual(height / 2 - amplitude - 0.001);
      expect(y).toBeLessThanOrEqual(height / 2 + amplitude + 0.001);
    }
  });

  it('is symmetric about the centre line for a sine wave', () => {
    const height = 100;
    const pts = wavePoints({ width: 100, height, cycles: 1, amplitude: 10, phase: 0, samples: 5 });
    // samples 5 at cycles 1 => phase 0, pi/2, pi, 3pi/2, 2pi
    expect(pts[0][1]).toBeCloseTo(50, 5);
    expect(pts[1][1]).toBeCloseTo(60, 5);
    expect(pts[2][1]).toBeCloseTo(50, 5);
    expect(pts[3][1]).toBeCloseTo(40, 5);
  });

  it('never returns fewer than two points', () => {
    expect(wavePoints({ width: 10, height: 10, cycles: 1, amplitude: 2, phase: 0, samples: 1 }).length).toBe(2);
  });
});

describe('smoothPath', () => {
  it('returns an empty string for no points', () => {
    expect(smoothPath([])).toBe('');
  });

  it('starts with a move command', () => {
    const d = smoothPath([
      [0, 0],
      [10, 10],
    ]);
    expect(d.startsWith('M 0 0')).toBe(true);
  });

  it('ends at the final point', () => {
    const d = smoothPath([
      [0, 0],
      [10, 10],
      [20, 0],
    ]);
    expect(d.trim().endsWith('L 20 0')).toBe(true);
  });

  it('produces only finite numbers', () => {
    const d = smoothPath(wavePoints({ width: 300, height: 100, cycles: 2, amplitude: 20, phase: 0.3 }));
    expect(d).not.toMatch(/NaN|Infinity/);
  });
});

describe('equalizerBars', () => {
  it('returns the requested number of bars', () => {
    expect(equalizerBars(24, 0).length).toBe(24);
  });

  it('clamps every bar between 0.08 and 1', () => {
    for (const phase of [0, 1.3, 7.7, 42]) {
      for (const v of equalizerBars(40, phase)) {
        expect(v).toBeGreaterThanOrEqual(0.08);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it('is deterministic for the same phase and seed', () => {
    expect(equalizerBars(10, 2.5, 3)).toEqual(equalizerBars(10, 2.5, 3));
  });

  it('changes as the phase advances', () => {
    expect(equalizerBars(10, 0)).not.toEqual(equalizerBars(10, 1.9));
  });
});

describe('cyclesForFrequency', () => {
  it('draws denser waves for higher tones', () => {
    expect(cyclesForFrequency(1000)).toBeGreaterThan(cyclesForFrequency(100));
  });

  it('stays within a readable range', () => {
    for (const hz of [0, 1, 7.83, 100, 432, 528, 963, 20000, NaN]) {
      const c = cyclesForFrequency(hz);
      expect(c).toBeGreaterThanOrEqual(2);
      expect(c).toBeLessThanOrEqual(8);
    }
  });

  it('falls back to a default for missing or invalid input', () => {
    expect(cyclesForFrequency(0)).toBe(3);
    expect(cyclesForFrequency(-5)).toBe(3);
  });
});

describe('amplitudeForHeight', () => {
  it('keeps a minimum amplitude so flat stages still show a wave', () => {
    expect(amplitudeForHeight(10)).toBe(6);
  });

  it('scales with height but never exceeds the stage', () => {
    expect(amplitudeForHeight(200)).toBeCloseTo(44, 5);
    expect(amplitudeForHeight(400)).toBeLessThan(400 / 2);
  });
});

describe('breathing helpers', () => {
  it('completes one cycle per BREATH_CYCLE_SECONDS', () => {
    expect(breathProgress(0)).toBeCloseTo(0, 5);
    expect(breathProgress(BREATH_CYCLE_SECONDS)).toBeCloseTo(0, 5);
    expect(breathProgress(BREATH_CYCLE_SECONDS / 2)).toBeCloseTo(1, 5);
  });

  it('scales between 1 and 1 + depth', () => {
    expect(breathScale(0, 0.12)).toBeCloseTo(1, 5);
    expect(breathScale(BREATH_CYCLE_SECONDS / 2, 0.12)).toBeCloseTo(1.12, 5);
  });

  it('cues inhale for the first half and exhale for the second', () => {
    expect(breathCue(1)).toBe('in');
    expect(breathCue(BREATH_CYCLE_SECONDS * 0.75)).toBe('out');
  });

  it('defaults to a calm six breaths per minute', () => {
    // 6 breaths/min == one cycle every 10 s, the resonance rate.
    expect(60 / BREATH_CYCLE_SECONDS).toBe(6);
  });
});

describe('Visual style labels and cycling', () => {
  it('gives every style a distinct, human-readable label', () => {
    const styles: VisualizerStyle[] = ['wave', 'equalizer', 'orb'];
    const labels = styles.map((s) => VISUALIZER_LABELS[s]);
    expect(new Set(labels).size).toBe(styles.length);
    labels.forEach((label) => expect(label.length).toBeGreaterThan(0));
  });

  it('cycles through all styles and returns to the first', () => {
    const seen = new Set<VisualizerStyle>();
    let current: VisualizerStyle = 'wave';
    for (let i = 0; i < 3; i++) {
      seen.add(current);
      current = nextVisualizerStyle(current);
    }
    expect(current).toBe('wave');
    expect(seen.size).toBe(3);
  });

  it('never returns the style it was given', () => {
    (['wave', 'equalizer', 'orb'] as VisualizerStyle[]).forEach((style) => {
      expect(nextVisualizerStyle(style)).not.toBe(style);
    });
  });
});
