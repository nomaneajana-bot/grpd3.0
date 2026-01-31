// POST /api/v1/clubs/:id/request – membership request

import { NextRequest } from "next/server";
import { MembershipStatus } from "@prisma/client";
import { requireAuth } from "@/lib/server/auth-helpers";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
import { clubIdParamSchema } from "@/lib/server/validators";

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
    const rawId = parsed.data.id.trim();

    let club = await prisma.club.findUnique({ where: { id: rawId } });
    if (!club) {
      const normalized = rawId.toLowerCase();
      const matches = await prisma.club.findMany({
        where: {
          OR: [
            { slug: normalized },
            { name: { equals: rawId, mode: "insensitive" } },
            { name: { contains: rawId, mode: "insensitive" } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 2,
      });
      if (matches.length === 0) {
        return jsonError("Club not found", "NOT_FOUND", 404);
      }
      if (matches.length > 1) {
        return jsonError(
          "Plusieurs clubs trouvés. Utilise le code.",
          "AMBIGUOUS",
          409,
        );
      }
      club = matches[0];
    }

    const clubId = club.id;

    const existing = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId, clubId } },
    });
    if (existing) {
      return jsonError(
        "Membership request already exists",
        "VALIDATION_ERROR",
        409,
      );
    }

    const membership = await prisma.clubMembership.create({
      data: { userId, clubId, status: MembershipStatus.pending },
    });

    return jsonOk(membership);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Club request:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
