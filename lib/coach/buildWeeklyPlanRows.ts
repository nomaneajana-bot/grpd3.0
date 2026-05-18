import type { SessionData } from "../sessionData";
import { getSessionDateForSort, getSessionRunTypeId } from "../sessionLogic";
import { getRunTypePillLabel } from "../workoutHelpers";
import { classifySessionIntensity } from "./buildCoachContext";

const DAY_MS = 24 * 60 * 60 * 1000;
const GRACE_MS = 90 * 60 * 1000;

const FR_DAY_LABELS = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"] as const;

export const WEEKLY_PLAN_DOT = {
  orange: "#F5782A",
  green: "#4DD990",
  grey: "#3A3A48",
  blue: "#2E7CF6",
  red: "#FF453A",
} as const;

export type WeeklyPlanRow = {
  dayLabel: string;
  title: string;
  subtitle?: string;
  statusLabel: string;
  dotColor: string;
  muted?: boolean;
};

export type BuildWeeklyPlanRowsInput = {
  sessions: SessionData[];
  joinedIds: Set<string>;
  workoutRunTypes?: Record<string, string>;
  now?: number;
};

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function mondayOfWeek(ts: number): number {
  const d = new Date(startOfDay(ts));
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.getTime();
}

function resolveType(
  session: SessionData,
  workoutRunTypes?: Record<string, string>,
): string {
  const fromWorkout = workoutRunTypes?.[session.id];
  if (fromWorkout) return fromWorkout;
  return getSessionRunTypeId(session) ?? session.typeLabel ?? "";
}

function sessionTitle(session: SessionData, runType: string): string {
  const label = getRunTypePillLabel(
    runType as Parameters<typeof getRunTypePillLabel>[0],
  );
  return label || session.title;
}

export function buildWeeklyPlanRows(
  input: BuildWeeklyPlanRowsInput,
): WeeklyPlanRow[] {
  const now = input.now ?? Date.now();
  const weekStart = mondayOfWeek(now);
  const joinedIds = input.joinedIds;
  const todayStart = startOfDay(now);

  const sessionsByDay = new Map<number, SessionData[]>();
  for (const s of input.sessions) {
    const t = getSessionDateForSort(s);
    const day = startOfDay(t);
    const list = sessionsByDay.get(day) ?? [];
    list.push(s);
    sessionsByDay.set(day, list);
  }

  for (const list of sessionsByDay.values()) {
    list.sort((a, b) => getSessionDateForSort(a) - getSessionDateForSort(b));
  }

  let lastHardPast = false;
  let recommendedAssigned = false;
  const rows: WeeklyPlanRow[] = [];

  for (let i = 0; i < 7; i++) {
    const dayTs = weekStart + i * DAY_MS;
    const dayLabel = FR_DAY_LABELS[new Date(dayTs).getDay()];
    const daySessions = sessionsByDay.get(dayTs) ?? [];
    const isPast = dayTs + DAY_MS <= now - GRACE_MS;

    if (daySessions.length > 0) {
      const session = daySessions[0];
      const runType = resolveType(session, input.workoutRunTypes);
      const intensity = classifySessionIntensity(runType);
      const joined = joinedIds.has(session.id);
      const title = sessionTitle(session, runType);
      const spot = session.spot?.trim();

      if (isPast && joined) {
        lastHardPast = intensity === "hard";
        rows.push({
          dayLabel,
          title,
          subtitle: spot || undefined,
          statusLabel: "Fait",
          dotColor:
            intensity === "hard" ? WEEKLY_PLAN_DOT.orange : WEEKLY_PLAN_DOT.green,
        });
        continue;
      }

      if (!isPast && joined) {
        rows.push({
          dayLabel,
          title,
          subtitle: spot || undefined,
          statusLabel: "Inscrite",
          dotColor: WEEKLY_PLAN_DOT.blue,
        });
        continue;
      }

      if (!isPast && !joined && intensity === "hard" && !recommendedAssigned) {
        recommendedAssigned = true;
        rows.push({
          dayLabel,
          title,
          subtitle: spot || undefined,
          statusLabel: "recommandé coach",
          dotColor: WEEKLY_PLAN_DOT.red,
        });
        continue;
      }

      rows.push({
        dayLabel,
        title,
        subtitle: spot || undefined,
        statusLabel: isPast ? "Fait" : "Prévu",
        dotColor: WEEKLY_PLAN_DOT.grey,
        muted: isPast,
      });
      continue;
    }

    if (lastHardPast && dayTs >= todayStart) {
      lastHardPast = false;
      rows.push({
        dayLabel,
        title: "Sortie facile",
        statusLabel: "conseil coach",
        dotColor: WEEKLY_PLAN_DOT.green,
      });
      continue;
    }

    rows.push({
      dayLabel,
      title: "Repos",
      statusLabel: "",
      dotColor: WEEKLY_PLAN_DOT.grey,
      muted: dayTs < todayStart,
    });
  }

  return rows;
}
