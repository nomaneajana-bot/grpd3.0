// POST /api/v1/clubs/:id/request – membership request

import { NextRequest } from "next/server";
import { MembershipStatus } from "@prisma/client";
import { requireAuth } from "@/lib/server/auth-helpers";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
import { clubIdParamSchema } from "@/lib/server/validators";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = requireAuth(req);
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

    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return jsonError("Club not found", "NOT_FOUND", 404);

    const existing = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId, clubId } },
    });
    if (existing) {
      return jsonError(
        "Membership request already exists",
        "VALIDATION_ERROR",
        409,
      );
    }

    const membership = await prisma.clubMembership.create({
      data: { userId, clubId, status: MembershipStatus.pending },
    });

    return jsonOk(membership);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Club request:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
