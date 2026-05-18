import type { ClubMembership, ClubRosterMember } from "@/types/api";
import type { SessionData } from "./sessionData";

export type ClubFeedItem = {
  id: string;
  who: string;
  what: string;
  when: string;
  initials: string;
  color: string;
  kind?: "pr" | "session" | "coach";
};

const COLORS = ["#2F7BFF", "#E94B5E", "#2BC97A", "#F08A3A", "#B265E0"];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function relativeWhen(isoOrMs: string | number): string {
  const t = typeof isoOrMs === "number" ? isoOrMs : new Date(isoOrMs).getTime();
  if (isNaN(t)) return "";
  const diff = Date.now() - t;
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 1) return "à l'instant";
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days}j`;
  return "cette semaine";
}

export function buildClubActivityFeed(input: {
  roster: ClubRosterMember[];
  sessions: SessionData[];
  memberships: ClubMembership[];
}): ClubFeedItem[] {
  const items: ClubFeedItem[] = [];
  let colorIdx = 0;

  for (const member of input.roster.slice(0, 2)) {
    const name = member.displayName ?? "Coureur";
    items.push({
      id: `roster-${member.userId}`,
      who: name,
      what: "est membre du club",
      when: "récemment",
      initials: initialsFromName(name),
      color: COLORS[colorIdx++ % COLORS.length],
    });
  }

  const recentSessions = [...input.sessions]
    .filter((s) => s.title)
    .sort((a, b) => (b.dateISO ?? "").localeCompare(a.dateISO ?? ""))
    .slice(0, 2);

  for (const session of recentSessions) {
    const title = session.title ?? "une séance";
    items.push({
      id: `session-${session.id}`,
      who: "Un membre",
      what: `a une séance · ${title}`,
      when: session.dateISO ? relativeWhen(session.dateISO) : "bientôt",
      initials: "GR",
      color: COLORS[colorIdx++ % COLORS.length],
      kind: "session",
    });
  }

  const pending = input.memberships.filter((m) => m.status === "pending");
  if (pending.length > 0 && items.length < 3) {
    items.push({
      id: "pending",
      who: "Nouveau membre",
      what: "demande à rejoindre le club",
      when: "récemment",
      initials: "NM",
      color: COLORS[colorIdx++ % COLORS.length],
    });
  }

  return items.slice(0, 3);
}

export const EMPTY_FEED_PLACEHOLDER: ClubFeedItem = {
  id: "empty",
  who: "",
  what: "Rien à signaler cette semaine — invite tes co-runners.",
  when: "",
  initials: "—",
  color: "#7A7A82",
};
