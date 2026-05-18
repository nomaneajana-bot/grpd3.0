import type { SessionData } from "./sessionData";
import { getSessionRunTypeId } from "./sessionLogic";
import type { RunTypeId } from "./workoutStore";

export type SessionFilterChipId =
  | "all"
  | "fartlek"
  | "tempo_run"
  | "discovery_run"
  | "easy_run"
  | "series"
  | "progressif";

export function filterSessionsList(
  sessions: SessionData[],
  chipType: SessionFilterChipId,
  search: string,
  workoutRunTypes: Record<string, RunTypeId>,
): SessionData[] {
  let list = sessions;
  if (chipType !== "all") {
    list = list.filter((s) => {
      const rt = s.workoutId ? workoutRunTypes[s.id] : null;
      return (rt ?? getSessionRunTypeId(s)) === chipType;
    });
  }
  const q = search.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.spot.toLowerCase().includes(q),
    );
  }
  return list;
}
