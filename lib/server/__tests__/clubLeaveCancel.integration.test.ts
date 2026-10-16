/**
 * Batch 5 — ISSUE-004 hosted leave / cancel-request
 * Isolated PostgreSQL integration (not mock).
 *
 * Auth coverage invokes the **actual** exported POST handlers from
 * `app/api/v1/clubs/[id]/leave/route.ts` and `…/cancel-request/route.ts`
 * with Request-compatible NextRequest inputs using the Auth.js v5 contract
 * (`req.auth?.user?.id` via `requireAuth` in lib/server/auth-helpers.ts).
 * Production auth helpers are unchanged.
 *
 * Requires: DATABASE_URL pointing at a disposable Postgres DB with migrations applied.
 * Skip when unset: `SKIP_PG_INTEGRATION=1` or missing DATABASE_URL.
 */

import {
  PrismaClient,
  MembershipRole,
  MembershipStatus,
  SessionVisibility,
  AttendanceStatus,
} from "@prisma/client";
import { NextRequest } from "next/server";
import {
  cancelPendingClubRequestForUserTx,
  leaveClubForUserTx,
} from "../clubMembershipLifecycle";

const DATABASE_URL = process.env.DATABASE_URL;
const SKIP =
  process.env.SKIP_PG_INTEGRATION === "1" ||
  !DATABASE_URL ||
  /mock|memory/i.test(DATABASE_URL);

/** Shared Prisma for routes + assertions (same DB as route singleton). */
jest.mock("@/lib/server/prisma", () => {
  const { PrismaClient: PC } = require("@prisma/client");
  const client = new PC({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  return { prisma: client };
});

import { prisma } from "@/lib/server/prisma";
import { POST as leavePOST } from "@/app/api/v1/clubs/[id]/leave/route";
import { POST as cancelPOST } from "@/app/api/v1/clubs/[id]/cancel-request/route";

const describePg = SKIP ? describe.skip : describe;

type AuthFixture =
  | { kind: "missing" }
  | { kind: "null_auth" }
  | { kind: "empty_id" }
  | { kind: "non_string_id" }
  | { kind: "user"; userId: string };

function attachAuth(
  req: NextRequest,
  auth: AuthFixture,
): NextRequest & { auth?: unknown } {
  const r = req as NextRequest & { auth?: unknown };
  switch (auth.kind) {
    case "missing":
      delete r.auth;
      break;
    case "null_auth":
      r.auth = null;
      break;
    case "empty_id":
      r.auth = { user: { id: "" } };
      break;
    case "non_string_id":
      r.auth = { user: { id: 99 } };
      break;
    case "user":
      r.auth = { user: { id: auth.userId } };
      break;
  }
  return r;
}

function makeClubRequest(
  pathSuffix: "leave" | "cancel-request",
  clubId: string,
  auth: AuthFixture,
  body?: Record<string, unknown>,
): NextRequest {
  const req = new NextRequest(
    `http://test.local/api/v1/clubs/${clubId}/${pathSuffix}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body ?? {}),
    },
  );
  return attachAuth(req, auth);
}

async function invokeLeave(
  clubId: string,
  auth: AuthFixture,
  body?: Record<string, unknown>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await leavePOST(makeClubRequest("leave", clubId, auth, body), {
    params: Promise.resolve({ id: clubId }),
  });
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

async function invokeCancel(
  clubId: string,
  auth: AuthFixture,
  body?: Record<string, unknown>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await cancelPOST(
    makeClubRequest("cancel-request", clubId, auth, body),
    { params: Promise.resolve({ id: clubId }) },
  );
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

describePg("club leave + cancel-request (PostgreSQL)", () => {
  const suffix = `b5_${Date.now().toString(36)}`;
  let clubSeq = 0;

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function seedClub(opts?: {
    withSecondAdmin?: boolean;
    slugPrefix?: string;
  }) {
    clubSeq += 1;
    const tag = `${suffix}_${clubSeq}`;
    const ownerId = `owner_${tag}`;
    const memberId = `member_${tag}`;
    const pendingId = `pending_${tag}`;
    const outsiderId = `outsider_${tag}`;
    const admin2Id = `admin2_${tag}`;
    const slugPrefix = opts?.slugPrefix ?? "club";
    const club = await prisma.club.create({
      data: {
        name: `Club ${tag}`,
        slug: `${slugPrefix}-${tag}`,
        city: "Casablanca",
        visibility: "members",
        createdById: ownerId,
        memberships: {
          create: [
            {
              userId: ownerId,
              role: MembershipRole.admin,
              status: MembershipStatus.approved,
            },
            {
              userId: memberId,
              role: MembershipRole.member,
              status: MembershipStatus.approved,
            },
            {
              userId: pendingId,
              role: MembershipRole.member,
              status: MembershipStatus.pending,
            },
            ...(opts?.withSecondAdmin
              ? [
                  {
                    userId: admin2Id,
                    role: MembershipRole.admin,
                    status: MembershipStatus.approved,
                  },
                ]
              : []),
          ],
        },
      },
    });
    const membersSession = await prisma.session.create({
      data: {
        title: `Privée ${tag}`,
        spot: "Parc",
        dateLabel: "SAMEDI",
        typeLabel: "Marche",
        volume: "",
        targetPace: "",
        estimatedDistanceKm: 0,
        recommendedGroupId: "",
        clubId: club.id,
        visibility: SessionVisibility.members,
        hostUserId: ownerId,
        attendance: {
          create: {
            userId: memberId,
            status: AttendanceStatus.joined,
            groupId: "B",
          },
        },
      },
    });
    const publicSession = await prisma.session.create({
      data: {
        title: `Publique ${tag}`,
        spot: "Plage",
        dateLabel: "DIMANCHE",
        typeLabel: "Marche",
        volume: "",
        targetPace: "",
        estimatedDistanceKm: 0,
        recommendedGroupId: "",
        clubId: club.id,
        visibility: SessionVisibility.public,
        hostUserId: ownerId,
        attendance: {
          create: {
            userId: memberId,
            status: AttendanceStatus.joined,
            groupId: "A",
          },
        },
      },
    });
    return {
      club,
      ownerId,
      memberId,
      pendingId,
      outsiderId,
      membersSession,
      publicSession,
      admin2Id,
      tag,
    };
  }

  afterEach(async () => {
    await prisma.club.deleteMany({
      where: {
        OR: [
          { slug: { startsWith: `club-${suffix}` } },
          { slug: { startsWith: `other-${suffix}` } },
          { slug: { startsWith: `race-${suffix}` } },
        ],
      },
    });
  });

  it("actual leave/cancel POST: missing/invalid auth → Response 401, no DB mutation", async () => {
    const { club } = await seedClub();
    const before = await prisma.clubMembership.count({
      where: { clubId: club.id },
    });

    const invalids: AuthFixture[] = [
      { kind: "missing" },
      { kind: "null_auth" },
      { kind: "empty_id" },
      { kind: "non_string_id" },
    ];

    for (const auth of invalids) {
      const leave = await invokeLeave(club.id, auth);
      expect(leave.status).toBe(401);
      expect(leave.body.ok).toBe(false);
      expect(
        (leave.body.error as { code?: string } | undefined)?.code,
      ).toBe("UNAUTHORIZED");

      const cancel = await invokeCancel(club.id, auth);
      expect(cancel.status).toBe(401);
      expect(cancel.body.ok).toBe(false);
      expect(
        (cancel.body.error as { code?: string } | undefined)?.code,
      ).toBe("UNAUTHORIZED");
    }

    const after = await prisma.clubMembership.count({
      where: { clubId: club.id },
    });
    expect(after).toBe(before);
    expect(after).toBe(3);
  });

  it("actual leave/cancel POST: actor from auth only — body userId ignored (isolation)", async () => {
    const { club, memberId, pendingId, outsiderId } = await seedClub();

    // Outsider authenticated, body claims memberId — must not remove member
    const leave = await invokeLeave(club.id, { kind: "user", userId: outsiderId }, {
      userId: memberId,
    });
    expect(leave.status).toBe(200);
    expect(
      (leave.body.data as { alreadyAbsent?: boolean } | undefined)?.alreadyAbsent,
    ).toBe(true);

    const memberStill = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: memberId, clubId: club.id } },
    });
    expect(memberStill?.status).toBe(MembershipStatus.approved);

    const cancel = await invokeCancel(
      club.id,
      { kind: "user", userId: outsiderId },
      { userId: pendingId },
    );
    expect(cancel.status).toBe(404);

    const pendingStill = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: pendingId, clubId: club.id } },
    });
    expect(pendingStill?.status).toBe(MembershipStatus.pending);

    // Approved member cannot cancel via body pointing at pendingId
    const approvedCancel = await invokeCancel(
      club.id,
      { kind: "user", userId: memberId },
      { userId: pendingId },
    );
    expect(approvedCancel.status).toBe(409);
    const pendingUnchanged = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: pendingId, clubId: club.id } },
    });
    expect(pendingUnchanged?.status).toBe(MembershipStatus.pending);

    // Authenticated member leave removes only self
    const selfLeave = await invokeLeave(club.id, {
      kind: "user",
      userId: memberId,
    });
    expect(selfLeave.status).toBe(200);
    const memberGone = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: memberId, clubId: club.id } },
    });
    expect(memberGone).toBeNull();
    const pendingAfter = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: pendingId, clubId: club.id } },
    });
    expect(pendingAfter?.status).toBe(MembershipStatus.pending);
  });

  it("approved member leaves: membership removed, members-only attendance left, public attendance unchanged, club persists", async () => {
    const { club, memberId, membersSession, publicSession } = await seedClub();
    const result = await leaveClubForUserTx(prisma, {
      userId: memberId,
      clubId: club.id,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadyAbsent).toBeFalsy();
      expect(result.revokedAttendance).toBe(1);
    }

    const mem = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: memberId, clubId: club.id } },
    });
    expect(mem).toBeNull();

    const privAtt = await prisma.sessionAttendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId: membersSession.id,
          userId: memberId,
        },
      },
    });
    expect(privAtt?.status).toBe(AttendanceStatus.left);
    expect(privAtt?.groupId).toBeNull();

    const pubAtt = await prisma.sessionAttendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId: publicSession.id,
          userId: memberId,
        },
      },
    });
    expect(pubAtt?.status).toBe(AttendanceStatus.joined);

    const clubStill = await prisma.club.findUnique({ where: { id: club.id } });
    expect(clubStill).not.toBeNull();
    const ownerStill = await prisma.clubMembership.count({
      where: { clubId: club.id, status: MembershipStatus.approved },
    });
    expect(ownerStill).toBeGreaterThanOrEqual(1);
  });

  it("leave is idempotent on retry (duplicate leave)", async () => {
    const { club, memberId } = await seedClub();
    const first = await leaveClubForUserTx(prisma, {
      userId: memberId,
      clubId: club.id,
    });
    expect(first.ok).toBe(true);
    const second = await leaveClubForUserTx(prisma, {
      userId: memberId,
      clubId: club.id,
    });
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.alreadyAbsent).toBe(true);
  });

  it("rejects pending actor on leave (must cancel request)", async () => {
    const { club, pendingId } = await seedClub();
    const result = await leaveClubForUserTx(prisma, {
      userId: pendingId,
      clubId: club.id,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("WRONG_STATUS");
      expect(result.message).not.toMatch(/cancel-request|API|leave\b/i);
    }
    const still = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: pendingId, clubId: club.id } },
    });
    expect(still?.status).toBe(MembershipStatus.pending);
  });

  it("rejects sole admin leave without inventing transfer/deletion", async () => {
    const { club, ownerId, memberId } = await seedClub();
    const result = await leaveClubForUserTx(prisma, {
      userId: ownerId,
      clubId: club.id,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("LAST_ADMIN");
      expect(result.message).not.toMatch(/transfert|suppression|API|cancel-request/i);
    }
    const owner = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: ownerId, clubId: club.id } },
    });
    expect(owner?.status).toBe(MembershipStatus.approved);
    const clubStill = await prisma.club.findUnique({ where: { id: club.id } });
    expect(clubStill).not.toBeNull();
    const memberStill = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: memberId, clubId: club.id } },
    });
    expect(memberStill).not.toBeNull();
  });

  it("allows admin leave when another approved admin remains", async () => {
    const { club, ownerId } = await seedClub({ withSecondAdmin: true });
    const result = await leaveClubForUserTx(prisma, {
      userId: ownerId,
      clubId: club.id,
    });
    expect(result.ok).toBe(true);
    const gone = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: ownerId, clubId: club.id } },
    });
    expect(gone).toBeNull();
    const remainingAdmins = await prisma.clubMembership.count({
      where: {
        clubId: club.id,
        role: MembershipRole.admin,
        status: MembershipStatus.approved,
      },
    });
    expect(remainingAdmins).toBe(1);
  });

  it("PG race: concurrent last-admin departures — exactly one leaves, one LAST_ADMIN", async () => {
    const { club, ownerId, admin2Id } = await seedClub({
      withSecondAdmin: true,
      slugPrefix: "race",
    });

    const [r1, r2] = await Promise.all([
      leaveClubForUserTx(prisma, { userId: ownerId, clubId: club.id }),
      leaveClubForUserTx(prisma, { userId: admin2Id, clubId: club.id }),
    ]);

    const outcomes = [r1, r2];
    const oks = outcomes.filter((r) => r.ok);
    const lastAdmin = outcomes.filter(
      (r) => !r.ok && r.code === "LAST_ADMIN",
    );
    expect(oks).toHaveLength(1);
    expect(lastAdmin).toHaveLength(1);

    const remainingAdmins = await prisma.clubMembership.count({
      where: {
        clubId: club.id,
        role: MembershipRole.admin,
        status: MembershipStatus.approved,
      },
    });
    expect(remainingAdmins).toBe(1);

    const clubStill = await prisma.club.findUnique({ where: { id: club.id } });
    expect(clubStill).not.toBeNull();
  });

  it("cancel-request removes only own pending row", async () => {
    const { club, pendingId, memberId } = await seedClub();
    const result = await cancelPendingClubRequestForUserTx(prisma, {
      userId: pendingId,
      clubId: club.id,
    });
    expect(result.ok).toBe(true);
    const gone = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: pendingId, clubId: club.id } },
    });
    expect(gone).toBeNull();
    const memberStill = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: memberId, clubId: club.id } },
    });
    expect(memberStill?.status).toBe(MembershipStatus.approved);
  });

  it("cancel-request rejects approved member and missing request", async () => {
    const { club, memberId, outsiderId } = await seedClub();
    const wrong = await cancelPendingClubRequestForUserTx(prisma, {
      userId: memberId,
      clubId: club.id,
    });
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) {
      expect(wrong.code).toBe("WRONG_STATUS");
      expect(wrong.message).not.toMatch(/leave\b|API|cancel-request/i);
    }

    const missing = await cancelPendingClubRequestForUserTx(prisma, {
      userId: outsiderId,
      clubId: club.id,
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.code).toBe("NOT_FOUND");
  });

  it("concurrent duplicate cancellation: exactly one ok, other NOT_FOUND", async () => {
    const { club, pendingId } = await seedClub({ slugPrefix: "race" });
    const [a, b] = await Promise.all([
      cancelPendingClubRequestForUserTx(prisma, {
        userId: pendingId,
        clubId: club.id,
      }),
      cancelPendingClubRequestForUserTx(prisma, {
        userId: pendingId,
        clubId: club.id,
      }),
    ]);
    const oks = [a, b].filter((r) => r.ok);
    const fails = [a, b].filter((r) => !r.ok);
    expect(oks).toHaveLength(1);
    expect(fails).toHaveLength(1);
    if (!fails[0].ok) expect(fails[0].code).toBe("NOT_FOUND");

    const gone = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: pendingId, clubId: club.id } },
    });
    expect(gone).toBeNull();
  });

  it("PG race: cancel pending vs concurrent approval — record both outcomes", async () => {
    for (let i = 0; i < 12; i++) {
      const { club, pendingId } = await seedClub({ slugPrefix: "race" });

      const cancelP = cancelPendingClubRequestForUserTx(prisma, {
        userId: pendingId,
        clubId: club.id,
      });
      const approveP = prisma.clubMembership.updateMany({
        where: {
          userId: pendingId,
          clubId: club.id,
          status: MembershipStatus.pending,
        },
        data: { status: MembershipStatus.approved },
      });

      const [cancelSettled, approveSettled] = await Promise.allSettled([
        cancelP,
        approveP,
      ]);

      // Do not swallow unexpected failures — only fulfilled paths are permitted.
      if (cancelSettled.status !== "fulfilled") {
        throw new Error(
          `cancel rejected unexpectedly: ${String(cancelSettled.reason)}`,
        );
      }
      if (approveSettled.status !== "fulfilled") {
        throw new Error(
          `approval rejected unexpectedly: ${String(approveSettled.reason)}`,
        );
      }

      const cancelResult = cancelSettled.value;
      const approveResult = approveSettled.value;

      const existing = await prisma.clubMembership.findUnique({
        where: { userId_clubId: { userId: pendingId, clubId: club.id } },
      });

      if (!existing) {
        // Cancel won: pending deleted before approval matched.
        expect(cancelResult.ok).toBe(true);
        expect(approveResult.count).toBe(0);
      } else if (existing.status === MembershipStatus.approved) {
        // Approval won: conditional cancel must not wipe approved.
        expect(cancelResult.ok).toBe(false);
        if (!cancelResult.ok) expect(cancelResult.code).toBe("WRONG_STATUS");
        expect(approveResult.count).toBe(1);
      } else {
        throw new Error(
          `unexpected cancel-vs-approval outcome: status=${existing.status} cancel=${JSON.stringify(cancelResult)} approveCount=${approveResult.count}`,
        );
      }
    }
  });

  it("lifecycle rollback: hook throw after attendance revoke restores membership + attendance", async () => {
    const { club, memberId, membersSession } = await seedClub();
    await expect(
      leaveClubForUserTx(
        prisma,
        { userId: memberId, clubId: club.id },
        {
          afterAttendanceRevoke: async () => {
            throw new Error("forced_lifecycle_rollback");
          },
        },
      ),
    ).rejects.toThrow("forced_lifecycle_rollback");

    const still = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: memberId, clubId: club.id } },
    });
    expect(still?.status).toBe(MembershipStatus.approved);

    const att = await prisma.sessionAttendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId: membersSession.id,
          userId: memberId,
        },
      },
    });
    expect(att?.status).toBe(AttendanceStatus.joined);
    expect(att?.groupId).toBe("B");
  });

  it("wrong clubId does not affect other clubs; club not found", async () => {
    const a = await seedClub();
    const other = await prisma.club.create({
      data: {
        name: `Other ${a.tag}`,
        slug: `other-${a.tag}`,
        createdById: a.ownerId,
        memberships: {
          create: {
            userId: a.memberId,
            role: MembershipRole.member,
            status: MembershipStatus.approved,
          },
        },
      },
    });
    const result = await leaveClubForUserTx(prisma, {
      userId: a.memberId,
      clubId: other.id,
    });
    expect(result.ok).toBe(true);
    const stillA = await prisma.clubMembership.findUnique({
      where: {
        userId_clubId: { userId: a.memberId, clubId: a.club.id },
      },
    });
    expect(stillA?.status).toBe(MembershipStatus.approved);

    const missingClub = await leaveClubForUserTx(prisma, {
      userId: a.memberId,
      clubId: "does_not_exist",
    });
    expect(missingClub.ok).toBe(false);
    if (!missingClub.ok) expect(missingClub.code).toBe("CLUB_NOT_FOUND");
  });

  it("persists leave across a new Prisma client (connection)", async () => {
    const { club, memberId } = await seedClub();
    await leaveClubForUserTx(prisma, { userId: memberId, clubId: club.id });
    const fresh = new PrismaClient({
      datasources: { db: { url: DATABASE_URL! } },
    });
    try {
      const mem = await fresh.clubMembership.findUnique({
        where: { userId_clubId: { userId: memberId, clubId: club.id } },
      });
      expect(mem).toBeNull();
    } finally {
      await fresh.$disconnect();
    }
  });
});
