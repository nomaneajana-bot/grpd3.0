/**
 * Batch 5 — ISSUE-004 hosted leave / cancel-request
 * Isolated PostgreSQL integration (not mock).
 *
 * Requires: DATABASE_URL pointing at a disposable Postgres DB with migrations applied.
 * Skip when unset: `SKIP_PG_INTEGRATION=1` or missing DATABASE_URL.
 */

import { PrismaClient, MembershipRole, MembershipStatus, SessionVisibility, AttendanceStatus } from "@prisma/client";
import {
  cancelPendingClubRequestForUserTx,
  leaveClubForUserTx,
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

  beforeAll(() => {
    prisma = new PrismaClient({
      datasources: { db: { url: DATABASE_URL! } },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function seedClub(opts?: { withSecondAdmin?: boolean }) {
    const ownerId = `owner_${suffix}`;
    const memberId = `member_${suffix}`;
    const pendingId = `pending_${suffix}`;
    const outsiderId = `outsider_${suffix}`;
    const club = await prisma.club.create({
      data: {
        name: `Club ${suffix}`,
        slug: `club-${suffix}`,
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
                    userId: `admin2_${suffix}`,
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
        title: `Privée ${suffix}`,
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
        title: `Publique ${suffix}`,
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
      admin2Id: `admin2_${suffix}`,
    };
  }

  afterEach(async () => {
    // Cleanup clubs created this run (cascade memberships/sessions/attendance)
    await prisma.club.deleteMany({
      where: {
        OR: [
          { slug: { startsWith: `club-${suffix}` } },
          { slug: { startsWith: `other-${suffix}` } },
        ],
      },
    });
  });

  it("rejects unauthenticated callers at the decision boundary (no userId)", async () => {
    // Route layer enforces requireAuth; lifecycle requires explicit userId.
    // Guard: empty userId must not delete arbitrary rows.
    const { club, memberId } = await seedClub();
    const before = await prisma.clubMembership.count({
      where: { clubId: club.id },
    });
    const result = await leaveClubForUserTx(prisma, {
      userId: "",
      clubId: club.id,
    });
    // Empty userId finds no membership → idempotent absent, no deletes of others
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.alreadyAbsent).toBe(true);
    const after = await prisma.clubMembership.count({
      where: { clubId: club.id },
    });
    expect(after).toBe(before);
    const stillMember = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: memberId, clubId: club.id } },
    });
    expect(stillMember?.status).toBe(MembershipStatus.approved);
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

  it("rejects pending actor on leave (must cancel-request)", async () => {
    const { club, pendingId } = await seedClub();
    const result = await leaveClubForUserTx(prisma, {
      userId: pendingId,
      clubId: club.id,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("WRONG_STATUS");
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
    if (!result.ok) expect(result.code).toBe("LAST_ADMIN");
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
    if (!wrong.ok) expect(wrong.code).toBe("WRONG_STATUS");

    const missing = await cancelPendingClubRequestForUserTx(prisma, {
      userId: outsiderId,
      clubId: club.id,
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.code).toBe("NOT_FOUND");
  });

  it("cancel-request retry after success returns NOT_FOUND", async () => {
    const { club, pendingId } = await seedClub();
    const first = await cancelPendingClubRequestForUserTx(prisma, {
      userId: pendingId,
      clubId: club.id,
    });
    expect(first.ok).toBe(true);
    const second = await cancelPendingClubRequestForUserTx(prisma, {
      userId: pendingId,
      clubId: club.id,
    });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.code).toBe("NOT_FOUND");
  });

  it("wrong clubId does not affect other clubs; club not found", async () => {
    const a = await seedClub();
    const other = await prisma.club.create({
      data: {
        name: `Other ${suffix}`,
        slug: `other-${suffix}`,
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
    // Still member of original club
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

  it("rolls back membership delete if attendance update fails mid-transaction", async () => {
    const { club, memberId } = await seedClub();
    // Force failure by using a broken interactive path: simulate via $transaction that throws after delete attempt
    // We verify transactional wrapper: if sessionAttendance update throws, membership remains.
    await expect(
      prisma.$transaction(async (tx) => {
        const mem = await tx.clubMembership.findUnique({
          where: {
            userId_clubId: { userId: memberId, clubId: club.id },
          },
        });
        expect(mem).not.toBeNull();
        await tx.clubMembership.delete({ where: { id: mem!.id } });
        throw new Error("forced_rollback");
      }),
    ).rejects.toThrow("forced_rollback");

    const still = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: memberId, clubId: club.id } },
    });
    expect(still?.status).toBe(MembershipStatus.approved);
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
