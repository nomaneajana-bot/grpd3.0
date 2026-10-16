// Design tokens — aligned with noa1_redesign_best_of_both.html :root

import { Platform, StyleSheet } from "react-native";

/** Border width matching mock 0.5px (hairline on native). */
export const hairline = Platform.OS === "web" ? 0.5 : StyleSheet.hairlineWidth;

/** Prototype GRPD hairline — rgba white 7% */
export const hairlineColor = "rgba(255, 255, 255, 0.07)";

/**
 * Aligned to NEW GREEN HOME (D03 experienceTheme):
 * bg #111214 · card #1C1E21 · text #F3F2ED · muted #B1B2B6 · accent #C3D5B3 · line #383B40
 * Source: components/experiences/ExperienceUI.tsx · reference: /reference/green-home
 */
export const colors = {
  background: {
    /** communityTheme.bg */
    primary: "#111214",
    /** --s1 */
    frame: "#16181B",
    /** communityTheme.card */
    card: "#1C1E21",
    /** --s3 */
    elevated: "#24262A",
    /** --s4 */
    elevated2: "#2C2E32",
    input: "#1C1E21",
    inputDark: "#24262A",
  },
  surface: {
    s1: "#1C1E21",
    s2: "#222428",
    s3: "#2A2C30",
    s4: "#323438",
  },
  text: {
    /** communityTheme.text */
    primary: "#F3F2ED",
    /** communityTheme.muted */
    secondary: "#B1B2B6",
    tertiary: "#8A8B90",
    faint: "#6A6B70",
    disabled: "#6A6B70",
    /** community accent (links / emphasis) */
    accent: "#C3D5B3",
    warning: "#F59040",
    success: "#C3D5B3",
    error: "#FFB7AA",
  },
  accent: {
    /** communityTheme.accent — soft sage green CTAs */
    primary: "#C3D5B3",
    /** dim surface for green-tinted panels */
    primaryDim: "#1A2218",
    primaryMid: "#2A3828",
    success: "#C3D5B3",
    charcoal: "#111214",
    sage: "#C3D5B3",
    sageDim: "rgba(195, 213, 179, 0.14)",
    /** --orange (streak / warn — retained) */
    orange: "#F5782A",
    orangeDim: "#2A1608",
    warning: "#F59040",
    error: "#FFB7AA",
  },
  tag: {
    blueBg: "#1A2218",
    blueText: "#C3D5B3",
    greenBg: "#1A2218",
    greenText: "#C3D5B3",
    orangeBg: "#2A1608",
    orangeText: "#F59040",
    purpleBg: "#1E1035",
    purpleText: "#A87BF8",
    pinkBg: "#2A0E1C",
    pinkText: "#EC7AAA",
    grayBg: "#2A2C30",
    grayText: "#B1B2B6",
  },
  /** Coach surfaces — green-home adjacent (neutral olive, not neon teal) */
  coach: {
    bg: "#1A2218",
    border: "rgba(195, 213, 179, 0.35)",
    text: "#C3D5B3",
    muted: "#B1B2B6",
  },
  border: {
    /** communityTheme.line */
    default: "#383B40",
    hairline: "#383B40",
    light: "#2A2C30",
    medium: "#383B40",
    active: "#C3D5B3",
    accent: "#C3D5B3",
  },
  overlay: {
    backdrop: "rgba(0, 0, 0, 0.75)",
    backdropLight: "rgba(0, 0, 0, 0.6)",
  },
  pill: {
    default: "#2A2C30",
    active: "rgba(195, 213, 179, 0.22)",
    custom: "rgba(177, 178, 182, 0.2)",
    success: "rgba(195, 213, 179, 0.18)",
  },
  workoutBlock: {
    cool: "#16181B",
    coolBorder: "#383B40",
    mainBorder: "#2A3828",
  },
  whatsapp: {
    bg: "#1A2218",
    text: "#C3D5B3",
    border: "#2A3828",
  },
  groupRow: {
    selectedBg: "#1A2218",
    recommendedBg: "#1C1008",
    recommendedBorder: "#F5782A",
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  header: 56,
  bottom: 100,
  /** mock body horizontal padding */
  screenHorizontal: 14,
};

/** Community home radii (D03 cards 22 / CTA 16). */
export const borderRadius = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const typography = {
  sizes: {
    xs: 10,
    sm: 11,
    md: 12,
    base: 15,
    lg: 16,
    xl: 18,
    "2xl": 26,
    "3xl": 28,
    /** Session titles, mock ~21px */
    title: 21,
    /** Streak hero */
    hero: 36,
    /** Bottom tab label ~9px mock */
    tab: 9,
  },
  weights: {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    extrabold: "800" as const,
  },
};

export const commonStyles = {
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: hairline,
    borderColor: colors.border.default,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginBottom: 9,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.pill.default,
    borderWidth: hairline,
    borderColor: colors.border.default,
  },
  button: {
    primary: {
      backgroundColor: colors.accent.primary,
      borderRadius: 16,
      paddingHorizontal: spacing.lg,
      paddingVertical: 17,
    },
    secondary: {
      borderRadius: 16,
      paddingHorizontal: spacing.lg,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: colors.border.default,
      backgroundColor: colors.background.card,
    },
  },
};
