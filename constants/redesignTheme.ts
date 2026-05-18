import { Platform } from "react-native";

/** GRPD redesign tokens — 390px mock parity (redesigns.html). */
export const redesignTheme = {
  screen: {
    width: 390,
    horizontalPadding: 20,
    background: "#000000",
  },
  card: {
    background: "#141414",
    backgroundElevated: "#1C1C1E",
    radiusSm: 10,
    radiusMd: 12,
    radiusLg: 14,
    radiusXl: 18,
    radius2xl: 20,
    border: "rgba(255,255,255,0.07)",
    hairline: "rgba(255,255,255,0.07)",
  },
  text: {
    primary: "#FFFFFF",
    dim: "rgba(255,255,255,0.62)",
    faint: "rgba(255,255,255,0.38)",
  },
  accent: {
    blue: "#2F7BFF",
    green: "#2BC97A",
    orange: "#F08A3A",
    red: "#E94B5E",
    purple: "#B265E0",
    grey: "#7A7A82",
    greenSoft: "rgba(43,201,122,0.12)",
    blueDim: "rgba(47,123,255,0.12)",
    blueBorder: "rgba(47,123,255,0.20)",
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
