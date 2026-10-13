import { Platform } from "react-native";

/** GRPD redesign tokens — 390px mock parity (redesigns.html). */
/** Aligned to D03 green home experienceTheme. */
export const redesignTheme = {
  screen: {
    width: 390,
    horizontalPadding: 24,
    background: "#111214",
    charcoal: "#111214",
  },
  card: {
    background: "#1C1E21",
    backgroundElevated: "#222428",
    charcoal: "#1C1E21",
    radiusSm: 12,
    radiusMd: 14,
    radiusLg: 16,
    radiusXl: 20,
    radius2xl: 22,
    border: "#383B40",
    hairline: "#383B40",
  },
  text: {
    primary: "#F3F2ED",
    dim: "#B1B2B6",
    faint: "#8A8B90",
    sage: "#C3D5B3",
  },
  accent: {
    blue: "#C3D5B3",
    green: "#C3D5B3",
    sage: "#C3D5B3",
    orange: "#F08A3A",
    red: "#E94B5E",
    purple: "#B265E0",
    grey: "#B1B2B6",
    greenSoft: "rgba(195,213,179,0.14)",
    sageSoft: "rgba(195,213,179,0.14)",
    blueDim: "rgba(195,213,179,0.12)",
    blueBorder: "rgba(195,213,179,0.28)",
  },
  type: {
    h1: { fontSize: 30, fontWeight: "700" as const, letterSpacing: -0.7 },
    h2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.4 },
    title: { fontSize: 18, fontWeight: "700" as const, letterSpacing: -0.3 },
    body: { fontSize: 14, fontWeight: "500" as const },
    bodyS: { fontSize: 13, fontWeight: "400" as const, lineHeight: 19 },
    caption: { fontSize: 12, fontWeight: "400" as const },
    metric: { fontSize: 36, fontWeight: "700" as const, letterSpacing: -1 },
    kicker: {
      fontSize: 11,
      fontWeight: "600" as const,
      letterSpacing: 1,
    },
    monoSm: {
      fontSize: 10,
      fontWeight: "500" as const,
      letterSpacing: 0.6,
    },
  },
  backButton: {
    size: 40,
    background: "rgba(255,255,255,0.06)",
  },
  cta: {
    height: 56,
    radius: 16,
  },
} as const;

export const monoFontFamily = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});
