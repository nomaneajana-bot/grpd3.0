// PUT /api/v1/clubs/:id/member-group — set club home group (TOI), not outing attendance

import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonError, jsonOk } from "@/lib/server/api-response";
import { requireAuth } from "@/lib/server/auth-helpers";
import { prisma } from "@/lib/server/prisma";
import { requireClubPermission } from "@/lib/server/role-checks";
import { clubIdParamSchema } from "@/lib/server/validators";

const bodySchema = z.object({
  userId: z.string().min(1),
  groupId: z.enum(["A", "B", "C", "D"]),
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actorId = await requireAuth(req);
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
    await requireClubPermission(actorId, clubId, "manage_club");

    const body = bodySchema.safeParse(await req.json());
    if (!body.success) {
      return jsonError("Invalid request", "VALIDATION_ERROR", 400);
    }

    const membership = await prisma.clubMembership.findUnique({
      where: {
        userId_clubId: { userId: body.data.userId, clubId },
      },
    });
    if (!membership || membership.status !== "approved") {
      return jsonError("Member not found", "NOT_FOUND", 404);
    }

    await prisma.clubMembership.update({
      where: { id: membership.id },
      data: { homeGroupId: body.data.groupId },
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
