/**
 * Captures real D02 API functional evidence against local disposable Postgres.
 * Redacts tokens/secrets before writing artifacts.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { NextRequest } from "next/server";
import {
  MembershipRole,
  MembershipStatus,
  PrismaClient,
} from "@prisma/client";

process.env.AUTH_JWT_SECRET =
  process.env.AUTH_JWT_SECRET || "d02-local-test-jwt-secret-not-for-prod";

import { hashPassword } from "../lib/server/password";
import { signAppAccessToken } from "../lib/server/app-jwt";
import { dispatchApiRequest } from "../lib/server/vercel-dispatch";
import { prisma } from "../lib/server/prisma";

type Capture = {
  step: string;
  method: string;
  path: string;
  status: number;
  requestNotes: string;
  response: unknown;
};

function sanitize(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.startsWith("eyJ")) return "<redacted-jwt>";
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (/token|password|secret|authorization|passwordHash/i.test(k)) {
        out[k] = "<redacted>";
      } else {
        out[k] = sanitize(v);
      }
    }
    return out;
  }
  return value;
}

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
  return dispatchApiRequest(req, apiPath.split("/").filter(Boolean));
}

async function capture(
  step: string,
  method: string,
  path: string,
  opts: {
    token?: string | null;
    body?: unknown;
    requestNotes: string;
  },
): Promise<Capture> {
  const res = await dispatch(method, path, opts);
  const json = await res.json();
  return {
    step,
    method,
    path: `/api/v1/${path}`,
    status: res.status,
    requestNotes: opts.requestNotes,
    response: sanitize(json),
  };
}

async function main() {
  const outDir = resolve("docs/funding/technical-evidence/D02/evidence");
  mkdirSync(outDir, { recursive: true });

  const adminId = "d02_evidence_admin";
  const memberId = "d02_evidence_member";
  const stamp = Date.now();

  await prisma.sessionAttendance.deleteMany({
    where: { userId: { in: [adminId, memberId] } },
  });
  await prisma.session.deleteMany({
    where: { hostUserId: { in: [adminId, memberId] } },
  });
  await prisma.clubInvite.deleteMany({
    where: { club: { createdById: adminId } },
  });
  await prisma.clubMembership.deleteMany({
    where: { userId: { in: [adminId, memberId] } },
  });
  await prisma.club.deleteMany({ where: { createdById: adminId } });
  await prisma.appUser.deleteMany({
    where: {
      email: {
        in: ["d02-evidence-admin@example.test", "d02-evidence-member@example.test"],
      },
    },
  });

  await prisma.appUser.createMany({
    data: [
      {
        id: adminId,
        email: "d02-evidence-admin@example.test",
        passwordHash: hashPassword("evidence-admin-pass-1"),
        displayName: "Evidence Admin",
      },
      {
        id: memberId,
        email: "d02-evidence-member@example.test",
        passwordHash: hashPassword("evidence-member-pass-1"),
        displayName: "Evidence Member",
      },
    ],
  });

  const adminToken = await signAppAccessToken(adminId);
  const memberToken = await signAppAccessToken(memberId);

  const captures: Capture[] = [];

  captures.push(
    await capture("1_health", "GET", "health", {
      requestNotes: "Unauthenticated readiness probe",
    }),
  );

  captures.push(
    await capture("2_register", "POST", "auth/email/register", {
      body: {
        email: `d02-evidence-reg-${stamp}@example.test`,
        password: "evidence-reg-pass-99",
        displayName: "Evidence Registrant",
      },
      requestNotes: "Self-serve email register (password redacted in artifact)",
    }),
  );

  captures.push(
    await capture("3_unauth_me", "GET", "me/memberships", {
      requestNotes: "No Authorization header → expect 401 UNAUTHORIZED",
    }),
  );

  captures.push(
    await capture("4_create_club", "POST", "clubs", {
      token: adminToken,
      body: {
        name: "D02 Evidence Club",
        slug: `d02-evidence-${stamp}`,
        city: "Casablanca",
        visibility: "public",
      },
      requestNotes: "Bearer admin JWT → create club",
    }),
  );

  const clubId = (captures[3].response as any)?.data?.id as string;

  captures.push(
    await capture("5_invite", "POST", `clubs/${clubId}/invite`, {
      token: adminToken,
      body: {},
      requestNotes: "Admin invite code generation",
    }),
  );
  const code = (captures[4].response as any)?.data?.code as string;

  captures.push(
    await capture("6_join", "POST", "clubs/join-by-code", {
      token: memberToken,
      body: { code },
      requestNotes: "Member joins with invite code",
    }),
  );

  captures.push(
    await capture("7_roster_member_forbidden", "GET", `clubs/${clubId}/roster`, {
      token: memberToken,
      requestNotes: "Approved member without manage_club → expect 403 FORBIDDEN",
    }),
  );

  captures.push(
    await capture("8_roster_admin_ok", "GET", `clubs/${clubId}/roster`, {
      token: adminToken,
      requestNotes: "Admin/coach manage_club → roster 200",
    }),
  );

  const summary = {
    capturedAt: new Date().toISOString(),
    environment: {
      database: "local disposable PostgreSQL (grpd_test @ 127.0.0.1)",
      auth: "AUTH_JWT_SECRET synthetic test secret (value not recorded)",
      note: "Tokens and passwords redacted in this artifact",
    },
    assertions: {
      healthOk: captures[0].status === 200,
      registerOk: captures[1].status === 200,
      unauthRejected: captures[2].status === 401,
      createClubOk: captures[3].status === 200,
      inviteOk: captures[4].status === 200,
      joinOk: captures[5].status === 200,
      memberRosterForbidden: captures[6].status === 403,
      adminRosterOk: captures[7].status === 200,
    },
    captures,
  };

  const outPath = resolve(outDir, "functional-captures.json");
  writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary.assertions, null, 2));
  console.log(`Wrote ${outPath}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
