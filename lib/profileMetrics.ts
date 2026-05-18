import { getSessionDateForSort } from "./sessionLogic";
import type { SessionData } from "./sessionData";
import type { TestRecord } from "./profileStore";
import { formatDurationLabel } from "./testHelpers";

const DAY_MS = 24 * 60 * 60 * 1000;
const GRACE_MS = 90 * 60 * 1000;

const GOAL_TARGET_SECONDS: Record<string, number> = {
  "5k": 25 * 60,
  "10k": 50 * 60,
  "21k": 110 * 60,
  "42k": 240 * 60,
};

export function countAttendedSessions(
  sessions: SessionData[],
  joinedIds: Set<string>,
  now = Date.now(),
): number {
  const grace = 90 * 60 * 1000;
  return sessions.filter((s) => {
    if (!joinedIds.has(s.id)) return false;
    return getSessionDateForSort(s) <= now - grace;
  }).length;
}

export function sumKmYearToDate(
  sessions: SessionData[],
  joinedIds: Set<string>,
  now = Date.now(),
): number {
  const year = new Date(now).getFullYear();
  const grace = 90 * 60 * 1000;
  let total = 0;
  for (const s of sessions) {
    if (!joinedIds.has(s.id)) continue;
    const t = getSessionDateForSort(s);
    if (t > now - grace) continue;
    const sessionYear = new Date(t).getFullYear();
    if (sessionYear !== year) continue;
    total += s.estimatedDistanceKm ?? 0;
  }
  return Math.round(total);
}

export function findTenKRecord(tests: TestRecord[]): TestRecord | null {
  for (const t of tests) {
    const label = t.label.toLowerCase();
    if (label.includes("10") && (label.includes("km") || label.includes("k"))) {
      return t;
    }
    if (t.distanceMeters != null && t.distanceMeters >= 9900 && t.distanceMeters <= 10100) {
      return t;
    }
  }
  return null;
}

export function formatRaceTime(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "—";
  return formatDurationLabel(seconds);
}

export type GoalProgress = {
  title: string;
  subtitle: string;
  currentLabel: string;
  targetLabel: string;
  progress: number;
};

function formatGoalDeadline(targetDeadline?: string | null): string {
  if (!targetDeadline?.trim()) return "Continue ta progression régulière.";
  const raw = targetDeadline.trim();
  const monthMatch = raw.match(/^(\d{4})-(\d{2})/);
  if (monthMatch) {
    const year = Number(monthMatch[1]);
    const month = Number(monthMatch[2]) - 1;
    const label = new Date(year, month, 1).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    const label = parsed.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return raw;
}

export function formatPaceShort(secondsPerKm: number | null): string {
  if (secondsPerKm == null || secondsPerKm <= 0) return "—";
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;
  return `${minutes}'${seconds.toString().padStart(2, "0")}`;
}

export function formatPaceColon(secondsPerKm: number | null): string {
  if (secondsPerKm == null || secondsPerKm <= 0) return "—";
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = secondsPerKm % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
}

export function computeAveragePaceFromSessions(
  sessions: SessionData[],
  joinedIds: Set<string>,
  limit = 4,
  now = Date.now(),
): number | null {
  const grace = 90 * 60 * 1000;
  const paces: number[] = [];
  const sorted = [...sessions]
    .filter((s) => joinedIds.has(s.id))
    .filter((s) => getSessionDateForSort(s) <= now - grace)
    .sort((a, b) => getSessionDateForSort(b) - getSessionDateForSort(a));

  for (const session of sorted) {
    if (paces.length >= limit) break;
    const groups = session.paceGroups ?? [];
    const withPace = groups
      .map((g) => g.avgPaceSecondsPerKm)
      .filter((p): p is number => typeof p === "number" && p > 0);
    if (withPace.length === 0) continue;
    const avg =
      withPace.reduce((sum, p) => sum + p, 0) / Math.max(withPace.length, 1);
    paces.push(avg);
  }

  if (paces.length === 0) return null;
  return Math.round(paces.reduce((a, b) => a + b, 0) / paces.length);
}

export function buildGoalProgress(
  mainGoal: string | undefined,
  tests: TestRecord[],
  targetDeadline?: string | null,
): GoalProgress {
  const goalKey = mainGoal ?? "10k";
  const titles: Record<string, string> = {
    "5k": "Sub-25 sur 5 km",
    "10k": "Sub-50 sur 10 km",
    "21k": "Semi en moins de 1h50",
    "42k": "Marathon sous 4h",
    other: "Objectif course",
  };
  const title = titles[goalKey] ?? "Objectif principal";
  const subtitle = formatGoalDeadline(targetDeadline);

  const tenK = findTenKRecord(tests);
  const currentSeconds =
    tenK?.durationSeconds ??
    (goalKey === "5k"
      ? tests.find((t) => t.label.toLowerCase().includes("5"))?.durationSeconds
      : null) ??
    null;
  const targetSeconds = GOAL_TARGET_SECONDS[goalKey] ?? GOAL_TARGET_SECONDS["10k"];

  const currentLabel = formatRaceTime(currentSeconds);
  const targetLabel = formatRaceTime(targetSeconds);

  let progress = 0.35;
  if (currentSeconds != null && targetSeconds > 0) {
    if (currentSeconds <= targetSeconds) {
      progress = 1;
    } else {
      const span = currentSeconds - targetSeconds;
      const headroom = targetSeconds * 0.35;
      progress = Math.min(1, Math.max(0.08, 1 - span / headroom));
    }
  }

  return {
    title,
    subtitle,
    currentLabel,
    targetLabel,
    progress,
  };
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + diff);
  return d;
}

function sessionsInWeek(
  sessions: SessionData[],
  joinedIds: Set<string>,
  weekStartMs: number,
  now: number,
): number {
  const weekEnd = weekStartMs + 7 * DAY_MS;
  return sessions.filter((s) => {
    if (!joinedIds.has(s.id)) return false;
    const t = getSessionDateForSort(s);
    if (t > now - GRACE_MS) return false;
    return t >= weekStartMs && t < weekEnd;
  }).length;
}

/** Mon–Sun activity for the current calendar week. */
export function computeWeekActivity(
  sessions: SessionData[],
  joinedIds: Set<string>,
  now = Date.now(),
): boolean[] {
  const weekStart = startOfWeekMonday(new Date(now)).getTime();
  const active = [false, false, false, false, false, false, false];
  for (const s of sessions) {
    if (!joinedIds.has(s.id)) continue;
    const t = getSessionDateForSort(s);
    if (t > now - GRACE_MS) continue;
    if (t < weekStart || t >= weekStart + 7 * DAY_MS) continue;
    const dayIndex = (new Date(t).getDay() + 6) % 7;
    active[dayIndex] = true;
  }
  return active;
}

/** Sessions in consecutive active weeks (current week backward until a gap). */
export function computeStreakSessionCount(
  sessions: SessionData[],
  joinedIds: Set<string>,
  now = Date.now(),
): number {
  let total = 0;
  let weekStart = startOfWeekMonday(new Date(now)).getTime();
  for (let i = 0; i < 52; i++) {
    const count = sessionsInWeek(sessions, joinedIds, weekStart, now);
    if (count === 0) break;
    total += count;
    weekStart -= 7 * DAY_MS;
  }
  return total;
}

export function kmMotivationLine(kmYtd: number): string {
  if (kmYtd <= 0) {
    return "Chaque sortie compte. Ta prochaine séance alimente ce total.";
  }
  if (kmYtd < 50) {
    return "Belle base en cours — la régularité fera monter ce chiffre.";
  }
  if (kmYtd < 150) {
    return "Tu construis un volume solide. Garde le rythme sur la semaine.";
  }
  return "Volume impressionnant — récupère bien entre les séances clés.";
}
