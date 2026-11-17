import {
  emptyColorGroupsSettingsPatch,
  isMemberOrgEnabled,
  memberAssignedGroupId,
  migrateLegacyPaceGroupsToColorGroups,
  starterTemplates,
  type MemberOrgSettingsSlice,
} from "../clubMemberGroups";
import {
  defaultClubAdminSettings,
  defaultWalkClubAdminSettings,
  mergeClubAdminSettings,
} from "../clubAdminStore";

describe("club member color groups v1", () => {
  it("defaults new clubs with org off and no invented A–D chrome", () => {
    const run = defaultClubAdminSettings();
    const walk = defaultWalkClubAdminSettings();
    expect(run.memberOrgEnabled).toBe(false);
    expect(walk.memberOrgEnabled).toBe(false);
    expect(run.colorGroups).toEqual([]);
    expect(walk.colorGroups).toEqual([]);
    expect(run.groups.every((g) => g.active === false)).toBe(true);
  });

  it("does not invent TOI when org is off", () => {
    const settings = {
      ...emptyColorGroupsSettingsPatch("walk"),
      activityStructure: "walk" as const,
      memberGroups: { u1: "A" },
    };
    expect(isMemberOrgEnabled(settings)).toBe(false);
    expect(memberAssignedGroupId("u1", settings)).toBeNull();
  });

  it("migrates legacy active run A–D into color groups", () => {
    const input: MemberOrgSettingsSlice = {
      activityStructure: "run",
      groups: [
        {
          id: "A" as const,
          paceLabel: "Sub 4:30/km",
          active: true,
          displayName: "Groupe A — Élite",
        },
        {
          id: "B" as const,
          paceLabel: "4:30–5:30/km",
          active: true,
          displayName: "Groupe B",
        },
        {
          id: "C" as const,
          paceLabel: "x",
          active: true,
          displayName: "C",
        },
        {
          id: "D" as const,
          paceLabel: "y",
          active: true,
          displayName: "D",
        },
      ],
      memberGroups: { host: "B" },
    };
    const migrated = migrateLegacyPaceGroupsToColorGroups(input);
    expect(migrated.memberOrgEnabled).toBe(true);
    expect(migrated.colorGroups?.length).toBe(4);
    expect(memberAssignedGroupId("host", migrated)).toBe("B");
  });

  it("walk merge stays opted out without inventing groups", () => {
    const merged = mergeClubAdminSettings({
      activityStructure: "walk",
      groups: [],
      memberGroups: {},
    });
    expect(merged.memberOrgEnabled).toBe(false);
    expect(merged.colorGroups ?? []).toEqual([]);
  });

  it("starter templates respect soft structure", () => {
    expect(starterTemplates("empty")).toEqual([]);
    expect(starterTemplates("walk3")).toHaveLength(3);
    expect(starterTemplates("run4")).toHaveLength(4);
  });
});
