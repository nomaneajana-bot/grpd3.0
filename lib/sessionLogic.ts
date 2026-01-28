// Session business logic - filtering, sorting, and matching

import {
    getSessionDateForSort as getSessionDateForSortHelper,
    isDateInRange,
    isFutureDate,
} from "./dateHelpers";
import type { ReferencePaces } from "./profileStore";
import { mapTypeLabelToRunTypeId, type RunTypeId } from "./runTypes";
import type { SessionData } from "./sessionData";

export type FilterState = {
  date?: "today" | "thisWeek" | "thisMonth" | "custom";
  customDateRange?: {
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
  };
  type?: RunTypeId | null;
  paceRange?: {
    minSecondsPerKm: number;
    maxSecondsPerKm: number;
  } | null;
  spot?: string | null;
  genderRestriction?: "women_only" | null; // Filter for girls-only runs
  walkingOnly?: boolean; // Filter for walking sessions only
};

/**
 * Check if pace ranges overlap
 */
function paceRangesOverlap(
  groupMin: number,
  groupMax: number,
  filterMin: number,
  filterMax: number,
): boolean {
  return groupMin <= filterMax && groupMax >= filterMin;
}

/**
 * Check if session matches date filter
 */
export function matchesDateFilter(
  session: SessionData,
  dateFilter?: "today" | "thisWeek" | "thisMonth" | "custom",
  customDateRange?: { startDate: string; endDate: string },
): boolean {
  if (!dateFilter) return true;

  // Use dateISO if available, otherwise fallback to true (legacy behavior)
  if (session.dateISO) {
    if (dateFilter === "custom" && customDateRange) {
      // Check if date is within custom range
      const sessionDate = new Date(session.dateISO);
      const startDate = new Date(customDateRange.startDate);
      const endDate = new Date(customDateRange.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate >= startDate && sessionDate <= endDate;
    }
    return isDateInRange(session.dateISO, dateFilter);
  }

  // Legacy: if no dateISO, assume it matches (will be migrated on next load)
  return true;
}

/**
 * Check if session matches type filter
 */
export function matchesTypeFilter(
  session: SessionData,
  typeFilter: RunTypeId | null | undefined,
): boolean {
  if (typeFilter === null || typeFilter === undefined) return true;

  const sessionTypeId = getSessionRunTypeId(session);
  return sessionTypeId === typeFilter;
}

/**
 * Check if session matches pace range filter
 */
export function matchesPaceFilter(
  session: SessionData,
  paceRange:
    | { minSecondsPerKm: number; maxSecondsPerKm: number }
    | null
    | undefined,
): boolean {
  if (!paceRange) return true;

  const hasMatchingGroup = session.paceGroups.some((group) => {
    const groupPace = group.avgPaceSecondsPerKm;
    const groupMin = groupPace - 10;
    const groupMax = groupPace + 10;
    return paceRangesOverlap(
      groupMin,
      groupMax,
      paceRange.minSecondsPerKm,
      paceRange.maxSecondsPerKm,
    );
  });

  return hasMatchingGroup;
}

/**
 * Check if session matches spot filter
 */
export function matchesSpotFilter(
  session: SessionData,
  spot: string | null | undefined,
): boolean {
  if (!spot) return true;
  return session.spot === spot;
}

/**
 * Check if session matches all filters
 */
export function matchesFilters(
  session: SessionData,
  filters: FilterState,
): boolean {
  // Date filter
  if (!matchesDateFilter(session, filters.date, filters.customDateRange)) {
    return false;
  }

  // Type filter
  if (!matchesTypeFilter(session, filters.type)) {
    return false;
  }

  // Spot filter
  if (!matchesSpotFilter(session, filters.spot)) {
    return false;
  }

  // Pace range filter
  if (!matchesPaceFilter(session, filters.paceRange)) {
    return false;
  }

  // Gender restriction filter
  if (filters.genderRestriction === "women_only") {
    if (session.genderRestriction !== "women_only") {
      return false;
    }
  }

  // Walking only filter
  if (filters.walkingOnly) {
    const sessionTypeId = getSessionRunTypeId(session);
    if (sessionTypeId !== "walking") {
      return false;
    }
  }

  return true;
}

/**
 * Compute match score between session and runner's paces
 * Lower score = better match (closer to user's pace zones)
 */
export function computeMatchScore(
  session: SessionData,
  paces: ReferencePaces | null,
): number | null {
  if (!paces) return null;

  const referencePaces: number[] = [];

  if (paces.easyMin !== null && paces.easyMin !== undefined) {
    const easyRef =
      paces.easyMax !== null && paces.easyMax !== undefined
        ? (paces.easyMin + paces.easyMax) / 2
        : paces.easyMin;
    referencePaces.push(easyRef);
  }

  if (paces.tempoMin !== null && paces.tempoMin !== undefined) {
    const tempoRef =
      paces.tempoMax !== null && paces.tempoMax !== undefined
        ? (paces.tempoMin + paces.tempoMax) / 2
        : paces.tempoMin;
    referencePaces.push(tempoRef);
  }

  if (paces.thresholdMin !== null && paces.thresholdMin !== undefined) {
    const thresholdRef =
      paces.thresholdMax !== null && paces.thresholdMax !== undefined
        ? (paces.thresholdMin + paces.thresholdMax) / 2
        : paces.thresholdMin;
    referencePaces.push(thresholdRef);
  }

  if (paces.intervalsMin !== null && paces.intervalsMin !== undefined) {
    const intervalsRef =
      paces.intervalsMax !== null && paces.intervalsMax !== undefined
        ? (paces.intervalsMin + paces.intervalsMax) / 2
        : paces.intervalsMin;
    referencePaces.push(intervalsRef);
  }

  if (referencePaces.length === 0) return null;

  const groupDistances = session.paceGroups.map((group) => {
    const groupPace = group.avgPaceSecondsPerKm;
    const minDistance = Math.min(
      ...referencePaces.map((ref) => Math.abs(groupPace - ref)),
    );
    return minDistance;
  });

  return Math.min(...groupDistances);
}

/**
 * Extract date for sorting
 * Uses dateISO + timeMinutes if available, otherwise falls back to parsing dateLabel
 */
export function getSessionDateForSort(session: SessionData): number {
  return getSessionDateForSortHelper(session);
}

/**
 * Get session run type ID (from workout or typeLabel fallback)
 */
export function getSessionRunTypeId(session: SessionData): RunTypeId | null {
  // If session has workoutId, the runType should come from the workout
  // For now, fallback to typeLabel parsing
  // In Phase 2, we'll properly load workout and get runType
  return mapTypeLabelToRunTypeId(session.typeLabel);
}

/**
 * Check if session is in the future
 */
export function isFutureSession(session: SessionData): boolean {
  // Use dateISO if available
  if (session.dateISO) {
    return isFutureDate(session.dateISO);
  }

  // Legacy: if no dateISO, assume future (will be migrated on next load)
  return true;
}

/**
 * Apply filters and sorting to sessions
 * Returns filtered and sorted sessions, with best matches first
 */
export function applyFiltersAndSorting(
  allSessions: SessionData[],
  filters: FilterState,
  paces: ReferencePaces | null,
): SessionData[] {
  // Step 1: Filter to future sessions only
  let filtered = allSessions.filter(isFutureSession);

  // Step 2: Apply user filters
  filtered = filtered.filter((session) => matchesFilters(session, filters));

  // Step 3: Sort
  const withScores = filtered.map((session) => ({
    session,
    score: computeMatchScore(session, paces),
    dateSort: getSessionDateForSort(session),
  }));

  const withScoresList = withScores.filter((item) => item.score !== null);
  const withoutScoresList = withScores.filter((item) => item.score === null);

  // Sort by match score (ascending = better match first), then by date
  withScoresList.sort((a, b) => {
    if (a.score! !== b.score!) {
      return a.score! - b.score!;
    }
    return a.dateSort - b.dateSort;
  });

  // Sort by date only for sessions without match scores
  withoutScoresList.sort((a, b) => a.dateSort - b.dateSort);

  return [
    ...withScoresList.map((item) => item.session),
    ...withoutScoresList.map((item) => item.session),
  ];
}
