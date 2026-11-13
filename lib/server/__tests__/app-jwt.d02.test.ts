/**
 * D02 — JWT issuer/verify checks (no database).
 * Synthetic secret only.
 */

process.env.AUTH_JWT_SECRET = "d02-jwt-unit-secret-not-for-prod";
delete process.env.SUPABASE_JWT_SECRET;

import {
  getAccessTokenTtlSeconds,
  signAppAccessToken,
  verifyAppAccessToken,
} from "@/lib/server/app-jwt";

describe("D02 app JWT", () => {
  it("signs and verifies a token with expected issuer/subject", async () => {
    const token = await signAppAccessToken("user_d02_jwt");
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
    const sub = await verifyAppAccessToken(token);
    expect(sub).toBe("user_d02_jwt");
    expect(getAccessTokenTtlSeconds()).toBeGreaterThan(0);
  });

  it("rejects empty subject on sign", async () => {
    await expect(signAppAccessToken("   ")).rejects.toThrow(/userId/i);
  });

  it("rejects token signed with a different secret", async () => {
    const token = await signAppAccessToken("user_d02_jwt");
    const prev = process.env.AUTH_JWT_SECRET;
    process.env.AUTH_JWT_SECRET = "other-secret-not-for-prod-xx";
    // Module caches secret via getSecret() per call — env change is enough.
    const sub = await verifyAppAccessToken(token);
    expect(sub).toBeNull();
    process.env.AUTH_JWT_SECRET = prev;
  });

  it("rejects expired tokens", async () => {
    const { createHmac } = await import("crypto");
    const b64url = (input: Buffer | string) => {
      const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
      return buf
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    };
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = b64url(
      JSON.stringify({
        sub: "user_expired",
        iss: "grpd",
        iat: now - 120,
        exp: now - 30,
      }),
    );
    const data = `${header}.${body}`;
    const sig = createHmac("sha256", process.env.AUTH_JWT_SECRET!)
      .update(data)
      .digest();
    const token = `${data}.${b64url(sig)}`;
    expect(await verifyAppAccessToken(token)).toBeNull();
  });
});
