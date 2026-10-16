import { createHmac, timingSafeEqual } from "crypto";

const ISSUER = "grpd";
const ACCESS_TTL_SECONDS = 7 * 24 * 60 * 60;

function getSecret(): string | null {
  const secret =
    process.env.AUTH_JWT_SECRET?.trim() ||
    process.env.SUPABASE_JWT_SECRET?.trim();
  return secret || null;
}

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlJson(value: unknown): string {
  return b64url(JSON.stringify(value));
}

export function getAccessTokenTtlSeconds(): number {
  return ACCESS_TTL_SECONDS;
}

/** HS256 app access token (Node crypto — Jest + Vercel Node compatible). */
export async function signAppAccessToken(userId: string): Promise<string> {
  const secret = getSecret();
  if (!secret) {
    throw new Error("AUTH_JWT_SECRET is not configured");
  }
  const now = Math.floor(Date.now() / 1000);
  const header = b64urlJson({ alg: "HS256", typ: "JWT" });
  const payload = b64urlJson({
    sub: userId,
    iss: ISSUER,
    iat: now,
    exp: now + ACCESS_TTL_SECONDS,
  });
  const data = `${header}.${payload}`;
  const sig = createHmac("sha256", secret).update(data).digest();
  return `${data}.${b64url(sig)}`;
}

export async function verifyAppAccessToken(
  token: string,
): Promise<string | null> {
  const secret = getSecret();
  if (!secret || !token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const data = `${headerB64}.${payloadB64}`;
    const expected = createHmac("sha256", secret).update(data).digest();
    const actual = Buffer.from(
      sigB64.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    );
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
      return null;
    }
    const payloadJson = Buffer.from(
      payloadB64.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    const payload = JSON.parse(payloadJson) as {
      sub?: unknown;
      iss?: unknown;
      exp?: unknown;
    };
    if (payload.iss !== ISSUER) return null;
    if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
