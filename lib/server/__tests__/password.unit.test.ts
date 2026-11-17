import {
  hashPassword,
  normalizeEmail,
  normalizePassword,
  verifyPassword,
} from "../password";

describe("password helpers", () => {
  it("normalizes email trim + lowercase", () => {
    expect(normalizeEmail("  Cam.Ile@Example.COM ")).toBe("cam.ile@example.com");
  });

  it("trims password whitespace from autofill/paste", () => {
    expect(normalizePassword("  secret12  ")).toBe("secret12");
  });

  it("verifies scrypt hash for exact password", () => {
    const stored = hashPassword("secret12");
    expect(verifyPassword("secret12", stored)).toBe(true);
    expect(verifyPassword("wrong-pass", stored)).toBe(false);
  });

  it("register+login stay consistent when both sides trim", () => {
    const stored = hashPassword(normalizePassword("  secret12  "));
    expect(verifyPassword(normalizePassword("secret12 "), stored)).toBe(true);
  });
});
