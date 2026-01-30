// POST /api/clubs/:id/invite - Create an invite code (admin/coach only)

import { NextRequest, NextResponse } from "next/server";
import { MembershipRole } from "@prisma/client";
import { requireAuth } from "../../../lib/auth-helpers";
import { requireClubPermission } from "../../../lib/role-checks";
import { prisma } from "../../../lib/prisma";
import { randomBytes } from "crypto";

function generateInviteCode(): string {
  // Generate 8-character alphanumeric code
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = requireAuth(req);
    const clubId = params.id;
    const body = await req.json();

    const { invitedPhone, invitedEmail, role, expiresInDays } = body;

    // Check permission (admin or coach)
    await requireClubPermission(userId, clubId, "invite");

    // Generate unique code
    let code = generateInviteCode();
    let attempts = 0;
    while (
      (await prisma.clubInvite.findUnique({ where: { code } })) &&
      attempts < 10
    ) {
      code = generateInviteCode();
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { ok: false, error: { message: "Failed to generate unique code" } },
        { status: 500 },
      );
    }

    // Calculate expiration
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    // Create invite
    const invite = await prisma.clubInvite.create({
      data: {
        clubId,
        code,
        invitedPhone: invitedPhone || null,
        invitedEmail: invitedEmail || null,
        role: role || MembershipRole.member,
        expiresAt,
      },
    });

    return NextResponse.json({ ok: true, data: invite });
  } catch (error) {
    console.error("Failed to create invite:", error);
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json(
          { ok: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } },
          { status: 401 },
        );
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          { ok: false, error: { message: "Forbidden", code: "FORBIDDEN" } },
          { status: 403 },
        );
      }
    }
    return NextResponse.json(
      { ok: false, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}
