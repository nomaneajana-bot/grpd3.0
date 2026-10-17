import {
  formatKmTotal,
  isConfirmedParticipation,
  isPendingParticipation,
  sumPastDistanceKm,
} from "@/lib/mesSortiesViewModel";
import type { SessionData } from "@/lib/sessionData";

function session(partial: Partial<SessionData> & { id: string }): SessionData {
  return {
    title: "Test",
    spot: "Spot",
    dateLabel: "SAMEDI",
    typeLabel: "FOOTING",
    volume: "",
    targetPace: "5:30",
    paceGroups: [],
    recommendedGroupId: "B",
    estimatedDistanceKm: 8,
    ...partial,
  } as SessionData;
}

describe("mesSortiesViewModel", () => {
  it("treats joined attendance as confirmed", () => {
    const s = session({ id: "a", attendanceStatus: "joined" });
    expect(isConfirmedParticipation(s, new Set())).toBe(true);
  });

  it("treats requested as pending not confirmed", () => {
    const s = session({ id: "b", attendanceStatus: "requested" });
    expect(isPendingParticipation(s)).toBe(true);
    expect(isConfirmedParticipation(s, new Set(["b"]))).toBe(false);
  });

  it("sums past distances", () => {
    const list = [
      session({ id: "1", estimatedDistanceKm: 10.2 }),
      session({ id: "2", estimatedDistanceKm: 5.1 }),
    ];
    expect(sumPastDistanceKm(list)).toBeCloseTo(15.3);
    expect(formatKmTotal(15.3)).toBe("15,3 km");
  });
});
