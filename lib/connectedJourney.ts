/**
 * Connected-mode helpers for the D03 member journey
 * (login → list → detail → join → Mes sorties).
 *
 * Local/demo seed fallbacks are allowed only when useMock is true.
 * Connected API failures must surface as errors — never as silent local success.
 */

export type AttendanceLike = {
  id: string;
  attendanceStatus?:
    | "joined"
    | "suggested"
    | "left"
    | "requested"
    | "waitlisted"
    | "declined"
    | null;
};

/** Local join / seed catalog fallback is demo/mock only — never connected. */
export function allowLocalCatalogFallback(useMock: boolean): boolean {
  return useMock === true;
}

/**
 * After a join attempt: connected mode requires API success before treating
 * the member as registered. Demo/mock may keep a device-local join.
 */
export function canRecordJoinLocally(opts: {
  useMock: boolean;
  apiJoined: boolean;
}): boolean {
  if (opts.apiJoined) return true;
  return allowLocalCatalogFallback(opts.useMock);
}

/** Confirmed join ids from GET /api/v1/me/sessions (or equivalent). */
export function joinedIdsFromAttendance(
  sessions: AttendanceLike[],
): Set<string> {
  const ids = new Set<string>();
  for (const s of sessions) {
    if (s.attendanceStatus === "joined") ids.add(s.id);
  }
  return ids;
}

/**
 * Merge a successful join into the Mes sorties list (fixture-friendly).
 * Ensures the session appears with attendanceStatus "joined".
 */
export function mergeJoinedSessionIntoMine<T extends AttendanceLike>(
  mine: T[],
  joined: T,
): T[] {
  const next: T = { ...joined, attendanceStatus: "joined" };
  const idx = mine.findIndex((s) => s.id === next.id);
  if (idx < 0) return [...mine, next];
  return mine.map((s, i) => (i === idx ? { ...s, ...next } : s));
}
