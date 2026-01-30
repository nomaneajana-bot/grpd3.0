// POST /api/sessions/:id/request - Non-member requests to join a session

import { NextRequest, NextResponse } from "next/server";
import { AttendanceStatus, SessionVisibility } from "@prisma/client";
import { requireAuth } from "../../../lib/auth-helpers";
import { hasClubPermission } from "../../../lib/role-checks";
import { prisma } from "../../../lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = requireAuth(req);
    const sessionId = params.id;
    const body = await req.json();
    const { groupId } = body;

    // Get session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        club: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { ok: false, error: { message: "Session not found", code: "NOT_FOUND" } },
        { status: 404 },
      );
    }

    // Check if session is members-only and user has access
    if (session.visibility === SessionVisibility.members && session.clubId) {
      const hasAccess = await hasClubPermission(userId, session.clubId, "view");
      if (!hasAccess) {
        return NextResponse.json(
          {
            ok: false,
            error: {
              message: "This session is members-only",
              code: "FORBIDDEN",
            },
          },
          { status: 403 },
        );
      }
    }

    // Check if already has attendance record
    const existing = await prisma.sessionAttendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "Already requested/joined this session" },
        },
        { status: 409 },
      );
    }

    // Create attendance request
    const attendance = await prisma.sessionAttendance.create({
      data: {
        sessionId,
        userId,
        status: AttendanceStatus.requested,
        groupId: groupId || null,
      },
    });

    return NextResponse.json({ ok: true, data: attendance });
  } catch (error) {
    console.error("Failed to request session attendance:", error);
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
