// POST /api/v1/clubs/join-by-code - Accept invite

import { NextRequest, NextResponse } from "next/server";
import { MembershipStatus } from "@prisma/client";
import { requireAuth } from "../../../lib/auth-helpers";
import { prisma } from "../../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const userId = requireAuth(req);
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { ok: false, error: { message: "Code is required" } },
        { status: 400 },
      );
    }

    const invite = await prisma.clubInvite.findUnique({
      where: { code },
      include: { club: true },
    });

    if (!invite) {
      return NextResponse.json(
        {
          ok: false,
          error: { message: "Invalid invite code", code: "NOT_FOUND" },
        },
        { status: 404 },
      );
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json(
        { ok: false, error: { message: "Invite code expired" } },
        { status: 410 },
      );
    }

    const existing = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId, clubId: invite.clubId } },
    });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: { message: "Already a member of this club" } },
        { status: 409 },
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

    return NextResponse.json({
      ok: true,
      data: { membership, club: invite.club },
    });
  } catch (e) {
    console.error("Join by code:", e);
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
