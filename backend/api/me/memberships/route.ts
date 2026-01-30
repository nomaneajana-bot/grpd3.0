// GET /api/me/memberships - Get current user's club memberships

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../lib/auth-helpers";
import { prisma } from "../../lib/prisma";

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
              select: {
                memberships: {
                  where: {
                    status: "approved",
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      ok: true,
      data: memberships.map((m) => ({
        ...m,
        club: {
          ...m.club,
          membersCount: m.club._count.memberships,
        },
      })),
    });
  } catch (error) {
    console.error("Failed to get memberships:", error);
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { ok: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}
