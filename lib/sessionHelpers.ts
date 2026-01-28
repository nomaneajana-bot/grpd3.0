// Helper functions for session data manipulation

import type { SessionGroupOverride } from "./sessionData";
import {
    getWorkoutBasePaceSeconds,
    getWorkoutIntervalDefaults,
} from "./workoutHelpers";
import type { WorkoutEntity } from "./workoutStore";

export type EffectiveGroupConfig = {
  repetitions: number | null;
  effortSeconds: number | null;
  effortDistanceKm: number | null;
  recoverySeconds: number | null;
  paceSecondsPerKm: number | null;
};

/**
 * Get effective group configuration for a session, applying overrides to workout defaults
 * @param workout - The workout entity (may be null if no workout is associated)
 * @param overrides - Session-level overrides array
 * @param groupId - The group ID ('A', 'B', 'C', or 'D')
 * @returns Effective configuration with overrides applied
 */
export function getEffectiveGroupConfig(
  workout: WorkoutEntity | null | undefined,
  overrides: SessionGroupOverride[] | undefined,
  groupId: "A" | "B" | "C" | "D",
): EffectiveGroupConfig {
  // Find override for this group
  const override = overrides?.find((o) => o.id === groupId && o.isActive);

  // Get workout defaults if workout exists
  let workoutReps: number | null = null;
  let workoutEffortSeconds: number | null = null;
  let workoutEffortDistanceKm: number | null = null;
  let workoutRecoverySeconds: number | null = null;
  let workoutPaceSecondsPerKm: number | null = null;

  if (workout) {
    const defaults = getWorkoutIntervalDefaults(workout);
    workoutReps = defaults.reps ?? null;
    workoutEffortSeconds = defaults.effortDurationSeconds ?? null;
    workoutEffortDistanceKm = defaults.effortDistanceKm ?? null;
    workoutRecoverySeconds = defaults.recoveryDurationSeconds ?? null;

    // For pace, we need to get the base pace for the group
    // This is typically calculated from the workout's base pace + group offset
    // For now, we'll use a simple approach: if workout has pace info, use it
    // In practice, this might need to be calculated from workout.main.steps
    const basePace = getWorkoutBasePaceSeconds(workout);
    if (basePace !== null) {
      // Group A = base, B = base + 20s, C = base + 40s, D = base + 60s
      const groupOffset = { A: 0, B: 20, C: 40, D: 60 }[groupId];
      workoutPaceSecondsPerKm = basePace + groupOffset;
    }
  }

  // Apply overrides: override value takes precedence, fall back to workout default, then null
  return {
    repetitions: override?.reps ?? workoutReps ?? null,
    effortSeconds:
      override?.effortDurationSeconds ?? workoutEffortSeconds ?? null,
    effortDistanceKm:
      override?.effortDistanceKm ?? workoutEffortDistanceKm ?? null,
    recoverySeconds:
      override?.recoveryDurationSeconds ?? workoutRecoverySeconds ?? null,
    paceSecondsPerKm:
      override?.paceSecondsPerKm ?? workoutPaceSecondsPerKm ?? null,
  };
}
