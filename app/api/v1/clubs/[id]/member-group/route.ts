// PUT /api/v1/clubs/:id/member-group

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "../../../../../../lib/server/auth-helpers";
import { requireClubPermission } from "../../../../../../lib/server/role-checks";
import { prisma } from "../../../../../../lib/server/prisma";
import { jsonOk, jsonError } from "../../../../../../lib/server/api-response";
import { clubIdParamSchema } from "../../../../../../lib/server/validators";

const bodySchema = z.object({
  userId: z.string().min(1),
  groupId: z.enum(["A", "B", "C", "D"]),
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authUserId = await requireAuth(req);
    const params = await context.params;
    const parsedParams = clubIdParamSchema.safeParse(params);
    if (!parsedParams.success) {
      return jsonError(
        parsedParams.error.errors[0]?.message ?? "Invalid clubId",
        "VALIDATION_ERROR",
        400,
      );
    }

    const clubId = parsedParams.data.id;
    await requireClubPermission(authUserId, clubId, "manage_club");

    const body = await req.json().catch(() => null);
    const parsedBody = bodySchema.safeParse(body ?? {});
    if (!parsedBody.success) {
      return jsonError(
        parsedBody.error.errors[0]?.message ?? "Invalid payload",
        "VALIDATION_ERROR",
        400,
      );
    }

    const { userId, groupId } = parsedBody.data;
    const membership = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId, clubId } },
    });
    if (!membership || membership.status !== "approved") {
      return jsonError("Member not found", "NOT_FOUND", 404);
    }

    const prSummary = (membership.prSummary as Record<string, unknown> | null) ?? {};
    await prisma.clubMembership.update({
      where: { userId_clubId: { userId, clubId } },
      data: {
        prSummary: { ...prSummary, defaultGroup: groupId },
      },
    });

    return jsonOk({ ok: true as const });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return jsonError("Forbidden", "FORBIDDEN", 403);
    }
    console.error("Set member group:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
