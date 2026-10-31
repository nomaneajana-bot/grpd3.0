// PUT /api/v1/clubs/:id/member-group — set club home group (TOI), not outing attendance

import { NextRequest } from "next/server";
import { z } from "zod";

import { jsonError, jsonOk } from "../../../../../../lib/server/api-response";
import { requireAuth } from "../../../../../../lib/server/auth-helpers";
import { prisma } from "../../../../../../lib/server/prisma";
import { requireClubPermission } from "../../../../../../lib/server/role-checks";
import { clubIdParamSchema } from "../../../../../../lib/server/validators";

/**
 * Legacy pace groups A–D, or opt-in color-group ids (`g_…`).
 * When `eligibleGroupIds` is provided (from club admin settings), groupId
 * must be in that list — prevents assigning inactive/absent groups.
 * When omitted, only A–D are accepted (legacy callers).
 */
const bodySchema = z.object({
  userId: z.string().min(1),
  groupId: z.string().trim().min(1).max(64),
  eligibleGroupIds: z.array(z.string().min(1).max(64)).max(32).optional(),
});

const LEGACY_PACE = new Set(["A", "B", "C", "D"]);

function isEligibleGroupId(
  groupId: string,
  eligibleGroupIds: string[] | undefined,
): boolean {
  if (eligibleGroupIds && eligibleGroupIds.length > 0) {
    return eligibleGroupIds.includes(groupId);
  }
  return LEGACY_PACE.has(groupId);
}

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

    if (!isEligibleGroupId(body.data.groupId, body.data.eligibleGroupIds)) {
      return jsonError(
        "Group is not available for this club",
        "VALIDATION_ERROR",
        400,
      );
    }

    // Atomic: re-check approved membership; never touch SessionAttendance.
    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.clubMembership.findUnique({
        where: {
          userId_clubId: { userId: body.data.userId, clubId },
        },
      });
      if (!membership) {
        return { kind: "missing" as const };
      }
      if (membership.status !== "approved") {
        return { kind: "not_approved" as const, status: membership.status };
      }

      const updated = await tx.clubMembership.update({
        where: { id: membership.id },
        data: { homeGroupId: body.data.groupId },
      });

      return {
        kind: "ok" as const,
        homeGroupId: updated.homeGroupId,
        membershipId: updated.id,
      };
    });

    if (result.kind === "missing") {
      return jsonError("Member not found", "NOT_FOUND", 404);
    }
    if (result.kind === "not_approved") {
      return jsonError(
        "Member is not an approved club member",
        "FORBIDDEN",
        403,
      );
    }

    return jsonOk({
      ok: true as const,
      homeGroupId: result.homeGroupId,
      membershipId: result.membershipId,
    });
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
