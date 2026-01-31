// GET /api/v1/clubs/:id

import { NextRequest } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
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

    const [membersCount, sessionsCount, pendingMembers] =
      await prisma.$transaction([
        prisma.clubMembership.count({
          where: { clubId, status: "approved" },
        }),
        prisma.session.count({ where: { clubId } }),
        prisma.clubMembership.findMany({
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
        }),
      ]);

    return jsonOk({
      club: {
        ...club,
        membersCount,
        sessionsCount,
      },
      pendingMembers: pendingMembers.map((m) => ({
        id: m.id,
        userId: m.userId,
        displayName: m.displayName ?? null,
        status: m.status,
        role: m.role,
        requestedAt: m.createdAt,
      })),
    });
  } catch (e) {
    console.error("Get club:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
