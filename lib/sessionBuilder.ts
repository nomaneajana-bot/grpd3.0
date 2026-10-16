// Session builder - constructs SessionData from form inputs

import {
  formatDateLabel,
  isSelectableOutingDate,
  isSelectableOutingDateTime,
  todayISO,
} from "./dateHelpers";
import type {
  PaceGroup,
  SessionData,
  SessionGroupOverride,
  SessionVisibility,
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

export type BuildSessionError = {
  code: "PAST_DATE" | "INVALID_DATE";
  message: string;
};

/**
 * Build a SessionData object from form values.
 * Prefer `dateISO` (YYYY-MM-DD). Past dates are rejected.
 */
export function buildSessionFromForm(params: {
  spot: string;
  /** @deprecated Prefer dateISO — kept for legacy test callers */
  dateLabel?: string;
  /** Real calendar date YYYY-MM-DD */
  dateISO?: string;
  timeLabel: string; // e.g. "06:00"
  sessionType: string; // e.g. "FARTLEK", "SORTIE LONGUE", "SEUIL", "MARCHE"
  groupConfigs: SessionGroupConfig[];
  workoutId?: string | null;
  visibility?: SessionVisibility;
  hostGroupName?: string | null;
  genderRestriction?: "women_only" | null;
  /** Optional explicit distance — never invent for walks */
  estimatedDistanceKm?: number | null;
  /** Optional explicit target pace label — never invent for walks */
  targetPace?: string | null;
  /** User-entered outing title (required for walk/language journeys) */
  title?: string | null;
  /** User-entered purpose / “à quoi s’attendre” — stored as coachAdvice */
  purpose?: string | null;
  /**
   * Free-text structure / déroulé for any session type (replaces FARTLEK
   * chips + associated-workout picker). When set, used as `volume`.
   */
  structureNotes?: string | null;
  /**
   * Optional spoken language label when relevant (e.g. walk + language).
   * Never invent a default language (no mandatory English).
   */
  language?: string | null;
}): { id: string; session: SessionData; defaultGroupId: string } {
  const { spot, timeLabel, sessionType, groupConfigs, workoutId } = params;
  const visibility = params.visibility ?? "public";
  const hostGroupName = params.hostGroupName ?? null;
  const genderRestriction = params.genderRestriction ?? null;

  const id = "custom-" + Date.now().toString();
  const language = params.language?.trim() || "";
  const purpose = params.purpose?.trim() || "";
  const userTitle = params.title?.trim() || "";
  const title = userTitle || sessionType.toUpperCase();

  const timeMatch = timeLabel.match(/(\d{2}):(\d{2})/);
  const hour = timeMatch ? parseInt(timeMatch[1], 10) : 6;
  const minute = timeMatch ? parseInt(timeMatch[2], 10) : 0;
  const timeMinutes = hour * 60 + minute;

  let dateISO = params.dateISO?.trim() || "";
  if (!dateISO && params.dateLabel) {
    // Legacy path: parse day number from "LUNDI 10" style — only for tests/old data
    const now = new Date();
    const dayMatch = params.dateLabel.match(/\b(\d{1,2})\b/);
    const day = dayMatch ? parseInt(dayMatch[1], 10) : now.getDate();
    const month = now.getMonth();
    let year = now.getFullYear();
    const sessionDate = new Date(year, month, day, hour, minute, 0, 0);
    if (sessionDate < now) {
      year = now.getFullYear() + 1;
      sessionDate.setFullYear(year);
    }
    dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  if (!dateISO) {
    dateISO = todayISO();
  }

  if (!isSelectableOutingDate(dateISO)) {
    throw new Error("PAST_DATE: La date doit être aujourd'hui ou dans le futur.");
  }
  if (!isSelectableOutingDateTime(dateISO, timeMinutes)) {
    throw new Error(
      "PAST_DATE: Choisis une date et une heure encore à venir.",
    );
  }

  const [y, m, d] = dateISO.split("-").map((n) => parseInt(n, 10));
  const sessionDate = new Date(y, m - 1, d, hour, minute, 0, 0);
  const fullDateLabel = formatDateLabel(sessionDate, timeMinutes);

  const isWalk =
    sessionType.includes("MARCHE") || sessionType.includes("WALKING");
  const isCasual =
    isWalk ||
    sessionType.includes("COURSE LIBRE") ||
    sessionType.includes("LIBRE") ||
    sessionType.includes("DÉCOUVERTE");

  // Language is optional and only applied when the creator filled it (no English default).
  const typeLabel =
    isWalk && language
      ? "LANGUES · MARCHE"
      : sessionType.toUpperCase();

  const structureNotes = params.structureNotes?.trim() || "";
  let volume = "Séance personnalisée";
  if (structureNotes) {
    volume = structureNotes;
  } else if (sessionType.includes("STRUCTUR")) {
    volume = "Workout structuré";
  } else if (sessionType.includes("FARTLEK")) {
    volume = "Fartlek personnalisé";
  } else if (sessionType.includes("SEUIL")) {
    volume = "Séance seuil personnalisée";
  } else if (sessionType.includes("SORTIE")) {
    volume = "Sortie longue personnalisée";
  } else if (sessionType.includes("COURSE LIBRE") || sessionType.includes("LIBRE")) {
    volume = "Course libre - chacun à son rythme";
  } else if (sessionType.includes("DÉCOUVERTE")) {
    volume = "Sortie découverte - exploration en groupe";
  } else if (isWalk && language) {
    volume = language;
  } else if (isWalk) {
    volume = "Marche en groupe - accessible à tous";
  }

  const paceGroups: PaceGroup[] = groupConfigs
    .filter((g) => g.isActive && g.paceSecondsPerKm !== null)
    .map((g) => {
      const avgPaceSecondsPerKm = g.paceSecondsPerKm!;
      return {
        id: g.id,
        label: `Groupe ${g.id}`,
        paceRange: formatPaceLabel(avgPaceSecondsPerKm),
        runnersCount: 1,
        avgPaceSecondsPerKm,
      };
    });

  let defaultGroupId: "A" | "B" | "C" | "D" = "C";
  const groupC = groupConfigs.find((g) => g.id === "C");
  const groupB = groupConfigs.find((g) => g.id === "B");
  const groupA = groupConfigs.find((g) => g.id === "A");
  const groupD = groupConfigs.find((g) => g.id === "D");
  if (groupC?.isActive) defaultGroupId = "C";
  else if (groupB?.isActive) defaultGroupId = "B";
  else if (groupA?.isActive) defaultGroupId = "A";
  else if (groupD?.isActive) defaultGroupId = "D";

  if (paceGroups.length === 0 && groupConfigs.length > 0) {
    const firstGroup = groupConfigs.find(
      (g) => g.isActive && g.paceSecondsPerKm !== null,
    );
    if (firstGroup && firstGroup.paceSecondsPerKm !== null) {
      paceGroups.push({
        id: firstGroup.id,
        label: `Groupe ${firstGroup.id}`,
        paceRange: formatPaceRange(firstGroup.paceSecondsPerKm),
        runnersCount: 1,
        avgPaceSecondsPerKm: firstGroup.paceSecondsPerKm,
      });
      defaultGroupId = firstGroup.id;
    }
  }

  // Never invent pace/distance for walks or casual modes without groups
  let targetPace =
    params.targetPace?.trim() ||
    (paceGroups.length > 0
      ? formatPaceLabel(paceGroups[0].avgPaceSecondsPerKm)
      : "");
  if (!targetPace && !isCasual) {
    targetPace = "Allure libre";
  }
  if (!targetPace) {
    targetPace = "Allure libre";
  }

  let estimatedDistanceKm = params.estimatedDistanceKm ?? null;
  if (estimatedDistanceKm == null) {
    if (isWalk || isCasual) {
      estimatedDistanceKm = 0; // unknown — do not invent 10 km
    } else if (sessionType.includes("SORTIE")) {
      estimatedDistanceKm = 12;
    } else if (sessionType.includes("SEUIL")) {
      estimatedDistanceKm = 8;
    } else if (paceGroups.length > 0) {
      estimatedDistanceKm = 10;
    } else {
      estimatedDistanceKm = 0;
    }
  }

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

  const session: SessionData = {
    id,
    title,
    spot,
    dateLabel: fullDateLabel,
    dateISO,
    timeMinutes,
    typeLabel,
    volume,
    targetPace,
    estimatedDistanceKm,
    paceGroups,
    // Walks without pace groups: no invented recommended group
    recommendedGroupId: paceGroups.length > 0 ? defaultGroupId : "",
    isCustom: true,
    workoutId: workoutId ?? null,
    paceGroupsOverride:
      paceGroupsOverride.length > 0 ? paceGroupsOverride : undefined,
    visibility,
    hostGroupName,
    genderRestriction,
    coachAdvice: purpose || undefined,
    meetingPoint: spot,
    experience: isWalk
      ? {
          kind: "community",
          activity: "walk",
          format: language ? "language" : "community",
        }
      : undefined,
  };

  return {
    id,
    session,
    defaultGroupId: paceGroups.length > 0 ? defaultGroupId : "open",
  };
}
