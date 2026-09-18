// PATCH /api/v1/clubs/:id/members/:userId/dues – admin toggles cash dues paid

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "../../../../../../../../lib/server/auth-helpers";
import { requireClubPermission } from "../../../../../../../../lib/server/role-checks";
import { prisma } from "../../../../../../../../lib/server/prisma";
import { jsonOk, jsonError } from "../../../../../../../../lib/server/api-response";
import { clubIdParamSchema } from "../../../../../../../../lib/server/validators";

const bodySchema = z.object({
  duesPaid: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const authUserId = await requireAuth(req);
    const params = await context.params;
    const parsedClub = clubIdParamSchema.safeParse({ id: params.id });
    if (!parsedClub.success) {
      return jsonError("Invalid clubId", "VALIDATION_ERROR", 400);
    }

    const clubId = parsedClub.data.id;
    const targetUserId = params.userId?.trim();
    if (!targetUserId) {
      return jsonError("Invalid userId", "VALIDATION_ERROR", 400);
    }

    await requireClubPermission(authUserId, clubId, "manage_club");

    const membership = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: targetUserId, clubId } },
    });
    if (!membership || membership.status !== "approved") {
      return jsonError("Member not found", "NOT_FOUND", 404);
    }

    const body = await req.json().catch(() => null);
    const parsedBody = bodySchema.safeParse(body ?? {});
    if (!parsedBody.success) {
      return jsonError("Invalid payload", "VALIDATION_ERROR", 400);
    }

    const updated = await prisma.clubMembership.update({
      where: { userId_clubId: { userId: targetUserId, clubId } },
      data: { duesPaid: parsedBody.data.duesPaid },
    });

    return jsonOk({
      membership: {
        id: updated.id,
        userId: updated.userId,
        clubId: updated.clubId,
        duesPaid: updated.duesPaid,
        status: updated.status,
        role: updated.role,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", "FORBIDDEN", 403);
    }
    console.error("Patch member dues:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
