/** Club pace group labels, display ranges, and roster bucketing. */

import type { JoinedSession } from "./joinedSessionsStore";
import type { ReferencePaces, RunnerProfile } from "./profileStore";
import type { ClubAdminSettings } from "@/lib/clubAdminStore";
import type { ClubRosterMember } from "@/types/api";

export type PaceGroupId = "A" | "B" | "C" | "D";
export type ClubPaceGroupId = PaceGroupId;

function memberGroupFromAdminSettings(
  userId: string,
  settings: ClubAdminSettings,
): ClubPaceGroupId | null {
  const g = settings.memberGroups[userId];
  if (g === "A" || g === "B" || g === "C" || g === "D") return g;
  return null;
}

export type ClubPaceGroupInfo = {
  id: PaceGroupId;
  label: string;
  /** Display range e.g. "4:30–5:30" */
  window: string;
};

export const CLUB_PACE_GROUPS: ClubPaceGroupInfo[] = [
  { id: "A", label: "Groupe A", window: "4:00–4:30" },
  { id: "B", label: "Groupe B", window: "4:30–5:30" },
  { id: "C", label: "Groupe C", window: "5:00–5:30" },
  { id: "D", label: "Groupe D", window: "5:30–6:00" },
];

export type ClubPaceGroupDef = {
  id: ClubPaceGroupId;
  label: string;
  paceLabel: string;
  dotColor: string;
  avatarColor: string;
};

export const CLUB_PACE_GROUP_DEFS: ClubPaceGroupDef[] = [
  {
    id: "A",
    label: "Groupe A — Élite",
    paceLabel: "Sub 4:30/km",
    dotColor: "#FF453A",
    avatarColor: "#FF453A",
  },
  {
    id: "B",
    label: "Groupe B — Intermédiaire",
    paceLabel: "4:30–5:30/km",
    dotColor: "#2E7CF6",
    avatarColor: "#2E7CF6",
  },
  {
    id: "C",
    label: "Groupe C — Découverte",
    paceLabel: "5:30–7:00/km",
    dotColor: "#4DD990",
    avatarColor: "#4DD990",
  },
  {
    id: "D",
    label: "Groupe D — Social",
    paceLabel: "7:00+/km",
    dotColor: "#7A7A8A",
    avatarColor: "#7A7A8A",
  },
];

export type ClubGroupBucket = {
  count: number;
  sampleInitials: string[];
};

export type ClubGroupBuckets = Record<ClubPaceGroupId, ClubGroupBucket>;

const byId = Object.fromEntries(
  CLUB_PACE_GROUPS.map((g) => [g.id, g]),
) as Record<PaceGroupId, ClubPaceGroupInfo>;

export function getClubPaceGroup(
  id: string | null | undefined,
): ClubPaceGroupInfo | null {
  if (!id || !(id in byId)) return null;
  return byId[id as PaceGroupId];
}

/** e.g. "Groupe B · 4:30–5:30" */
export function formatClubGroupLine(groupId: string | null | undefined): string {
  const g = getClubPaceGroup(groupId);
  if (!g) return "Groupe —";
  return `${g.label} · ${g.window}`;
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function initialsFromName(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

function bestPaceSecondsPerKm(member: ClubRosterMember): number | null {
  const records = member.prSummary?.records ?? [];
  const paces = records
    .map((r) => r.paceSecondsPerKm)
    .filter((p): p is number => p != null && p > 0);
  if (paces.length === 0) return null;
  return Math.min(...paces);
}

export function paceSecondsToClubGroupId(
  paceSecondsPerKm: number,
): ClubPaceGroupId {
  if (paceSecondsPerKm < 270) return "A";
  if (paceSecondsPerKm < 330) return "B";
  if (paceSecondsPerKm < 420) return "C";
  return "D";
}

/** Pace in minutes per km (decimal) → group A–D per prototype ranges. */
export function paceMinutesToClubGroupId(
  paceMinPerKm: number,
): ClubPaceGroupId {
  if (paceMinPerKm < 4.5) return "A";
  if (paceMinPerKm < 5.5) return "B";
  if (paceMinPerKm < 7) return "C";
  return "D";
}

export function discoveryGroup(): ClubPaceGroupId {
  return "D";
}

export function assignMemberToClubGroup(
  member: ClubRosterMember,
  adminSettings?: ClubAdminSettings | null,
): ClubPaceGroupId {
  const assigned = adminSettings
    ? memberGroupFromAdminSettings(member.userId, adminSettings)
    : null;
  if (assigned) return assigned;

  const pace = bestPaceSecondsPerKm(member);
  if (pace != null) return paceSecondsToClubGroupId(pace);
  const seed = hashString(member.userId || member.membershipId);
  const ids: ClubPaceGroupId[] = ["A", "B", "C", "D"];
  return ids[seed % ids.length];
}

export function emptyGroupBuckets(): ClubGroupBuckets {
  return {
    A: { count: 0, sampleInitials: [] },
    B: { count: 0, sampleInitials: [] },
    C: { count: 0, sampleInitials: [] },
    D: { count: 0, sampleInitials: [] },
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfWeekMonday(now = Date.now()): number {
  const d = new Date(now);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d.getTime();
}

/** Sessions this calendar week attributed to a pace group (heuristic via roster pace). */
export function countSessionsThisWeekForGroup(
  groupId: ClubPaceGroupId,
  roster: ClubRosterMember[],
  sessionCountTotal: number,
  adminSettings?: ClubAdminSettings | null,
): number {
  if (sessionCountTotal <= 0) return 0;
  const bucket = bucketMembersByGroup(roster, adminSettings)[groupId];
  const totalMembers = roster.length || 1;
  const share = bucket.count / totalMembers;
  const estimated = Math.round(sessionCountTotal * share);
  return Math.max(0, Math.min(estimated, sessionCountTotal));
}

export function bucketMembersByGroup(
  members: ClubRosterMember[],
  adminSettings?: ClubAdminSettings | null,
): ClubGroupBuckets {
  const buckets = emptyGroupBuckets();

  for (const member of members) {
    const groupId = assignMemberToClubGroup(member, adminSettings);
    const bucket = buckets[groupId];
    bucket.count += 1;
    if (bucket.sampleInitials.length < 2) {
      const initials = initialsFromName(member.displayName);
      if (!bucket.sampleInitials.includes(initials)) {
        bucket.sampleInitials.push(initials);
      }
    }
  }

  return buckets;
}

function referencePaceSeconds(paces: ReferencePaces | null): number | null {
  if (!paces) return null;
  const candidates = [
    paces.tempoMin,
    paces.tempoMax,
    paces.easyMin,
    paces.easyMax,
    paces.thresholdMin,
    paces.thresholdMax,
  ].filter((p): p is number => p != null && p > 0);
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => a + b, 0) / candidates.length;
}

export function inferUserClubGroupId(
  profile: RunnerProfile | null,
  joinedSessions: JoinedSession[],
  referencePaces: ReferencePaces | null,
): ClubPaceGroupId {
  if (
    profile?.defaultGroup === "A" ||
    profile?.defaultGroup === "B" ||
    profile?.defaultGroup === "C" ||
    profile?.defaultGroup === "D"
  ) {
    return profile.defaultGroup;
  }

  const pace = referencePaceSeconds(referencePaces);
  if (pace != null) return paceSecondsToClubGroupId(pace);

  if (joinedSessions.length > 0) {
    const last = joinedSessions[joinedSessions.length - 1];
    const gid = last.groupId;
    if (gid === "A" || gid === "B" || gid === "C" || gid === "D") {
      return gid;
    }
  }

  return "B";
}

export function clubInitialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CL";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function formatFoundedYear(createdAt?: string | null): string | null {
  if (!createdAt) return null;
  try {
    const year = new Date(createdAt).getFullYear();
    if (Number.isNaN(year)) return null;
    return String(year);
  } catch {
    return null;
  }
}

export function getClubPaceGroupDef(id: ClubPaceGroupId): ClubPaceGroupDef {
  return (
    CLUB_PACE_GROUP_DEFS.find((g) => g.id === id) ?? CLUB_PACE_GROUP_DEFS[1]
  );
}
