// Unified run types module - single source of truth for run type definitions

export type RunTypeId =
  | "easy_run"
  | "recovery_run"
  | "tempo_run"
  | "threshold_run"
  | "interval_400m"
  | "interval_800m"
  | "interval_1000m"
  | "interval_1600m"
  | "fartlek"
  | "long_run"
  | "hill_repeats"
  | "track_workout"
  | "progressif";

export const RUN_TYPE_OPTIONS: Array<{ id: RunTypeId; label: string }> = [
  { id: "easy_run", label: "Footing facile" },
  { id: "recovery_run", label: "Récupération" },
  { id: "tempo_run", label: "Tempo" },
  { id: "threshold_run", label: "Seuil" },
  { id: "interval_400m", label: "Séries 400m" },
  { id: "interval_800m", label: "Séries 800m" },
  { id: "interval_1000m", label: "Séries 1000m" },
  { id: "interval_1600m", label: "Séries 1600m" },
  { id: "fartlek", label: "Fartlek" },
  { id: "long_run", label: "Sortie longue" },
  { id: "hill_repeats", label: "Côtes" },
  { id: "track_workout", label: "Piste" },
  { id: "progressif", label: "Progressif" },
] as const;

/**
 * Get human-readable label for a run type
 */
export function getRunTypeLabel(runType: RunTypeId): string {
  const option = RUN_TYPE_OPTIONS.find((opt) => opt.id === runType);
  return option?.label || "Footing facile";
}

/**
 * Get uppercase pill label for run type (used in UI badges)
 */
export function getRunTypePillLabel(runType: RunTypeId): string {
  const labelMap: Record<RunTypeId, string> = {
    easy_run: "FOOTING",
    recovery_run: "RÉCUP",
    tempo_run: "TEMPO",
    threshold_run: "SEUIL",
    interval_400m: "400M",
    interval_800m: "800M",
    interval_1000m: "1000M",
    interval_1600m: "MILE",
    fartlek: "FARTLEK",
    long_run: "LONGUE",
    hill_repeats: "CÔTES",
    track_workout: "PISTE",
    progressif: "PROGRESSIF",
  };

  return labelMap[runType] || "FOOTING";
}

/**
 * Map a session's typeLabel string to a RunTypeId
 * Used as fallback when session doesn't have a workoutId
 */
export function mapTypeLabelToRunTypeId(
  typeLabel: string | null | undefined,
): RunTypeId | null {
  if (!typeLabel) return null;

  const normalized = typeLabel.toLowerCase().trim();

  // Professional types - recognize both English and French terms
  if (
    normalized.includes("easy run") ||
    normalized.includes("easy") ||
    normalized.includes("footing facile") ||
    normalized.includes("footing")
  )
    return "easy_run";
  if (
    normalized.includes("recovery run") ||
    normalized.includes("recovery") ||
    normalized.includes("récupération") ||
    normalized.includes("récup")
  )
    return "recovery_run";
  if (normalized.includes("tempo run") || normalized.includes("tempo"))
    return "tempo_run";
  if (
    normalized.includes("threshold run") ||
    normalized.includes("threshold") ||
    normalized.includes("seuil")
  )
    return "threshold_run";
  if (
    normalized.includes("interval 400") ||
    normalized.includes("400m") ||
    normalized.includes("série 400") ||
    normalized.includes("séries 400")
  )
    return "interval_400m";
  if (
    normalized.includes("interval 800") ||
    normalized.includes("800m") ||
    normalized.includes("série 800") ||
    normalized.includes("séries 800")
  )
    return "interval_800m";
  if (
    normalized.includes("interval 1000") ||
    normalized.includes("1000m") ||
    normalized.includes("1km") ||
    normalized.includes("série 1000") ||
    normalized.includes("séries 1000")
  )
    return "interval_1000m";
  if (
    normalized.includes("interval 1600") ||
    normalized.includes("1600m") ||
    normalized.includes("mile") ||
    normalized.includes("série 1600") ||
    normalized.includes("séries 1600")
  )
    return "interval_1600m";
  if (
    normalized.includes("long run") ||
    normalized.includes("long") ||
    normalized.includes("sortie longue") ||
    normalized.includes("longue")
  )
    return "long_run";
  if (
    normalized.includes("hill repeat") ||
    normalized.includes("côte") ||
    normalized.includes("côtes") ||
    normalized.includes("hills")
  )
    return "hill_repeats";
  if (
    normalized.includes("track workout") ||
    normalized.includes("track") ||
    normalized.includes("piste")
  )
    return "track_workout";
  if (normalized.includes("fartlek")) return "fartlek";
  if (normalized.includes("progressif")) return "progressif";

  return null;
}
