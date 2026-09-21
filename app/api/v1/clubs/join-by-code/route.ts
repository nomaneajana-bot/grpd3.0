// POST /api/v1/clubs/join-by-code – accept invite

import { NextRequest } from "next/server";
import { MembershipStatus } from "@prisma/client";
import { requireAuth } from "../../../../../lib/server/auth-helpers";
import { prisma } from "../../../../../lib/server/prisma";
import { jsonOk, jsonError } from "../../../../../lib/server/api-response";
import { joinByCodeBodySchema } from "../../../../../lib/server/validators";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth(req);
    const body = await req.json().catch(() => null);
    const parsed = joinByCodeBodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(
        parsed.error.errors[0]?.message ?? "code is required",
        "VALIDATION_ERROR",
        400,
      );
    }
    const code = parsed.data.code.trim().toUpperCase();

    const invite = await prisma.clubInvite.findUnique({
      where: { code },
      include: { club: true },
    });

    if (!invite) {
      return jsonError("Invalid invite code", "NOT_FOUND", 404);
    }

    if (invite.expiresAt && invite.expiresAt <= new Date()) {
      return jsonError("Invite code expired", "VALIDATION_ERROR", 410);
    }

    const existing = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId, clubId: invite.clubId } },
    });
    // Contact-bound legacy invitations require verified contact matching, not possession alone.
    if (invite.invitedPhone || invite.invitedEmail) return jsonError("Contact verification required", "FORBIDDEN", 403);
    if (existing?.status === "banned" || existing?.status === "rejected") return jsonError("Membership unavailable", "FORBIDDEN", 403);
    if (existing?.status === "approved") return jsonOk({membership: existing, club: invite.club});
    // Empty update makes concurrent retries safe without undoing a concurrent ban.
    let membership = await prisma.clubMembership.upsert({
      where: { userId_clubId: { userId, clubId: invite.clubId } },
      update: {},
      create: { userId, clubId: invite.clubId, role: invite.role ?? "member", status: MembershipStatus.approved },
    });
    if (membership.status === "pending") {
      await prisma.clubMembership.updateMany({where: {id: membership.id, status: "pending"}, data: {status: "approved", role: invite.role ?? "member"}});
      membership = await prisma.clubMembership.findUniqueOrThrow({where: {id: membership.id}});
    }
    if (membership.status !== "approved") return jsonError("Membership approval required", "FORBIDDEN", 403);

    return jsonOk({ membership, club: invite.club });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Join by code:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
