// jose is ESM-only; use native dynamic imports from the server runtime.

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
  const trimmed = userId.trim();
  if (!trimmed) {
    throw new Error("userId is required");
  }
  const secret = getSecret();
  if (!secret) {
    throw new Error("AUTH_JWT_SECRET is not configured");
  }
  const { SignJWT } = await import("jose");
  return await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(trimmed)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(secret);
}

/**
 * Verify app HS256 access token.
 * Enforces alg HS256, issuer, nonempty sub, required finite numeric exp
 * (reject when exp <= now), and nbf when present.
 */
export async function verifyAppAccessToken(
  token: string,
): Promise<string | null> {
  const secret = getSecret();
  if (!secret || !token.trim()) return null;
  try {
    const { jwtVerify } = await import("jose");
    const { payload, protectedHeader } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      clockTolerance: 0,
      requiredClaims: ["sub", "exp", "iss"],
    });

    if (protectedHeader.alg !== "HS256") return null;

    if (typeof payload.sub !== "string" || !payload.sub.trim()) return null;

    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return null;
    }
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) return null;

    if (payload.nbf !== undefined) {
      if (typeof payload.nbf !== "number" || !Number.isFinite(payload.nbf)) {
        return null;
      }
      if (payload.nbf > now) return null;
    }

    return payload.sub.trim();
  } catch {
    return null;
  }
}
