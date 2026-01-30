// GET /api/clubs/:id - Get club details with members summary

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const clubId = params.id;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        memberships: {
          where: {
            status: "approved",
          },
          select: {
            id: true,
            userId: true,
            role: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            memberships: {
              where: {
                status: "approved",
              },
            },
            sessions: true,
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json(
        { ok: false, error: { message: "Club not found", code: "NOT_FOUND" } },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...club,
        membersCount: club._count.memberships,
        sessionsCount: club._count.sessions,
      },
    });
  } catch (error) {
    console.error("Failed to get club:", error);
    return NextResponse.json(
      { ok: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}
