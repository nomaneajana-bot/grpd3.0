// GET /api/v1/clubs/:id

import { NextRequest } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
import { getAuthUserId } from "@/lib/server/auth-helpers";
import { hasClubPermission } from "@/lib/server/role-checks";
import { clubIdParamSchema } from "@/lib/server/validators";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
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

    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) return jsonError("Club not found", "NOT_FOUND", 404);

    const [membersCount, sessionsCount] = await prisma.$transaction([
      prisma.clubMembership.count({
        where: { clubId, status: "approved" },
      }),
      prisma.session.count({ where: { clubId } }),
    ]);

    // Pending memberships are governance data — only coach/admin may see them.
    let pendingMembers: Array<{
      id: string;
      userId: string;
      displayName: string | null;
      status: string;
      role: string;
      requestedAt: Date;
    }> = [];

    const viewerId = await getAuthUserId(req);
    if (
      viewerId &&
      (await hasClubPermission(viewerId, clubId, "manage_club"))
    ) {
      const pending = await prisma.clubMembership.findMany({
        where: { clubId, status: "pending" },
        select: {
          id: true,
          userId: true,
          displayName: true,
          status: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      });
      pendingMembers = pending.map((m) => ({
        id: m.id,
        userId: m.userId,
        displayName: m.displayName ?? null,
        status: m.status,
        role: m.role,
        requestedAt: m.createdAt,
      }));
    }

    return jsonOk({
      club: {
        ...club,
        membersCount,
        sessionsCount,
      },
      pendingMembers,
    });
  } catch (e) {
    console.error("Get club:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
