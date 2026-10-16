import type { createRemoteJWKSet } from "jose";

const supabaseUrl = process.env.SUPABASE_URL?.trim() ?? "";
const jwtSecret = process.env.SUPABASE_JWT_SECRET?.trim() ?? "";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getIssuer(): string {
  return `${supabaseUrl.replace(/\/$/, "")}/auth/v1`;
}

/**
 * Verifies a Supabase access token and returns the user id (JWT `sub`).
 */
export async function verifySupabaseAccessToken(
  token: string,
): Promise<string | null> {
  if (!token) return null;

  try {
    const { createRemoteJWKSet, jwtVerify } = await import("jose");
    if (jwtSecret && supabaseUrl) {
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ["HS256"],
        issuer: getIssuer(),
        audience: "authenticated",
      });
      return typeof payload.sub === "string" ? payload.sub : null;
    }

    if (supabaseUrl) {
      if (!jwks) {
        jwks = createRemoteJWKSet(
          new URL(`${getIssuer()}/.well-known/jwks.json`),
        );
      }
      const { payload } = await jwtVerify(token, jwks, {
        issuer: getIssuer(),
        audience: "authenticated",
      });
      return typeof payload.sub === "string" ? payload.sub : null;
    }

    return null;
  } catch {
    return null;
  }
}
