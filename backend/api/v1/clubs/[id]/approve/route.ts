// POST /api/v1/clubs/:id/approve - Admin/coach approves membership

import { NextRequest, NextResponse } from "next/server";
import { MembershipStatus } from "@prisma/client";
import { requireAuth } from "../../../../lib/auth-helpers";
import { requireClubPermission } from "../../../../lib/role-checks";
import { prisma } from "../../../../lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = requireAuth(req);
    const clubId = params.id;
    const body = await req.json();
    const { membershipId } = body;

    if (!membershipId) {
      return NextResponse.json(
        { ok: false, error: { message: "membershipId is required" } },
        { status: 400 },
      );
    }

    await requireClubPermission(userId, clubId, "approve_members");

    const membership = await prisma.clubMembership.update({
      where: { id: membershipId },
      data: { status: MembershipStatus.approved },
    });

    return NextResponse.json({ ok: true, data: membership });
  } catch (e) {
    console.error("Approve membership:", e);
    if (e instanceof Error) {
      if (e.message === "UNAUTHORIZED") {
        return NextResponse.json(
          {
            ok: false,
            error: { message: "Unauthorized", code: "UNAUTHORIZED" },
          },
          { status: 401 },
        );
      }
      if (e.message === "FORBIDDEN") {
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
