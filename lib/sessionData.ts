// Shared session data - exported from session detail screen for reuse

import { formatDateLabel } from "./dateHelpers";
import type { Workout } from "./workoutTypes";

export type PaceGroup = {
  id: string;
  label: string;
  paceRange: string;
  runnersCount: number;
  avgPaceSecondsPerKm: number;
};

// Session-level group override: full description of a group as it will be run on that day
// This is independent from the workout template - it's what actually happens on that date
export type SessionGroupOverride = {
  id: "A" | "B" | "C" | "D";
  isActive: boolean;
  paceSecondsPerKm: number | null; // The actual target pace for this group
  reps: number | null; // Number of reps for intervals
  effortDurationSeconds: number | null; // Effort duration for intervals
  effortDistanceKm: number | null; // Effort distance for intervals (alternative to duration)
  recoveryDurationSeconds: number | null; // Recovery duration for intervals
};

// Legacy type for backward compatibility (old format used groupId instead of id)
export type LegacySessionGroupOverride = {
  groupId: "A" | "B" | "C" | "D";
  repetitions?: number | null;
  effortSeconds?: number | null;
  recoverySeconds?: number | null;
  paceSecondsPerKm?: number | null;
};

export type SessionData = {
  id: string;
  title: string;
  spot: string;
  dateLabel: string; // Display string (kept for backward compatibility)
  dateISO?: string; // NEW: ISO date string (YYYY-MM-DD) for proper date handling
  timeMinutes?: number; // NEW: Minutes since midnight (0-1439) for time handling
  typeLabel: string;
  volume: string;
  targetPace: string;
  paceGroups: PaceGroup[]; // Legacy: kept for backward compatibility and display (computed from paceGroupsOverride when available)
  recommendedGroupId: string;
  estimatedDistanceKm: number;
  workout?: Workout;
  workoutId?: string | null; // Reference to a workout template (by id)
  isCustom?: boolean;
  groupOverrides?: LegacySessionGroupOverride[]; // Legacy: old format, kept for backward compatibility
  // New field: explicit per-group configuration (preferred format)
  // Each active group has its full settings stored here, independent of workout template
  //
  // RESPONSIBILITIES:
  // - Workout = generic structure (steps, blocks, runType). Template that can be reused.
  // - Session = workoutId + per-group overrides for that specific date.
  // Sessions should never overwrite the workout template.
  // When a workout is edited, existing sessions remain unchanged (they store their own overrides).
  paceGroupsOverride?: SessionGroupOverride[]; // Full group overrides: explicit description of each active group
  // Meeting point and contact info
  meetingPoint?: string; // Exact meeting location (e.g., "Marina Casablanca - Entrée principale")
  meetingPointGPS?: string; // GPS coordinates if available
  coachAdvice?: string; // Coach's advice for this session
  coachPhone?: string; // Coach/organizer phone number for WhatsApp
  coachName?: string; // Coach/organizer name
  visibility?: SessionVisibility; // "public" | "members" (members-only sessions)
  hostGroupName?: string | null; // Group/club name for members-only sessions
  genderRestriction?: "women_only" | null; // Optional gender restriction (e.g., girls-only runs)
  /** Set when session is from API (club-linked). Used for matching membership. */
  clubId?: string | null;
};

export type SessionVisibility = "public" | "members";

/** Map API session to SessionData for UI. Used by session detail and my-sessions. */
export function apiSessionToSessionData(api: {
  id: string;
  title: string;
  spot: string;
  dateLabel: string;
  dateISO?: string | null;
  timeMinutes?: number | null;
  typeLabel: string;
  volume: string;
  targetPace: string;
  estimatedDistanceKm: number;
  recommendedGroupId: string;
  clubId?: string | null;
  visibility?: string;
  hostGroupName?: string | null;
  meetingPoint?: string | null;
  coachAdvice?: string | null;
  coachPhone?: string | null;
  coachName?: string | null;
  workoutId?: string | null;
  isCustom?: boolean;
  paceGroups?: { id: string; label: string; paceRange: string; runnersCount?: number; avgPaceSecondsPerKm?: number }[];
}): SessionData {
  const paceGroups = api.paceGroups?.length
    ? api.paceGroups.map((g) => ({
        id: g.id,
        label: g.label,
        paceRange: g.paceRange,
        runnersCount: g.runnersCount ?? 0,
        avgPaceSecondsPerKm: g.avgPaceSecondsPerKm ?? 300,
      }))
    : [
        {
          id: api.recommendedGroupId || "C",
          label: `Groupe ${api.recommendedGroupId || "C"}`,
          paceRange: api.targetPace,
          runnersCount: 0,
          avgPaceSecondsPerKm: 300,
        },
      ];
  return {
    id: api.id,
    title: api.title,
    spot: api.spot,
    dateLabel: api.dateLabel,
    dateISO: api.dateISO ?? undefined,
    timeMinutes: api.timeMinutes ?? undefined,
    typeLabel: api.typeLabel,
    volume: api.volume,
    targetPace: api.targetPace,
    paceGroups,
    recommendedGroupId: api.recommendedGroupId,
    estimatedDistanceKm: api.estimatedDistanceKm,
    workoutId: api.workoutId ?? undefined,
    isCustom: api.isCustom ?? true,
    visibility: (api.visibility as SessionVisibility) ?? "public",
    hostGroupName: api.hostGroupName ?? null,
    meetingPoint: api.meetingPoint ?? undefined,
    coachAdvice: api.coachAdvice ?? undefined,
    coachPhone: api.coachPhone ?? undefined,
    coachName: api.coachName ?? undefined,
    clubId: api.clubId ?? null,
  };
}

export const SESSION_MAP: Record<string, SessionData> = {
  "marina-fartlek-long": {
    id: "marina-fartlek-long",
    title: "FARTLEK LONG",
    spot: "Spot 1",
    dateLabel: "LUNDI 10 NOVEMBRE 06:00",
    dateISO: "2025-11-10",
    timeMinutes: 360, // 06:00
    typeLabel: "FARTLEK",
    volume: "3:00 effort x 6 · Récup 2:00",
    targetPace: "5:20–6:00/km",
    estimatedDistanceKm: 10,
    paceGroups: [
      {
        id: "A",
        label: "Groupe A",
        paceRange: "4'00–4'30/km",
        runnersCount: 2,
        avgPaceSecondsPerKm: 255,
      },
      {
        id: "B",
        label: "Groupe B",
        paceRange: "4'30–5'00/km",
        runnersCount: 5,
        avgPaceSecondsPerKm: 285,
      },
      {
        id: "C",
        label: "Groupe C",
        paceRange: "5'00–5'30/km",
        runnersCount: 8,
        avgPaceSecondsPerKm: 315,
      },
      {
        id: "D",
        label: "Groupe D",
        paceRange: "5'30–6'00/km",
        runnersCount: 4,
        avgPaceSecondsPerKm: 345,
      },
    ],
    recommendedGroupId: "C",
    workout: {
      id: "marina-fartlek-long-workout",
      title: "FARTLEK LONG",
      warmup: {
        id: "warmup",
        label: "Échauffement",
        steps: [
          {
            id: "warmup-easy",
            kind: "easy",
            description: "Jog facile 10–15 min",
            durationSeconds: 12 * 60, // 12 minutes
            targetPaceSecondsPerKm: null,
          },
        ],
      },
      main: {
        id: "main",
        label: "Série principale",
        repeatCount: 6,
        steps: [
          {
            id: "interval",
            kind: "interval",
            description: "3:00 effort",
            durationSeconds: 180, // 3:00
            targetPaceSecondsPerKm: 315, // ~5:15/km (middle of target pace range)
          },
          {
            id: "recovery",
            kind: "recovery",
            description: "2:00 récupération",
            durationSeconds: 120, // 2:00
            targetPaceSecondsPerKm: null,
          },
        ],
      },
      cooldown: {
        id: "cooldown",
        label: "Retour au calme",
        steps: [
          {
            id: "cooldown-easy",
            kind: "easy",
            description: "Jog facile 10 min",
            durationSeconds: 10 * 60, // 10 minutes
            targetPaceSecondsPerKm: null,
          },
        ],
      },
    },
  },
  "marina-fartlek-court": {
    id: "marina-fartlek-court",
    title: "FARTLEK COURT",
    spot: "Spot 2",
    dateLabel: "MARDI 11 NOVEMBRE 18:00",
    dateISO: "2025-11-11",
    timeMinutes: 1080, // 18:00
    typeLabel: "FARTLEK",
    volume: "1:30 effort x 8 · Récup 1:00",
    targetPace: "4:30–5:00/km",
    estimatedDistanceKm: 8,
    paceGroups: [
      {
        id: "A",
        label: "Groupe A",
        paceRange: "3'30–4'00/km",
        runnersCount: 3,
        avgPaceSecondsPerKm: 225,
      },
      {
        id: "B",
        label: "Groupe B",
        paceRange: "4'00–4'30/km",
        runnersCount: 6,
        avgPaceSecondsPerKm: 255,
      },
      {
        id: "C",
        label: "Groupe C",
        paceRange: "4'30–5'00/km",
        runnersCount: 7,
        avgPaceSecondsPerKm: 285,
      },
      {
        id: "D",
        label: "Groupe D",
        paceRange: "5'00–5'30/km",
        runnersCount: 3,
        avgPaceSecondsPerKm: 315,
      },
    ],
    recommendedGroupId: "B",
    workout: {
      id: "marina-fartlek-court-workout",
      title: "FARTLEK COURT",
      warmup: {
        id: "warmup",
        label: "Échauffement",
        steps: [
          {
            id: "warmup-easy",
            kind: "easy",
            description: "Jog facile 10–15 min",
            durationSeconds: 12 * 60, // 12 minutes
            targetPaceSecondsPerKm: null,
          },
        ],
      },
      main: {
        id: "main",
        label: "Série principale",
        repeatCount: 8,
        steps: [
          {
            id: "interval",
            kind: "interval",
            description: "1:30 effort",
            durationSeconds: 90, // 1:30
            targetPaceSecondsPerKm: 285, // ~4:45/km (middle of target pace range)
          },
          {
            id: "recovery",
            kind: "recovery",
            description: "1:00 récupération",
            durationSeconds: 60, // 1:00
            targetPaceSecondsPerKm: null,
          },
        ],
      },
      cooldown: {
        id: "cooldown",
        label: "Retour au calme",
        steps: [
          {
            id: "cooldown-easy",
            kind: "easy",
            description: "Jog facile 10 min",
            durationSeconds: 10 * 60, // 10 minutes
            targetPaceSecondsPerKm: null,
          },
        ],
      },
    },
  },
  "explore-fartlek-progressif": {
    id: "explore-fartlek-progressif",
    title: "FARTLEK PROGRESSIF",
    spot: "Spot 1",
    dateLabel: "MERCREDI 12 NOVEMBRE 18:00",
    dateISO: "2025-11-12",
    timeMinutes: 1080, // 18:00
    typeLabel: "FARTLEK",
    volume: "4:00 effort x 5 · Récup 2:30",
    targetPace: "5:10–5:40/km",
    estimatedDistanceKm: 8,
    paceGroups: [
      {
        id: "A",
        label: "Groupe A",
        paceRange: "4'50–5'10/km",
        runnersCount: 2,
        avgPaceSecondsPerKm: 300,
      },
      {
        id: "B",
        label: "Groupe B",
        paceRange: "5'10–5'30/km",
        runnersCount: 5,
        avgPaceSecondsPerKm: 320,
      },
      {
        id: "C",
        label: "Groupe C",
        paceRange: "5'30–5'50/km",
        runnersCount: 6,
        avgPaceSecondsPerKm: 340,
      },
      {
        id: "D",
        label: "Groupe D",
        paceRange: "5'50–6'10/km",
        runnersCount: 3,
        avgPaceSecondsPerKm: 360,
      },
    ],
    recommendedGroupId: "B",
    workout: {
      id: "explore-fartlek-progressif-workout",
      title: "FARTLEK PROGRESSIF",
      warmup: {
        id: "warmup",
        label: "Échauffement",
        steps: [
          {
            id: "warmup-easy",
            kind: "easy",
            description: "Jog facile 10–15 min",
            durationSeconds: 12 * 60, // 12 minutes
            targetPaceSecondsPerKm: null,
          },
        ],
      },
      main: {
        id: "main",
        label: "Série principale",
        repeatCount: 5,
        steps: [
          {
            id: "interval",
            kind: "interval",
            description: "4:00 effort",
            durationSeconds: 240, // 4:00
            targetPaceSecondsPerKm: 325, // ~5:25/km (middle of target pace range)
          },
          {
            id: "recovery",
            kind: "recovery",
            description: "2:30 récupération",
            durationSeconds: 150, // 2:30
            targetPaceSecondsPerKm: null,
          },
        ],
      },
      cooldown: {
        id: "cooldown",
        label: "Retour au calme",
        steps: [
          {
            id: "cooldown-easy",
            kind: "easy",
            description: "Jog facile 10 min",
            durationSeconds: 10 * 60, // 10 minutes
            targetPaceSecondsPerKm: null,
          },
        ],
      },
    },
  },
  "explore-sortie-longue-facile": {
    id: "explore-sortie-longue-facile",
    title: "SORTIE LONGUE FACILE",
    spot: "Spot 2",
    dateLabel: "SAMEDI 15 NOVEMBRE 07:00",
    dateISO: "2025-11-15",
    timeMinutes: 420, // 07:00
    typeLabel: "SORTIE",
    volume: "1h30 sortie continue",
    targetPace: "5:30–6:10/km",
    estimatedDistanceKm: 15,
    paceGroups: [
      {
        id: "A",
        label: "Groupe A",
        paceRange: "5'10–5'35/km",
        runnersCount: 4,
        avgPaceSecondsPerKm: 323,
      },
      {
        id: "B",
        label: "Groupe B",
        paceRange: "5'35–6'00/km",
        runnersCount: 8,
        avgPaceSecondsPerKm: 348,
      },
      {
        id: "C",
        label: "Groupe C",
        paceRange: "6'00–6'25/km",
        runnersCount: 7,
        avgPaceSecondsPerKm: 373,
      },
      {
        id: "D",
        label: "Groupe D",
        paceRange: "6'25–6'50/km",
        runnersCount: 3,
        avgPaceSecondsPerKm: 398,
      },
    ],
    recommendedGroupId: "B",
    workout: {
      id: "explore-sortie-longue-facile-workout",
      title: "SORTIE LONGUE FACILE",
      main: {
        id: "main",
        label: "Sortie continue",
        steps: [
          {
            id: "easy-run",
            kind: "easy",
            description: "1h30 sortie continue",
            durationSeconds: 90 * 60, // 90 minutes
            distanceKm: 15, // ~15 km at easy pace
            targetPaceSecondsPerKm: 348, // ~5:48/km (middle of target pace range)
          },
        ],
      },
    },
  },
};

function shiftSeedSessionToFuture(session: SessionData): SessionData {
  if (!session.dateISO || session.timeMinutes === undefined) {
    return session;
  }

  try {
    const now = new Date();
    const baseDate = new Date(session.dateISO);
    if (isNaN(baseDate.getTime())) return session;

    const hours = Math.floor(session.timeMinutes / 60);
    const minutes = session.timeMinutes % 60;
    baseDate.setHours(hours, minutes, 0, 0);

    const nextDate = new Date(baseDate);
    while (nextDate.getTime() <= now.getTime()) {
      nextDate.setDate(nextDate.getDate() + 7);
    }

    const dateISO = `${nextDate.getFullYear()}-${String(
      nextDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`;

    return {
      ...session,
      dateISO,
      dateLabel: formatDateLabel(nextDate, session.timeMinutes),
    };
  } catch {
    return session;
  }
}

// Helper to get all sessions from SESSION_MAP
export function getAllSessions(): SessionData[] {
  return Object.values(SESSION_MAP).map(shiftSeedSessionToFuture);
}

// Helper to get all sessions (including stored user sessions)
export async function getAllSessionsIncludingStored(): Promise<SessionData[]> {
  const seedSessions = Object.values(SESSION_MAP).map(shiftSeedSessionToFuture);
  try {
    const { getUserSessions } = await import("./sessionStore");
    const storedSessions = await getUserSessions();
    // Merge: seed sessions + stored sessions (stored sessions take precedence if same ID)
    const sessionMap = new Map<string, SessionData>();
    seedSessions.forEach((s) => sessionMap.set(s.id, s));
    storedSessions.forEach((s) => sessionMap.set(s.id, s));
    return Array.from(sessionMap.values());
  } catch (error) {
    console.warn("Failed to load stored sessions:", error);
    return seedSessions;
  }
}

// Helper to get a session by ID (checks both SESSION_MAP and stored sessions)
// This is used by the detail screen and other components
export async function getSessionById(
  id: string,
): Promise<SessionData | undefined> {
  // First check SESSION_MAP (seed data)
  if (SESSION_MAP[id]) {
    return shiftSeedSessionToFuture(SESSION_MAP[id]);
  }

  // Then check stored user sessions
  try {
    const { getUserSession } = await import("./sessionStore");
    return await getUserSession(id);
  } catch (error) {
    console.warn("Failed to load session from store:", error);
    return undefined;
  }
}
