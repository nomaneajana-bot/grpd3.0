/**
 * Pure view-model helpers for authenticated Accueil homepage.
 * Fixtures belong in tests only — not in product screens.
 */

import {
  activityForSession,
  isUpcoming,
  type Activity,
} from "@/lib/experiences";
import type { JoinedSession } from "@/lib/joinedSessionsStore";
import type { SessionData } from "@/lib/sessionData";
import type { ClubMembership } from "@/types/api";

export type HomeMode = "new_member" | "active_with_next" | "existing_no_upcoming";

export type HomeActivityFilter = "all" | "walk" | "run";

export type HomeStat = {
  id: "upcoming" | "clubs" | "completed";
  value: number;
  label: string;
};

const DAY_NAMES = [
  "DIMANCHE",
  "LUNDI",
  "MARDI",
  "MERCREDI",
  "JEUDI",
  "VENDREDI",
  "SAMEDI",
] as const;
const MONTH_NAMES = [
  "JANVIER",
  "FÉVRIER",
  "MARS",
  "AVRIL",
  "MAI",
  "JUIN",
  "JUILLET",
  "AOÛT",
  "SEPTEMBRE",
  "OCTOBRE",
  "NOVEMBRE",
  "DÉCEMBRE",
] as const;
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
const DAY_SHORT = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."] as const;

export function sessionSortKey(session: SessionData): string {
  const t = String(session.timeMinutes ?? 0).padStart(4, "0");
  return `${session.dateISO ?? ""} ${t}`;
}

export function formatTimeLabel(timeMinutes: number | null | undefined): string | null {
  if (timeMinutes == null || !Number.isFinite(timeMinutes)) return null;
  const h = Math.floor(timeMinutes / 60);
  const m = timeMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Eyebrow above title: VENDREDI 17 OCTOBRE from real dateISO (no hardcoded May). */
export function formatHomeDayEyebrow(
  dateISO: string | null | undefined,
  now = new Date(),
): string {
  const d = parseLocalDate(dateISO) ?? now;
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

export function formatDiscoveryWhen(session: SessionData): string {
  const d = parseLocalDate(session.dateISO);
  const time = formatTimeLabel(session.timeMinutes);
  if (!d) {
    return [session.dateLabel, time].filter(Boolean).join(" · ");
  }
  const day = `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
  return time ? `${day}, ${time}` : day;
}

function parseLocalDate(dateISO: string | null | undefined): Date | null {
  if (!dateISO || !/^\d{4}-\d{2}-\d{2}/.test(dateISO)) return null;
  const [y, m, day] = dateISO.slice(0, 10).split("-").map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
}

export function isConfirmedJoined(session: SessionData): boolean {
  return session.attendanceStatus === "joined";
}

/** Earliest future outing with confirmed participation — not pending/public seed. */
export function selectNextOuting(
  sessions: SessionData[],
  joinedIds: Set<string>,
  now = new Date(),
): SessionData | null {
  const candidates = sessions
    .filter((s) => {
      if (!isUpcoming(s, now)) return false;
      const confirmed =
        isConfirmedJoined(s) ||
        (joinedIds.has(s.id) && s.attendanceStatus !== "left");
      // Prefer explicit joined; joined store alone counts only if not left/pending
      if (s.attendanceStatus === "requested" || s.attendanceStatus === "suggested") {
        return false;
      }
      return confirmed;
    })
    .sort((a, b) => sessionSortKey(a).localeCompare(sessionSortKey(b)));
  return candidates[0] ?? null;
}

export function countConfirmedUpcoming(
  sessions: SessionData[],
  joinedIds: Set<string>,
  now = new Date(),
): number {
  return sessions.filter((s) => {
    if (!isUpcoming(s, now)) return false;
    if (s.attendanceStatus === "requested" || s.attendanceStatus === "suggested") {
      return false;
    }
    return isConfirmedJoined(s) || joinedIds.has(s.id);
  }).length;
}

/** Past confirmed joins — omit metric when zero sources exist. */
export function countCompletedOutings(
  sessions: SessionData[],
  joinedIds: Set<string>,
  now = new Date(),
): number {
  return sessions.filter((s) => {
    if (isUpcoming(s, now)) return false;
    if (s.attendanceStatus === "left") return false;
    return isConfirmedJoined(s) || joinedIds.has(s.id);
  }).length;
}

export function countApprovedClubs(memberships: ClubMembership[]): number {
  return memberships.filter((m) => m.status === "approved").length;
}

export function resolveHomeMode(params: {
  nextOuting: SessionData | null;
  approvedClubCount: number;
  completedCount: number;
  upcomingJoinedCount: number;
}): HomeMode {
  const { nextOuting, approvedClubCount, completedCount, upcomingJoinedCount } =
    params;
  if (nextOuting) return "active_with_next";
  const hasHistory =
    approvedClubCount > 0 || completedCount > 0 || upcomingJoinedCount > 0;
  if (!hasHistory) return "new_member";
  return "existing_no_upcoming";
}

export function buildHomeStats(params: {
  upcomingJoinedCount: number;
  approvedClubCount: number;
  completedCount: number;
}): HomeStat[] {
  const stats: HomeStat[] = [
    {
      id: "upcoming",
      value: params.upcomingJoinedCount,
      label: "à venir",
    },
    {
      id: "clubs",
      value: params.approvedClubCount,
      label: params.approvedClubCount === 1 ? "club" : "clubs",
    },
  ];
  // Only show completed when we have a reliable past-join signal at least once,
  // or when other stats already establish an existing member (rebalance ok at 2).
  if (params.completedCount > 0) {
    stats.push({
      id: "completed",
      value: params.completedCount,
      label: "sorties réalisées",
    });
  }
  return stats;
}

/** Discovery list: accessible upcoming; members-only already filtered by API/list. */
export function filterDiscoverySessions(
  sessions: SessionData[],
  filter: HomeActivityFilter,
  query: string,
  nextOutingId: string | null,
): SessionData[] {
  const q = query.trim().toLowerCase();
  return sessions
    .filter((s) => isUpcoming(s))
    .filter((s) => s.visibility !== "members")
    .filter((s) => (nextOutingId ? s.id !== nextOutingId : true))
    .filter((s) => {
      if (filter === "all") return true;
      return activityForSession(s) === filter;
    })
    .filter((s) => {
      if (!q) return true;
      const hay = `${s.title} ${s.spot} ${s.meetingPoint ?? ""} ${s.hostGroupName ?? ""} ${s.coachName ?? ""} ${s.dateLabel}`.toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => sessionSortKey(a).localeCompare(sessionSortKey(b)));
}

export function confirmedParticipantCount(session: SessionData): number | null {
  const fromGroups = (session.paceGroups ?? []).reduce(
    (sum, g) => sum + (g.runnersCount ?? 0),
    0,
  );
  if (fromGroups > 0) return fromGroups;
  return null;
}

export function initialsFromName(name: string | null | undefined): string | null {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function activityLabel(session: SessionData): string {
  return activityForSession(session) === "walk" ? "Marche" : "Course";
}

/**
 * Display title for discovery / list surfaces.
 * Collapses ALL-CAPS seed titles into sentence case without touching storage.
 */
export function displayOutingTitle(raw: string): string {
  const t = raw.trim().replace(/\s+/g, " ");
  if (!t) return t;
  const letters = t.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "");
  const mostlyUpper =
    letters.length >= 3 &&
    letters === letters.toUpperCase() &&
    letters !== letters.toLowerCase();
  if (!mostlyUpper) return t;
  const lower = t.toLocaleLowerCase("fr-FR");
  return lower.charAt(0).toLocaleUpperCase("fr-FR") + lower.slice(1);
}

/** Day number + short weekday for discovery date column. */
export function discoveryDateParts(session: SessionData): {
  dayNum: string;
  weekday: string;
  month: string;
} | null {
  const d = parseLocalDate(session.dateISO);
  if (!d) return null;
  return {
    dayNum: String(d.getDate()),
    weekday: DAY_SHORT[d.getDay()]!.replace(/\.$/, ""),
    month: MONTH_SHORT[d.getMonth()]!,
  };
}

export function resolveCityLabel(params: {
  memberships: ClubMembership[];
  query: string;
}): string {
  const fromQuery = params.query.trim();
  // If user typed a short place-like query, surface it in the chip.
  if (fromQuery && fromQuery.length <= 28 && !fromQuery.includes(" ")) {
    return fromQuery;
  }
  const cities = params.memberships
    .filter((m) => m.status === "approved")
    .map((m) => m.club?.city?.trim())
    .filter((c): c is string => Boolean(c));
  if (cities.length) return cities[0]!;
  return "Explorer";
}

export function joinedIdSet(joined: JoinedSession[]): Set<string> {
  return new Set(joined.map((j) => j.sessionId));
}

export function toActivityFilter(a: Activity): HomeActivityFilter {
  if (a === "walk" || a === "run") return a;
  return "all";
}
