// Helper functions for test calculations and formatting

import type { TestRecord } from "./profileStore";

/**
 * Safe pace calculation helper
 * Returns null if inputs are invalid, never throws or returns NaN
 */
export type PaceInput = {
  distanceMeters: number | null | undefined;
  durationSeconds: number | null | undefined;
};

export function calculatePaceSecondsPerKmSafe(input: PaceInput): number | null {
  const { distanceMeters, durationSeconds } = input;
  if (
    !distanceMeters ||
    !durationSeconds ||
    distanceMeters <= 0 ||
    durationSeconds <= 0
  ) {
    return null;
  }
  const km = distanceMeters / 1000;
  if (km <= 0) return null;
  const pace = durationSeconds / km;
  if (isNaN(pace) || !isFinite(pace)) return null;
  return Math.round(pace);
}

/**
 * Calculate time (seconds) from distance and pace
 */
export function calculateTimeFromDistanceAndPace(
  distanceMeters: number | null,
  paceSecondsPerKm: number | null,
): number | null {
  if (
    !distanceMeters ||
    !paceSecondsPerKm ||
    distanceMeters <= 0 ||
    paceSecondsPerKm <= 0
  ) {
    return null;
  }
  const km = distanceMeters / 1000;
  if (km <= 0) return null;
  const time = km * paceSecondsPerKm;
  if (isNaN(time) || !isFinite(time)) return null;
  return Math.round(time);
}

/**
 * Calculate distance (meters) from time and pace
 */
export function calculateDistanceFromTimeAndPace(
  durationSeconds: number | null,
  paceSecondsPerKm: number | null,
): number | null {
  if (
    !durationSeconds ||
    !paceSecondsPerKm ||
    durationSeconds <= 0 ||
    paceSecondsPerKm <= 0
  ) {
    return null;
  }
  const km = durationSeconds / paceSecondsPerKm;
  if (km <= 0 || isNaN(km) || !isFinite(km)) return null;
  return Math.round(km * 1000);
}

/**
 * Parse pace input (e.g., "5:30" or "5'30") to seconds per km
 */
export function parsePaceInput(paceInput: string): number | null {
  if (!paceInput || paceInput.trim() === "") return null;

  // Remove spaces and normalize separators
  const normalized = paceInput.replace(/\s/g, "").replace(/'/g, ":");

  // Try MM:SS format
  const match = normalized.match(/^(\d+):(\d{1,2})$/);
  if (match) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    if (
      !isNaN(minutes) &&
      !isNaN(seconds) &&
      minutes >= 0 &&
      seconds >= 0 &&
      seconds < 60
    ) {
      const totalSeconds = minutes * 60 + seconds;
      return totalSeconds > 0 ? totalSeconds : null;
    }
  }

  // Try just minutes (e.g., "5" means 5:00)
  const minutesOnly = parseInt(normalized, 10);
  if (!isNaN(minutesOnly) && minutesOnly > 0) {
    return minutesOnly * 60;
  }

  return null;
}

/**
 * Compute pace in seconds per km from distance (meters) and time (seconds)
 * Returns null if either value is invalid
 * @deprecated Use calculatePaceSecondsPerKmSafe instead
 */
export function computePaceFromDistanceAndTime(
  distanceMeters: number | null,
  timeSeconds: number | null,
): number | null {
  return calculatePaceSecondsPerKmSafe({
    distanceMeters,
    durationSeconds: timeSeconds,
  });
}

/**
 * Format pace from seconds per km to "X'YY/km" format
 */
export function formatPace(secondsPerKm: number | null): string {
  if (secondsPerKm === null || secondsPerKm <= 0) {
    return "—";
  }
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;
  return `${minutes}'${seconds.toString().padStart(2, "0")}/km`;
}

/**
 * Format time from seconds to "MM:SS" or "H:MM:SS" format
 */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Format distance from meters to readable string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  const km = meters / 1000;
  // Show 1 decimal if not whole number
  if (km % 1 === 0) {
    return `${km} km`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Format duration from seconds to readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  if (minutes > 0) {
    return secs > 0 ? `${minutes}min ${secs}s` : `${minutes}min`;
  }
  return `${secs}s`;
}

/**
 * Format duration label in canonical format:
 * - If hours > 0: H:MM:SS format (e.g. "1:05:00", "2:30:15")
 * - If hours === 0: M:SS format where M has no leading zero (e.g. "5:00", "1:03")
 * Used for test labels, not general duration display
 */
export function formatDurationLabel(durationSeconds: number): string {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  if (hours > 0) {
    // If hours > 0: label = H:MM:SS where MM and SS are 2-digit padded
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${hours}:${mm}:${ss}`;
  } else {
    // If hours === 0: label = M:SS where M is minutes WITHOUT leading zero, SS is 2-digit padded
    const ss = String(seconds).padStart(2, "0");
    return `${minutes}:${ss}`;
  }
}

/**
 * Format distance label in canonical format (e.g. "200 m", "1 km", "3 km")
 * Used for test labels
 */
export function formatDistanceLabel(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${distanceMeters} m`;
  }
  const km = distanceMeters / 1000;
  // If divisible by 1000, show no decimals
  if (km % 1 === 0) {
    return `${km} km`;
  }
  // Otherwise show one decimal
  return `${km.toFixed(1)} km`;
}

/**
 * Parse distance input value and unit to meters
 */
export function parseDistanceInput(
  value: string,
  unit: "m" | "km",
): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const numValue = parseFloat(trimmed);
  if (isNaN(numValue) || numValue <= 0) return null;

  if (unit === "km") {
    return Math.round(numValue * 1000);
  }
  return Math.round(numValue);
}

/**
 * Format date as "24 nov" or "24 nov 2025" for list display
 * Shows year only if different from current year
 * Accepts Date object, ISO string, or null/undefined
 */
export function formatDateForList(
  date: string | Date | null | undefined,
): string {
  if (!date) {
    return "À définir";
  }

  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return "À définir";
  }

  const day = d.getDate();
  const monthIndex = d.getMonth();
  const year = d.getFullYear();
  const currentYear = new Date().getFullYear();

  if (
    isNaN(day) ||
    isNaN(monthIndex) ||
    isNaN(year) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return "À définir";
  }

  const shortMonths = [
    "jan",
    "fév",
    "mar",
    "avr",
    "mai",
    "jun",
    "jul",
    "aoû",
    "sep",
    "oct",
    "nov",
    "déc",
  ];
  const monthLabel = shortMonths[monthIndex];

  // Show year only if different from current year
  if (year !== currentYear) {
    return `${day} ${monthLabel} ${year}`;
  }
  return `${day} ${monthLabel}`;
}

/**
 * Format date as DD/MM/YYYY for input fields
 */
export function formatDateForInput(dateISO: string | null | undefined): string {
  if (!dateISO) return "";

  try {
    const date = new Date(dateISO);
    if (isNaN(date.getTime())) {
      return "";
    }

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return "";
    }

    return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
  } catch {
    return "";
  }
}

/**
 * Parse DD/MM/YYYY or YYYY-MM-DD to YYYY-MM-DD
 */
export function parseDateInput(input: string): string | null {
  const cleaned = input.trim();
  if (!cleaned) return null;

  // Try YYYY-MM-DD format first
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return cleaned;
    }
  }

  // Try DD/MM/YYYY format
  const ddmmyyyyMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  return null;
}

/**
 * Infer test mode from label
 * 'time_over_distance' = time over a fixed distance (e.g. 200m, 5km)
 * 'distance_over_time' = distance in a fixed time (e.g. 1min, 5min)
 */
export function inferTestMode(
  label: string,
  kind?: "distance" | "duration",
): "time_over_distance" | "distance_over_time" {
  const lower = label.toLowerCase();

  // If kind is provided, use it as a hint
  if (kind === "distance") {
    return "time_over_distance";
  }
  if (kind === "duration") {
    return "distance_over_time";
  }

  // Infer from label content
  if (
    lower.includes("min") ||
    lower.includes("sec") ||
    lower.includes("minute") ||
    lower.includes("seconde")
  ) {
    return "distance_over_time";
  }
  if (lower.match(/\d+\s*(m|km|meter|kilometer)/)) {
    return "time_over_distance";
  }

  // Default fallback
  return "time_over_distance";
}

/**
 * Format test label dynamically based on actual tested values
 * Uses canonical format: M:SS for duration, "X m" or "X km" for distance
 */
export function formatTestLabel(
  test: {
    mode?: "time_over_distance" | "distance_over_time" | null;
    distanceMeters: number | null;
    durationSeconds: number | null;
  },
  fallbackLabel: string,
): string {
  // Use mode to determine label type
  // time_over_distance = distance PR (fixed distance, measure time)
  // distance_over_time = duration PR (fixed time, measure distance)

  if (test.mode === "time_over_distance" && test.distanceMeters != null) {
    // Distance PR: use distance label
    return formatDistanceLabel(test.distanceMeters);
  }

  if (test.mode === "distance_over_time" && test.durationSeconds != null) {
    // Duration PR: use duration label
    return formatDurationLabel(test.durationSeconds);
  }

  // Fallback: use available data
  if (test.durationSeconds != null && test.mode === "distance_over_time") {
    return formatDurationLabel(test.durationSeconds);
  }

  if (test.distanceMeters != null && test.mode === "time_over_distance") {
    return formatDistanceLabel(test.distanceMeters);
  }

  // Last resort: legacy label
  return fallbackLabel;
}

/**
 * Format date for display in date picker (e.g. "10 jan 2025")
 */
export function formatDateForDisplay(
  dateISO: string | null | undefined,
): string {
  if (!dateISO) return "";

  try {
    const date = new Date(dateISO);
    if (isNaN(date.getTime())) {
      return "";
    }

    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();

    if (isNaN(day) || isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      return "";
    }

    const monthNames = [
      "jan",
      "fév",
      "mar",
      "avr",
      "mai",
      "jun",
      "jul",
      "aoû",
      "sep",
      "oct",
      "nov",
      "déc",
    ];
    const month = monthNames[monthIndex];

    return `${day} ${month} ${year}`;
  } catch {
    return "";
  }
}

/**
 * Generate a test label from the test record
 * Uses canonical format: M:SS for duration, "X m" or "X km" for distance
 */
export function generateTestLabel(test: TestRecord): string {
  if (test.durationSeconds != null) {
    return formatDurationLabel(test.durationSeconds);
  }
  if (test.distanceMeters != null) {
    return formatDistanceLabel(test.distanceMeters);
  }
  return test.label || "Test";
}
