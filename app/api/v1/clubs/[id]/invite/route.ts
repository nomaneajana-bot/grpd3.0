// POST /api/v1/clubs/:id/invite – create invite code (admin/coach only)

import { NextRequest } from "next/server";
import { inviteCreateSchema } from "../../../../../../lib/server/community-input";
import { randomBytes } from "crypto";
import { requireAuth } from "../../../../../../lib/server/auth-helpers";
import { requireClubPermission } from "../../../../../../lib/server/role-checks";
import { prisma } from "../../../../../../lib/server/prisma";
import { jsonOk, jsonError } from "../../../../../../lib/server/api-response";
import { clubIdParamSchema } from "../../../../../../lib/server/validators";

function generateInviteCode(): string {
  return randomBytes(16).toString("hex").toUpperCase();
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireAuth(req);
    const params = await context.params;
    const parsed = clubIdParamSchema.safeParse(params);
    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Invalid clubId",
        "VALIDATION_ERROR",
        400,
      );
    }
    const clubId = parsed.data.id;

    const parsedBody = inviteCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsedBody.success) return jsonError("Invalid invite: use a shareable code and expiry of 1–30 days", "VALIDATION_ERROR", 400);
    const { invitedPhone, invitedEmail, role, expiresInDays } = parsedBody.data;

    await requireClubPermission(userId, clubId, "invite");

    if (role !== "member") {
      const issuer = await prisma.clubMembership.findUnique({ where: { userId_clubId: { userId, clubId } } });
      if (issuer?.role !== "admin") return jsonError("Only admins can invite elevated roles", "FORBIDDEN", 403);
    }
    let code = generateInviteCode();
    let attempts = 0;
    while (
      (await prisma.clubInvite.findUnique({ where: { code } })) &&
      attempts < 10
    ) {
      code = generateInviteCode();
      attempts++;
    }
    if (attempts >= 10) {
      return jsonError("Failed to generate unique code", "INTERNAL_ERROR", 500);
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const invite = await prisma.clubInvite.create({
      data: {
        clubId,
        code,
        invitedPhone: invitedPhone ?? null,
        invitedEmail: invitedEmail ?? null,
        role,
        expiresAt,
      },
    });

    return jsonOk(invite);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") {
        return jsonError("Unauthorized", "UNAUTHORIZED", 401);
      }
      if (e.message === "FORBIDDEN") {
        return jsonError("Forbidden", "FORBIDDEN", 403);
      }
    }
    console.error("Create invite:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
