import { SignJWT, jwtVerify } from "jose";

const ISSUER = "grpd";
const ACCESS_TTL_SECONDS = 7 * 24 * 60 * 60;

function getSecret(): Uint8Array | null {
  const secret =
    process.env.AUTH_JWT_SECRET?.trim() ||
    process.env.SUPABASE_JWT_SECRET?.trim();
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export function getAccessTokenTtlSeconds(): number {
  return ACCESS_TTL_SECONDS;
}

export async function signAppAccessToken(userId: string): Promise<string> {
  const secret = getSecret();
  if (!secret) {
    throw new Error("AUTH_JWT_SECRET is not configured");
  }
  return await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(secret);
}

export async function verifyAppAccessToken(
  token: string,
): Promise<string | null> {
  const secret = getSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: ISSUER,
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
