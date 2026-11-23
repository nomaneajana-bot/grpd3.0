/**
 * Display helpers for session metrics — never show invented walk/casual numbers.
 */

export function formatSessionDistanceKm(
  km: number | null | undefined,
): string {
  if (km == null || !Number.isFinite(km) || km <= 0) return "—";
  return Number.isInteger(km) ? String(km) : km.toFixed(1);
}

export function formatSessionDistanceLabel(
  km: number | null | undefined,
): string {
  const value = formatSessionDistanceKm(km);
  return value === "—" ? "—" : `${value} km`;
}

/** Pace for UI; empty / free / zero → em dash (no fake 5:00). */
export function formatSessionPaceLabel(
  pace: string | null | undefined,
): string {
  const raw = (pace ?? "").trim();
  if (!raw) return "—";
  const normalized = raw.replace(/\s*\/km\s*/i, "").trim();
  if (!normalized) return "—";
  if (/^allure\s+libre$/i.test(normalized)) return "Allure libre";
  return normalized;
}
