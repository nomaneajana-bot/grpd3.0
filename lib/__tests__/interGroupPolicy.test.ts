import {
  effectiveSessionGroupPolicy,
  resolveCrossGroupJoinState,
} from "../interGroupPolicy";
import {
  defaultClubAdminSettings,
  type ClubAdminSettings,
} from "../clubAdminStore";

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

describe("effectiveSessionGroupPolicy", () => {
  it("returns warn by default when inter-group access is enabled", () => {
    const s = defaultClubAdminSettings();
    expect(effectiveSessionGroupPolicy("A", s)).toBe("warn");
  });

  it("returns locked when club inter-group access is disabled", () => {
    const s = settingsWith({ interGroupAccessEnabled: false });
    expect(effectiveSessionGroupPolicy("A", s)).toBe("locked");
  });

  it("uses session group override when not inherit", () => {
    const s = settingsWith({
      groups: defaultClubAdminSettings().groups.map((g) =>
        g.id === "A" ? { ...g, accessPolicy: "free" } : g,
      ),
    });
    expect(effectiveSessionGroupPolicy("A", s)).toBe("free");
  });

  it("migrates legacy warning to warn on read", () => {
    const s = settingsWith({
      defaultInterGroupPolicy: "warn",
      groups: defaultClubAdminSettings().groups.map((g) =>
        g.id === "A" ? { ...g, accessPolicy: "inherit" } : g,
      ),
    });
    expect(effectiveSessionGroupPolicy("A", s)).toBe("warn");
  });
});

describe("resolveCrossGroupJoinState", () => {
  const base = defaultClubAdminSettings();

  it("returns same_group when runner and session share a group", () => {
    expect(
      resolveCrossGroupJoinState({
        memberGroupId: "B",
        sessionTargetGroupId: "B",
        settings: base,
      }),
    ).toBe("same_group");
  });

  it("returns warn for cross-group when session group inherits club warn", () => {
    expect(
      resolveCrossGroupJoinState({
        memberGroupId: "B",
        sessionTargetGroupId: "A",
        settings: base,
      }),
    ).toBe("warn");
  });

  it("returns locked when session target group policy is locked", () => {
    const s = settingsWith({
      groups: base.groups.map((g) =>
        g.id === "A" ? { ...g, accessPolicy: "locked" } : g,
      ),
    });
    expect(
      resolveCrossGroupJoinState({
        memberGroupId: "B",
        sessionTargetGroupId: "A",
        settings: s,
      }),
    ).toBe("locked");
  });

  it("returns free when session target group policy is free", () => {
    const s = settingsWith({
      groups: base.groups.map((g) =>
        g.id === "A" ? { ...g, accessPolicy: "free" } : g,
      ),
    });
    expect(
      resolveCrossGroupJoinState({
        memberGroupId: "B",
        sessionTargetGroupId: "A",
        settings: s,
      }),
    ).toBe("free");
  });

  it("does not use runner home group policy for cross-group decision", () => {
    const s = settingsWith({
      defaultInterGroupPolicy: "warn",
      groups: base.groups.map((g) => {
        if (g.id === "A") return { ...g, accessPolicy: "locked" };
        if (g.id === "B") return { ...g, accessPolicy: "free" };
        return g;
      }),
    });
    expect(
      resolveCrossGroupJoinState({
        memberGroupId: "B",
        sessionTargetGroupId: "A",
        settings: s,
      }),
    ).toBe("locked");
  });
});
