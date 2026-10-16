/**
 * finishOnboarding must persist auth before clearing draft — otherwise
 * auth-gate sends the user back to the first onboarding screen.
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

describe("finishOnboarding auth persistence", () => {
  beforeEach(() => {
    memory.clear();
    jest.resetModules();
    process.env.EXPO_PUBLIC_DEMO_MODE = "false";
    process.env.EXPO_PUBLIC_USE_MOCK_API = "true";
  });

  it("registers mock user and leaves auth stored (no onboarding loop)", async () => {
    const { patchOnboardingState } = await import("../onboardingStore");
    const { finishOnboarding } = await import("../onboardingComplete");
    const { getAuthData } = await import("../authStore");
    const { getOnboardingState } = await import("../onboardingStore");

    await patchOnboardingState({
      phone: "+2120708060337", // malformed leading 0 — must normalize
      code: "123456",
      firstName: "Noa",
      role: "solo",
      discoveryMode: true,
      goal: "marche",
      cadence: 3,
    });

    await finishOnboarding();

    const auth = await getAuthData();
    expect(auth).not.toBeNull();
    expect(auth?.user.phone.replace(/\D/g, "")).toContain("708060337");
    expect(auth?.user.phone.replace(/\D/g, "")).not.toContain("0708060337");

    const draft = await getOnboardingState();
    expect(draft.phone).toBeUndefined();
  });

  it("throws when phone/code missing instead of clearing into an auth-less home", async () => {
    const { finishOnboarding } = await import("../onboardingComplete");
    const { getAuthData } = await import("../authStore");

    await expect(finishOnboarding({})).rejects.toThrow(/Téléphone ou code/);
    expect(await getAuthData()).toBeNull();
  });

  it("normalizes 0708060337 to +212708060337", async () => {
    const { normalizePhone } = await import("../phone-normalize");
    expect(normalizePhone("0708060337")).toBe("+212708060337");
    expect(normalizePhone("+2120708060337")).toBe("+212708060337");
    expect(normalizePhone("+212708060337")).toBe("+212708060337");
  });
});
