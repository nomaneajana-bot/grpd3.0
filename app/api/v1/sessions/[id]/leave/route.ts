// POST /api/v1/sessions/:id/leave – runner leaves session (sets status to left)

import { NextRequest } from "next/server";
import { prisma } from "../../../../../../lib/server/prisma";
import { jsonOk, jsonError } from "../../../../../../lib/server/api-response";
import { requireAuth } from "../../../../../../lib/server/auth-helpers";
import { sessionIdParamSchema } from "../../../../../../lib/server/validators";
import { getLeaveUpdateData } from "../../../../../../lib/attendanceStatusLogic";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireAuth(req);
    const params = await context.params;
    const parsedParams = sessionIdParamSchema.safeParse(params);
    if (!parsedParams.success) {
      return jsonError(
        parsedParams.error.errors[0]?.message ?? "Invalid sessionId",
        "VALIDATION_ERROR",
        400,
      );
    }

    const sessionId = parsedParams.data.id;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) return jsonError("Session not found", "NOT_FOUND", 404);

    const existingAttendance = await prisma.sessionAttendance.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });

    if (!existingAttendance) return jsonError("Participation not found", "NOT_FOUND", 404);
    const attendance = await prisma.sessionAttendance.update({
      where: { sessionId_userId: { sessionId, userId } },
      data: getLeaveUpdateData(),
    });

    return jsonOk({
      attendance: {
        id: attendance.id,
        sessionId: attendance.sessionId,
        userId: attendance.userId,
        status: attendance.status,
        groupId: attendance.groupId,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Leave session:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
