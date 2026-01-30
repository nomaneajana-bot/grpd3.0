// POST /api/v1/clubs - Create club, creator becomes admin

import { NextRequest, NextResponse } from "next/server";
import { MembershipRole, MembershipStatus } from "@prisma/client";
import { requireAuth } from "../../../lib/auth-helpers";
import { prisma } from "../../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const userId = requireAuth(req);
    const body = await req.json();
    const { name, slug, city, description, visibility } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { ok: false, error: { message: "Name and slug are required" } },
        { status: 400 },
      );
    }

    const existing = await prisma.club.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: { message: "Slug already taken" } },
        { status: 409 },
      );
    }

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

    return NextResponse.json({ ok: true, data: result });
  } catch (e) {
    console.error("Create club:", e);
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { ok: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}
