/**
 * Hosted club membership lifecycle: leave (approved) + cancel pending request.
 * Decisions recorded for Batch 5 / ISSUE-004:
 * - Leave applies only to the authenticated actor's approved membership.
 * - Cancel applies only to the authenticated actor's pending request.
 * - Sole approved admin cannot leave (no transfer/deletion invented).
 * - Concurrent admin leaves are serialized (FOR UPDATE + Serializable + retry).
 * - Cancel uses conditional delete of pending only (safe vs concurrent approval).
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

/** Test seam: throw after attendance revoke, before membership delete. */
export type LeaveClubHooks = {
  afterAttendanceRevoke?: (ctx: {
    userId: string;
    clubId: string;
  }) => Promise<void> | void;
};

const TX_OPTS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 10_000,
  timeout: 15_000,
} as const;

const MAX_TX_RETRIES = 8;

function isSerializationFailure(e: unknown): boolean {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (e.code === "P2034") return true;
  const msg = `${e.message} ${JSON.stringify(e.meta ?? {})}`;
  return /could not serialize|serialization failure|40001/i.test(msg);
}

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
        "Ta demande est encore en attente — annule-la plutôt que de quitter.",
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
        "Tu es le dernier administrateur : tu ne peux pas quitter le club pour le moment.",
    };
  }
  return { ok: true, proceed: true };
}

/**
 * Leave within an open transaction. Locks approved admin rows FOR UPDATE so
 * concurrent last-admin departures cannot both succeed.
 */
export async function leaveClubForUser(
  db: Prisma.TransactionClient,
  input: { userId: string; clubId: string },
  hooks?: LeaveClubHooks,
): Promise<LeaveClubResult> {
  const club = await db.club.findUnique({
    where: { id: input.clubId },
    select: { id: true },
  });
  if (!club) {
    return { ok: false, code: "CLUB_NOT_FOUND", message: "Club introuvable." };
  }

  await db.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM club_memberships
    WHERE "clubId" = ${input.clubId}
      AND status = CAST('approved' AS "MembershipStatus")
      AND role = CAST('admin' AS "MembershipRole")
    FOR UPDATE
  `;

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
        status: leaveData.status,
        groupId: leaveData.groupId,
      },
    });
    revokedAttendance = updated.count;
  }

  if (hooks?.afterAttendanceRevoke) {
    await hooks.afterAttendanceRevoke({
      userId: input.userId,
      clubId: input.clubId,
    });
  }

  await db.clubMembership.delete({
    where: { id: membership!.id },
  });

  return { ok: true, revokedAttendance };
}

/**
 * Cancel pending request. Conditional deleteMany(status=pending) so a concurrent
 * approval (status→approved) cannot be wiped.
 */
export async function cancelPendingClubRequestForUser(
  db: Prisma.TransactionClient,
  input: { userId: string; clubId: string },
): Promise<CancelRequestResult> {
  const club = await db.club.findUnique({
    where: { id: input.clubId },
    select: { id: true },
  });
  if (!club) {
    return { ok: false, code: "CLUB_NOT_FOUND", message: "Club introuvable." };
  }

  const deleted = await db.clubMembership.deleteMany({
    where: {
      userId: input.userId,
      clubId: input.clubId,
      status: MembershipStatus.pending,
    },
  });

  if (deleted.count === 1) {
    return { ok: true };
  }

  const existing = await db.clubMembership.findUnique({
    where: {
      userId_clubId: { userId: input.userId, clubId: input.clubId },
    },
  });
  if (!existing) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Demande introuvable.",
    };
  }
  return {
    ok: false,
    code: "WRONG_STATUS",
    message:
      "Seule une demande en attente peut être annulée. Si tu es déjà membre, quitte le club.",
  };
}

export async function leaveClubForUserTx(
  prisma: PrismaClient,
  input: { userId: string; clubId: string },
  hooks?: LeaveClubHooks,
): Promise<LeaveClubResult> {
  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      return await prisma.$transaction(
        async (tx) => leaveClubForUser(tx, input, hooks),
        TX_OPTS,
      );
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2025"
      ) {
        return { ok: true, alreadyAbsent: true, revokedAttendance: 0 };
      }
      if (isSerializationFailure(e) && attempt < MAX_TX_RETRIES) {
        continue;
      }
      throw e;
    }
  }
}

export async function cancelPendingClubRequestForUserTx(
  prisma: PrismaClient,
  input: { userId: string; clubId: string },
): Promise<CancelRequestResult> {
  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      return await prisma.$transaction(
        async (tx) => cancelPendingClubRequestForUser(tx, input),
        TX_OPTS,
      );
    } catch (e) {
      if (isSerializationFailure(e) && attempt < MAX_TX_RETRIES) {
        continue;
      }
      throw e;
    }
  }
}

/** Simulate route requireAuth gate used by leave/cancel handlers. */
export function requireActorUserId(userId: string | null | undefined): string {
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}

/**
 * Route POST body after auth — shared by leave route + auth mapping tests.
 */
export async function runAuthenticatedLeave(
  prisma: PrismaClient,
  actorUserId: string | null | undefined,
  clubId: string,
): Promise<{ status: number; body: Record<string, unknown> }> {
  try {
    const userId = requireActorUserId(actorUserId);
    const result = await leaveClubForUserTx(prisma, { userId, clubId });
    if (!result.ok) {
      const status =
        result.code === "CLUB_NOT_FOUND" || result.code === "NOT_FOUND"
          ? 404
          : result.code === "LAST_ADMIN" || result.code === "WRONG_STATUS"
            ? 409
            : 400;
      return {
        status,
        body: {
          ok: false,
          error: { message: result.message, code: result.code },
        },
      };
    }
    return {
      status: 200,
      body: {
        ok: true,
        data: {
          ok: true,
          alreadyAbsent: Boolean(result.alreadyAbsent),
          revokedAttendance: result.revokedAttendance,
        },
      },
    };
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return {
        status: 401,
        body: {
          ok: false,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        },
      };
    }
    throw e;
  }
}

export async function runAuthenticatedCancelRequest(
  prisma: PrismaClient,
  actorUserId: string | null | undefined,
  clubId: string,
): Promise<{ status: number; body: Record<string, unknown> }> {
  try {
    const userId = requireActorUserId(actorUserId);
    const result = await cancelPendingClubRequestForUserTx(prisma, {
      userId,
      clubId,
    });
    if (!result.ok) {
      const status =
        result.code === "CLUB_NOT_FOUND" || result.code === "NOT_FOUND"
          ? 404
          : result.code === "WRONG_STATUS"
            ? 409
            : 400;
      return {
        status,
        body: {
          ok: false,
          error: { message: result.message, code: result.code },
        },
      };
    }
    return {
      status: 200,
      body: { ok: true, data: { ok: true } },
    };
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return {
        status: 401,
        body: {
          ok: false,
          error: { message: "Unauthorized", code: "UNAUTHORIZED" },
        },
      };
    }
    throw e;
  }
}
