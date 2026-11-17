/**
 * Wrong OTP must surface as Code invalide — never masked by PIN "Compte introuvable".
 */

process.env.EXPO_PUBLIC_DEMO_MODE = "false";
process.env.EXPO_PUBLIC_USE_MOCK_API = "true";

const loginMemory = new Map<string, string>();

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (k: string) => loginMemory.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => {
      loginMemory.set(k, v);
    }),
    removeItem: jest.fn(async (k: string) => {
      loginMemory.delete(k);
    }),
    multiSet: jest.fn(async (pairs: [string, string][]) => {
      for (const [k, v] of pairs) loginMemory.set(k, v);
    }),
    multiGet: jest.fn(async (keys: string[]) =>
      keys.map((k) => [k, loginMemory.get(k) ?? null] as [string, string | null]),
    ),
    multiRemove: jest.fn(async (keys: string[]) => {
      for (const k of keys) loginMemory.delete(k);
    }),
    getAllKeys: jest.fn(async () => [...loginMemory.keys()]),
    clear: jest.fn(async () => loginMemory.clear()),
  },
}));

describe("mock OTP wrong code (DEMO_MODE=false)", () => {
  beforeEach(() => {
    loginMemory.clear();
    jest.resetModules();
    process.env.EXPO_PUBLIC_DEMO_MODE = "false";
    process.env.EXPO_PUBLIC_USE_MOCK_API = "true";
  });

  it("request then wrong code → Code invalide (not Compte introuvable)", async () => {
    const { mockApiRequest } = await import("../api/mock");
    const phone = "+212708060337";
    const otp = await mockApiRequest<{ requestId: string }>(
      "/api/v1/auth/otp/request",
      {
        method: "POST",
        body: JSON.stringify({ phone, channel: "sms" }),
      },
    );
    expect(otp.requestId).toBeTruthy();

    await expect(
      mockApiRequest("/api/v1/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({
          phone,
          code: "000000",
          requestId: otp.requestId,
          deviceId: "device_test",
        }),
      }),
    ).rejects.toMatchObject({ message: expect.stringMatching(/Code invalide/i) });

    await expect(
      mockApiRequest("/api/v1/auth/pin/login", {
        method: "POST",
        body: JSON.stringify({ phone, pin: "000000" }),
      }),
    ).rejects.toMatchObject({
      message: expect.stringMatching(/Compte introuvable|Code incorrect/i),
    });
  });

  it("correct mock code 123456 verifies", async () => {
    const { mockApiRequest } = await import("../api/mock");
    const phone = "+212708060337";
    const otp = await mockApiRequest<{ requestId: string }>(
      "/api/v1/auth/otp/request",
      {
        method: "POST",
        body: JSON.stringify({ phone, channel: "sms" }),
      },
    );
    const result = await mockApiRequest<{ user: { phone: string } }>(
      "/api/v1/auth/otp/verify",
      {
        method: "POST",
        body: JSON.stringify({
          phone,
          code: "123456",
          requestId: otp.requestId,
          deviceId: "device_test",
        }),
      },
    );
    expect(result.user.phone).toContain("708060337");
  });
});
