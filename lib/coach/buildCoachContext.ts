import type { StoredCoachFeedback } from "../coachFeedbackStore";
import type { SessionData } from "../sessionData";
import { getSessionDateForSort } from "../sessionLogic";
import { getSessionRunTypeId } from "../sessionLogic";
import { enrichContextWithScores } from "./coachScoring";
import type { CoachContext, CoachScreen, SessionIntensity } from "./coachTypes";

const GRACE_MS = 90 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function normType(s: string | undefined): string {
  return (s ?? "").toLowerCase();
}

export function classifySessionIntensity(sessionType: string): SessionIntensity {
  const u = normType(sessionType);
  if (
    u.includes("easy") ||
    u.includes("footing") ||
    u.includes("recovery") ||
    u.includes("decouverte") ||
    u.includes("découverte") ||
    u.includes("libre") ||
    u.includes("casual") ||
    u.includes("walk") ||
    u.includes("marche")
  ) {
    return "easy";
  }
  if (
    u.includes("fartlek") ||
    u.includes("tempo") ||
    u.includes("seuil") ||
    u.includes("threshold") ||
    u.includes("interval") ||
    u.includes("serie") ||
    u.includes("série") ||
    u.includes("progressif") ||
    u.includes("hill") ||
    u.includes("track")
  ) {
    return "hard";
  }
  return "moderate";
}

function resolveSessionType(
  session: SessionData,
  workoutRunTypes?: Record<string, string>,
): string {
  const fromWorkout = workoutRunTypes?.[session.id];
  if (fromWorkout) return fromWorkout;
  return getSessionRunTypeId(session) ?? session.typeLabel ?? "";
}

/** Past joined sessions count (proxy for showing-up streak). */
export function computeAttendedStreakCount(
  sessions: SessionData[],
  joinedIds: Set<string>,
  now = Date.now(),
): number {
  let n = 0;
  for (const s of sessions) {
    if (!joinedIds.has(s.id)) continue;
    const t = getSessionDateForSort(s);
    if (t <= now - GRACE_MS) n += 1;
  }
  return n;
}

export function computeDaysSinceLastSession(
  sessions: SessionData[],
  joinedIds: Set<string>,
  now = Date.now(),
): number | undefined {
  let last = 0;
  for (const s of sessions) {
    if (!joinedIds.has(s.id)) continue;
    const t = getSessionDateForSort(s);
    if (t > now - GRACE_MS) continue;
    if (t > last) last = t;
  }
  if (last === 0) return undefined;
  return Math.floor((now - last) / DAY_MS);
}

export function computeHardSessionsLast4Days(
  sessions: SessionData[],
  joinedIds: Set<string>,
  workoutRunTypes?: Record<string, string>,
  now = Date.now(),
): number {
  const windowStart = now - 4 * DAY_MS;
  let count = 0;
  for (const s of sessions) {
    if (!joinedIds.has(s.id)) continue;
    const t = getSessionDateForSort(s);
    if (t < windowStart || t > now - GRACE_MS) continue;
    const type = resolveSessionType(s, workoutRunTypes);
    if (classifySessionIntensity(type) === "hard") count += 1;
  }
  return count;
}

export type BuildCoachContextInput = {
  screen: CoachScreen;
  sessions?: SessionData[];
  joinedIds?: Set<string>;
  workoutRunTypes?: Record<string, string>;
  feedback?: StoredCoachFeedback | null;
  now?: number;
  sessionType?: string;
  sessionPace?: string;
  userGroup?: string;
  weekSessions?: string[];
  lastSessionType?: string;
};

export function buildCoachContext(input: BuildCoachContextInput): CoachContext {
  const now = input.now ?? Date.now();
  const sessions = input.sessions ?? [];
  const joinedIds = input.joinedIds ?? new Set<string>();

  const streakCount = computeAttendedStreakCount(sessions, joinedIds, now);
  const daysSinceLastSession = computeDaysSinceLastSession(
    sessions,
    joinedIds,
    now,
  );
  const hardSessionsLast4Days = computeHardSessionsLast4Days(
    sessions,
    joinedIds,
    input.workoutRunTypes,
    now,
  );

  const base: CoachContext = {
    screen: input.screen,
    sessionType: input.sessionType,
    sessionPace: input.sessionPace,
    userGroup: input.userGroup,
    weekSessions: input.weekSessions,
    lastSessionType: input.lastSessionType,
    streakCount,
    daysSinceLastSession,
    hardSessionsLast4Days,
    lastSessionRating: input.feedback?.rating,
  };

  return enrichContextWithScores(base);
}

export function streakMotivationMessage(streak: number): string {
  if (streak <= 0) return "Ta première séance démarre ta série.";
  if (streak <= 2) return "Ta série commence. Reviens à la prochaine séance.";
  if (streak <= 9) return `${streak} séances. La régularité s'installe.`;
  return `${streak} séances. Tu deviens fiable.`;
}
