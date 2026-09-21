// POST /api/v1/sessions/:id/complete – mark session attended with optional actuals

import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "../../../../../../lib/server/auth-helpers";
import { prisma } from "../../../../../../lib/server/prisma";
import { jsonOk, jsonError } from "../../../../../../lib/server/api-response";
import { sessionIdParamSchema } from "../../../../../../lib/server/validators";
import { visibleSessionsWhere } from "../../../../../../lib/server/session-access";

const bodySchema = z.object({
  actualDistanceKm: z.number().positive().optional(),
  actualDurationMin: z.number().int().positive().optional(),
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

    const body = await req.json().catch(() => ({}));
    const parsedBody = bodySchema.safeParse(body);
    if (!parsedBody.success) {
      return jsonError(
        parsedBody.error.errors[0]?.message ?? "Invalid payload",
        "VALIDATION_ERROR",
        400,
      );
    }

    const sessionId = parsedParams.data.id;
    const session = await prisma.session.findFirst({
      where: { AND: [{ id: sessionId }, visibleSessionsWhere(userId)] },
      select: { id: true },
    });
    if (!session) return jsonError("Session not found", "NOT_FOUND", 404);
    const existing = await prisma.sessionAttendance.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });

    if (!existing || !["joined", "attended"].includes(existing.status)) {
      return jsonError(
        "Join the session before marking it complete",
        "VALIDATION_ERROR",
        400,
      );
    }

    const attendance = await prisma.sessionAttendance.update({
      where: { sessionId_userId: { sessionId, userId } },
      data: {
        status: "attended",
        completedAt: new Date(),
        actualDistanceKm: parsedBody.data.actualDistanceKm ?? existing.actualDistanceKm,
        actualDurationMin: parsedBody.data.actualDurationMin ?? existing.actualDurationMin,
      },
    });

    return jsonOk(attendance);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Complete session:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
