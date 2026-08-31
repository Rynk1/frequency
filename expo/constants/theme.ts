import { Platform, TextStyle } from 'react-native';

// ── Typography ──────────────────────────────────────────────
// DM Serif Display → headings, titles, hero text (elegant modern serif)
// Satoshi → body, labels, UI text (crisp neo-grotesque sans)
export const FONTS = {
  heading: 'DM Serif Display',
  headingItalic: 'DM Serif Display Italic',
  body: 'Satoshi',
  bodyItalic: 'SatoshiItalic',
} as const;

export const TEXT_PRESETS: Record<string, TextStyle> = {
  heroLarge: {
    fontFamily: FONTS.heading,
    fontSize: 36,
    fontWeight: '400' as const,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  heroMedium: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    fontWeight: '400' as const,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  headingLarge: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    fontWeight: '400' as const,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  headingMedium: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    fontWeight: '400' as const,
    lineHeight: 28,
  },
  headingSmall: {
    fontFamily: FONTS.heading,
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyLarge: {
    fontFamily: FONTS.body,
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: FONTS.body,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: FONTS.body,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  labelLarge: {
    fontFamily: FONTS.body,
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  labelMedium: {
    fontFamily: FONTS.body,
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: FONTS.body,
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontFamily: FONTS.body,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
};

// ── Theme Color Types ───────────────────────────────────────

export interface ThemeColors {
  // Core backgrounds
  bg: string;
  bgSecondary: string;
  bgTertiary: string;

  // Indigo/Violet gradient family
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Accent
  accent: string;
  accentSoft: string;

  // Violet glow
  glow: string;
  glowSoft: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Glass surfaces
  glass: string;
  glassMid: string;
  glassStrong: string;
  glassBorder: string;
  glassBorderBright: string;

  // Status / Category colors
  researchColor: string;
  brainwaveColor: string;
  solfeggioColor: string;
  chakraColor: string;

  // Premium gold
  gold: string;
  goldLight: string;
  goldGlow: string;

  // Divider
  divider: string;
  dividerBright: string;

  // Tab bar
  tabBarBg: string;
  tabBarBorder: string;
  tabBarInactive: string;
  statusBarStyle: 'light-content' | 'dark-content';
}

export interface ThemeGradients {
  bg: readonly [string, string, string];
  bgShort: readonly [string, string];
  orb: readonly [string, string, string];
  orbOuter: readonly [string, string, string];
  gold: readonly [string, string, string];
  goldSubtle: readonly [string, string];
  card: readonly [string, string];
  cardHover: readonly [string, string];
  header: readonly [string, string];
}

export interface ThemeGlass {
  light: object;
  normal: object;
  deep: object;
}

// ── Dark Theme (current app theme) ──────────────────────────

export const darkColors: ThemeColors = {
  bg: '#0A0E1A',
  bgSecondary: '#0F1628',
  bgTertiary: '#141D35',

  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4A42CC',

  accent: '#A78BFA',
  accentSoft: 'rgba(167, 139, 250, 0.15)',

  glow: '#7C3AED',
  glowSoft: 'rgba(124, 58, 237, 0.25)',

  textPrimary: '#F0EFFF',
  textSecondary: 'rgba(240, 239, 255, 0.6)',
  textMuted: 'rgba(240, 239, 255, 0.35)',

  glass: 'rgba(255, 255, 255, 0.05)',
  glassMid: 'rgba(255, 255, 255, 0.08)',
  glassStrong: 'rgba(255, 255, 255, 0.12)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  glassBorderBright: 'rgba(255, 255, 255, 0.18)',

  researchColor: '#60A5FA',
  brainwaveColor: '#A78BFA',
  solfeggioColor: '#F472B6',
  chakraColor: '#34D399',

  gold: '#D4AF37',
  goldLight: '#F5D060',
  goldGlow: 'rgba(212, 175, 55, 0.3)',

  divider: 'rgba(255, 255, 255, 0.06)',
  dividerBright: 'rgba(255, 255, 255, 0.1)',

  tabBarBg: 'rgba(8, 11, 22, 0.97)',
  tabBarBorder: 'rgba(108, 99, 255, 0.14)',
  tabBarInactive: 'rgba(240, 239, 255, 0.32)',
  statusBarStyle: 'light-content',
};

export const darkGradients: ThemeGradients = {
  bg: ['#0A0E1A', '#0F1628', '#141D35'] as const,
  bgShort: ['#0A0E1A', '#141D35'] as const,
  orb: ['rgba(108, 99, 255, 0.8)', 'rgba(124, 58, 237, 0.6)', 'rgba(167, 139, 250, 0.4)'] as const,
  orbOuter: ['rgba(108, 99, 255, 0.15)', 'rgba(124, 58, 237, 0.08)', 'transparent'] as const,
  gold: ['#D4AF37', '#F5D060', '#D4AF37'] as const,
  goldSubtle: ['rgba(212, 175, 55, 0.2)', 'rgba(245, 208, 96, 0.1)'] as const,
  card: ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.04)'] as const,
  cardHover: ['rgba(108, 99, 255, 0.15)', 'rgba(124, 58, 237, 0.08)'] as const,
  header: ['rgba(10,14,26,0.95)', 'rgba(10,14,26,0)'] as const,
};

export const darkGlass: ThemeGlass = {
  light: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    overflow: 'hidden' as const,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    } : {}),
    elevation: 0,
  },
  normal: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    borderRadius: 20,
    overflow: 'hidden' as const,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#6C63FF',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    } : {}),
    elevation: 0,
  },
  deep: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    borderRadius: 24,
    overflow: 'hidden' as const,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
    } : {}),
    elevation: 0,
  },
};

// ── Light Theme ─────────────────────────────────────────────

export const lightColors: ThemeColors = {
  bg: '#F5F6FA',
  bgSecondary: '#FFFFFF',
  bgTertiary: '#EEF0F6',

  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4A42CC',

  accent: '#7C3AED',
  accentSoft: 'rgba(124, 58, 237, 0.10)',

  glow: '#7C3AED',
  glowSoft: 'rgba(124, 58, 237, 0.15)',

  textPrimary: '#1A1D2E',
  textSecondary: 'rgba(26, 29, 46, 0.6)',
  textMuted: 'rgba(26, 29, 46, 0.40)',

  glass: 'rgba(0, 0, 0, 0.035)',
  glassMid: 'rgba(0, 0, 0, 0.05)',
  glassStrong: 'rgba(0, 0, 0, 0.08)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  glassBorderBright: 'rgba(0, 0, 0, 0.14)',

  researchColor: '#3B82F6',
  brainwaveColor: '#7C3AED',
  solfeggioColor: '#EC4899',
  chakraColor: '#10B981',

  gold: '#B8860B',
  goldLight: '#DAA520',
  goldGlow: 'rgba(184, 134, 11, 0.18)',

  divider: 'rgba(0, 0, 0, 0.06)',
  dividerBright: 'rgba(0, 0, 0, 0.10)',

  tabBarBg: 'rgba(255, 255, 255, 0.97)',
  tabBarBorder: 'rgba(108, 99, 255, 0.12)',
  tabBarInactive: 'rgba(26, 29, 46, 0.35)',
  statusBarStyle: 'dark-content',
};

export const lightGradients: ThemeGradients = {
  bg: ['#F5F6FA', '#FFFFFF', '#EEF0F6'] as const,
  bgShort: ['#F5F6FA', '#EEF0F6'] as const,
  orb: ['rgba(108, 99, 255, 0.5)', 'rgba(124, 58, 237, 0.35)', 'rgba(167, 139, 250, 0.2)'] as const,
  orbOuter: ['rgba(108, 99, 255, 0.08)', 'rgba(124, 58, 237, 0.05)', 'transparent'] as const,
  gold: ['#B8860B', '#DAA520', '#B8860B'] as const,
  goldSubtle: ['rgba(184, 134, 11, 0.12)', 'rgba(218, 165, 32, 0.06)'] as const,
  card: ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.6)'] as const,
  cardHover: ['rgba(108, 99, 255, 0.08)', 'rgba(124, 58, 237, 0.04)'] as const,
  header: ['rgba(245,246,250,0.95)', 'rgba(245,246,250,0)'] as const,
};

export const lightGlass: ThemeGlass = {
  light: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 20,
    overflow: 'hidden' as const,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    } : {}),
    elevation: 0,
  },
  normal: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 20,
    overflow: 'hidden' as const,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#6C63FF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    } : {}),
    elevation: 0,
  },
  deep: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.10)',
    borderRadius: 24,
    overflow: 'hidden' as const,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.10,
      shadowRadius: 18,
    } : {}),
    elevation: 0,
  },
};

// ── Backward-compatible exports (default to dark) ───────────
// These allow existing code to keep working during the transition.
// New theme-aware code should use useTheme() instead.
export const COLORS = darkColors;
export const GRADIENTS = darkGradients;
export const GLASS = darkGlass;

export const CATEGORY_COLORS: Record<string, { primary: string; glow: string; soft: string }> = {
  scientific: { primary: '#60A5FA', glow: 'rgba(96, 165, 250, 0.3)', soft: 'rgba(96, 165, 250, 0.10)' },
  binaural:   { primary: '#A78BFA', glow: 'rgba(167, 139, 250, 0.3)', soft: 'rgba(167, 139, 250, 0.10)' },
  solfeggio:  { primary: '#F472B6', glow: 'rgba(244, 114, 182, 0.3)', soft: 'rgba(244, 114, 182, 0.10)' },
  chakra:     { primary: '#34D399', glow: 'rgba(52, 211, 153, 0.3)', soft: 'rgba(52, 211, 153, 0.10)' },
};
