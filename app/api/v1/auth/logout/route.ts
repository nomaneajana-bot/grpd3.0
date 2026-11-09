// POST /api/v1/auth/logout
// Stateless JWT: acknowledges logout; client must discard tokens.
// Does not claim a global denylist unless one is introduced later.

import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "../../../../../lib/server/api-response";
import { requireAuth } from "../../../../../lib/server/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req);
    // Body refreshToken/deviceId accepted for forward-compat; unused for HS256 JWT.
    try {
      await req.json();
    } catch {
      /* empty body ok */
    }
    return jsonOk({
      ok: true as const,
      serverRevocation: "not_applicable_stateless_jwt" as const,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Logout:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
