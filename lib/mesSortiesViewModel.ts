import {
  formatTimeLabel,
  activityLabel,
} from "@/lib/homeViewModel";
import { getSessionDateForSort } from "@/lib/sessionLogic";
import type { SessionData } from "@/lib/sessionData";

const DAY_SHORT = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."] as const;
const MONTH_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
] as const;

export type MesSortiesTab = "upcoming" | "pending" | "past";

export function isConfirmedParticipation(
  session: SessionData,
  joinedIds: Set<string>,
): boolean {
  if (session.attendanceStatus === "joined") return true;
  if (session.attendanceStatus === "requested" || session.attendanceStatus === "suggested") {
    return false;
  }
  return joinedIds.has(session.id);
}

export function isPendingParticipation(session: SessionData): boolean {
  return session.attendanceStatus === "requested";
}

export function formatOutingDateTime(session: SessionData): string {
  const ms = getSessionDateForSort(session);
  const d = new Date(ms);
  if (!Number.isFinite(ms)) {
    const time = formatTimeLabel(session.timeMinutes);
    return [session.dateLabel, time].filter(Boolean).join(" · ");
  }
  const time = formatTimeLabel(session.timeMinutes) ||
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]} · ${time}`;
}

export function formatOutingDateCompact(session: SessionData): string {
  const ms = getSessionDateForSort(session);
  const d = new Date(ms);
  if (!Number.isFinite(ms)) return session.dateLabel || "";
  const time = formatTimeLabel(session.timeMinutes);
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}${time ? ` · ${time}` : ""}`;
}

export function clubOrHostLabel(session: SessionData): string {
  return (
    session.hostGroupName?.trim() ||
    session.coachName?.trim() ||
    "Sortie"
  );
}

export function locationLabel(session: SessionData): string {
  return (
    session.meetingPoint?.trim() ||
    session.spot?.trim() ||
    ""
  );
}

export function disciplineMeta(session: SessionData): string {
  return activityLabel(session);
}

export function distanceLabel(session: SessionData): string | null {
  if (!(session.estimatedDistanceKm > 0)) return null;
  return `${String(session.estimatedDistanceKm).replace(".", ",")} km`;
}

export function paceLabel(session: SessionData): string | null {
  if (
    !session.targetPace ||
    session.targetPace === "—" ||
    /^0:00/i.test(session.targetPace)
  ) {
    return null;
  }
  return session.targetPace;
}

export function sumPastDistanceKm(sessions: SessionData[]): number {
  return sessions.reduce((sum, s) => sum + (s.estimatedDistanceKm || 0), 0);
}

export function formatKmTotal(km: number): string {
  if (km <= 0) return "0 km";
  const rounded = Math.round(km * 10) / 10;
  return `${String(rounded).replace(".", ",")} km`;
}
