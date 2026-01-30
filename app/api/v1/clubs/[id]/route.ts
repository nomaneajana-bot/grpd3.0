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
      include: {
        memberships: {
          where: { status: "approved" },
          select: { id: true, userId: true, role: true, createdAt: true },
        },
        _count: {
          select: {
            memberships: { where: { status: "approved" } },
            sessions: true,
          },
        },
      },
    });

    if (!club) return jsonError("Club not found", "NOT_FOUND", 404);

    return jsonOk({
      ...club,
      membersCount: club._count.memberships,
      sessionsCount: club._count.sessions,
    });
  } catch (e) {
    console.error("Get club:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
