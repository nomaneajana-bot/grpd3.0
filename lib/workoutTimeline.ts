import type { Workout, WorkoutBlock, WorkoutStep } from "./workoutTypes";

export type TimelineSegmentKind = "warmup" | "effort" | "recovery" | "cooldown";

export type TimelineSegment = {
  id: string;
  durationSeconds: number;
  kind: TimelineSegmentKind;
  paceLabel?: string;
};

const DEFAULT_EASY_PACE_SECONDS = 360;

export function estimateStepDurationSeconds(step: WorkoutStep): number {
  if (step.durationSeconds !== undefined && step.durationSeconds > 0) {
    return step.durationSeconds;
  }
  if (step.distanceKm !== undefined && step.distanceKm > 0) {
    const pace = step.targetPaceSecondsPerKm ?? DEFAULT_EASY_PACE_SECONDS;
    return Math.round(step.distanceKm * pace);
  }
  return 0;
}

function mapStepToSegmentKind(
  step: WorkoutStep,
  blockRole: "warmup" | "main" | "cooldown",
): TimelineSegmentKind {
  if (blockRole === "warmup") return "warmup";
  if (blockRole === "cooldown") return "cooldown";
  if (step.kind === "recovery") return "recovery";
  if (step.kind === "interval") return "effort";
  if (step.kind === "cooldown") return "cooldown";
  if (step.kind === "warmup") return "warmup";
  return "effort";
}

function formatPaceShort(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const secs = secondsPerKm % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function appendBlockSegments(
  segments: TimelineSegment[],
  block: WorkoutBlock | undefined,
  blockRole: "warmup" | "main" | "cooldown",
): void {
  if (!block?.steps.length) return;

  const repeat = blockRole === "main" ? (block.repeatCount ?? 1) : 1;

  for (let rep = 0; rep < repeat; rep += 1) {
    block.steps.forEach((step, index) => {
      const durationSeconds = estimateStepDurationSeconds(step);
      if (durationSeconds <= 0) return;

      const kind = mapStepToSegmentKind(step, blockRole);
      segments.push({
        id: `${block.id}-${step.id}-r${rep}-i${index}`,
        durationSeconds,
        kind,
        paceLabel:
          kind === "effort" && step.targetPaceSecondsPerKm
            ? formatPaceShort(step.targetPaceSecondsPerKm)
            : undefined,
      });
    });
  }
}

export function buildTimelineSegments(workout: Workout): TimelineSegment[] {
  const segments: TimelineSegment[] = [];
  appendBlockSegments(segments, workout.warmup, "warmup");
  appendBlockSegments(segments, workout.main, "main");
  appendBlockSegments(segments, workout.cooldown, "cooldown");
  return segments;
}

export function getTimelineTotalSeconds(segments: TimelineSegment[]): number {
  return segments.reduce((sum, s) => sum + s.durationSeconds, 0);
}

export function formatTimelineClock(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function formatTimelineAxis(totalSeconds: number): [string, string, string] {
  if (totalSeconds <= 0) {
    return ["0:00", "—", "—"];
  }
  const mid = Math.round(totalSeconds / 2);
  return ["0:00", formatTimelineClock(mid), formatTimelineClock(totalSeconds)];
}

export function getBlockDurationSeconds(block: WorkoutBlock | undefined): number {
  if (!block?.steps.length) return 0;
  const repeat = block.repeatCount ?? 1;
  const perRound = block.steps.reduce(
    (sum, step) => sum + estimateStepDurationSeconds(step),
    0,
  );
  return perRound * repeat;
}
