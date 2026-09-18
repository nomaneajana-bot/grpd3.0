// GET /api/v1/me/inbox – pending memberships + session attendance notifications

import { NextRequest } from "next/server";
import { MembershipRole, MembershipStatus } from "@prisma/client";
import { requireAuth } from "../../../../../lib/server/auth-helpers";
import { prisma } from "../../../../../lib/server/prisma";
import { jsonOk, jsonError } from "../../../../../lib/server/api-response";
import { visibleSessionsWhere } from "../../../../../lib/server/session-access";

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth(req);

    const [pendingMemberships, sessionItems, adminPending] = await Promise.all([
      prisma.clubMembership.findMany({
        where: { userId, status: MembershipStatus.pending },
        include: {
          club: {
            select: { id: true, name: true, slug: true, city: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sessionAttendance.findMany({
        where: {
          userId,
          status: { in: ["requested", "suggested"] },
          session: { is: visibleSessionsWhere(userId) },
        },
        include: {
          session: {
            select: {
              id: true,
              title: true,
              dateLabel: true,
              spot: true,
              clubId: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.clubMembership.findMany({
        where: {
          status: MembershipStatus.pending,
          club: {
            memberships: {
              some: {
                userId,
                status: MembershipStatus.approved,
                role: { in: [MembershipRole.coach, MembershipRole.admin] },
              },
            },
          },
        },
        include: {
          club: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return jsonOk({
      pendingMemberships: pendingMemberships.map((m) => ({
        id: m.id,
        clubId: m.clubId,
        userId: m.userId,
        status: m.status,
        role: m.role,
        createdAt: m.createdAt.toISOString(),
        club: m.club,
      })),
      sessionNotifications: sessionItems.map((a) => ({
        attendanceId: a.id,
        sessionId: a.sessionId,
        status: a.status,
        groupId: a.groupId,
        session: a.session,
      })),
      adminPendingRequests: adminPending.map((m) => ({
        membershipId: m.id,
        clubId: m.clubId,
        userId: m.userId,
        displayName: m.displayName,
        createdAt: m.createdAt.toISOString(),
        club: m.club,
      })),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", "UNAUTHORIZED", 401);
    }
    console.error("Get inbox:", e);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
}
