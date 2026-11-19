import { describe, it, expect } from 'vitest';
import {
  BREAKPOINTS,
  MAX_CONTENT_WIDTH,
  columnWidth,
  resolveLayout,
} from '../lib/ui/responsive';

/**
 * Layout is resolved from a measured width rather than a module-scope
 * `Dimensions.get`, so these cases pin the behaviour a tablet actually gets.
 */
describe('resolveLayout', () => {
  it('keeps a single column and phone gutters on a phone', () => {
    const layout = resolveLayout(390, 844);
    expect(layout.isTablet).toBe(false);
    expect(layout.columns).toBe(1);
    expect(layout.gutter).toBe(20);
    expect(layout.contentWidth).toBe(350);
  });

  it('switches to two columns at the tablet breakpoint', () => {
    const layout = resolveLayout(BREAKPOINTS.tablet, 1024);
    expect(layout.isTablet).toBe(true);
    expect(layout.columns).toBe(2);
    expect(layout.contentWidth).toBeLessThanOrEqual(MAX_CONTENT_WIDTH);
  });

  it('uses three columns on a wide tablet', () => {
    expect(resolveLayout(BREAKPOINTS.wide, 1366).columns).toBe(3);
  });

  it('caps the reading column so lines stay readable on large screens', () => {
    const layout = resolveLayout(2048, 1536);
    expect(layout.contentWidth).toBe(MAX_CONTENT_WIDTH);
    // The grid may use more room than body copy.
    expect(layout.gridWidth).toBeGreaterThanOrEqual(layout.contentWidth);
  });

  it('never reports a negative or zero available width', () => {
    const layout = resolveLayout(100, 400);
    expect(layout.contentWidth).toBeGreaterThan(0);
    expect(layout.gridWidth).toBeGreaterThan(0);
  });

  it('treats rotation as a pure function of the measured width', () => {
    const portrait = resolveLayout(768, 1024);
    const landscape = resolveLayout(1024, 768);
    expect(portrait.isTablet).toBe(true);
    expect(landscape.isTablet).toBe(true);
    expect(landscape.columns).toBeGreaterThanOrEqual(portrait.columns);
  });
});

describe('columnWidth', () => {
  it('returns the full width for a single column', () => {
    expect(columnWidth(720, 1, 16)).toBe(720);
  });

  it('subtracts the gaps between cells', () => {
    // (720 - 16) / 2 = 352
    expect(columnWidth(720, 2, 16)).toBe(352);
    // (720 - 32) / 3 = 229.33 -> 229
    expect(columnWidth(720, 3, 16)).toBe(229);
  });

  it('keeps cells positive when columns exceed the available width', () => {
    expect(columnWidth(100, 4, 16)).toBeGreaterThan(0);
  });
});
