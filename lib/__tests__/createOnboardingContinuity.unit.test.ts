/**
 * Create-onboarding continuity: walk defaults, focus, display name, no TOI on skip.
 */

process.env.EXPO_PUBLIC_DEMO_MODE = "false";
process.env.EXPO_PUBLIC_USE_MOCK_API = "true";

const memory = new Map<string, string>();

jest.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => memory.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => {
      memory.set(k, v);
    }),
    removeItem: jest.fn(async (k: string) => {
      memory.delete(k);
    }),
    multiSet: jest.fn(async (pairs: [string, string][]) => {
      for (const [k, v] of pairs) memory.set(k, v);
    }),
    multiGet: jest.fn(async (keys: string[]) =>
      keys.map((k) => [k, memory.get(k) ?? null] as [string, string | null]),
    ),
    multiRemove: jest.fn(async (keys: string[]) => {
      for (const k of keys) memory.delete(k);
    }),
    getAllKeys: jest.fn(async () => [...memory.keys()]),
    clear: jest.fn(async () => memory.clear()),
  },
}));

jest.mock("@/lib/notifications", () => ({
  registerForPushNotificationsAsync: jest.fn(async () => null),
}));

describe("create onboarding continuity", () => {
  beforeEach(() => {
    memory.clear();
    jest.resetModules();
    process.env.EXPO_PUBLIC_DEMO_MODE = "false";
    process.env.EXPO_PUBLIC_USE_MOCK_API = "true";
  });

  it("finish creates deferred walk club, focuses it, sets display name, no Groupe D TOI", async () => {
    const { patchOnboardingState } = await import("../onboardingStore");
    const { finishOnboarding } = await import("../onboardingComplete");
    const { getFocusedClubId } = await import("../focusedClubStore");
    const { getClubAdminSettings } = await import("../clubAdminStore");
    const { MOCK_MEMBERSHIPS_KEY, MOCK_CLUBS_KEY } = await import(
      "../api/demoSeed"
    );
    const { assignMemberToClubGroup } = await import("../clubPaceGroups");
    const { getRunnerProfile } = await import("../profileStore");

    await patchOnboardingState({
      phone: "+212708060337",
      code: "123456",
      firstName: "Revue",
      city: "Casablanca",
      role: "coach",
      discoveryMode: true,
      pace: undefined,
      goal: "marche",
      cadence: 3,
      clubName: "Marche revue A",
      pendingClubCreate: {
        name: "Marche revue A",
        city: "Casablanca",
        purpose: "Marche & bien-être",
      },
    });

    await finishOnboarding();

    const profile = await getRunnerProfile();
    expect(profile?.firstName).toBe("Revue");
    expect(profile?.name).toBe("Revue");

    const focused = await getFocusedClubId();
    expect(focused).toBeTruthy();

    const clubsRaw = memory.get(MOCK_CLUBS_KEY);
    expect(clubsRaw).toBeTruthy();
    const clubs = JSON.parse(clubsRaw!);
    const club = Object.values(clubs).find(
      (c: any) => c.name === "Marche revue A",
    ) as any;
    expect(club).toBeTruthy();
    expect(focused).toBe(club.id);

    const settings = await getClubAdminSettings(club.id);
    expect(settings.activityStructure).toBe("walk");
    const blob = JSON.stringify(settings.groups);
    expect(blob).not.toMatch(/Élite|Elite|Sub 4:30/i);

    const memRaw = memory.get(MOCK_MEMBERSHIPS_KEY);
    expect(memRaw).toBeTruthy();
    const memberships = Object.values(JSON.parse(memRaw!)) as any[];
    const mine = memberships.find((m) => m.clubId === club.id);
    expect(mine?.role).toBe("admin");
    expect(mine?.displayName).toBe("Revue");

    const toi = assignMemberToClubGroup(
      {
        userId: mine.userId,
        membershipId: mine.id,
        role: "admin",
        status: "approved",
        displayName: mine.displayName,
        sharePrs: false,
        prSummary: null,
      } as any,
      settings,
    );
    expect(toi).toBeNull();
  });

  it("preserves a pre-existing run club while focusing the new walk club", async () => {
    const { MOCK_CLUBS_KEY, MOCK_MEMBERSHIPS_KEY } = await import(
      "../api/demoSeed"
    );
    const { defaultClubAdminSettings, saveClubAdminSettings, getClubAdminSettings } =
      await import("../clubAdminStore");
    const { setFocusedClubId, getFocusedClubId } = await import(
      "../focusedClubStore"
    );
    const { patchOnboardingState } = await import("../onboardingStore");
    const { finishOnboarding } = await import("../onboardingComplete");

    // Seed an existing run club (must survive).
    const oldId = "club_existing_run";
    memory.set(
      MOCK_CLUBS_KEY,
      JSON.stringify({
        [oldId]: {
          id: oldId,
          name: "j'aime courir",
          slug: "jaime-courir",
          city: "Casablanca",
          visibility: "public",
          createdAt: new Date().toISOString(),
          createdById: "seed",
        },
      }),
    );
    // Legacy run club (pre–member-org): active A–D with Élite label.
    await saveClubAdminSettings(oldId, {
      ...defaultClubAdminSettings(),
      memberOrgEnabled: true,
      activityStructure: "run",
      groups: [
        {
          id: "A",
          paceLabel: "Sub 4:30/km",
          active: true,
          displayName: "Groupe A — Élite",
          accessPolicy: "inherit",
        },
        {
          id: "B",
          paceLabel: "4:30–5:30/km",
          active: true,
          displayName: "Groupe B — Intermédiaire",
          accessPolicy: "inherit",
        },
        {
          id: "C",
          paceLabel: "5:30–7:00/km",
          active: true,
          displayName: "Groupe C — Découverte",
          accessPolicy: "inherit",
        },
        {
          id: "D",
          paceLabel: "7:00+/km",
          active: true,
          displayName: "Groupe D — Social",
          accessPolicy: "inherit",
        },
      ],
      colorGroups: [
        {
          id: "A",
          name: "Groupe A — Élite",
          colorKey: "red",
          note: "Sub 4:30/km",
          sortOrder: 0,
          active: true,
        },
      ],
    });
    await setFocusedClubId(oldId);

    await patchOnboardingState({
      phone: "+212708060337",
      code: "123456",
      firstName: "Revue",
      role: "coach",
      discoveryMode: true,
      goal: "marche",
      pendingClubCreate: {
        name: "English Walk B",
        city: "Rabat",
        purpose: "Marche & bien-être",
      },
    });

    await finishOnboarding();

    const focused = await getFocusedClubId();
    expect(focused).not.toBe(oldId);

    const oldSettings = await getClubAdminSettings(oldId);
    expect(oldSettings.activityStructure).toBe("run");
    expect(oldSettings.groups[0].displayName).toMatch(/Élite/);

    const clubs = JSON.parse(memory.get(MOCK_CLUBS_KEY)!);
    expect(clubs[oldId].name).toBe("j'aime courir");
    expect(
      Object.values(clubs).some((c: any) => c.name === "English Walk B"),
    ).toBe(true);

    // Memberships storage may only have the new club admin until seed user links —
    // focus must be the new club.
    expect(focused).toBeTruthy();
    void MOCK_MEMBERSHIPS_KEY;
  });
});
