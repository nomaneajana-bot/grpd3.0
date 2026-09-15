// GET /api/v1/clubs/:id/summary – member-safe club overview

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth-helpers";
import { hasClubPermission } from "@/lib/server/role-checks";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
import { clubIdParamSchema } from "@/lib/server/validators";

export async function GET(
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
    const canView = await hasClubPermission(userId, clubId, "view");
    if (!canView) {
      const club = await prisma.club.findUnique({
        where: { id: clubId },
        select: { visibility: true },
      });
      if (!club || club.visibility !== "public") {
        return jsonError("Forbidden", "FORBIDDEN", 403);
      }
    }

    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return jsonError("Club not found", "NOT_FOUND", 404);

    const membersCount = await prisma.clubMembership.count({
      where: { clubId, status: "approved" },
    });

    return jsonOk({
      club: {
        id: club.id,
        name: club.name,
        slug: club.slug,
        city: club.city,
        description: club.description,
        visibility: club.visibility,
        isPaid: club.isPaid,
        duesAmountCents: club.duesAmountCents,
        duesLabel: club.duesLabel,
        membersCount,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Club summary:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
