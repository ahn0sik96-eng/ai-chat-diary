/**
 * Design tokens — modern, trendy, Instagram-flavored.
 * Clean neutrals, bold type, a signature pink→violet gradient for brand moments.
 */

export const colors = {
  // Brand / accent
  primary: '#111114', // near-black: primary buttons, active states
  accent: '#E1306C', // vivid insta pink (single-color fallback for the gradient)
  accent2: '#7C4DFF', // violet
  accentSoft: '#F4EEFF',

  // Surfaces
  bg: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F6F6F8',
  surfaceSunken: '#FAFAFB',
  border: '#ECECEF',
  borderStrong: '#DADADF',

  // Text
  text: '#0B0B0F',
  textMuted: '#8E8E93',
  textFaint: '#BDBDC4',
  onPrimary: '#FFFFFF',
  onAccent: '#FFFFFF',

  // Chat bubbles
  bubbleUser: '#111114',
  bubbleUserText: '#FFFFFF',
  bubbleAi: '#F1F1F4',
  bubbleAiText: '#0B0B0F',

  // Status
  success: '#2BBE7B',
  danger: '#FF3B5C',
  warning: '#FF9F0A',

  // Canvas backgrounds (diary decoration)
  canvasOptions: [
    '#FFFFFF',
    '#FAFAFB',
    '#FFF1F5',
    '#FFF7E9',
    '#EAF7F0',
    '#EEF1FF',
    '#F4EEFF',
    '#111114',
  ],
} as const;

/** Signature gradient used for FAB, active tab pill, primary highlights. */
export const gradients = {
  brand: ['#FE6AA9', '#9B5CFF'] as const, // pink -> violet
  insta: ['#F58529', '#DD2A7B', '#8134AF', '#515BD4'] as const,
  sunset: ['#FF9A8B', '#FF6A88', '#FF99AC'] as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5, color: colors.text },
  title: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.3, color: colors.text },
  heading: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  tiny: { fontSize: 11, fontWeight: '500' as const, color: colors.textMuted },
} as const;

export const shadow = {
  card: {
    shadowColor: '#0B0B0F',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  float: {
    shadowColor: '#0B0B0F',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
} as const;

export const diaryFonts = {
  system: undefined,
} as const;
