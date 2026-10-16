/**
 * Explicit mock (DEMO_MODE=false) must persist create + allow get/join.
 * Reproduces live-journey failures for private walk + discover join.
 */

process.env.EXPO_PUBLIC_DEMO_MODE = "false";
process.env.EXPO_PUBLIC_USE_MOCK_API = "true";

const memory = new Map<string, string>();

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

describe("mock session persistence without DEMO_MODE", () => {
  beforeEach(() => {
    memory.clear();
    jest.resetModules();
    process.env.EXPO_PUBLIC_DEMO_MODE = "false";
    process.env.EXPO_PUBLIC_USE_MOCK_API = "true";
  });

  async function seedUser() {
    const { storeAuthData } = await import("../authStore");
    await storeAuthData({
      user: {
        id: "user_live_review",
        phone: "+212708060337",
        profileComplete: true,
      },
      tokens: {
        accessToken: "tok",
        refreshToken: "ref",
        expiresInSeconds: 3600,
        refreshExpiresInSeconds: 86400,
      },
      deviceId: "device_test",
    });
  }

  it("create members-only walk → get by id succeeds for host", async () => {
    await seedUser();
    const { mockApiRequest } = await import("../api/mock");

    const club = await mockApiRequest<{ id: string }>("/api/v1/clubs", {
      method: "POST",
      body: JSON.stringify({
        name: "Revue Walk",
        purpose: "English walk",
        visibility: "members",
      }),
    });
    expect(club.id).toMatch(/^club_/);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateISO = tomorrow.toISOString().slice(0, 10);

    const session = await mockApiRequest<{
      id: string;
      hostUserId: string;
      title: string;
    }>("/api/v1/sessions", {
      method: "POST",
      body: JSON.stringify({
        title: "English walk — revue",
        spot: "Marina",
        dateLabel: "DEMAIN",
        dateISO,
        timeMinutes: 16 * 60,
        typeLabel: "Marche",
        volume: "",
        targetPace: "",
        estimatedDistanceKm: 0,
        recommendedGroupId: "",
        visibility: "members",
        clubId: club.id,
        coachAdvice: "Pratiquer les présentations",
      }),
    });
    expect(session.id).toMatch(/^session_/);
    expect(session.hostUserId).toBe("user_live_review");

    const fetched = await mockApiRequest<{ id: string; title: string }>(
      `/api/v1/sessions/${session.id}`,
      { method: "GET" },
    );
    expect(fetched.id).toBe(session.id);
    expect(fetched.title).toMatch(/English walk/);
  });

  it("join explore fixture via resolve (not silent 404)", async () => {
    await seedUser();
    const { mockApiRequest } = await import("../api/mock");

    const joined = await mockApiRequest<{
      status: string;
      sessionId: string;
    }>("/api/v1/sessions/explore-sortie-longue-facile/join", {
      method: "POST",
      body: JSON.stringify({ groupId: "open" }),
    });
    expect(joined.status).toBe("joined");
    expect(joined.sessionId).toBe("explore-sortie-longue-facile");
  });
});
