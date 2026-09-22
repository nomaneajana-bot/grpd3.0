import type { WorkoutStep } from "./workoutTypes";
import { estimateStepDurationSeconds } from "./workoutTimeline";

export type BlockRole = "warmup" | "main" | "cooldown";

export type StepCardDisplay = {
  badge: string;
  title: string;
  subtitle: string;
  rightMetric: string;
  rightMetricIsPace: boolean;
};

function formatPaceDisplay(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const secs = secondsPerKm % 60;
  return `${minutes}'${secs.toString().padStart(2, "0")} /KM`;
}

function formatDurationMetric(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const clock =
    secs > 0
      ? `${minutes}:${secs.toString().padStart(2, "0")}`
      : `${minutes}:00`;
  return `${clock} MIN`;
}

function kindTitle(step: WorkoutStep, blockRole: BlockRole): string {
  if (step.description?.trim()) {
    const desc = step.description.trim();
    if (desc.length <= 48) return desc;
    return desc.slice(0, 48);
  }

  switch (step.kind) {
    case "interval": {
      if (step.distanceKm !== undefined) {
        const meters = Math.round(step.distanceKm * 1000);
        return meters < 1000 ? `Effort ${meters} m` : `Effort ${step.distanceKm} km`;
      }
      return "Effort";
    }
    case "recovery":
      return "Récupération";
    case "cooldown":
      return "Retour au calme";
    case "easy":
      if (blockRole === "warmup") return "Footing facile";
      if (blockRole === "cooldown") return "Très facile";
      return "Footing facile";
    case "warmup":
      return "Échauffement";
    default:
      return "Étape";
  }
}

function kindSubtitle(step: WorkoutStep): string {
  const desc = step.description?.trim();
  if (desc && desc.length > 48) return desc;

  if (step.kind === "interval" && step.targetPaceSecondsPerKm) {
    return "à allure cible — vivace mais contrôlé";
  }
  if (step.kind === "recovery") {
    return "trottinement ou marche";
  }
  if (step.kind === "easy" || step.kind === "warmup") {
    return "allure libre, échauffement";
  }
  if (step.kind === "cooldown") {
    return "souffle nasal possible";
  }
  return desc || "";
}

export function getStepBadge(
  step: WorkoutStep,
  blockRole: BlockRole,
  options?: { effortIndex?: number },
): string {
  if (blockRole === "warmup") return "W";
  if (blockRole === "cooldown") return "C";
  if (step.kind === "recovery") return "R";
  if (step.kind === "interval" || step.kind === "easy") {
    return options?.effortIndex !== undefined
      ? String(options.effortIndex)
      : "1";
  }
  return "•";
}

export function getStepCardDisplay(
  step: WorkoutStep,
  blockRole: BlockRole,
  options?: { effortIndex?: number },
): StepCardDisplay {
  const title = kindTitle(step, blockRole);
  const subtitle = kindSubtitle(step);
  const duration = estimateStepDurationSeconds(step);

  let rightMetric = "";
  let rightMetricIsPace = false;

  if (
    step.kind === "interval" &&
    step.targetPaceSecondsPerKm !== undefined &&
    step.targetPaceSecondsPerKm !== null
  ) {
    rightMetric = formatPaceDisplay(step.targetPaceSecondsPerKm);
    rightMetricIsPace = true;
  } else if (duration > 0) {
    rightMetric = formatDurationMetric(duration);
  } else if (
    step.targetPaceSecondsPerKm !== undefined &&
    step.targetPaceSecondsPerKm !== null
  ) {
    rightMetric = formatPaceDisplay(step.targetPaceSecondsPerKm);
    rightMetricIsPace = true;
  } else {
    rightMetric = "—";
  }

  return {
    badge: getStepBadge(step, blockRole, options),
    title,
    subtitle,
    rightMetric,
    rightMetricIsPace,
  };
}

export function countMainEffortSteps(steps: WorkoutStep[]): number {
  return steps.filter(
    (s) => s.kind === "interval" || (s.kind === "easy" && s.distanceKm),
  ).length;
}
