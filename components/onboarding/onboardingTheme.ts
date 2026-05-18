import { colors } from "@/constants/ui";
import { welcomeFontFamily } from "@/lib/welcomeFonts";

/** Onboarding-specific tokens (Variation A — Présence). */
export const onboardingColors = {
  greenSoft: "#0A2318",
  greenBorder: "rgba(77, 217, 144, 0.35)",
  greenText: colors.text.success,
  tagMarcheBg: "#1A3A28",
  tagMarcheText: "#4DD990",
  radialBlue: "rgba(47, 123, 255, 0.35)",
  iconTileBg: colors.accent.primaryDim,
  /** Muted copy on dark backgrounds (HTML: rgba(255,255,255,0.62)). */
  textMuted: "rgba(255, 255, 255, 0.62)",
};

/** Welcome screen tokens parsed from Présence HTML export. */
export const welcomeTheme = {
  textMuted: onboardingColors.textMuted,
  heroMutedColor: "rgba(255, 255, 255, 0.50)",
  background: "#000000",
  fontFamily: welcomeFontFamily,
  progressTrack: "rgba(255, 255, 255, 0.08)",
  heroSize: 44,
  heroLineHeight: 43,
  heroLetterSpacing: -1.6,
  heroWeight: "700" as const,
  brandSize: 12,
  brandWeight: "400" as const,
  brandLetterSpacing: 4,
  subtitleSize: 16,
  subtitleLineHeight: 24,
  subtitleWeight: "400" as const,
  featureTitleSize: 16,
  featureTitleWeight: "600" as const,
  featureDescSize: 13,
  featureDescLineHeight: 19,
  featureDescWeight: "400" as const,
  badgeSize: 32,
  badgeRadius: 10,
  badgeBg: "rgba(17, 32, 68, 0.85)",
  badgeNumberSize: 11,
  badgeNumberWeight: "600" as const,
  badgeNumberColor: colors.accent.primary,
  secondaryLinkSize: 14,
  secondaryLinkWeight: "500" as const,
  primaryLabelSize: 16,
  primaryLabelWeight: "600" as const,
  primaryMinHeight: 52,
  screenPaddingHorizontal: 24,
  heroToFeaturesGap: 36,
  featuresMarginTop: 36,
  featuresToCtaGap: 56,
  /** Bottom vignette only — top stays clear so radial bloom shows. */
  gradientLinear: {
    colors: ["rgba(0, 0, 0, 0)", "#000000"] as const,
    locations: [0.5, 1] as const,
  },
  gradientRadial: {
    cx: "50%",
    cy: "32%",
    rx: "55%",
    ry: "55%",
    centerColor: "rgba(47, 123, 255, 0.55)",
    edgeColor: "rgba(0, 0, 0, 0)",
    edgeOffset: "62%",
  },
};
