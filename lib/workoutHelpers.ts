// Helper functions for workout display and formatting

import type { ReferencePaces } from "./profileStore";
import {
  getRunTypePillLabel as getRunTypePillLabelFromRunTypes,
  type RunTypeId as RunTypeIdFromRunTypes,
} from "./runTypes";
import type { RunTypeId, WorkoutEntity } from "./workoutStore";
import type { WorkoutBlock } from "./workoutTypes";

// Format pace from seconds per km (e.g. 310 -> "5'10/km")
function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;
  return `${minutes}'${seconds.toString().padStart(2, "0")}/km`;
}

// Format distance in km (e.g. 10.5 -> "10,5 km", 8 -> "8 km")
export function formatDistanceKm(km: number): string {
  // Use comma as decimal separator (French format)
  const formatted =
    km % 1 === 0 ? km.toString() : km.toFixed(1).replace(".", ",");
  return `${formatted} km`;
}

// Calculate total distance from workout steps
export function getWorkoutTotalDistanceKm(
  workout: WorkoutEntity["workout"],
): number | null {
  let totalKm = 0;

  const calculateBlockDistance = (block: WorkoutBlock | undefined): number => {
    if (!block) return 0;
    let blockKm = 0;
    block.steps.forEach((step) => {
      if (step.distanceKm) {
        blockKm += step.distanceKm;
      }
    });
    return blockKm * (block.repeatCount || 1);
  };

  totalKm += calculateBlockDistance(workout.warmup);
  totalKm += calculateBlockDistance(workout.main);
  totalKm += calculateBlockDistance(workout.cooldown);

  return totalKm > 0 ? totalKm : null;
}

// Generate workout summary string
export function getWorkoutSummary(workout: WorkoutEntity): string {
  const runType = workout.runType;
  const mainBlock = workout.workout.main;
  const mainSteps = mainBlock?.steps ?? [];

  if (runType === "fartlek") {
    if (mainBlock && mainSteps.length >= 2) {
      const intervalStep = mainSteps.find((s) => s.kind === "interval");
      const recoveryStep = mainSteps.find((s) => s.kind === "recovery");
      const repeatCount = mainBlock.repeatCount || 1;

      if (intervalStep?.durationSeconds && recoveryStep?.durationSeconds) {
        const intervalMin = Math.floor(intervalStep.durationSeconds / 60);
        const intervalSec = intervalStep.durationSeconds % 60;
        const recoveryMin = Math.floor(recoveryStep.durationSeconds / 60);
        const recoverySec = recoveryStep.durationSeconds % 60;

        const intervalStr =
          intervalSec > 0
            ? `${intervalMin}:${intervalSec.toString().padStart(2, "0")}`
            : `${intervalMin}:00`;
        const recoveryStr =
          recoverySec > 0
            ? `${recoveryMin}:${recoverySec.toString().padStart(2, "0")}`
            : `${recoveryMin}:00`;

        return `effort ${intervalStr} / récup ${recoveryStr} × ${repeatCount}`;
      }
    }
    return "Fartlek";
  }

  // Interval types (400m, 800m, 1000m, 1600m)
  if (
    (runType as string) === "interval_400m" ||
    (runType as string) === "interval_800m" ||
    (runType as string) === "interval_1000m" ||
    (runType as string) === "interval_1600m"
  ) {
    if (mainBlock && mainSteps.length > 0) {
      const intervalStep = mainSteps.find((s) => s.kind === "interval");
      const repeatCount = mainBlock.repeatCount || 1;

      if (intervalStep?.distanceKm) {
        const distance = intervalStep.distanceKm;
        const unit =
          distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance} km`;
        return `${repeatCount} × ${unit}`;
      } else if (intervalStep?.durationSeconds) {
        const min = Math.floor(intervalStep.durationSeconds / 60);
        const sec = intervalStep.durationSeconds % 60;
        const timeStr =
          sec > 0 ? `${min}:${sec.toString().padStart(2, "0")}` : `${min}:00`;
        return `${repeatCount} × ${timeStr}`;
      }
    }
    const distanceMap: Record<string, string> = {
      interval_400m: "Séries 400m",
      interval_800m: "Séries 800m",
      interval_1000m: "Séries 1000m",
      interval_1600m: "Séries 1600m",
    };
    return distanceMap[runType as string] || "Séries";
  }

  if (runType === "progressif") {
    if (mainSteps.length > 0) {
      const firstPace = mainSteps[0].targetPaceSecondsPerKm;
      const lastPace = mainSteps[mainSteps.length - 1]?.targetPaceSecondsPerKm;

      if (firstPace && lastPace) {
        return `${formatPace(firstPace)} → ${formatPace(lastPace)}`;
      }
    }
    return "Progressif";
  }

  if (
    (runType as string) === "easy_run" ||
    (runType as string) === "recovery_run" ||
    (runType as string) === "long_run"
  ) {
    const step = mainSteps[0];
    if (step) {
      const parts: string[] = [];

      if (step.distanceKm) {
        parts.push(`${step.distanceKm} km`);
      } else if (step.durationSeconds) {
        const minutes = Math.round(step.durationSeconds / 60);
        parts.push(`${minutes}'`);
      }

      if (step.targetPaceSecondsPerKm) {
        parts.push(`à ${formatPace(step.targetPaceSecondsPerKm)}`);
      }

      const labelMap: Record<string, string> = {
        easy_run: "Footing facile",
        recovery_run: "Récupération",
        long_run: "Sortie longue",
      };
      return parts.length > 0
        ? parts.join(" ")
        : labelMap[runType] || "Footing facile";
    }
    const labelMap: Record<string, string> = {
      easy_run: "Footing facile",
      recovery_run: "Récupération",
      long_run: "Sortie longue",
    };
    return labelMap[runType as string] || "Footing facile";
  }

  if ((runType as string) === "tempo_run" || (runType as string) === "threshold_run") {
    return (runType as string) === "tempo_run" ? "Tempo" : "Seuil";
  }

  if ((runType as string) === "hill_repeats") {
    return "Côtes";
  }

  if ((runType as string) === "track_workout") {
    return "Piste";
  }

  return "Workout personnalisé";
}

// Format last used timestamp
export function formatLastUsed(lastUsedAt?: number): string {
  if (!lastUsedAt) {
    return "jamais";
  }

  const now = Date.now();
  const diffMs = now - lastUsedAt;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "aujourd'hui";
  } else if (diffDays === 1) {
    return "hier";
  } else {
    return `il y a ${diffDays} jours`;
  }
}

// Get run type pill label (uppercase)
// Re-export from runTypes.ts for backward compatibility
export function getRunTypePillLabel(runType: RunTypeId): string {
  return getRunTypePillLabelFromRunTypes(runType as RunTypeIdFromRunTypes);
}

// Compute base workout pace in seconds per km
export function getWorkoutBasePaceSeconds(
  workout: WorkoutEntity,
  referencePaces?: ReferencePaces | null,
): number | null {
  const runType = workout.runType;
  const mainBlock = workout.workout.main;
  const mainSteps = mainBlock?.steps ?? [];

  // Easy Run, Recovery Run, Long Run, Casual Run, Discovery Run: use first step's pace or reference easyMin
  if (
    (runType as string) === "easy_run" ||
    (runType as string) === "recovery_run" ||
    (runType as string) === "long_run" ||
    (runType as string) === "casual_run" ||
    (runType as string) === "discovery_run"
  ) {
    const firstStepPace = mainSteps[0]?.targetPaceSecondsPerKm;
    if (firstStepPace !== undefined && firstStepPace !== null) {
      return firstStepPace;
    }
    // Fallback to reference paces
    if (
      referencePaces?.easyMin !== undefined &&
      referencePaces.easyMin !== null
    ) {
      return referencePaces.easyMin;
    }
    return null;
  }

  // Progressif: use midpoint between slowest and fastest
  if (runType === "progressif") {
    const paces = mainSteps
      .map((s) => s.targetPaceSecondsPerKm)
      .filter((p): p is number => p !== undefined && p !== null);

    if (paces.length === 0) {
      return null;
    }

    const slowest = Math.max(...paces);
    const fastest = Math.min(...paces);
    return Math.round((slowest + fastest) / 2);
  }

  // Walking: use first step's pace or a very slow default (8:00/km = 480s/km)
  if ((runType as string) === "walking") {
    const firstStepPace = mainSteps[0]?.targetPaceSecondsPerKm;
    if (firstStepPace !== undefined && firstStepPace !== null) {
      return firstStepPace;
    }
    // Default walking pace: 8:00/km (480 seconds per km)
    return 480;
  }

  // Intervals, Fartlek, Tempo, Threshold, Track: use median of all non-null paces
  const paces = mainSteps
    .map((s) => s.targetPaceSecondsPerKm)
    .filter((p): p is number => p !== undefined && p !== null);

  if (paces.length === 0) {
    return null;
  }

  // Calculate median
  const sorted = [...paces].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

// Get interval defaults from workout (for fartlek and series)
export function getWorkoutIntervalDefaults(workout: WorkoutEntity): {
  reps: number | null;
  effortDurationSeconds: number | null;
  effortDistanceKm: number | null;
  recoveryDurationSeconds: number | null;
} {
  const mainBlock = workout.workout.main;
  const mainSteps = mainBlock?.steps ?? [];
  const repeatCount = mainBlock?.repeatCount ?? 1;

  // Only for fartlek and series
  const rt = workout.runType as string;
  if (
    workout.runType !== "fartlek" &&
    rt !== "interval_400m" &&
    rt !== "interval_800m" &&
    rt !== "interval_1000m" &&
    rt !== "interval_1600m"
  ) {
    return {
      reps: null,
      effortDurationSeconds: null,
      effortDistanceKm: null,
      recoveryDurationSeconds: null,
    };
  }

  // Find effort and recovery steps
  const effortSteps = mainSteps.filter((s) => s.kind === "interval");
  const recoverySteps = mainSteps.filter((s) => s.kind === "recovery");

  // Calculate reps: number of effort steps * repeat count
  const reps = effortSteps.length > 0 ? effortSteps.length * repeatCount : null;

  // Get effort duration: median or first non-null duration
  let effortDurationSeconds: number | null = null;
  let effortDistanceKm: number | null = null;
  if (effortSteps.length > 0) {
    const durations = effortSteps
      .map((s) => s.durationSeconds)
      .filter((d): d is number => d !== undefined && d !== null);
    if (durations.length > 0) {
      const sorted = [...durations].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      effortDurationSeconds =
        sorted.length % 2 === 0
          ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
          : sorted[mid];
    }

    // Get effort distance: median or first non-null distance
    const distances = effortSteps
      .map((s) => s.distanceKm)
      .filter((d): d is number => d !== undefined && d !== null);
    if (distances.length > 0) {
      const sorted = [...distances].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      effortDistanceKm =
        sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];
    }
  }

  // Get recovery duration: median or first non-null duration
  let recoveryDurationSeconds: number | null = null;
  if (recoverySteps.length > 0) {
    const durations = recoverySteps
      .map((s) => s.durationSeconds)
      .filter((d): d is number => d !== undefined && d !== null);
    if (durations.length > 0) {
      const sorted = [...durations].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      recoveryDurationSeconds =
        sorted.length % 2 === 0
          ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
          : sorted[mid];
    }
  }

  return {
    reps,
    effortDurationSeconds,
    effortDistanceKm,
    recoveryDurationSeconds,
  };
}
