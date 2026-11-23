// POST /api/v1/auth/email/login — self-serve email + password

import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonError, jsonOk } from "../../../../../../lib/server/api-response";
import {
  getAccessTokenTtlSeconds,
  signAppAccessToken,
} from "../../../../../../lib/server/app-jwt";
import {
  isValidEmail,
  normalizeEmail,
  verifyPassword,
} from "../../../../../../lib/server/password";
import { prisma } from "../../../../../../lib/server/prisma";

const bodySchema = z.object({
  email: z.string().min(3).max(254),
  password: z.string().min(1).max(128),
  deviceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Requête invalide",
        "VALIDATION_ERROR",
        400,
      );
    }

    const email = normalizeEmail(parsed.data.email);
    if (!isValidEmail(email)) {
      return jsonError("Email invalide", "VALIDATION_ERROR", 400);
    }

    const user = await prisma.appUser.findUnique({ where: { email } });
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return jsonError("Email ou mot de passe incorrect", "UNAUTHORIZED", 401);
    }

    const accessToken = await signAppAccessToken(user.id);
    const ttl = getAccessTokenTtlSeconds();

    return jsonOk({
      user: {
        id: user.id,
        phone: "",
        email: user.email,
        name: user.displayName,
        profileComplete: user.profileComplete,
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
    console.error("Email login:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
