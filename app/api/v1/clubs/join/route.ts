// POST /api/v1/clubs/join – accept invite code and auto-approve membership

import { NextRequest } from "next/server";
import { MembershipStatus } from "@prisma/client";
import { requireAuth } from "@/lib/server/auth-helpers";
import { prisma } from "@/lib/server/prisma";
import { jsonOk, jsonError } from "@/lib/server/api-response";
import { joinByCodeBodySchema } from "@/lib/server/validators";

export async function POST(req: NextRequest) {
  try {
    const userId = requireAuth(req);
    const body = await req.json();
    const parsed = joinByCodeBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "code is required",
        "VALIDATION_ERROR",
        400,
      );
    }
    const { code } = parsed.data;

    const invite = await prisma.clubInvite.findUnique({
      where: { code },
      include: { club: true },
    });

    if (!invite) {
      return jsonError("Invalid invite code", "NOT_FOUND", 404);
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return jsonError("Invite code expired", "VALIDATION_ERROR", 410);
    }

    const existing = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId, clubId: invite.clubId } },
    });
    if (existing) {
      return jsonError(
        "Already a member of this club",
        "VALIDATION_ERROR",
        409,
      );
    }

    const membership = await prisma.clubMembership.create({
      data: {
        userId,
        clubId: invite.clubId,
        role: invite.role ?? "member",
        status: MembershipStatus.approved,
      },
    });

    return jsonOk({ membership, club: invite.club });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Join club:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
