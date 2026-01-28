// Storage validation schemas - validate data loaded from AsyncStorage

import type { SessionData } from './sessionData';
import type { WorkoutEntity } from './workoutStore';
import type { TestRecord } from './profileStore';
import type { JoinedSession } from './joinedSessionsStore';

/**
 * Validate SessionData structure
 * Returns validated SessionData or null if invalid
 */
export function validateSessionData(data: unknown): SessionData | null {
  if (!data || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;

  // Check required fields
  if (
    typeof obj.id !== 'string' ||
    typeof obj.title !== 'string' ||
    typeof obj.spot !== 'string' ||
    typeof obj.dateLabel !== 'string' ||
    typeof obj.typeLabel !== 'string' ||
    typeof obj.volume !== 'string' ||
    typeof obj.targetPace !== 'string' ||
    typeof obj.recommendedGroupId !== 'string' ||
    typeof obj.estimatedDistanceKm !== 'number'
  ) {
    return null;
  }

  // Validate optional dateISO if present
  if (obj.dateISO !== undefined && (typeof obj.dateISO !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(obj.dateISO))) {
    return null;
  }

  // Validate optional timeMinutes if present
  if (obj.timeMinutes !== undefined && (typeof obj.timeMinutes !== 'number' || obj.timeMinutes < 0 || obj.timeMinutes > 1439)) {
    return null;
  }

  // Validate paceGroups array
  if (!Array.isArray(obj.paceGroups)) return null;
  for (const group of obj.paceGroups) {
    if (
      typeof group !== 'object' ||
      typeof group.id !== 'string' ||
      typeof group.label !== 'string' ||
      typeof group.paceRange !== 'string' ||
      typeof group.runnersCount !== 'number' ||
      typeof group.avgPaceSecondsPerKm !== 'number'
    ) {
      return null;
    }
  }

  // Return as SessionData (TypeScript will trust our validation)
  return obj as SessionData;
}

/**
 * Validate WorkoutEntity structure
 */
export function validateWorkoutEntity(data: unknown): WorkoutEntity | null {
  if (!data || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;

  // Check required fields
  if (
    typeof obj.id !== 'string' ||
    typeof obj.name !== 'string' ||
    typeof obj.runType !== 'string' ||
    typeof obj.createdAt !== 'number' ||
    typeof obj.isCustom !== 'boolean' ||
    !obj.workout ||
    typeof obj.workout !== 'object'
  ) {
    return null;
  }

  // Validate workout structure has id and title
  const workout = obj.workout as Record<string, unknown>;
  if (typeof workout.id !== 'string' || typeof workout.title !== 'string') {
    return null;
  }

  return obj as WorkoutEntity;
}

/**
 * Validate TestRecord structure
 */
export function validateTestRecord(data: unknown): TestRecord | null {
  if (!data || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;

  // Check required fields
  if (
    typeof obj.id !== 'string' ||
    typeof obj.kind !== 'string' ||
    typeof obj.label !== 'string' ||
    (obj.kind !== 'distance' && obj.kind !== 'duration')
  ) {
    return null;
  }

  // Validate optional fields
  if (obj.distanceMeters !== null && obj.distanceMeters !== undefined && typeof obj.distanceMeters !== 'number') {
    return null;
  }

  if (obj.durationSeconds !== null && obj.durationSeconds !== undefined && typeof obj.durationSeconds !== 'number') {
    return null;
  }

  if (obj.paceSecondsPerKm !== null && obj.paceSecondsPerKm !== undefined && typeof obj.paceSecondsPerKm !== 'number') {
    return null;
  }

  if (obj.testDate !== null && obj.testDate !== undefined && typeof obj.testDate !== 'string') {
    return null;
  }

  return obj as TestRecord;
}

/**
 * Validate JoinedSession structure
 */
export function validateJoinedSession(data: unknown): JoinedSession | null {
  if (!data || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;

  if (
    typeof obj.sessionId !== 'string' ||
    typeof obj.groupId !== 'string' ||
    !['A', 'B', 'C', 'D'].includes(obj.groupId)
  ) {
    return null;
  }

  return obj as JoinedSession;
}
