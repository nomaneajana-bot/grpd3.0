// POST /api/v1/clubs/:id/leave – approved member leaves (authenticated actor only)

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/server/auth-helpers";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
import { clubIdParamSchema } from "@/lib/server/validators";
import { leaveClubForUserTx } from "@/lib/server/clubMembershipLifecycle";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = requireAuth(req);
    const params = await context.params;
    const parsed = clubIdParamSchema.safeParse(params);
    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "Invalid clubId",
        "VALIDATION_ERROR",
        400,
      );
    }
    const clubId = parsed.data.id;

    const result = await leaveClubForUserTx(prisma, { userId, clubId });
    if (!result.ok) {
      const status =
        result.code === "CLUB_NOT_FOUND" || result.code === "NOT_FOUND"
          ? 404
          : result.code === "LAST_ADMIN" || result.code === "WRONG_STATUS"
            ? 409
            : 400;
      return jsonError(result.message, result.code, status);
    }

    return jsonOk({
      ok: true as const,
      alreadyAbsent: Boolean(result.alreadyAbsent),
      revokedAttendance: result.revokedAttendance,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Leave club:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
