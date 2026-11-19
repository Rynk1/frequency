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

export interface ResponsiveLayout {
  width: number;
  height: number;
  isTablet: boolean;
  isWide: boolean;
  /** Columns a card grid should use at this width. */
  columns: number;
  /** Horizontal page gutter. */
  gutter: number;
  /** Width to constrain a single reading column to. */
  contentWidth: number;
  /** Width available to a card grid. */
  gridWidth: number;
}

export function resolveLayout(width: number, height: number): ResponsiveLayout {
  const isTablet = width >= BREAKPOINTS.tablet;
  const isWide = width >= BREAKPOINTS.wide;

  const gutter = isWide ? 32 : isTablet ? 28 : 20;
  const available = Math.max(0, width - gutter * 2);

  return {
    width,
    height,
    isTablet,
    isWide,
    columns: isWide ? 3 : isTablet ? 2 : 1,
    gutter,
    contentWidth: Math.min(available, MAX_CONTENT_WIDTH),
    gridWidth: Math.min(available, MAX_GRID_WIDTH),
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
