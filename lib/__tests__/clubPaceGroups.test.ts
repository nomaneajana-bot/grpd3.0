import {
  assignMemberToClubGroup,
  bucketMembersByGroup,
  emptyGroupBuckets,
  paceSecondsToClubGroupId,
} from "../clubPaceGroups";
import {
  defaultClubAdminSettings,
  type ClubAdminSettings,
} from "../clubAdminStore";
import type { ClubRosterMember } from "@/types/api";

function member(
  patch: Partial<ClubRosterMember> & { userId: string },
): ClubRosterMember {
  return {
    membershipId: `m-${patch.userId}`,
    role: "member",
    status: "approved",
    sharePrs: false,
    displayName: patch.displayName ?? patch.userId,
    ...patch,
  };
}

function settingsWith(
  patch: Partial<ClubAdminSettings>,
): ClubAdminSettings {
  const base = defaultClubAdminSettings();
  return {
    ...base,
    ...patch,
    groups: patch.groups ?? base.groups,
    memberGroups: patch.memberGroups ?? base.memberGroups,
  };
}

describe("assignMemberToClubGroup", () => {
  it("prefers explicit admin home-group assignment over pace/hash", () => {
    const m = member({
      userId: "u1",
      prSummary: {
        updatedAt: new Date().toISOString(),
        records: [
          {
            label: "5k",
            distanceMeters: 5000,
            paceSecondsPerKm: 240,
          },
        ],
      },
    });
    const settings = settingsWith({ memberGroups: { u1: "C" } });
    expect(assignMemberToClubGroup(m, settings)).toBe("C");
  });

  it("uses pace when no admin assignment", () => {
    const m = member({
      userId: "u2",
      prSummary: {
        updatedAt: new Date().toISOString(),
        records: [
          {
            label: "5k",
            distanceMeters: 5000,
            paceSecondsPerKm: 300,
          },
        ],
      },
    });
    expect(assignMemberToClubGroup(m, null)).toBe("B");
    expect(paceSecondsToClubGroupId(300)).toBe("B");
  });

  it("defaults to open/social group D without pace (no invented Élite)", () => {
    const m = member({ userId: "stable-user-xyz" });
    const a = assignMemberToClubGroup(m, null);
    const b = assignMemberToClubGroup(m, null);
    expect(a).toBe("D");
    expect(a).toBe(b);
    expect(["A", "B", "C", "D"]).toContain(a);
  });
});

describe("bucketMembersByGroup", () => {
  it("counts each member exactly once and matches TOI assignment path", () => {
    const roster = [
      member({ userId: "a" }),
      member({ userId: "b" }),
      member({ userId: "c" }),
    ];
    const settings = settingsWith({
      memberGroups: { a: "A", b: "A", c: "D" },
    });
    const buckets = bucketMembersByGroup(roster, settings);
    expect(buckets.A.count).toBe(2);
    expect(buckets.B.count).toBe(0);
    expect(buckets.C.count).toBe(0);
    expect(buckets.D.count).toBe(1);
    const total =
      buckets.A.count +
      buckets.B.count +
      buckets.C.count +
      buckets.D.count;
    expect(total).toBe(roster.length);
    for (const m of roster) {
      const gid = assignMemberToClubGroup(m, settings);
      expect(buckets[gid].count).toBeGreaterThanOrEqual(1);
    }
  });

  it("moves a member: decrement source, increment target, no duplicates", () => {
    const roster = [
      member({ userId: "host" }),
      member({ userId: "runner" }),
    ];
    const before = settingsWith({
      memberGroups: { host: "B", runner: "B" },
    });
    const after = settingsWith({
      memberGroups: { host: "B", runner: "C" },
    });
    const b0 = bucketMembersByGroup(roster, before);
    const b1 = bucketMembersByGroup(roster, after);
    expect(b0.B.count).toBe(2);
    expect(b1.B.count).toBe(1);
    expect(b1.C.count).toBe(1);
    expect(
      b1.A.count + b1.B.count + b1.C.count + b1.D.count,
    ).toBe(2);
    expect(assignMemberToClubGroup(roster[1], after)).toBe("C");
  });

  it("keeps club memberGroups isolated (two clubs)", () => {
    const roster = [member({ userId: "shared-user" })];
    const clubA = settingsWith({ memberGroups: { "shared-user": "A" } });
    const clubB = settingsWith({ memberGroups: { "shared-user": "D" } });
    expect(bucketMembersByGroup(roster, clubA).A.count).toBe(1);
    expect(bucketMembersByGroup(roster, clubA).D.count).toBe(0);
    expect(bucketMembersByGroup(roster, clubB).D.count).toBe(1);
    expect(bucketMembersByGroup(roster, clubB).A.count).toBe(0);
  });

  it("emptyGroupBuckets starts at zero", () => {
    const empty = emptyGroupBuckets();
    expect(empty.A.count).toBe(0);
    expect(empty.B.count).toBe(0);
    expect(empty.C.count).toBe(0);
    expect(empty.D.count).toBe(0);
  });
});
