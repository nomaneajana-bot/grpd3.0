// Session builder - constructs SessionData from form inputs

import { formatDateLabel } from "./dateHelpers";
import type {
    PaceGroup,
    SessionData,
    SessionGroupOverride,
} from "./sessionData";

export type SessionGroupConfig = {
  id: "A" | "B" | "C" | "D";
  isActive: boolean;
  paceSecondsPerKm: number | null;
  reps: number | null;
  effortDurationSeconds: number | null;
  effortDistanceKm: number | null;
  recoveryDurationSeconds: number | null;
};

/**
 * Format pace range from average pace (e.g. 310 -> "5'00–5'20/km")
 */
function formatPaceRange(avgSecondsPerKm: number): string {
  const minSeconds = Math.max(180, avgSecondsPerKm - 10); // Don't go below 3'00/km
  const maxSeconds = avgSecondsPerKm + 10;
  const minMinutes = Math.floor(minSeconds / 60);
  const minSecs = minSeconds % 60;
  const maxMinutes = Math.floor(maxSeconds / 60);
  const maxSecs = maxSeconds % 60;
  return `${minMinutes}'${minSecs.toString().padStart(2, "0")}–${maxMinutes}'${maxSecs.toString().padStart(2, "0")}/km`;
}

/**
 * Format pace from seconds per km (e.g. 310 -> "5'10/km")
 */
function formatPaceLabel(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;
  return `${minutes}'${seconds.toString().padStart(2, "0")}/km`;
}

// Note: formatPaceLabel is a local helper, not exported

/**
 * Build a SessionData object from form values
 */
export function buildSessionFromForm(params: {
  spot: string;
  dateLabel: string; // e.g. "LUNDI 10"
  timeLabel: string; // e.g. "06:00"
  sessionType: string; // e.g. "FARTLEK", "SORTIE LONGUE", "SEUIL"
  groupConfigs: SessionGroupConfig[];
  workoutId?: string | null;
}): { id: string; session: SessionData; defaultGroupId: string } {
  const { spot, dateLabel, timeLabel, sessionType, groupConfigs, workoutId } =
    params;

  // Generate unique ID
  const id = "custom-" + Date.now().toString();

  // Build title from session type
  const title = sessionType.toUpperCase();

  // Parse time from timeLabel (e.g. "06:00")
  const timeMatch = timeLabel.match(/(\d{2}):(\d{2})/);
  const hour = timeMatch ? parseInt(timeMatch[1], 10) : 6;
  const minute = timeMatch ? parseInt(timeMatch[2], 10) : 0;
  const timeMinutes = hour * 60 + minute;

  // Parse date from dateLabel (e.g. "LUNDI 10")
  // For now, use current date and adjust day/month based on dateLabel
  // In a full implementation, you'd parse the full date string
  const now = new Date();
  const dayMatch = dateLabel.match(/\b(\d{1,2})\b/);
  const day = dayMatch ? parseInt(dayMatch[1], 10) : now.getDate();

  // Try to extract month from French month names, otherwise use current month
  const monthMap: Record<string, number> = {
    janvier: 0,
    février: 1,
    mars: 2,
    avril: 3,
    mai: 4,
    juin: 5,
    juillet: 6,
    août: 7,
    septembre: 8,
    octobre: 9,
    novembre: 10,
    décembre: 11,
  };
  let month = now.getMonth();
  const monthMatch = dateLabel.match(
    /\b(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\b/i,
  );
  if (monthMatch) {
    month = monthMap[monthMatch[1].toLowerCase()] ?? now.getMonth();
  }

  let year = now.getFullYear();
  const sessionDate = new Date(year, month, day, hour, minute, 0, 0);

  // If date is in the past, assume next year
  if (sessionDate < now) {
    year = now.getFullYear() + 1;
    sessionDate.setFullYear(year);
  }

  // Generate dateISO (YYYY-MM-DD)
  const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // Build dateLabel by combining date and time (for display)
  const fullDateLabel = formatDateLabel(sessionDate, timeMinutes);

  // Build typeLabel (uppercase)
  const typeLabel = sessionType.toUpperCase();

  // Build volume description based on type
  let volume = "Séance personnalisée";
  if (sessionType.includes("FARTLEK")) {
    volume = "Fartlek personnalisé";
  } else if (sessionType.includes("SEUIL")) {
    volume = "Séance seuil personnalisée";
  } else if (sessionType.includes("SORTIE")) {
    volume = "Sortie longue personnalisée";
  }

  // Build pace groups from groupConfigs
  const paceGroups: PaceGroup[] = groupConfigs
    .filter((g) => g.isActive && g.paceSecondsPerKm !== null)
    .map((g) => {
      const avgPaceSecondsPerKm = g.paceSecondsPerKm!;
      const paceRange = formatPaceRange(avgPaceSecondsPerKm);

      return {
        id: g.id,
        label: `Groupe ${g.id}`,
        paceRange,
        runnersCount: 1, // User is the first member
        avgPaceSecondsPerKm,
      };
    });

  // Determine recommendedGroupId (prefer C, then B, then A, then D)
  let defaultGroupId: "A" | "B" | "C" | "D" = "C";
  const groupC = groupConfigs.find((g) => g.id === "C");
  const groupB = groupConfigs.find((g) => g.id === "B");
  const groupA = groupConfigs.find((g) => g.id === "A");
  const groupD = groupConfigs.find((g) => g.id === "D");

  if (groupC) {
    defaultGroupId = "C";
  } else if (groupB) {
    defaultGroupId = "B";
  } else if (groupA) {
    defaultGroupId = "A";
  } else if (groupD) {
    defaultGroupId = "D";
  }

  // Ensure at least one group exists (edge case: all disabled)
  if (paceGroups.length === 0 && groupConfigs.length > 0) {
    // Fallback: use first available group or create default
    const firstGroup = groupConfigs.find(
      (g) => g.isActive && g.paceSecondsPerKm !== null,
    );
    if (firstGroup && firstGroup.paceSecondsPerKm !== null) {
      const avgPaceSecondsPerKm = firstGroup.paceSecondsPerKm;
      const paceRange = formatPaceRange(avgPaceSecondsPerKm);
      paceGroups.push({
        id: firstGroup.id,
        label: `Groupe ${firstGroup.id}`,
        paceRange,
        runnersCount: 1,
        avgPaceSecondsPerKm,
      });
    }
    if (firstGroup) {
      defaultGroupId = firstGroup.id;
    }
  }

  // Build targetPace from first group's pace (or fallback)
  const targetPace =
    paceGroups.length > 0
      ? formatPaceLabel(paceGroups[0].avgPaceSecondsPerKm)
      : "5:00/km";

  // Build estimatedDistanceKm based on type
  let estimatedDistanceKm = 10; // Default for FARTLEK
  if (sessionType.includes("SORTIE")) {
    estimatedDistanceKm = 12;
  } else if (sessionType.includes("SEUIL")) {
    estimatedDistanceKm = 8;
  }

  // Build full group overrides: store complete configuration for each active group
  // Group configs are session-level overrides built on top of the workout
  const paceGroupsOverride: SessionGroupOverride[] = groupConfigs
    .filter((g) => g.isActive && g.paceSecondsPerKm != null)
    .map((g) => ({
      id: g.id,
      isActive: true,
      paceSecondsPerKm: g.paceSecondsPerKm!,
      reps: g.reps ?? null,
      effortDurationSeconds: g.effortDurationSeconds ?? null,
      effortDistanceKm: g.effortDistanceKm ?? null,
      recoveryDurationSeconds: g.recoveryDurationSeconds ?? null,
    }));

  // Build the session object
  const session: SessionData = {
    id,
    title,
    spot,
    dateLabel: fullDateLabel, // Keep for display/backward compatibility
    dateISO, // NEW: Proper date storage
    timeMinutes, // NEW: Time in minutes since midnight
    typeLabel,
    volume,
    targetPace,
    estimatedDistanceKm,
    paceGroups, // Keep for backward compatibility and display
    recommendedGroupId: defaultGroupId,
    isCustom: true, // Mark custom sessions
    workoutId: workoutId ?? null, // Reference to workout template
    paceGroupsOverride:
      paceGroupsOverride.length > 0 ? paceGroupsOverride : undefined, // Full group overrides: explicit description of each active group
    // workout is undefined for custom sessions (we use workoutId reference instead)
  };

  return { id, session, defaultGroupId };
}
