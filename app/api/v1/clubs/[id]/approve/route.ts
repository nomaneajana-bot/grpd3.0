// POST /api/v1/clubs/:id/approve – admin/coach approves membership

import { NextRequest } from "next/server";
import { MembershipStatus } from "@prisma/client";
import { requireAuth } from "@/lib/server/auth-helpers";
import { requireClubPermission } from "@/lib/server/role-checks";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
import { clubIdParamSchema, approveBodySchema } from "@/lib/server/validators";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = requireAuth(req);
    const params = await context.params;
    const paramParsed = clubIdParamSchema.safeParse(params);
    if (!paramParsed.success) {
      return jsonError(
        paramParsed.error.errors[0]?.message ?? "Invalid clubId",
        "VALIDATION_ERROR",
        400,
      );
    }
    const clubId = paramParsed.data.id;

    const body = await req.json();
    const bodyParsed = approveBodySchema.safeParse(body);
    if (!bodyParsed.success) {
      return jsonError(
        bodyParsed.error.errors[0]?.message ?? "membershipId is required",
        "VALIDATION_ERROR",
        400,
      );
    }
    const { membershipId } = bodyParsed.data;

    await requireClubPermission(userId, clubId, "approve_members");

    const membership = await prisma.clubMembership.update({
      where: { id: membershipId },
      data: { status: MembershipStatus.approved },
    });

    return jsonOk(membership);
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") {
        return jsonError("Unauthorized", "UNAUTHORIZED", 401);
      }
      if (e.message === "FORBIDDEN") {
        return jsonError("Forbidden", "FORBIDDEN", 403);
      }
    }
    console.error("Approve membership:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
