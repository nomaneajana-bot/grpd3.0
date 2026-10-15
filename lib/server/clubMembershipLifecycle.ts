/**
 * Hosted club membership lifecycle: leave (approved) + cancel pending request.
 * Decisions recorded for Batch 5 / ISSUE-004:
 * - Leave applies only to the authenticated actor's approved membership.
 * - Cancel-request applies only to the authenticated actor's pending request.
 * - Sole approved admin cannot leave (no transfer/deletion invented).
 * - Leave never deletes the club or other users' rows.
 * - Leave revokes the actor's joined attendance on that club's members-only sessions.
 */

import {
  AttendanceStatus,
  MembershipRole,
  MembershipStatus,
  Prisma,
  SessionVisibility,
  type PrismaClient,
} from "@prisma/client";
import { getLeaveUpdateData } from "@/lib/attendanceStatusLogic";

export type LeaveClubCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "WRONG_STATUS"
  | "LAST_ADMIN"
  | "CLUB_NOT_FOUND";

export type CancelRequestCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "WRONG_STATUS"
  | "CLUB_NOT_FOUND";

export type LeaveClubResult =
  | { ok: true; alreadyAbsent?: boolean; revokedAttendance: number }
  | { ok: false; code: LeaveClubCode; message: string };

export type CancelRequestResult =
  | { ok: true }
  | { ok: false; code: CancelRequestCode; message: string };

/** Pure decision: may this membership leave, given other approved admin count? */
export function evaluateLeaveEligibility(input: {
  membership: { status: MembershipStatus; role: MembershipRole } | null;
  otherApprovedAdminCount: number;
}): LeaveClubResult | { ok: true; proceed: true } {
  if (!input.membership) {
    return { ok: true, alreadyAbsent: true, revokedAttendance: 0 };
  }
  if (input.membership.status === MembershipStatus.pending) {
    return {
      ok: false,
      code: "WRONG_STATUS",
      message:
        "Demande en attente — utilise cancel-request, pas leave.",
    };
  }
  if (input.membership.status !== MembershipStatus.approved) {
    return {
      ok: false,
      code: "WRONG_STATUS",
      message: "Seuls les membres approuvés peuvent quitter le club.",
    };
  }
  if (
    input.membership.role === MembershipRole.admin &&
    input.otherApprovedAdminCount === 0
  ) {
    return {
      ok: false,
      code: "LAST_ADMIN",
      message:
        "Dernier administrateur : départ refusé (pas de transfert/suppression inventés).",
    };
  }
  return { ok: true, proceed: true };
}

export async function leaveClubForUser(
  db: PrismaClient | Prisma.TransactionClient,
  input: { userId: string; clubId: string },
): Promise<LeaveClubResult> {
  const club = await db.club.findUnique({
    where: { id: input.clubId },
    select: { id: true },
  });
  if (!club) {
    return { ok: false, code: "CLUB_NOT_FOUND", message: "Club introuvable." };
  }

  const membership = await db.clubMembership.findUnique({
    where: {
      userId_clubId: { userId: input.userId, clubId: input.clubId },
    },
  });

  const otherApprovedAdminCount = await db.clubMembership.count({
    where: {
      clubId: input.clubId,
      status: MembershipStatus.approved,
      role: MembershipRole.admin,
      NOT: { userId: input.userId },
    },
  });

  const decision = evaluateLeaveEligibility({
    membership,
    otherApprovedAdminCount,
  });
  if (!("proceed" in decision)) {
    return decision;
  }

  // Transactional leave: delete membership + revoke members-only attendance.
  // Never delete club or other users.
  const membersOnly = await db.session.findMany({
    where: {
      clubId: input.clubId,
      visibility: SessionVisibility.members,
    },
    select: { id: true },
  });
  const sessionIds = membersOnly.map((s) => s.id);
  const leaveData = getLeaveUpdateData();

  let revokedAttendance = 0;
  if (sessionIds.length > 0) {
    const updated = await db.sessionAttendance.updateMany({
      where: {
        userId: input.userId,
        sessionId: { in: sessionIds },
        status: AttendanceStatus.joined,
      },
      data: {
        status: AttendanceStatus.left,
        groupId: null,
      },
    });
    revokedAttendance = updated.count;
    // Ensure a left row exists if they somehow had no row but were joined locally — skip invent.
    void leaveData;
  }

  await db.clubMembership.delete({
    where: { id: membership!.id },
  });

  return { ok: true, revokedAttendance };
}

export async function cancelPendingClubRequestForUser(
  db: PrismaClient | Prisma.TransactionClient,
  input: { userId: string; clubId: string },
): Promise<CancelRequestResult> {
  const club = await db.club.findUnique({
    where: { id: input.clubId },
    select: { id: true },
  });
  if (!club) {
    return { ok: false, code: "CLUB_NOT_FOUND", message: "Club introuvable." };
  }

  const membership = await db.clubMembership.findUnique({
    where: {
      userId_clubId: { userId: input.userId, clubId: input.clubId },
    },
  });

  if (!membership) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Demande introuvable.",
    };
  }
  if (membership.status !== MembershipStatus.pending) {
    return {
      ok: false,
      code: "WRONG_STATUS",
      message:
        "Seule une demande en attente peut être annulée (membres : leave).",
    };
  }

  await db.clubMembership.delete({ where: { id: membership.id } });
  return { ok: true };
}

/** Run leave inside a prisma interactive transaction for rollback safety. */
export async function leaveClubForUserTx(
  prisma: PrismaClient,
  input: { userId: string; clubId: string },
): Promise<LeaveClubResult> {
  try {
    return await prisma.$transaction(async (tx) => leaveClubForUser(tx, input));
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      // Record vanished mid-flight — treat as already absent
      return { ok: true, alreadyAbsent: true, revokedAttendance: 0 };
    }
    throw e;
  }
}

export async function cancelPendingClubRequestForUserTx(
  prisma: PrismaClient,
  input: { userId: string; clubId: string },
): Promise<CancelRequestResult> {
  return prisma.$transaction(async (tx) =>
    cancelPendingClubRequestForUser(tx, input),
  );
}
