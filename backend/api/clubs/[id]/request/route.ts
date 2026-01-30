// POST /api/clubs/:id/request - Request membership to a club

import { NextRequest, NextResponse } from "next/server";
import { MembershipStatus } from "@prisma/client";
import { requireAuth } from "../../../lib/auth-helpers";
import { prisma } from "../../../lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = requireAuth(req);
    const clubId = params.id;

    // Check if club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json(
        { ok: false, error: { message: "Club not found", code: "NOT_FOUND" } },
        { status: 404 },
      );
    }

    // Check if membership already exists
    const existing = await prisma.clubMembership.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: "Membership request already exists",
            code: "VALIDATION_ERROR",
          },
        },
        { status: 409 },
      );
    }

    // Create membership request
    const membership = await prisma.clubMembership.create({
      data: {
        userId,
        clubId,
        status: MembershipStatus.pending,
      },
    });

    return NextResponse.json({ ok: true, data: membership });
  } catch (error) {
    console.error("Failed to request membership:", error);
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
