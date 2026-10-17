/**
 * Noa-Stito design tokens — visual source of truth from AI Studio export.
 * Use on authenticated Stito-ported surfaces. Keep dark experienceTheme elsewhere.
 */
import { stitoFont } from "@/lib/stitoFonts";

export const stitoTheme = {
  canvas: "#F9F9FA",
  card: "#FFFFFF",
  surfaceDim: "#DADADB",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F3F3F4",
  surfaceContainer: "#EEEEEF",
  surfaceContainerHigh: "#E8E8E9",
  surfaceContainerHighest: "#E2E2E3",
  text: "#1A1C1D",
  textSecondary: "#3F4941",
  outline: "#6F7A70",
  outlineVariant: "#BECABE",
  primary: "#005F34",
  primaryContainer: "#167A47",
  onPrimary: "#FFFFFF",
  primaryFixed: "#9AF6B7",
  secondary: "#006D3B",
  secondaryContainer: "#76FCA7",
  onSecondaryContainer: "#00743F",
  secondaryFixedDim: "#57DF8E",
  error: "#BA1A1A",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#93000A",
  radiusMain: 20,
  radiusXl: 24,
  radiusChip: 999,
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const,
  touchMin: 44,
  font: stitoFont,
  type: {
    pageTitle: {
      fontFamily: stitoFont.space.bold,
      fontSize: 28,
      lineHeight: 32,
      letterSpacing: -0.6,
    },
    section: {
      fontFamily: stitoFont.space.bold,
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: -0.2,
    },
    cardTitle: {
      fontFamily: stitoFont.space.bold,
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: -0.2,
    },
    cardTitleLg: {
      fontFamily: stitoFont.space.bold,
      fontSize: 18,
      lineHeight: 24,
    },
    bodySm: {
      fontFamily: stitoFont.hanken.regular,
      fontSize: 13,
      lineHeight: 18,
    },
    labelMd: {
      fontFamily: stitoFont.space.semibold,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.4,
    },
    labelSm: {
      fontFamily: stitoFont.space.bold,
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 0.6,
    },
    stat: {
      fontFamily: stitoFont.space.bold,
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.4,
    },
  },
} as const;

export type StitoTheme = typeof stitoTheme;
