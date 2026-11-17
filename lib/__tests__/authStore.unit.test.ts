/**
 * fixture — auth store token persistence for email login journey.
 */

const authStoreMemory = new Map<string, string>();

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => authStoreMemory.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => {
      authStoreMemory.set(k, v);
    }),
    removeItem: jest.fn(async (k: string) => {
      authStoreMemory.delete(k);
    }),
    multiSet: jest.fn(async (pairs: [string, string][]) => {
      for (const [k, v] of pairs) authStoreMemory.set(k, v);
    }),
    multiGet: jest.fn(async (keys: string[]) =>
      keys.map(
        (k) => [k, authStoreMemory.get(k) ?? null] as [string, string | null],
      ),
    ),
    multiRemove: jest.fn(async (keys: string[]) => {
      for (const k of keys) authStoreMemory.delete(k);
    }),
  },
}));

describe("authStore token state (fixture)", () => {
  beforeEach(() => {
    authStoreMemory.clear();
    jest.resetModules();
  });

  it("stores and reads access token + user after email login shape", async () => {
    const {
      storeAuthData,
      getAccessToken,
      getAuthUser,
      isAuthenticated,
      clearAuthData,
    } = await import("../authStore");

    expect(await isAuthenticated()).toBe(false);

    await storeAuthData({
      tokens: {
        accessToken: "fixture-access-token",
        expiresInSeconds: 3600,
        refreshToken: "fixture-refresh-token",
        refreshExpiresInSeconds: 86400,
      },
      user: {
        id: "fixture-user-1",
        phone: "",
        email: "fixture@example.com",
        name: "Fixture Runner",
        profileComplete: true,
      },
      deviceId: "fixture-device",
    });

    expect(await isAuthenticated()).toBe(true);
    expect(await getAccessToken()).toBe("fixture-access-token");
    const user = await getAuthUser();
    expect(user?.email).toBe("fixture@example.com");
    expect(user?.id).toBe("fixture-user-1");

    await clearAuthData();
    expect(await isAuthenticated()).toBe(false);
    expect(await getAccessToken()).toBeNull();
  });

  it("rehydrates from web localStorage mirror when AsyncStorage empty", async () => {
    const ls = new Map<string, string>();
    const localStorageMock: Storage = {
      get length() {
        return ls.size;
      },
      clear: () => ls.clear(),
      key: (i: number) => [...ls.keys()][i] ?? null,
      getItem: (k: string) => ls.get(k) ?? null,
      setItem: (k: string, v: string) => {
        ls.set(k, v);
      },
      removeItem: (k: string) => {
        ls.delete(k);
      },
    };
    const g = globalThis as typeof globalThis & { window?: Window & typeof globalThis };
    const prev = g.window;
    g.window = { localStorage: localStorageMock } as Window & typeof globalThis;

    const { storeAuthData, getAuthData, clearAuthData } = await import(
      "../authStore"
    );

    await storeAuthData({
      tokens: {
        accessToken: "mirrored-access",
        expiresInSeconds: 3600,
        refreshToken: "mirrored-refresh",
        refreshExpiresInSeconds: 86400,
      },
      user: {
        id: "mirror-user",
        phone: "",
        email: "mirror@example.com",
        name: "Mirror",
        profileComplete: true,
      },
      deviceId: "mirror-device",
    });

    expect(ls.get("grpd_auth_tokens_v1")).toContain("mirrored-access");

    // Simulate refresh where in-memory AsyncStorage was wiped but localStorage kept.
    authStoreMemory.clear();
    const restored = await getAuthData();
    expect(restored?.tokens.accessToken).toBe("mirrored-access");
    expect(restored?.user.email).toBe("mirror@example.com");

    await clearAuthData();
    expect(ls.get("grpd_auth_tokens_v1")).toBeUndefined();
    if (prev) g.window = prev;
    else Reflect.deleteProperty(g, "window");
  });
});


