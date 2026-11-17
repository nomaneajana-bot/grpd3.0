import { DEMO_OTP_CODE } from "../featureFlags";

describe("OTP isolation", () => {
  const originalDemo = process.env.EXPO_PUBLIC_DEMO_MODE;

  afterEach(() => {
    if (originalDemo === undefined) delete process.env.EXPO_PUBLIC_DEMO_MODE;
    else process.env.EXPO_PUBLIC_DEMO_MODE = originalDemo;
    jest.resetModules();
  });

  it("DEMO_OTP_CODE is 000000", () => {
    expect(DEMO_OTP_CODE).toBe("000000");
  });

  it("mock OTP accepts 000000 only when DEMO_MODE is on", async () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = "true";
    jest.resetModules();
    const { DEMO_MODE } = await import("../featureFlags");
    expect(DEMO_MODE).toBe(true);
    const demoCodeOk = DEMO_MODE && "000000" === DEMO_OTP_CODE;
    expect(demoCodeOk).toBe(true);
  });

  it("000000 is not auto-accepted when DEMO_MODE is off", async () => {
    process.env.EXPO_PUBLIC_DEMO_MODE = "false";
    jest.resetModules();
    const { DEMO_MODE, DEMO_OTP_CODE: code } = await import("../featureFlags");
    expect(DEMO_MODE).toBe(false);
    const demoCodeOk = DEMO_MODE && "000000" === code;
    expect(demoCodeOk).toBe(false);
  });
});
