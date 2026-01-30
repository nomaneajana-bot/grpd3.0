// POST /api/v1/sessions/:id/assign – coach/admin assigns group to a runner

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
import { requireAuth } from "@/lib/server/auth-helpers";
import { requireClubPermission } from "@/lib/server/role-checks";
import { sessionIdParamSchema } from "@/lib/server/validators";

const bodySchema = z.object({
  userId: z.string().min(1, "userId is required"),
  groupId: z.string().min(1, "groupId is required"),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const coachId = requireAuth(req);
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
    const { userId, groupId } = parsedBody.data;

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return jsonError("Session not found", "NOT_FOUND", 404);

    if (session.clubId) {
      try {
        await requireClubPermission(coachId, session.clubId, "manage_club");
      } catch {
        return jsonError("Forbidden", "FORBIDDEN", 403);
      }
    }

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
    console.error("Assign group:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
