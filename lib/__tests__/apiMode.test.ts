/**
 * Explicit mock/demo vs connected — missing API URL must not silently mock.
 */

describe("api transport mode", () => {
  const originalDemo = process.env.EXPO_PUBLIC_DEMO_MODE;
  const originalMock = process.env.EXPO_PUBLIC_USE_MOCK_API;
  const originalUrl = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    if (originalDemo === undefined) delete process.env.EXPO_PUBLIC_DEMO_MODE;
    else process.env.EXPO_PUBLIC_DEMO_MODE = originalDemo;
    if (originalMock === undefined) delete process.env.EXPO_PUBLIC_USE_MOCK_API;
    else process.env.EXPO_PUBLIC_USE_MOCK_API = originalMock;
    if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = originalUrl;
    jest.resetModules();
  });

  it("DEMO_MODE forces mock even with API URL", async () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = "true";
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
    delete process.env.EXPO_PUBLIC_USE_MOCK_API;
    jest.resetModules();
    const { isMockEnabled, resolveApiTransport } = await import("../api/mode");
    expect(isMockEnabled("https://api.example.com")).toBe(true);
    const t = await resolveApiTransport("https://api.example.com");
    expect(t.mode).toBe("demo");
    expect(t.useMock).toBe(true);
  });

  it("EXPO_PUBLIC_USE_MOCK_API is explicit mock (not connected)", async () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = "false";
    process.env.EXPO_PUBLIC_USE_MOCK_API = "true";
    delete process.env.EXPO_PUBLIC_API_URL;
    jest.resetModules();
    const { isMockEnabled, resolveApiTransport } = await import("../api/mode");
    expect(isMockEnabled("")).toBe(true);
    const t = await resolveApiTransport("");
    expect(t.mode).toBe("mock");
    expect(t.useMock).toBe(true);
  });

  it("missing API URL does NOT enable mock via isMockEnabled", async () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = "false";
    delete process.env.EXPO_PUBLIC_USE_MOCK_API;
    delete process.env.EXPO_PUBLIC_API_URL;
    jest.resetModules();
    const { isMockEnabled } = await import("../api/mode");
    expect(isMockEnabled("")).toBe(false);
    expect(isMockEnabled(undefined)).toBe(false);
  });

  it("assertConnectedApiUrl throws actionable MISSING_API_URL off-web", async () => {
    jest.resetModules();
    const { assertConnectedApiUrl } = await import("../api/mode");
    const { ApiError } = await import("../api/errors");
    expect(() => assertConnectedApiUrl("")).toThrow(ApiError);
    try {
      assertConnectedApiUrl("");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as InstanceType<typeof ApiError>).code).toBe("MISSING_API_URL");
      expect((e as Error).message).toMatch(/EXPO_PUBLIC_API_URL/);
    }
  });

  it("assertConnectedApiUrl allows empty URL on web (same-origin)", async () => {
    jest.resetModules();
    const g = globalThis as { window?: { location: { origin: string } } };
    const prev = g.window;
    g.window = { location: { origin: "https://example.vercel.app" } };
    try {
      const { assertConnectedApiUrl } = await import("../api/mode");
      expect(() => assertConnectedApiUrl("")).not.toThrow();
    } finally {
      if (prev === undefined) delete g.window;
      else g.window = prev;
    }
  });

  it("connected mode with URL does not use mock", async () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = "false";
    delete process.env.EXPO_PUBLIC_USE_MOCK_API;
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
    jest.resetModules();
    jest.doMock("../authStore", () => ({
      shouldUseMockApi: jest.fn(async () => false),
    }));
    const { resolveApiTransport } = await import("../api/mode");
    const t = await resolveApiTransport();
    expect(t.mode).toBe("connected");
    expect(t.useMock).toBe(false);
    expect(t.apiUrl).toBe("https://api.example.com");
  });

  it("ApiClient.request throws MISSING_API_URL when connected without URL", async () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = "false";
    delete process.env.EXPO_PUBLIC_USE_MOCK_API;
    delete process.env.EXPO_PUBLIC_API_URL;
    jest.resetModules();
    jest.doMock("../authStore", () => ({
      shouldUseMockApi: jest.fn(async () => false),
      getAccessToken: jest.fn(async () => null),
    }));
    const { createApiClient } = await import("../api/client");
    const { ApiError } = await import("../api/errors");
    const client = createApiClient({ baseUrl: "" });
    await expect(client.request("/api/v1/health")).rejects.toMatchObject({
      code: "MISSING_API_URL",
    });
    await expect(client.request("/api/v1/health")).rejects.toBeInstanceOf(
      ApiError,
    );
  });
});
