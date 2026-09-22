import { getSessionDateForSort } from "./sessionLogic";
import type { SessionData } from "./sessionData";

/** Grace after scheduled end before “Marquer comme fait” appears. */
export const SESSION_COMPLETE_GRACE_MS = 90 * 60 * 1000;

const DEFAULT_DURATION_MIN = 60;

function estimateDurationMin(session: SessionData): number {
  const vol = session.volume?.toLowerCase() ?? "";
  const kmMatch = vol.match(/(\d+(?:[.,]\d+)?)\s*km/);
  if (kmMatch) {
    const km = parseFloat(kmMatch[1].replace(",", "."));
    if (Number.isFinite(km) && km > 0) {
      return Math.max(30, Math.round(km * 6));
    }
  }
  if (session.estimatedDistanceKm > 0) {
    return Math.max(30, Math.round(session.estimatedDistanceKm * 6));
  }
  return DEFAULT_DURATION_MIN;
}

export function getSessionEndMs(session: SessionData): number {
  const start = getSessionDateForSort(session);
  return start + estimateDurationMin(session) * 60 * 1000;
}

export function isSessionPastForCompletion(
  session: SessionData,
  now = Date.now(),
): boolean {
  return now >= getSessionEndMs(session) + SESSION_COMPLETE_GRACE_MS;
}

export function canMarkSessionComplete(
  session: SessionData,
  opts: {
    hasLocalJoin?: boolean;
    attendanceStatus?: SessionData["attendanceStatus"];
    now?: number;
  },
): boolean {
  const status = opts.attendanceStatus ?? session.attendanceStatus;
  if (status === "attended") return false;
  const joined =
    status === "joined" || Boolean(opts.hasLocalJoin);
  if (!joined) return false;
  return isSessionPastForCompletion(session, opts.now);
}
