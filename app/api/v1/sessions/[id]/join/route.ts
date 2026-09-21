// POST /api/v1/sessions/:id/join – join a session with group

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "../../../../../../lib/server/auth-helpers";
import { visibleSessionsWhere } from "../../../../../../lib/server/session-access";
import { prisma } from "../../../../../../lib/server/prisma";
import { jsonOk, jsonError } from "../../../../../../lib/server/api-response";
import { sessionIdParamSchema } from "../../../../../../lib/server/validators";


const bodySchema = z.object({
  groupId: z.string().trim().min(1).optional(),
});

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

    const body = await req.json().catch(() => null);
    const parsedBody = bodySchema.safeParse(body ?? {});
    if (!parsedBody.success) {
      return jsonError(
        parsedBody.error.errors[0]?.message ?? "Invalid payload",
        "VALIDATION_ERROR",
        400,
      );
    }

    const sessionId = parsedParams.data.id;
    let { groupId } = parsedBody.data;

    const session = await prisma.session.findFirst({
      where: { AND: [{ id: sessionId }, visibleSessionsWhere(userId)] },
    });
    if (!session) return jsonError("Session not found", "NOT_FOUND", 404);

    const community = session.experience && typeof session.experience === "object" && !Array.isArray(session.experience) && session.experience.kind === "community";
    if (community && (!session.dateISO || Date.parse(session.dateISO) <= Date.now())) return jsonError("Outing has already started", "VALIDATION_ERROR", 400);
    if (!groupId && !community) return jsonError("groupId is required", "VALIDATION_ERROR", 400);
    groupId = groupId ?? "community";
    const attendance = await prisma.sessionAttendance.upsert({
      where: { sessionId_userId: { sessionId, userId } },
      update: { groupId, status: "joined" },
      create: { sessionId, userId, groupId, status: "joined" },
    });

    return jsonOk(attendance);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Join session:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
