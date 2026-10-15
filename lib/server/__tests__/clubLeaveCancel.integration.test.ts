/**
 * Batch 5 — ISSUE-004 hosted leave / cancel-request
 * Isolated PostgreSQL integration (not mock).
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
import {
  cancelPendingClubRequestForUserTx,
  leaveClubForUserTx,
  runAuthenticatedCancelRequest,
  runAuthenticatedLeave,
} from "../clubMembershipLifecycle";

const DATABASE_URL = process.env.DATABASE_URL;
const SKIP =
  process.env.SKIP_PG_INTEGRATION === "1" ||
  !DATABASE_URL ||
  /mock|memory/i.test(DATABASE_URL);

const describePg = SKIP ? describe.skip : describe;

describePg("club leave + cancel-request (PostgreSQL)", () => {
  let prisma: PrismaClient;
  const suffix = `b5_${Date.now().toString(36)}`;
  let clubSeq = 0;

  beforeAll(() => {
    prisma = new PrismaClient({
      datasources: { db: { url: DATABASE_URL! } },
    });
  });

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

  it("route auth: null actor → 401; empty actor → 401 (leave + cancel)", async () => {
    const { club } = await seedClub();
    for (const actor of [null, undefined, ""] as const) {
      const leave = await runAuthenticatedLeave(prisma, actor, club.id);
      expect(leave.status).toBe(401);
      expect(leave.body.ok).toBe(false);

      const cancel = await runAuthenticatedCancelRequest(prisma, actor, club.id);
      expect(cancel.status).toBe(401);
      expect(cancel.body.ok).toBe(false);
    }
    const still = await prisma.clubMembership.count({
      where: { clubId: club.id },
    });
    expect(still).toBe(3);
  });

  it("actor isolation: outsider leave/cancel does not remove another member or pending", async () => {
    const { club, memberId, pendingId, outsiderId } = await seedClub();
    const leave = await runAuthenticatedLeave(prisma, outsiderId, club.id);
    expect(leave.status).toBe(200);
    expect((leave.body.data as { alreadyAbsent?: boolean })?.alreadyAbsent).toBe(
      true,
    );

    const memberStill = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: memberId, clubId: club.id } },
    });
    expect(memberStill?.status).toBe(MembershipStatus.approved);

    const cancel = await runAuthenticatedCancelRequest(
      prisma,
      outsiderId,
      club.id,
    );
    expect(cancel.status).toBe(404);

    const pendingStill = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: pendingId, clubId: club.id } },
    });
    expect(pendingStill?.status).toBe(MembershipStatus.pending);

    const approvedCancel = await runAuthenticatedCancelRequest(
      prisma,
      memberId,
      club.id,
    );
    expect(approvedCancel.status).toBe(409);
    expect(pendingStill?.status).toBe(MembershipStatus.pending);
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

  it("PG race: cancel pending vs concurrent approval — never deletes approved", async () => {
    // Repeat to stress interleaving under Serializable + conditional delete.
    for (let i = 0; i < 12; i++) {
      const { club, pendingId } = await seedClub({ slugPrefix: "race" });

      const [cancelResult] = await Promise.all([
        cancelPendingClubRequestForUserTx(prisma, {
          userId: pendingId,
          clubId: club.id,
        }),
        prisma.clubMembership
          .updateMany({
            where: {
              userId: pendingId,
              clubId: club.id,
              status: MembershipStatus.pending,
            },
            data: { status: MembershipStatus.approved },
          })
          .catch(() => ({ count: 0 })),
      ]);

      const existing = await prisma.clubMembership.findUnique({
        where: { userId_clubId: { userId: pendingId, clubId: club.id } },
      });

      if (existing) {
        expect(existing.status).toBe(MembershipStatus.approved);
        expect(cancelResult.ok).toBe(false);
        if (!cancelResult.ok) expect(cancelResult.code).toBe("WRONG_STATUS");
      } else {
        expect(cancelResult.ok).toBe(true);
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
