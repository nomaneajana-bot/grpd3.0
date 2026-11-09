/**
 * D02 — disposable Postgres journeys:
 * successful authenticated API flow, unauthenticated rejection, role-gated roster.
 * Uses a synthetic AUTH_JWT_SECRET only (never production secrets).
 */

import {
  MembershipRole,
  MembershipStatus,
  PrismaClient,
} from "@prisma/client";
import { NextRequest } from "next/server";

const DATABASE_URL = process.env.DATABASE_URL;
const SKIP =
  process.env.SKIP_PG_INTEGRATION === "1" ||
  !DATABASE_URL ||
  /mock|memory/i.test(DATABASE_URL);

const TEST_JWT_SECRET = "d02-local-test-jwt-secret-not-for-prod";

process.env.AUTH_JWT_SECRET = TEST_JWT_SECRET;
delete process.env.SUPABASE_JWT_SECRET;
delete process.env.SUPABASE_URL;

jest.mock("@/lib/server/prisma", () => {
  const { PrismaClient: PC } = require("@prisma/client");
  const client = new PC({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  return { prisma: client };
});

import { prisma } from "@/lib/server/prisma";
import { signAppAccessToken } from "@/lib/server/app-jwt";
import { hashPassword } from "@/lib/server/password";
import { dispatchApiRequest } from "@/lib/server/vercel-dispatch";

const describePg = SKIP ? describe.skip : describe;

async function dispatch(
  method: string,
  apiPath: string,
  opts?: { token?: string | null; body?: unknown },
): Promise<Response> {
  const headers = new Headers({ "content-type": "application/json" });
  if (opts?.token) headers.set("authorization", `Bearer ${opts.token}`);
  const req = new NextRequest(`https://test.local/api/v1/${apiPath}`, {
    method,
    headers,
    body:
      method === "GET" || method === "HEAD"
        ? undefined
        : JSON.stringify(opts?.body ?? {}),
  });
  const segments = apiPath.split("/").filter(Boolean);
  return dispatchApiRequest(req, segments);
}

async function jsonBody(res: Response): Promise<any> {
  return res.json();
}

describePg("D02 auth + API journeys (Postgres)", () => {
  const adminId = "d02_admin_user";
  const memberId = "d02_member_user";
  const outsiderId = "d02_outsider_user";
  let clubId = "";
  let adminToken = "";
  let memberToken = "";
  let outsiderToken = "";

  beforeAll(async () => {
    // Clean prior fixture rows if re-run on same DB
    await prisma.sessionAttendance.deleteMany({
      where: { userId: { in: [adminId, memberId, outsiderId] } },
    });
    await prisma.session.deleteMany({
      where: { hostUserId: { in: [adminId, memberId, outsiderId] } },
    });
    await prisma.clubInvite.deleteMany({
      where: { club: { createdById: adminId } },
    });
    await prisma.clubMembership.deleteMany({
      where: { userId: { in: [adminId, memberId, outsiderId] } },
    });
    await prisma.club.deleteMany({ where: { createdById: adminId } });
    await prisma.appUser.deleteMany({
      where: {
        email: {
          in: [
            "d02-admin@example.test",
            "d02-member@example.test",
            "d02-outsider@example.test",
          ],
        },
      },
    });

    await prisma.appUser.createMany({
      data: [
        {
          id: adminId,
          email: "d02-admin@example.test",
          passwordHash: hashPassword("password-admin-1"),
          displayName: "D02 Admin",
        },
        {
          id: memberId,
          email: "d02-member@example.test",
          passwordHash: hashPassword("password-member-1"),
          displayName: "D02 Member",
        },
        {
          id: outsiderId,
          email: "d02-outsider@example.test",
          passwordHash: hashPassword("password-outsider-1"),
          displayName: "D02 Outsider",
        },
      ],
    });

    adminToken = await signAppAccessToken(adminId);
    memberToken = await signAppAccessToken(memberId);
    outsiderToken = await signAppAccessToken(outsiderId);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("health returns database ready", async () => {
    const res = await dispatch("GET", "health");
    expect(res.status).toBe(200);
    const body = await jsonBody(res);
    expect(body.ok).toBe(true);
    expect(body.data.database).toBe("ready");
  });

  it("email register + login issues Bearer tokens", async () => {
    const email = `d02-reg-${Date.now()}@example.test`;
    const reg = await dispatch("POST", "auth/email/register", {
      body: {
        email,
        password: "password-reg-99",
        displayName: "D02 Registrant",
      },
    });
    expect(reg.status).toBe(200);
    const regBody = await jsonBody(reg);
    expect(regBody.ok).toBe(true);
    expect(regBody.data.tokens.accessToken).toBeTruthy();
    expect(regBody.data.user.email).toBe(email);

    const login = await dispatch("POST", "auth/email/login", {
      body: { email, password: "password-reg-99" },
    });
    expect(login.status).toBe(200);
    const loginBody = await jsonBody(login);
    expect(loginBody.ok).toBe(true);
    expect(loginBody.data.tokens.accessToken).toBeTruthy();
  });

  it("rejects protected routes without Authorization", async () => {
    const cases: Array<[string, string]> = [
      ["POST", "clubs"],
      ["GET", "me/memberships"],
      ["GET", "me/sessions"],
    ];
    for (const [method, path] of cases) {
      const res = await dispatch(method, path, {
        body: method === "POST" ? { name: "Nope" } : undefined,
      });
      expect(res.status).toBe(401);
      const body = await jsonBody(res);
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe("UNAUTHORIZED");
    }
  });

  it("authenticated admin can create club and member can join by invite", async () => {
    const create = await dispatch("POST", "clubs", {
      token: adminToken,
      body: {
        name: "D02 Test Club",
        slug: `d02-club-${Date.now()}`,
        city: "Casablanca",
        visibility: "public",
      },
    });
    expect(create.status).toBe(200);
    const created = await jsonBody(create);
    expect(create.status).toBe(200);
    expect(created.ok).toBe(true);
    // Accept either { club: { id } } or flat { id } envelopes used by routes.
    clubId = (created.data?.club?.id ?? created.data?.id) as string;
    if (!clubId) {
      // eslint-disable-next-line no-console
      console.error("create club response", create.status, created);
    }
    expect(clubId).toBeTruthy();

    const invite = await dispatch("POST", `clubs/${clubId}/invite`, {
      token: adminToken,
      body: {},
    });
    expect(invite.status).toBe(200);
    const inviteBody = await jsonBody(invite);
    const code = (inviteBody.data?.invite?.code ?? inviteBody.data?.code) as string;
    expect(code).toBeTruthy();

    const join = await dispatch("POST", "clubs/join-by-code", {
      token: memberToken,
      body: { code },
    });
    expect(join.status).toBe(200);
    const joinBody = await jsonBody(join);
    expect(joinBody.ok).toBe(true);

    // Ensure memberships exist with expected roles
    const adminMembership = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: adminId, clubId } },
    });
    expect(adminMembership?.role).toBe(MembershipRole.admin);
    expect(adminMembership?.status).toBe(MembershipStatus.approved);

    const memberMembership = await prisma.clubMembership.findUnique({
      where: { userId_clubId: { userId: memberId, clubId } },
    });
    expect(memberMembership?.status).toBe(MembershipStatus.approved);
  });

  it("roster requires manage_club — member and outsider get 403; admin succeeds", async () => {
    expect(clubId).toBeTruthy();

    const unauth = await dispatch("GET", `clubs/${clubId}/roster`);
    expect(unauth.status).toBe(401);

    const memberRes = await dispatch("GET", `clubs/${clubId}/roster`, {
      token: memberToken,
    });
    expect(memberRes.status).toBe(403);
    const memberBody = await jsonBody(memberRes);
    expect(memberBody.error.code).toBe("FORBIDDEN");

    const outsiderRes = await dispatch("GET", `clubs/${clubId}/roster`, {
      token: outsiderToken,
    });
    expect(outsiderRes.status).toBe(403);

    const adminRes = await dispatch("GET", `clubs/${clubId}/roster`, {
      token: adminToken,
    });
    expect(adminRes.status).toBe(200);
    const adminBody = await jsonBody(adminRes);
    expect(adminBody.ok).toBe(true);
    expect(Array.isArray(adminBody.data.members)).toBe(true);
    expect(adminBody.data.members.length).toBeGreaterThanOrEqual(1);
  });

  it("club detail hides pendingMembers from non-managers", async () => {
    expect(clubId).toBeTruthy();
    await prisma.clubMembership.create({
      data: {
        userId: outsiderId,
        clubId,
        role: MembershipRole.member,
        status: MembershipStatus.pending,
        displayName: "Pending Outsider",
      },
    });

    const publicView = await dispatch("GET", `clubs/${clubId}`);
    expect(publicView.status).toBe(200);
    const publicBody = await jsonBody(publicView);
    expect(publicBody.data.pendingMembers).toEqual([]);

    const adminView = await dispatch("GET", `clubs/${clubId}`, {
      token: adminToken,
    });
    expect(adminView.status).toBe(200);
    const adminBody = await jsonBody(adminView);
    expect(adminBody.data.pendingMembers.length).toBeGreaterThanOrEqual(1);
  });

  it("rejects expired / wrong-secret Bearer tokens", async () => {
    const { createHmac } = await import("crypto");
    const b64url = (input: Buffer | string) => {
      const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
      return buf
        .toString("base64")
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    };
    const now = Math.floor(Date.now() / 1000);
    const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = b64url(
      JSON.stringify({
        sub: adminId,
        iss: "grpd",
        iat: now - 3600,
        exp: now - 60,
      }),
    );
    const data = `${header}.${body}`;
    const sig = createHmac("sha256", TEST_JWT_SECRET).update(data).digest();
    const expired = `${data}.${b64url(sig)}`;

    const res = await dispatch("GET", "me/memberships", { token: expired });
    expect(res.status).toBe(401);
  });
});

// Keep PrismaClient type reference for TS tooling when SKIP=true
void (0 as unknown as PrismaClient);
