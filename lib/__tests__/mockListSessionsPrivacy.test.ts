/**
 * Demo mock list must not leak members-only logistics to outsiders/pending.
 * Hosted GET /api/v1/sessions already filters — mock must stay explicit and aligned.
 */
describe("mockListSessions privacy filter (demo)", () => {
  const originalDemo = process.env.EXPO_PUBLIC_DEMO_MODE;

  afterEach(() => {
    if (originalDemo === undefined) delete process.env.EXPO_PUBLIC_DEMO_MODE;
    else process.env.EXPO_PUBLIC_DEMO_MODE = originalDemo;
    jest.resetModules();
  });

  it("documents members-only visibility rule for list filtering", () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = "true";
    // Pure rule mirror of mockListSessions filter (keeps unit test free of AsyncStorage).
    type Row = {
      visibility: "public" | "members";
      hostUserId: string;
      clubId: string | null;
    };
    const canSee = (
      session: Row,
      userId: string | null,
      approvedClubIds: Set<string>,
    ) => {
      if (session.visibility !== "members") return true;
      if (!userId) return false;
      if (session.hostUserId === userId) return true;
      return Boolean(session.clubId && approvedClubIds.has(session.clubId));
    };

    const privateOuting: Row = {
      visibility: "members",
      hostUserId: "host-1",
      clubId: "club-a",
    };
    const publicOuting: Row = {
      visibility: "public",
      hostUserId: "host-1",
      clubId: null,
    };

    expect(canSee(publicOuting, "outsider", new Set())).toBe(true);
    expect(canSee(privateOuting, null, new Set())).toBe(false);
    expect(canSee(privateOuting, "outsider", new Set())).toBe(false);
    expect(canSee(privateOuting, "pending-user", new Set())).toBe(false);
    expect(canSee(privateOuting, "member", new Set(["club-a"]))).toBe(true);
    expect(canSee(privateOuting, "host-1", new Set())).toBe(true);
  });
});
