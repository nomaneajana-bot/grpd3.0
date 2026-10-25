import {
  buildHomeStats,
  filterDiscoverySessions,
  formatHomeDayEyebrow,
  resolveHomeMode,
  selectNextOuting,
  sessionSortKey,
} from "../homeViewModel";
import type { SessionData } from "../sessionData";

function session(partial: Partial<SessionData> & { id: string }): SessionData {
  return {
    title: partial.title ?? "Sortie",
    spot: partial.spot ?? "Marina",
    dateLabel: partial.dateLabel ?? "VENDREDI 17 OCTOBRE 09:00",
    dateISO: partial.dateISO ?? "2099-10-17",
    timeMinutes: partial.timeMinutes ?? 540,
    typeLabel: partial.typeLabel ?? "MARCHE",
    volume: "",
    targetPace: "—",
    paceGroups: [],
    recommendedGroupId: "open",
    estimatedDistanceKm: 0,
    attendanceStatus: partial.attendanceStatus ?? null,
    visibility: partial.visibility ?? "public",
    ...partial,
  } as SessionData;
}

describe("homeViewModel", () => {
  const now = new Date("2026-10-17T10:00:00");

  it("selects earliest future confirmed join, ignores pending", () => {
    const later = session({
      id: "b",
      dateISO: "2099-10-20",
      timeMinutes: 600,
      attendanceStatus: "joined",
    });
    const sooner = session({
      id: "a",
      dateISO: "2099-10-18",
      timeMinutes: 420,
      attendanceStatus: "joined",
    });
    const pending = session({
      id: "p",
      dateISO: "2099-10-17",
      timeMinutes: 480,
      attendanceStatus: "requested",
    });
    const next = selectNextOuting(
      [later, sooner, pending],
      new Set(["a", "b", "p"]),
      now,
    );
    expect(next?.id).toBe("a");
  });

  it("pending alone is not next outing", () => {
    const pending = session({
      id: "p",
      attendanceStatus: "requested",
    });
    expect(selectNextOuting([pending], new Set(["p"]), now)).toBeNull();
  });

  it("unjoined upcoming is never next outing", () => {
    const open = session({
      id: "open",
      dateISO: "2099-10-18",
      attendanceStatus: null,
    });
    expect(selectNextOuting([open], new Set(), now)).toBeNull();
  });

  it("resolves new_member vs existing_no_upcoming", () => {
    expect(
      resolveHomeMode({
        nextOuting: null,
        approvedClubCount: 0,
        completedCount: 0,
        upcomingJoinedCount: 0,
      }),
    ).toBe("new_member");
    expect(
      resolveHomeMode({
        nextOuting: null,
        approvedClubCount: 2,
        completedCount: 0,
        upcomingJoinedCount: 0,
      }),
    ).toBe("existing_no_upcoming");
    expect(
      resolveHomeMode({
        nextOuting: session({ id: "x", attendanceStatus: "joined" }),
        approvedClubCount: 0,
        completedCount: 0,
        upcomingJoinedCount: 1,
      }),
    ).toBe("active_with_next");
  });

  it("omits completed stat when zero", () => {
    const stats = buildHomeStats({
      upcomingJoinedCount: 1,
      approvedClubCount: 2,
      completedCount: 0,
    });
    expect(stats.map((s) => s.id)).toEqual(["upcoming", "clubs"]);
  });

  it("filters discovery: public only, excludes next, activity + query", () => {
    const next = session({
      id: "next",
      typeLabel: "MARCHE",
      attendanceStatus: "joined",
    });
    const walk = session({
      id: "w",
      typeLabel: "MARCHE",
      title: "Balade Corniche",
      spot: "Ain Diab",
    });
    const run = session({
      id: "r",
      typeLabel: "COURSE LIBRE",
      title: "Footing",
    });
    const priv = session({
      id: "m",
      typeLabel: "MARCHE",
      visibility: "members",
    });
    const list = filterDiscoverySessions(
      [next, walk, run, priv],
      "walk",
      "corniche",
      "next",
    );
    expect(list.map((s) => s.id)).toEqual(["w"]);
  });

  it("formats day eyebrow from real ISO (not hardcoded May)", () => {
    // 2026-10-17 is a Saturday
    expect(formatHomeDayEyebrow("2026-10-17")).toBe("SAMEDI 17 OCTOBRE");
  });

  it("sorts by date then time", () => {
    const a = session({ id: "a", dateISO: "2099-01-02", timeMinutes: 600 });
    const b = session({ id: "b", dateISO: "2099-01-02", timeMinutes: 480 });
    expect(sessionSortKey(b) < sessionSortKey(a)).toBe(true);
  });
});
