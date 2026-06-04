/**
 * Design tokens — a soft, modern "Instagram meets cozy diary" aesthetic.
 * Keep all colors / spacing / typography here so the whole app stays consistent.
 */

export const colors = {
  // Brand
  primary: '#FF6B9D', // warm pink
  primarySoft: '#FFE3EE',
  accent: '#7C83FD', // soft indigo
  accentSoft: '#E8E9FF',

  // Surfaces
  bg: '#FFF7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#FBF1F6',
  border: '#F0E0E9',

  // Text
  text: '#2A2230',
  textMuted: '#8B8295',
  textFaint: '#BcaFc0',
  onPrimary: '#FFFFFF',

  // Chat bubbles
  bubbleUser: '#FF6B9D',
  bubbleUserText: '#FFFFFF',
  bubbleAi: '#F3EEF5',
  bubbleAiText: '#2A2230',

  // Status
  success: '#4CAF93',
  danger: '#F2545B',
  warning: '#F5A623',

  // Canvas backgrounds (diary decoration)
  canvasOptions: [
    '#FFFFFF',
    '#FFF1F5',
    '#FFF8E7',
    '#EAF7F0',
    '#EAF0FF',
    '#F6EFFF',
    '#FBE9E7',
    '#2A2230',
  ],
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
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 24, fontWeight: '800' as const, color: colors.text },
  heading: { fontSize: 19, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const, color: colors.text },
  caption: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  tiny: { fontSize: 11, fontWeight: '500' as const, color: colors.textMuted },
} as const;

export const shadow = {
  card: {
    shadowColor: '#7A2E50',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  float: {
    shadowColor: '#7A2E50',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} as const;

/** Font families available for diary text blocks on the canvas. */
export const diaryFonts = {
  system: undefined, // platform default
} as const;
