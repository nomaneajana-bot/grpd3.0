/**
 * App JWT (jose HS256) — claim enforcement for Batch6 auth.
 * Synthetic secret only.
 */

process.env.AUTH_JWT_SECRET = "batch6-app-jwt-unit-secret-not-for-prod";
delete process.env.SUPABASE_JWT_SECRET;

import { createHmac } from "crypto";
import { signAppAccessToken, verifyAppAccessToken } from "@/lib/server/app-jwt";

const SECRET = process.env.AUTH_JWT_SECRET!;

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function mintRaw(opts: {
  header?: Record<string, unknown>;
  payload: Record<string, unknown>;
  secret?: string;
}): string {
  const header = b64url(
    JSON.stringify(opts.header ?? { alg: "HS256", typ: "JWT" }),
  );
  const payload = b64url(JSON.stringify(opts.payload));
  const data = `${header}.${payload}`;
  const sig = createHmac("sha256", opts.secret ?? SECRET)
    .update(data)
    .digest();
  return `${data}.${b64url(sig)}`;
}

describe("app-jwt (jose)", () => {
  it("signs and verifies nonempty subject", async () => {
    const token = await signAppAccessToken("user_ok");
    expect(await verifyAppAccessToken(token)).toBe("user_ok");
  });

  it("rejects empty / whitespace subject on sign", async () => {
    await expect(signAppAccessToken("")).rejects.toThrow(/userId/i);
    await expect(signAppAccessToken("   ")).rejects.toThrow(/userId/i);
  });

  it("rejects missing exp", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = mintRaw({
      payload: { sub: "u1", iss: "grpd", iat: now },
    });
    expect(await verifyAppAccessToken(token)).toBeNull();
  });

  it("rejects non-numeric (string) exp", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = mintRaw({
      payload: {
        sub: "u1",
        iss: "grpd",
        iat: now,
        exp: String(now + 3600),
      },
    });
    expect(await verifyAppAccessToken(token)).toBeNull();
  });

  it("rejects exp at now and expired", async () => {
    const now = Math.floor(Date.now() / 1000);
    const atNow = mintRaw({
      payload: { sub: "u1", iss: "grpd", iat: now - 1, exp: now },
    });
    const expired = mintRaw({
      payload: { sub: "u1", iss: "grpd", iat: now - 120, exp: now - 60 },
    });
    expect(await verifyAppAccessToken(atNow)).toBeNull();
    expect(await verifyAppAccessToken(expired)).toBeNull();
  });

  it("rejects empty subject", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = mintRaw({
      payload: { sub: "   ", iss: "grpd", iat: now, exp: now + 3600 },
    });
    expect(await verifyAppAccessToken(token)).toBeNull();
  });

  it("rejects wrong issuer", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = mintRaw({
      payload: { sub: "u1", iss: "other", iat: now, exp: now + 3600 },
    });
    expect(await verifyAppAccessToken(token)).toBeNull();
  });

  it("rejects wrong / ignored algorithm header (none)", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = mintRaw({
      header: { alg: "none", typ: "JWT" },
      payload: { sub: "u1", iss: "grpd", iat: now, exp: now + 3600 },
    });
    expect(await verifyAppAccessToken(token)).toBeNull();
  });

  it("rejects future nbf when present", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = mintRaw({
      payload: {
        sub: "u1",
        iss: "grpd",
        iat: now,
        exp: now + 3600,
        nbf: now + 600,
      },
    });
    expect(await verifyAppAccessToken(token)).toBeNull();
  });

  it("accepts past nbf when present", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = mintRaw({
      payload: {
        sub: "u1",
        iss: "grpd",
        iat: now - 10,
        exp: now + 3600,
        nbf: now - 5,
      },
    });
    expect(await verifyAppAccessToken(token)).toBe("u1");
  });

  it("rejects forged / wrong-signature tokens", async () => {
    const good = await signAppAccessToken("u1");
    const parts = good.split(".");
    const forged = `${parts[0]}.${parts[1]}.${b64url("not-the-sig")}`;
    const wrongSecret = mintRaw({
      payload: {
        sub: "u1",
        iss: "grpd",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      secret: "different-secret-also-not-for-prod",
    });
    expect(await verifyAppAccessToken(forged)).toBeNull();
    expect(await verifyAppAccessToken(wrongSecret)).toBeNull();
    expect(await verifyAppAccessToken("not-a-jwt")).toBeNull();
    expect(await verifyAppAccessToken("")).toBeNull();
  });
});
