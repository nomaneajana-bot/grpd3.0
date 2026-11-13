// POST /api/v1/auth/pin/login — beta PIN allowlist (no SMS)

import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonError, jsonOk } from "../../../../../../lib/server/api-response";
import {
  getAccessTokenTtlSeconds,
  signAppAccessToken,
} from "../../../../../../lib/server/app-jwt";
import {
  findAllowlistUser,
  isPinAllowlistEnabled,
} from "../../../../../../lib/server/pin-allowlist";
import { normalizePhone } from "../../../../../../lib/server/phone-normalize";

const bodySchema = z.object({
  phone: z.string().min(8),
  pin: z.string().regex(/^\d{6}$/),
  deviceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!isPinAllowlistEnabled()) {
      return jsonError(
        "PIN login is not configured",
        "PIN_AUTH_DISABLED",
        503,
      );
    }

    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonError("Invalid request", "VALIDATION_ERROR", 400);
    }

    const phone = normalizePhone(parsed.data.phone);
    const match = findAllowlistUser(phone, parsed.data.pin);
    if (!match) {
      return jsonError("Code incorrect", "INVALID_PIN", 401);
    }

    const accessToken = await signAppAccessToken(match.userId);
    const ttl = getAccessTokenTtlSeconds();

    return jsonOk({
      user: {
        id: match.userId,
        phone: match.phone,
        profileComplete: match.profileComplete,
      },
      tokens: {
        accessToken,
        expiresInSeconds: ttl,
        refreshToken: accessToken,
        refreshExpiresInSeconds: ttl,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("AUTH_JWT_SECRET")) {
      return jsonError("Server auth misconfigured", "INTERNAL_ERROR", 500);
    }
    console.error("PIN login:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
