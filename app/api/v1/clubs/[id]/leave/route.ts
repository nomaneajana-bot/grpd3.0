// POST /api/v1/clubs/:id/leave

import { NextRequest } from "next/server";
import { requireAuth } from "../../../../../../lib/server/auth-helpers";
import { prisma } from "../../../../../../lib/server/prisma";
import { jsonOk, jsonError } from "../../../../../../lib/server/api-response";
import { clubIdParamSchema } from "../../../../../../lib/server/validators";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireAuth(req);
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
    const membership = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId, clubId } },
    });

    if (!membership) {
      return jsonError("Not a member", "NOT_FOUND", 404);
    }

    if (["banned", "rejected"].includes(membership.status)) {
      return jsonError("Forbidden", "FORBIDDEN", 403);
    }
    await prisma.$transaction(async (tx) => {
      const current = await tx.clubMembership.findUnique({ where: { userId_clubId: { userId, clubId } } });
      if (!current) return;
      if (["banned", "rejected"].includes(current.status)) throw new Error("FORBIDDEN");
      if (current.role === "admin" && current.status === "approved") {
        const admins = await tx.clubMembership.count({ where: { clubId, role: "admin", status: "approved" } });
        if (admins <= 1) throw new Error("LAST_ADMIN");
      }
      await tx.clubMembership.delete({ where: { id: current.id } });
    }, { isolationLevel: "Serializable" });

    return jsonOk({ ok: true as const });
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonError("Forbidden", "FORBIDDEN", 403);
    if (e instanceof Error && e.message === "LAST_ADMIN") return jsonError("Assign another administrator before leaving", "CONFLICT", 409);
    if (e && typeof e === "object" && "code" in e && e.code === "P2034") return jsonError("Membership changed; retry", "CONFLICT", 409);
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Leave club:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
