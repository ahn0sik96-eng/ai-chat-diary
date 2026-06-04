/**
 * Lumi design system — modern, sophisticated dark theme.
 * Glassmorphism surfaces + a violet→fuchsia→cyan accent gradient.
 */
import { Platform } from "react-native";

export const colors = {
  bg: "#07070b",
  bgElevated: "#0d0d14",

  text: "#ECECF1",
  textMuted: "rgba(255,255,255,0.55)",
  textFaint: "rgba(255,255,255,0.40)",
  textGhost: "rgba(255,255,255,0.28)",

  // glass tints
  glass: "rgba(255,255,255,0.06)",
  glassStrong: "rgba(255,255,255,0.10)",
  border: "rgba(255,255,255,0.10)",
  borderSoft: "rgba(255,255,255,0.07)",
  hairline: "rgba(255,255,255,0.05)",

  accent: "#a78bfa",
  accentSoft: "#c4b5fd",
  danger: "#f87171",

  // gradient stops
  gradFrom: "#8b5cf6",
  gradVia: "#d946ef",
  gradTo: "#22d3ee",

  white: "#ffffff",
} as const;

/** Primary accent gradient used across buttons, badges, brand mark. */
export const ACCENT_GRADIENT: readonly [string, string, string] = [
  colors.gradFrom,
  colors.gradVia,
  colors.gradTo,
];
export const ACCENT_GRADIENT_2: readonly [string, string] = [
  colors.gradFrom,
  colors.gradVia,
];

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  "2xl": 32,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
} as const;

export const fonts = Platform.select({
  ios: { sans: "system-ui", serif: "ui-serif", rounded: "ui-rounded", mono: "ui-monospace" },
  android: { sans: "sans-serif", serif: "serif", rounded: "sans-serif-medium", mono: "monospace" },
  default: { sans: "System", serif: "serif", rounded: "System", mono: "monospace" },
}) as { sans: string; serif: string; rounded: string; mono: string };

/** Vertical space the floating tab bar occupies (excl. safe-area inset). */
export const TAB_BAR_SPACE = 92;

export const shadow = {
  glow: {
    shadowColor: colors.gradFrom,
    shadowOpacity: 0.55,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  soft: {
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;
