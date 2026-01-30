// GET /api/v1/me/memberships

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth-helpers";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";

export async function GET(req: NextRequest) {
  try {
    const userId = requireAuth(req);

    const memberships = await prisma.clubMembership.findMany({
      where: { userId },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            visibility: true,
            _count: {
              select: { memberships: { where: { status: "approved" } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = memberships.map((m) => ({
      ...m,
      club: { ...m.club, membersCount: m.club._count.memberships },
    }));

    return jsonOk(data);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Get memberships:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
