import type { Workout } from "./workoutTypes";
import {
  buildTimelineSegments,
  estimateStepDurationSeconds,
  getTimelineTotalSeconds,
} from "./workoutTimeline";

const INTENSITY_BY_KIND: Record<string, number> = {
  warmup: 0.55,
  easy: 0.6,
  cooldown: 0.5,
  recovery: 0.45,
  interval: 0.95,
};

const DEFAULT_EASY_PACE = 360;

function stepIntensity(step: {
  kind: string;
  targetPaceSecondsPerKm?: number | null;
}): number {
  const base = INTENSITY_BY_KIND[step.kind] ?? 0.7;
  if (
    step.targetPaceSecondsPerKm !== undefined &&
    step.targetPaceSecondsPerKm !== null
  ) {
    const paceFactor = Math.min(
      1.2,
      Math.max(0.4, DEFAULT_EASY_PACE / step.targetPaceSecondsPerKm),
    );
    return Math.min(1, base * paceFactor);
  }
  return base;
}

/**
 * Rule-based training stress score for display (not TrainingPeaks-accurate).
 */
export function estimateTrainingStress(workout: Workout): number | null {
  const blocks = [workout.warmup, workout.main, workout.cooldown].filter(
    Boolean,
  );
  if (!blocks.length) return null;

  let weightedSeconds = 0;

  for (const block of blocks) {
    if (!block) continue;
    const repeat = block.repeatCount ?? 1;
    for (let r = 0; r < repeat; r += 1) {
      for (const step of block.steps) {
        const dur = estimateStepDurationSeconds(step);
        if (dur <= 0) continue;
        weightedSeconds += dur * stepIntensity(step);
      }
    }
  }

  if (weightedSeconds <= 0) {
    const segments = buildTimelineSegments(workout);
    const total = getTimelineTotalSeconds(segments);
    if (total <= 0) return null;
    return Math.round((total / 3600) * 70);
  }

  return Math.round((weightedSeconds / 3600) * 100);
}
