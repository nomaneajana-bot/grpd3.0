// POST /api/v1/sessions/:id/request – non-member requests to join session

import { NextRequest } from "next/server";
import { AttendanceStatus, SessionVisibility } from "@prisma/client";
import { requireAuth } from "@/lib/server/auth-helpers";
import { hasClubPermission } from "@/lib/server/role-checks";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
import { sessionIdParamSchema } from "@/lib/server/validators";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = requireAuth(req);
    const params = await context.params;
    const parsed = sessionIdParamSchema.safeParse(params);
    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Invalid sessionId",
        "VALIDATION_ERROR",
        400,
      );
    }
    const sessionId = parsed.data.id;

    const body = await req.json().catch(() => ({}));
    const { groupId } = body;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { club: true },
    });

    if (!session) {
      return jsonError("Session not found", "NOT_FOUND", 404);
    }

    if (session.visibility === SessionVisibility.members && session.clubId) {
      const hasAccess = await hasClubPermission(userId, session.clubId, "view");
      if (hasAccess) {
        return jsonError(
          "Already a member of this club",
          "VALIDATION_ERROR",
          409,
        );
      }
    }

    const existing = await prisma.sessionAttendance.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (existing) {
      return jsonError(
        "Already requested/joined this session",
        "VALIDATION_ERROR",
        409,
      );
    }

    const attendance = await prisma.sessionAttendance.create({
      data: {
        sessionId,
        userId,
        status: AttendanceStatus.requested,
        groupId: groupId ?? null,
      },
    });

    return jsonOk(attendance);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Session request:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
