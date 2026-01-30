// GET /api/v1/clubs/:id/sessions – upcoming sessions for the club

import { NextRequest } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
import { clubIdParamSchema } from "@/lib/server/validators";

const todayStart = (): Date => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

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

    const from = todayStart();
    const sessions = await prisma.session.findMany({
      where: {
        clubId,
        dateISO: { gte: from.toISOString() },
      },
      select: {
        id: true,
        title: true,
        dateLabel: true,
        dateISO: true,
        spot: true,
      },
      orderBy: { dateISO: "asc" },
      take: 20,
    });

    return jsonOk({
      sessions: sessions.map((s) => ({
        id: s.id,
        title: s.title,
        dateLabel: s.dateLabel,
        dateISO: s.dateISO,
        spot: s.spot,
      })),
    });
  } catch (e) {
    console.error("Get club sessions:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
