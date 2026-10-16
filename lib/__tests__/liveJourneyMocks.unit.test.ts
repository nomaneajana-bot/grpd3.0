/**
 * Unit coverage for live-journey fixes (explicit mock + club focus helpers).
 */

describe("assignMemberToClubGroup — no invented Élite", () => {
  it("defaults to open/social group D when no PR and no admin assignment", async () => {
    jest.resetModules();
    const { assignMemberToClubGroup } = await import("../clubPaceGroups");
    const group = assignMemberToClubGroup({
      userId: "user_hash_would_have_been_A_sometimes",
      membershipId: "mem_1",
      role: "admin",
      status: "approved",
      displayName: "Creator",
      sharePrs: false,
      prSummary: null,
    } as any);
    expect(group).toBe("D");
  });
});

describe("walk club admin defaults", () => {
  it("do not use Élite / Sub 4:30 labels", async () => {
    jest.resetModules();
    const {
      defaultWalkClubAdminSettings,
      defaultClubAdminSettings,
    } = await import("../clubAdminStore");
    const walk = defaultWalkClubAdminSettings();
    expect(walk.activityStructure).toBe("walk");
    const blob = JSON.stringify(walk.groups);
    expect(blob).not.toMatch(/Élite|Elite|Sub 4:30/i);
    expect(walk.groups.some((g) => /Conversation|Ouvert|Marche/i.test(g.displayName ?? ""))).toBe(
      true,
    );

    const run = defaultClubAdminSettings();
    expect(run.activityStructure).toBe("run");
    expect(run.groups[0].displayName).toMatch(/Élite/);
  });
});
