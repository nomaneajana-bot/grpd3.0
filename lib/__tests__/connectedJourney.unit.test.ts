/**
 * fixture — connected join policy + Mes sorties merge after join.
 */

import {
  allowLocalCatalogFallback,
  canRecordJoinLocally,
  joinedIdsFromAttendance,
  mergeJoinedSessionIntoMine,
} from "../connectedJourney";

describe("connectedJourney join → Mes sorties (fixture)", () => {
  it("forbids local catalog / silent join success when connected", () => {
    expect(allowLocalCatalogFallback(false)).toBe(false);
    expect(
      canRecordJoinLocally({ useMock: false, apiJoined: false }),
    ).toBe(false);
    expect(
      canRecordJoinLocally({ useMock: false, apiJoined: true }),
    ).toBe(true);
  });

  it("allows local join only in demo/mock when API did not join", () => {
    expect(allowLocalCatalogFallback(true)).toBe(true);
    expect(
      canRecordJoinLocally({ useMock: true, apiJoined: false }),
    ).toBe(true);
  });

  it("builds joined ids from real attendanceStatus", () => {
    const ids = joinedIdsFromAttendance([
      { id: "a", attendanceStatus: "joined" },
      { id: "b", attendanceStatus: "requested" },
      { id: "c", attendanceStatus: null },
      { id: "d", attendanceStatus: "left" },
    ]);
    expect([...ids]).toEqual(["a"]);
  });

  it("merges successful join into Mes sorties list with joined status", () => {
    const mine: {
      id: string;
      attendanceStatus: "joined" | "requested" | null;
    }[] = [
      { id: "x", attendanceStatus: "requested" },
      { id: "y", attendanceStatus: "joined" },
    ];
    const after = mergeJoinedSessionIntoMine(mine, {
      id: "fixture-session-corniche",
      attendanceStatus: null,
    });
    expect(after).toHaveLength(3);
    const joined = after.find((s) => s.id === "fixture-session-corniche");
    expect(joined?.attendanceStatus).toBe("joined");

    const updated = mergeJoinedSessionIntoMine(after, {
      id: "x",
      attendanceStatus: null,
    });
    expect(updated.find((s) => s.id === "x")?.attendanceStatus).toBe("joined");
    expect(updated).toHaveLength(3);
  });
});
