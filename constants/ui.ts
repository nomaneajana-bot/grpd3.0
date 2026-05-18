// Design tokens — aligned with noa1_redesign_best_of_both.html :root

import { Platform, StyleSheet } from "react-native";

/** Border width matching mock 0.5px (hairline on native). */
export const hairline = Platform.OS === "web" ? 0.5 : StyleSheet.hairlineWidth;

/** Prototype GRPD hairline — rgba white 7% */
export const hairlineColor = "rgba(255, 255, 255, 0.07)";

export const colors = {
  background: {
    /** --bg / GRPD.bg */
    primary: "#000000",
    /** --s1 */
    frame: "#141416",
    /** --s2 (cards) / GRPD.card */
    card: "#141414",
    /** --s3 */
    elevated: "#242428",
    /** --s4 */
    elevated2: "#2C2C32",
    input: "#1C1C1F",
    inputDark: "#242428",
  },
  surface: {
    s1: "#141414",
    /** GRPD.card2 */
    s2: "#1C1C1E",
    s3: "#242428",
    s4: "#2C2C32",
  },
  text: {
    /** --text */
    primary: "#EFEFEF",
    /** --t2 */
    secondary: "#7A7A8A",
    /** --t3 / GRPD.textFaint */
    tertiary: "#3A3A48",
    faint: "#3A3A48",
    disabled: "#3A3A48",
    /** on blue tint */
    accent: "#6BA4F8",
    warning: "#F59040",
    success: "#4DD990",
    error: "#FF3B30",
  },
  accent: {
    /** --blue / GRPD.accent */
    primary: "#2F7BFF",
    /** --blue-dim */
    primaryDim: "#112044",
    /** --blue-mid */
    primaryMid: "#1A3A7A",
    success: "#22C162",
    /** --orange */
    orange: "#F5782A",
    orangeDim: "#2A1608",
    warning: "#F59040",
    error: "#FF3B30",
  },
  tag: {
    blueBg: "#112044",
    blueText: "#6BA4F8",
    greenBg: "#0A2318",
    greenText: "#4DD990",
    orangeBg: "#2A1608",
    orangeText: "#F59040",
    purpleBg: "#1E1035",
    purpleText: "#A87BF8",
    pinkBg: "#2A0E1C",
    pinkText: "#EC7AAA",
    grayBg: "#242428",
    grayText: "#7A7A8A",
  },
  /** Teal — coach-only surfaces */
  coach: {
    bg: "#0A2222",
    border: "rgba(45, 212, 191, 0.35)",
    text: "#5EEAD4",
    muted: "#94A3B8",
  },
  border: {
    /** --bd / GRPD.hairline on cards */
    default: hairlineColor,
    hairline: hairlineColor,
    light: "#22222A",
    medium: "#2C2C32",
    active: "#2E7CF6",
    accent: "#2E7CF6",
  },
  overlay: {
    backdrop: "rgba(0, 0, 0, 0.75)",
    backdropLight: "rgba(0, 0, 0, 0.6)",
  },
  pill: {
    default: "#242428",
    active: "rgba(46, 124, 246, 0.2)",
    custom: "rgba(122, 122, 138, 0.2)",
    success: "rgba(34, 193, 98, 0.18)",
  },
  workoutBlock: {
    cool: "#0A1820",
    coolBorder: "#1A3040",
    mainBorder: "#112044",
  },
  whatsapp: {
    bg: "#1A3A1A",
    text: "#3ED87A",
    border: "#2A5A2A",
  },
  groupRow: {
    selectedBg: "#1A3A7A",
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

/** --r: 14px */
export const borderRadius = {
  sm: 11,
  md: 12,
  lg: 14,
  xl: 20,
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
      borderRadius: 13,
      paddingHorizontal: spacing.lg,
      paddingVertical: 13,
    },
    secondary: {
      borderRadius: 13,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      borderWidth: hairline,
      borderColor: colors.border.default,
      backgroundColor: colors.surface.s3,
    },
  },
};
