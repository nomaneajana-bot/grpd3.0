// POST /api/v1/clubs – create club, creator becomes admin

import { NextRequest } from "next/server";
import {
  ClubCategory,
  ClubJoinMode,
  MembershipRole,
  MembershipStatus,
} from "@prisma/client";
import { requireAuth } from "../../../../lib/server/auth-helpers";
import { prisma } from "../../../../lib/server/prisma";
import { jsonOk, jsonError } from "../../../../lib/server/api-response";

import { randomUUID } from "node:crypto";
import { clubCreateSchema } from "../../../../lib/server/community-input";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth(req);
    const parsed = clubCreateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return jsonError(parsed.error.errors[0]?.message ?? "Invalid club", "VALIDATION_ERROR", 400);
    const {name, city, description, visibility, clubCategory, joinMode} = parsed.data;
    const slug = parsed.data.slug ?? `club-${randomUUID()}`;

    const existing = await prisma.club.findUnique({ where: { slug } });
    if (existing)
      return jsonError("Slug already taken", "VALIDATION_ERROR", 409);

    const resolvedJoinMode = (joinMode as ClubJoinMode) ?? ClubJoinMode.invite;
    const resolvedVisibility =
      visibility ??
      (resolvedJoinMode === ClubJoinMode.open ? "public" : "members");

    const result = await prisma.$transaction(async (tx) => {
      const club = await tx.club.create({
        data: {
          name,
          slug,
          city: city ?? null,
          description: description ?? null,
          visibility: resolvedVisibility,
          clubCategory: (clubCategory as ClubCategory) ?? ClubCategory.mixed,
          joinMode: resolvedJoinMode,
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
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") return jsonError("Slug already taken", "VALIDATION_ERROR", 409);
    console.error("Create club:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}

// Public discovery deliberately excludes invitation-only club details.
export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      where: { visibility: "public" },
      select: { id: true, name: true, slug: true, city: true, description: true, visibility: true, joinMode: true },
      orderBy: { createdAt: "desc" }, take: 50,
    });
    return jsonOk({ clubs });
  } catch (e) {
    console.error("Discover clubs:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
