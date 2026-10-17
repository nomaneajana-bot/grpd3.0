/**
 * Authenticated homepage tokens — Noa-Stito / Stitch export.
 * Fonts: Space Grotesk + Hanken Grotesk (SIL OFL, bundled).
 */
import { stitoFont } from "@/lib/stitoFonts";

export const homeTheme = {
  canvas: "#F9F9FA",
  card: "#FFFFFF",
  mutedSurface: "#F3F3F4",
  surfaceContainer: "#EEEEEF",
  text: "#1A1C1D",
  textSecondary: "#3F4941",
  primary: "#005F34",
  onPrimary: "#FFFFFF",
  primaryFixed: "#9AF6B7",
  secondaryContainer: "#76FCA7",
  onSecondaryContainer: "#00743F",
  outline: "#BECABE",
  outlineStrong: "#E8E8E9",
  danger: "#BA1A1A",
  radiusMain: 20,
  radiusDiscovery: 16,
  radiusChip: 999,
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const,
  font: stitoFont,
  type: {
    pageTitle: {
      fontFamily: stitoFont.space.bold,
      fontSize: 28,
      lineHeight: 32,
      fontWeight: "700" as const,
      letterSpacing: -0.6,
    },
    section: {
      fontFamily: stitoFont.space.bold,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "700" as const,
    },
    cardTitle: {
      fontFamily: stitoFont.space.bold,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: "700" as const,
    },
    body: {
      fontFamily: stitoFont.hanken.regular,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "400" as const,
    },
    bodySm: {
      fontFamily: stitoFont.hanken.regular,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: "400" as const,
    },
    meta: {
      fontFamily: stitoFont.hanken.medium,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500" as const,
    },
    label: {
      fontFamily: stitoFont.space.semibold,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600" as const,
    },
    stat: {
      fontFamily: stitoFont.space.bold,
      fontSize: 22,
      lineHeight: 26,
      fontWeight: "700" as const,
    },
    tab: {
      fontFamily: stitoFont.space.bold,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "700" as const,
    },
  },
  touchMin: 44,
} as const;

export type HomeTheme = typeof homeTheme;
