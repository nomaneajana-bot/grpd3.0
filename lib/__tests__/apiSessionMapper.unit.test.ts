/**
 * fixture — API session payload → SessionData mapper for D03 detail/list.
 */

import { apiSessionToSessionData } from "../sessionData";

describe("apiSessionToSessionData (fixture)", () => {
  const fixtureApiSession = {
    id: "fixture-session-corniche",
    title: "Sortie testeurs — Corniche",
    spot: "Corniche Ain Diab",
    dateLabel: "Sam. 31",
    dateISO: "2026-10-31",
    timeMinutes: 1080,
    typeLabel: "Marche",
    volume: "6 km",
    targetPace: "6:00 /km",
    estimatedDistanceKm: 6,
    recommendedGroupId: "all",
    clubId: "fixture-club",
    visibility: "public",
    meetingPoint: "Devant le phare",
    hostGroupName: "Club Testeurs Stito",
    workoutId: null,
    attendanceStatus: "joined" as const,
    paceGroups: [
      {
        id: "all",
        label: "Tous",
        paceRange: "6:00 /km",
        runnersCount: 3,
      },
    ],
  };

  it("maps workout/pace/time/location/places fields from API fixture", () => {
    const s = apiSessionToSessionData(fixtureApiSession);
    expect(s.id).toBe("fixture-session-corniche");
    expect(s.title).toContain("Corniche");
    expect(s.spot).toBe("Corniche Ain Diab");
    expect(s.meetingPoint).toBe("Devant le phare");
    expect(s.timeMinutes).toBe(1080);
    expect(s.targetPace).toBe("6:00 /km");
    expect(s.estimatedDistanceKm).toBe(6);
    expect(s.volume).toBe("6 km");
    expect(s.attendanceStatus).toBe("joined");
    expect(s.paceGroups).toHaveLength(1);
    expect(s.paceGroups[0]?.id).toBe("all");
    expect(s.experience?.activity).toBe("walk");
  });

  it("keeps empty paceGroups empty (no invented group)", () => {
    const s = apiSessionToSessionData({
      ...fixtureApiSession,
      recommendedGroupId: "",
      paceGroups: [],
    });
    expect(s.paceGroups).toEqual([]);
  });
});
