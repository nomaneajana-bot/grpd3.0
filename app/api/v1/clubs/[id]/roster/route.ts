// GET /api/v1/clubs/:id/roster – list members (for coach/admin)

import { NextRequest } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
import { clubIdParamSchema } from "@/lib/server/validators";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
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

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true },
    });
    if (!club) return jsonError("Club not found", "NOT_FOUND", 404);

    const memberships = await prisma.clubMembership.findMany({
      where: { clubId, status: "approved" },
      select: {
        id: true,
        userId: true,
        displayName: true,
        role: true,
        status: true,
        sharePrs: true,
        prSummary: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const members = memberships.map((m) => ({
      membershipId: m.id,
      userId: m.userId,
      displayName: m.displayName ?? null,
      role: m.role,
      status: m.status,
      sharePrs: m.sharePrs,
      prSummary: m.prSummary as { updatedAt?: string; records?: Array<{ label: string; paceSecondsPerKm: number | null; testDate?: string | null }> } | null,
    }));

    return jsonOk({ clubId, members });
  } catch (e) {
    console.error("Get roster:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
