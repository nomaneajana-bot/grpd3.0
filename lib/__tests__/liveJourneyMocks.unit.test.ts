/**
 * Unit coverage for live-journey fixes (explicit mock + club focus helpers).
 */

describe("assignMemberToClubGroup — no invented Élite", () => {
  it("defaults to open/social group D on run clubs when no PR and no admin assignment", async () => {
    jest.resetModules();
    const { assignMemberToClubGroup } = await import("../clubPaceGroups");
    const { defaultClubAdminSettings } = await import("../clubAdminStore");
    const group = assignMemberToClubGroup(
      {
        userId: "user_hash_would_have_been_A_sometimes",
        membershipId: "mem_1",
        role: "admin",
        status: "approved",
        displayName: "Creator",
        sharePrs: false,
        prSummary: null,
      } as any,
      defaultClubAdminSettings(),
    );
    expect(group).toBe("D");
  });

  it("does not auto-assign a pace group on walk clubs when pace was skipped", async () => {
    jest.resetModules();
    const { assignMemberToClubGroup } = await import("../clubPaceGroups");
    const { defaultWalkClubAdminSettings } = await import("../clubAdminStore");
    const group = assignMemberToClubGroup(
      {
        userId: "walk_creator",
        membershipId: "mem_w",
        role: "admin",
        status: "approved",
        displayName: "Revue",
        sharePrs: false,
        prSummary: null,
      } as any,
      defaultWalkClubAdminSettings(),
    );
    expect(group).toBeNull();
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
    expect(walk.memberOrgEnabled).toBe(false);
    expect(walk.colorGroups ?? []).toEqual([]);
    const blob = JSON.stringify(walk);
    expect(blob).not.toMatch(/Élite|Elite|Sub 4:30/i);

    const run = defaultClubAdminSettings();
    expect(run.activityStructure).toBe("run");
    expect(run.memberOrgEnabled).toBe(false);
    expect(run.colorGroups ?? []).toEqual([]);
    expect(JSON.stringify(run)).not.toMatch(/Élite|Elite|Sub 4:30/i);
  });
});
