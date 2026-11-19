// POST /api/v1/auth/email/register — self-serve signup (user chooses password)

import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonError, jsonOk } from "../../../../../../lib/server/api-response";
import {
  getAccessTokenTtlSeconds,
  signAppAccessToken,
} from "../../../../../../lib/server/app-jwt";
import {
  hashPassword,
  isValidEmail,
  normalizeEmail,
} from "../../../../../../lib/server/password";
import { prisma } from "../../../../../../lib/server/prisma";

const bodySchema = z.object({
  email: z.string().min(3).max(254),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(80).optional(),
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

    const existing = await prisma.appUser.findUnique({ where: { email } });
    if (existing) {
      return jsonError(
        "Un compte existe déjà avec cet email",
        "VALIDATION_ERROR",
        409,
      );
    }

    const displayName =
      parsed.data.displayName?.trim() || email.split("@")[0] || "Runner";

    const user = await prisma.appUser.create({
      data: {
        email,
        passwordHash: hashPassword(parsed.data.password),
        displayName,
        profileComplete: true,
      },
    });

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
    console.error("Email register:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
