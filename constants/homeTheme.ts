/**
 * Authenticated homepage tokens — Stitch export config (17 Oct 2026).
 * Do not mix with DESIGN.md prose palette or dark experienceTheme.
 */
export const homeTheme = {
  canvas: "#F9F9FA",
  card: "#FFFFFF",
  mutedSurface: "#F3F3F4",
  text: "#1A1C1D",
  textSecondary: "#3F4941",
  primary: "#005F34",
  onPrimary: "#FFFFFF",
  outline: "#BECABE",
  danger: "#BA1A1A",
  radiusMain: 20,
  radiusDiscovery: 16,
  radiusChip: 999,
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const,
  /** Suggested type ramp — system font (no network font deps). */
  type: {
    pageTitle: { fontSize: 32, lineHeight: 38, fontWeight: "600" as const },
    section: { fontSize: 22, lineHeight: 28, fontWeight: "600" as const },
    cardTitle: { fontSize: 20, lineHeight: 26, fontWeight: "600" as const },
    body: { fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
    bodySm: { fontSize: 15, lineHeight: 21, fontWeight: "400" as const },
    meta: { fontSize: 13, lineHeight: 18, fontWeight: "500" as const },
    label: { fontSize: 13, lineHeight: 18, fontWeight: "600" as const },
    stat: { fontSize: 28, lineHeight: 32, fontWeight: "700" as const },
  },
  touchMin: 44,
} as const;

export type HomeTheme = typeof homeTheme;
