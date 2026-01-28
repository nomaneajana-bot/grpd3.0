import type {
  Workout,
  WorkoutBlock,
  WorkoutStep,
  Kilometers,
  Seconds,
} from './workoutTypes';

/**
 * Estimates total distance and duration for a workout.
 * Returns null for values that cannot be computed.
 */
export function estimateWorkoutTotals(workout: Workout): {
  distanceKm: Kilometers | null;
  durationSeconds: Seconds | null;
} {
  let totalDistanceKm: Kilometers | null = null;
  let totalDurationSeconds: Seconds | null = null;
  let hasDistance = false;
  let hasDuration = false;

  const blocks: (WorkoutBlock | undefined)[] = [
    workout.warmup,
    workout.main,
    workout.cooldown,
  ];

  for (const block of blocks) {
    if (!block) continue;

    const repeatCount = block.repeatCount ?? 1;

    for (const step of block.steps) {
      // Calculate distance
      if (step.distanceKm !== undefined) {
        const stepDistance = step.distanceKm * repeatCount;
        totalDistanceKm = (totalDistanceKm ?? 0) + stepDistance;
        hasDistance = true;
      }

      // Calculate duration
      if (step.durationSeconds !== undefined) {
        const stepDuration = step.durationSeconds * repeatCount;
        totalDurationSeconds = (totalDurationSeconds ?? 0) + stepDuration;
        hasDuration = true;
      }
    }
  }

  return {
    distanceKm: hasDistance ? totalDistanceKm : null,
    durationSeconds: hasDuration ? totalDurationSeconds : null,
  };
}

