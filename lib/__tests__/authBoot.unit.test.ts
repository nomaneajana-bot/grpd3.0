/**
 * Boot href after refresh: durable tokens ⇒ Accueil, else unauth landing.
 */

describe("authBoot resolveBootHref", () => {
  const originalDemo = process.env.EXPO_PUBLIC_DEMO_MODE;

  afterEach(() => {
    if (originalDemo === undefined) delete process.env.EXPO_PUBLIC_DEMO_MODE;
    else process.env.EXPO_PUBLIC_DEMO_MODE = originalDemo;
    jest.resetModules();
  });

  it("sends users with access token to Accueil (tabs)", async () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = "false";
    const { resolveBootHref, AUTHENTICATED_HOME_HREF } = await import(
      "../authBoot"
    );
    const href = resolveBootHref({
      tokens: {
        accessToken: "tok",
        expiresInSeconds: 3600,
        refreshToken: "ref",
        refreshExpiresInSeconds: 86400,
      },
      user: {
        id: "u1",
        phone: "",
        email: "a@b.com",
        name: "A",
        profileComplete: true,
      },
      deviceId: "d1",
    });
    expect(href).toBe(AUTHENTICATED_HOME_HREF);
  });

  it("sends users without tokens to onboarding when ONBOARDING_V2", async () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = "false";
    const { resolveBootHref } = await import("../authBoot");
    expect(resolveBootHref(null)).toBe("/(auth)/onboarding");
  });

  it("DEMO mode without tokens lands on /demo", async () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = "true";
    jest.resetModules();
    const { resolveBootHref } = await import("../authBoot");
    expect(resolveBootHref(null)).toBe("/demo");
  });
});
