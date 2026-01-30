// POST /api/v1/clubs – create club, creator becomes admin

import { NextRequest } from "next/server";
import { MembershipRole, MembershipStatus } from "@prisma/client";
import { requireAuth } from "@/lib/server/auth-helpers";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";

export async function POST(req: NextRequest) {
  try {
    const userId = requireAuth(req);
    const body = await req.json();
    const { name, slug, city, description, visibility } = body;

    if (!name || !slug) {
      return jsonError("Name and slug are required", "VALIDATION_ERROR", 400);
    }

    const existing = await prisma.club.findUnique({ where: { slug } });
    if (existing)
      return jsonError("Slug already taken", "VALIDATION_ERROR", 409);

    const result = await prisma.$transaction(async (tx) => {
      const club = await tx.club.create({
        data: {
          name,
          slug,
          city: city ?? null,
          description: description ?? null,
          visibility: visibility ?? "public",
          createdById: userId,
        },
      });
      await tx.clubMembership.create({
        data: {
          userId,
          clubId: club.id,
          role: MembershipRole.admin,
          status: MembershipStatus.approved,
        },
      });
      return club;
    });

    return jsonOk(result);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Create club:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
