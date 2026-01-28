// Base unit types
export type Seconds = number;
export type Minutes = number;
export type Kilometers = number;
export type PaceSecondsPerKm = number;

// Step kinds
export type WorkoutStepKind = "warmup" | "interval" | "recovery" | "cooldown" | "easy";

// Workout step
export type WorkoutStep = {
  id: string; // unique within the workout
  kind: WorkoutStepKind;
  description: string; // human-readable (e.g. "1:30 effort", "Jog 2:00")
  durationSeconds?: Seconds; // optional, used for time-based steps
  distanceKm?: Kilometers; // optional, used for distance-based steps
  targetPaceSecondsPerKm?: PaceSecondsPerKm | null; // null if "easy" / no target
  recoveryHrBpm?: number | null; // optional heart-rate based recovery target
};

// Workout block (repeated sets)
export type WorkoutBlock = {
  id: string;
  label: string; // e.g. "Main set"
  repeatCount?: number; // e.g. 8
  steps: WorkoutStep[];
};

// Top-level workout
export type Workout = {
  id: string;
  title: string; // usually same as session title
  totalEstimatedDistanceKm?: Kilometers;
  totalEstimatedDurationSeconds?: Seconds;
  warmup?: WorkoutBlock;
  main?: WorkoutBlock;
  cooldown?: WorkoutBlock;
};

// TODO[runTypes-builder]:
//   - Revisit step sections (Échauffement / Séance principale) and simplify.
//   - Design per-type default structures for:
//       Séries, Fartlek, Progressif, Footing, Footing de relâchement, Course.
//   - Make the builder feel "smart" for each run type.

