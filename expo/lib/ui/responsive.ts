import { useWindowDimensions } from 'react-native';

/**
 * Layout breakpoints. Kept in one place so screens agree on where the layout
 * changes; ad-hoc `width > 600` checks drift apart quickly.
 *
 * `tablet` is the point where a single phone column starts to look stretched:
 * a card grid can carry two columns and body copy wants a readable measure.
 */
export const BREAKPOINTS = {
  tablet: 700,
  wide: 1024,
} as const;

/** Upper bound for body copy so lines stay readable on wide screens. */
export const MAX_CONTENT_WIDTH = 720;
/** Upper bound for multi-column grids; beyond this, extra columns stop helping. */
export const MAX_GRID_WIDTH = 1100;

/**
 * The horizontal padding every tab applies to its scroll container.
 *
 * Screens set `maxWidth` from this module *and* pad their container, so the
 * width reported here is the outer container width, not the inner text width.
 * Reporting the inner width instead subtracts the gutter twice and visibly
 * thins every screen on a phone.
 */
export const PAGE_GUTTER = 22;

export interface ResponsiveLayout {
  width: number;
  height: number;
  isTablet: boolean;
  isWide: boolean;
  /** Columns a card grid should use at this width. */
  columns: number;
  /** Horizontal page gutter. */
  gutter: number;
  /** Outer width a screen's scroll container should be capped to. */
  contentWidth: number;
  /** Usable width inside a `contentWidth` container, after both gutters. */
  contentInnerWidth: number;
  /** Outer width available to a card grid, including its gutters. */
  gridWidth: number;
  /** Usable width inside a `gridWidth` container, after both gutters. */
  gridInnerWidth: number;
}

export function resolveLayout(width: number, height: number): ResponsiveLayout {
  const isTablet = width >= BREAKPOINTS.tablet;
  const isWide = width >= BREAKPOINTS.wide;

  const gutter = isWide ? 32 : isTablet ? 28 : 20;

  // Cap the *outer* container so that after `PAGE_GUTTER` on both sides the
  // inner column lands on MAX_CONTENT_WIDTH / MAX_GRID_WIDTH.
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH + PAGE_GUTTER * 2);
  const gridWidth = Math.min(width, MAX_GRID_WIDTH + PAGE_GUTTER * 2);
  const inset = PAGE_GUTTER * 2;

  return {
    width,
    height,
    isTablet,
    isWide,
    columns: isWide ? 3 : isTablet ? 2 : 1,
    gutter,
    contentWidth,
    contentInnerWidth: Math.max(0, contentWidth - inset),
    gridWidth,
    gridInnerWidth: Math.max(0, gridWidth - inset),
  };
}

export function useResponsive(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  return resolveLayout(width, height);
}

/**
 * Width of one cell in a grid with `columns` columns and `gap` between them.
 * Returns the full available width for a single column so cards never collapse
 * to zero or overflow.
 */
export function columnWidth(gridWidth: number, columns: number, gap: number): number {
  if (columns <= 1) return gridWidth;
  return Math.floor((gridWidth - gap * (columns - 1)) / columns);
}
