/**
 * Codex correction points 1–6 — connected local PG via packaged dispatch.
 * Club GET privacy matrix, PATCH atomic invite conflict, member-group eligibility,
 * logout honesty, unrelated-club seed-before + API reload.
 */
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(root, "package.json"));
const AUDIT = resolve(root, "docs/audit/architecture-remediation");
const ART = "/opt/cursor/artifacts";
mkdirSync(AUDIT, { recursive: true });
mkdirSync(ART, { recursive: true });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const TEST_JWT = "codex-correction-jwt-secret-not-for-prod";
process.env.AUTH_JWT_SECRET = TEST_JWT;
delete process.env.SUPABASE_JWT_SECRET;
delete process.env.SUPABASE_URL;

function uid(label, phone) {
  return `${label}_${createHash("sha256").update(phone).digest("hex").slice(0, 14)}`;
}

const adminPhone = `+2127${String(Date.now()).slice(-8)}`;
const memberPhone = `+2128${String(Date.now()).slice(-8)}`;
const outsiderPhone = `+2126${String(Date.now()).slice(-8)}`;
const pendingPhone = `+2125${String(Date.now()).slice(-8)}`;
const adminId = uid("adm", adminPhone);
const memberId = uid("mem", memberPhone);
const outsiderId = uid("out", outsiderPhone);
const pendingId = uid("pen", pendingPhone);

process.env.PIN_ALLOWLIST_JSON = JSON.stringify([
  { phone: adminPhone, pin: "246810", userId: adminId, profileComplete: true },
  { phone: memberPhone, pin: "135791", userId: memberId, profileComplete: true },
  { phone: outsiderPhone, pin: "112233", userId: outsiderId, profileComplete: true },
  { phone: pendingPhone, pin: "445566", userId: pendingId, profileComplete: true },
]);

const bundlePath = resolve(root, ".packaging/serverless/api-v1.cjs");
if (!existsSync(bundlePath)) {
  console.error("Missing bundle — run: node scripts/package-serverless-api.mjs");
  process.exit(1);
}
const handler = require(bundlePath).default;
const { PrismaClient, MembershipRole, MembershipStatus } = require("@prisma/client");
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

function invoke(method, urlPath, { token, body } = {}) {
  return new Promise((resolvePromise, reject) => {
    const state = { statusCode: 200, headers: {}, body: "" };
    const req = {
      method,
      url: urlPath,
      headers: {
        host: "127.0.0.1",
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body ?? {},
    };
    const res = {
      status(code) {
        state.statusCode = code;
        return res;
      },
      setHeader(key, value) {
        state.headers[key.toLowerCase()] = String(value);
        return res;
      },
      send(payload) {
        state.body =
          typeof payload === "string" ? payload : JSON.stringify(payload);
        return res;
      },
      json(payload) {
        state.headers["content-type"] = "application/json";
        state.body = JSON.stringify(payload);
        return res;
      },
    };
    Promise.resolve(handler(req, res))
      .then(() => resolvePromise(state))
      .catch(reject);
  });
}

function parseBody(state) {
  try {
    return JSON.parse(state.body || "{}");
  } catch {
    return {};
  }
}

const tipSha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
const suffix = `cx_${Date.now().toString(36)}`;
const results = [];
function check(id, ok, detail) {
  results.push({ id, ok, detail: String(detail ?? "").slice(0, 280) });
  console.log(ok ? "PASS" : "FAIL", id, String(detail ?? "").slice(0, 140));
}

async function login(phone, pin) {
  const res = await invoke("POST", "/api/v1/auth/pin/login", {
    body: { phone, pin },
  });
  const json = parseBody(res);
  return {
    status: res.statusCode,
    token: json?.data?.tokens?.accessToken ?? null,
  };
}

let publicClubId = null;
let privateClubId = null;
let otherClubId = null;

try {
  // --- Seed clubs BEFORE mutations (point 6) ---
  const publicClub = await prisma.club.create({
    data: {
      name: `Pub ${suffix}`,
      slug: `pub-${suffix}`,
      city: "Casablanca",
      visibility: "public",
      description: "public desc",
      createdById: adminId,
      memberships: {
        create: [
          {
            userId: adminId,
            role: MembershipRole.admin,
            status: MembershipStatus.approved,
          },
          {
            userId: memberId,
            role: MembershipRole.member,
            status: MembershipStatus.approved,
            homeGroupId: "A",
          },
          {
            userId: pendingId,
            role: MembershipRole.member,
            status: MembershipStatus.pending,
            displayName: "Pending Person",
          },
        ],
      },
    },
  });
  publicClubId = publicClub.id;

  const privateClub = await prisma.club.create({
    data: {
      name: `Priv ${suffix}`,
      slug: `priv-${suffix}`,
      city: "Rabat",
      visibility: "members",
      description: "secret desc",
      createdById: adminId,
      memberships: {
        create: {
          userId: adminId,
          role: MembershipRole.admin,
          status: MembershipStatus.approved,
        },
      },
      invites: {
        create: { code: `INV${suffix}`.slice(0, 12).toUpperCase() },
      },
    },
  });
  privateClubId = privateClub.id;

  const otherClub = await prisma.club.create({
    data: {
      name: `Other ${suffix}`,
      slug: `other-${suffix}`,
      city: "Fes",
      visibility: "members",
      createdById: `other_${suffix}`,
      memberships: {
        create: {
          userId: memberId,
          role: MembershipRole.member,
          status: MembershipStatus.approved,
          homeGroupId: "C",
        },
      },
    },
  });
  otherClubId = otherClub.id;

  const otherBefore = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId: memberId, clubId: otherClubId } },
  });
  check(
    "p6_unrelated_seeded_before",
    otherBefore?.homeGroupId === "C",
    otherBefore?.homeGroupId,
  );

  const adminLogin = await login(adminPhone, "246810");
  const memberLogin = await login(memberPhone, "135791");
  const outsiderLogin = await login(outsiderPhone, "112233");
  const pendingLogin = await login(pendingPhone, "445566");
  check("login_admin", !!adminLogin.token, adminLogin.status);
  check("login_member", !!memberLogin.token, memberLogin.status);
  check("login_outsider", !!outsiderLogin.token, outsiderLogin.status);
  check("login_pending", !!pendingLogin.token, pendingLogin.status);

  // --- Point 1+2: GET privacy matrix ---
  const anonPub = await invoke("GET", `/api/v1/clubs/${publicClubId}`);
  const anonPubJ = parseBody(anonPub);
  check("p2_anon_public_200", anonPub.statusCode === 200, anonPub.statusCode);
  check(
    "p2_anon_public_no_pending",
    Array.isArray(anonPubJ?.data?.pendingMembers) &&
      anonPubJ.data.pendingMembers.length === 0,
    JSON.stringify(anonPubJ?.data?.pendingMembers)?.slice(0, 80),
  );
  check(
    "p2_anon_public_no_createdBy",
    !anonPubJ?.data?.club?.createdById,
    "createdById absent",
  );
  check(
    "p2_anon_public_allowlist_name",
    anonPubJ?.data?.club?.name === `Pub ${suffix}`,
    anonPubJ?.data?.club?.name,
  );

  const anonPriv = await invoke("GET", `/api/v1/clubs/${privateClubId}`);
  check(
    "p2_anon_private_404",
    anonPriv.statusCode === 404,
    anonPriv.statusCode,
  );

  const outPub = await invoke("GET", `/api/v1/clubs/${publicClubId}`, {
    token: outsiderLogin.token,
  });
  const outPubJ = parseBody(outPub);
  check("p2_outsider_public_200", outPub.statusCode === 200, outPub.statusCode);
  check(
    "p2_outsider_public_no_pending",
    outPubJ?.data?.pendingMembers?.length === 0,
    "no pending",
  );

  const outPriv = await invoke("GET", `/api/v1/clubs/${privateClubId}`, {
    token: outsiderLogin.token,
  });
  const outPrivJ = parseBody(outPriv);
  check(
    "p2_outsider_private_preview_200",
    outPriv.statusCode === 200,
    outPriv.statusCode,
  );
  check(
    "p2_outsider_private_no_pending",
    outPrivJ?.data?.pendingMembers?.length === 0,
    "invite preview without pending",
  );
  check(
    "p2_outsider_private_no_createdBy",
    !outPrivJ?.data?.club?.createdById,
    "no createdBy",
  );
  check(
    "p2_outsider_private_has_name",
    outPrivJ?.data?.club?.name === `Priv ${suffix}`,
    outPrivJ?.data?.club?.name,
  );

  const pendGet = await invoke("GET", `/api/v1/clubs/${publicClubId}`, {
    token: pendingLogin.token,
  });
  const pendJ = parseBody(pendGet);
  check("p2_pending_200", pendGet.statusCode === 200, pendGet.statusCode);
  check(
    "p2_pending_no_pending_list",
    pendJ?.data?.pendingMembers?.length === 0,
    "pending viewer cannot list pendings",
  );

  const memGet = await invoke("GET", `/api/v1/clubs/${publicClubId}`, {
    token: memberLogin.token,
  });
  const memJ = parseBody(memGet);
  check("p2_member_200", memGet.statusCode === 200, memGet.statusCode);
  check(
    "p2_member_no_pending",
    memJ?.data?.pendingMembers?.length === 0,
    "member no pending list",
  );
  check(
    "p2_member_no_createdBy",
    !memJ?.data?.club?.createdById,
    "member no createdBy",
  );

  const admGet = await invoke("GET", `/api/v1/clubs/${publicClubId}`, {
    token: adminLogin.token,
  });
  const admJ = parseBody(admGet);
  check("p2_admin_200", admGet.statusCode === 200, admGet.statusCode);
  check(
    "p2_admin_sees_pending",
    Array.isArray(admJ?.data?.pendingMembers) &&
      admJ.data.pendingMembers.some((p) => p.userId === pendingId),
    JSON.stringify(admJ?.data?.pendingMembers)?.slice(0, 120),
  );
  check(
    "p2_admin_has_createdBy",
    admJ?.data?.club?.createdById === adminId,
    admJ?.data?.club?.createdById,
  );

  // Ex-member: delete membership then GET
  await prisma.clubMembership.deleteMany({
    where: { userId: memberId, clubId: publicClubId },
  });
  const exGet = await invoke("GET", `/api/v1/clubs/${publicClubId}`, {
    token: memberLogin.token,
  });
  const exJ = parseBody(exGet);
  check("p2_exmember_200_public", exGet.statusCode === 200, exGet.statusCode);
  check(
    "p2_exmember_no_pending",
    exJ?.data?.pendingMembers?.length === 0,
    "ex-member no pending",
  );
  // restore member for later tests
  await prisma.clubMembership.create({
    data: {
      userId: memberId,
      clubId: publicClubId,
      role: MembershipRole.member,
      status: MembershipStatus.approved,
      homeGroupId: "A",
    },
  });

  // --- Point 3: PATCH atomic invite collision ---
  const collideCode = `X${suffix}`.slice(0, 10).toUpperCase();
  await prisma.clubInvite.create({
    data: { clubId: otherClubId, code: collideCode },
  });
  const beforePatch = await prisma.club.findUnique({
    where: { id: publicClubId },
  });
  const patchConflict = await invoke("PATCH", `/api/v1/clubs/${publicClubId}`, {
    token: adminLogin.token,
    body: {
      name: `SHOULD_NOT_STICK ${suffix}`,
      accessCode: collideCode,
    },
  });
  check(
    "p3_invite_collision_409",
    patchConflict.statusCode === 409,
    patchConflict.statusCode,
  );
  const afterPatch = await prisma.club.findUnique({
    where: { id: publicClubId },
  });
  check(
    "p3_collision_rolls_back_name",
    afterPatch?.name === beforePatch?.name,
    afterPatch?.name,
  );
  const retryOk = await invoke("PATCH", `/api/v1/clubs/${publicClubId}`, {
    token: adminLogin.token,
    body: {
      name: `Pub Renamed ${suffix}`,
      accessCode: `OK${suffix}`.slice(0, 10).toUpperCase(),
    },
  });
  check("p3_retry_ok", retryOk.statusCode === 200, retryOk.statusCode);
  const otherUnchanged = await prisma.club.findUnique({
    where: { id: otherClubId },
  });
  check(
    "p3_unrelated_club_unchanged",
    otherUnchanged?.name === `Other ${suffix}`,
    otherUnchanged?.name,
  );

  // --- Point 4: member-group eligibility ---
  const badGroup = await invoke(
    "PUT",
    `/api/v1/clubs/${publicClubId}/member-group`,
    {
      token: adminLogin.token,
      body: {
        userId: memberId,
        groupId: "B",
        eligibleGroupIds: ["A", "C"],
      },
    },
  );
  check(
    "p4_ineligible_group_400",
    badGroup.statusCode === 400,
    badGroup.statusCode,
  );
  const memStillA = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId: memberId, clubId: publicClubId } },
  });
  check(
    "p4_ineligible_no_change",
    memStillA?.homeGroupId === "A",
    memStillA?.homeGroupId,
  );

  const pendingAssign = await invoke(
    "PUT",
    `/api/v1/clubs/${publicClubId}/member-group`,
    {
      token: adminLogin.token,
      body: { userId: pendingId, groupId: "B" },
    },
  );
  check(
    "p4_pending_member_forbidden_or_404",
    pendingAssign.statusCode === 403 || pendingAssign.statusCode === 404,
    pendingAssign.statusCode,
  );

  const memberSelf = await invoke(
    "PUT",
    `/api/v1/clubs/${publicClubId}/member-group`,
    {
      token: memberLogin.token,
      body: { userId: memberId, groupId: "B" },
    },
  );
  check("p4_member_cannot_assign", memberSelf.statusCode === 403, memberSelf.statusCode);

  const otherSnapBefore = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId: memberId, clubId: otherClubId } },
  });

  const okAssign = await invoke(
    "PUT",
    `/api/v1/clubs/${publicClubId}/member-group`,
    {
      token: adminLogin.token,
      body: {
        userId: memberId,
        groupId: "B",
        eligibleGroupIds: ["A", "B", "C", "D"],
      },
    },
  );
  check("p4_admin_assign_ok", okAssign.statusCode === 200, okAssign.statusCode);
  const okAssignJ = parseBody(okAssign);
  check(
    "p4_admin_assign_response_home",
    okAssignJ?.data?.homeGroupId === "B",
    okAssignJ?.data?.homeGroupId,
  );

  // Opt-in color-group id allowed only when listed as eligible
  const colorId = `g_smoke_${suffix}`;
  const colorOk = await invoke(
    "PUT",
    `/api/v1/clubs/${publicClubId}/member-group`,
    {
      token: adminLogin.token,
      body: {
        userId: memberId,
        groupId: colorId,
        eligibleGroupIds: ["A", "B", colorId],
      },
    },
  );
  check("p4_color_group_assign_ok", colorOk.statusCode === 200, colorOk.statusCode);
  const colorAbsent = await invoke(
    "PUT",
    `/api/v1/clubs/${publicClubId}/member-group`,
    {
      token: adminLogin.token,
      body: {
        userId: memberId,
        groupId: "g_not_enabled",
        eligibleGroupIds: ["A", "B", colorId],
      },
    },
  );
  check(
    "p4_absent_color_group_400",
    colorAbsent.statusCode === 400,
    colorAbsent.statusCode,
  );

  // Membership removed during/before update → not_found (txn re-check)
  await prisma.clubMembership.deleteMany({
    where: { userId: memberId, clubId: publicClubId },
  });
  const midLeave = await invoke(
    "PUT",
    `/api/v1/clubs/${publicClubId}/member-group`,
    {
      token: adminLogin.token,
      body: {
        userId: memberId,
        groupId: "A",
        eligibleGroupIds: ["A", "B"],
      },
    },
  );
  check(
    "p4_membership_gone_during_update",
    midLeave.statusCode === 404,
    midLeave.statusCode,
  );
  await prisma.clubMembership.create({
    data: {
      userId: memberId,
      clubId: publicClubId,
      role: MembershipRole.member,
      status: MembershipStatus.approved,
      homeGroupId: colorId,
    },
  });

  // Point 6: fresh API read (not only DB) for reload
  const mgApi = await invoke("GET", `/api/v1/clubs/${publicClubId}`, {
    token: adminLogin.token,
  });
  // Snapshot unrelated AFTER mutation via DB + prove seeded before
  const otherSnapAfter = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId: memberId, clubId: otherClubId } },
  });
  check(
    "p6_unrelated_preserved_after_mutation",
    otherSnapBefore?.homeGroupId === "C" &&
      otherSnapAfter?.homeGroupId === "C",
    `${otherSnapBefore?.homeGroupId}->${otherSnapAfter?.homeGroupId}`,
  );
  const memAfter = await prisma.clubMembership.findUnique({
    where: { userId_clubId: { userId: memberId, clubId: publicClubId } },
  });
  check(
    "p4_assign_persisted",
    memAfter?.homeGroupId === colorId,
    memAfter?.homeGroupId,
  );
  check("p6_api_get_after_mutation_ok", mgApi.statusCode === 200, mgApi.statusCode);

  // Attendance untouched (no session attendance rows for this member)
  const attCount = await prisma.sessionAttendance.count({
    where: { userId: memberId },
  });
  check("p4_attendance_untouched", attCount === 0, attCount);

  // --- Point 5: logout honesty ---
  const logout = await invoke("POST", "/api/v1/auth/logout", {
    token: adminLogin.token,
    body: { refreshToken: "x", deviceId: "smoke" },
  });
  const logoutJ = parseBody(logout);
  check("p5_logout_200", logout.statusCode === 200, logout.statusCode);
  check(
    "p5_logout_stateless_ack",
    logoutJ?.data?.serverRevocation === "not_applicable_stateless_jwt",
    JSON.stringify(logoutJ?.data),
  );
  const stillValid = await invoke("POST", "/api/v1/auth/logout", {
    token: adminLogin.token,
    body: {},
  });
  check(
    "p5_token_still_valid_until_client_discard",
    stillValid.statusCode === 200,
    stillValid.statusCode,
  );
  check(
    "p5_no_global_revoke_claim",
    !/revoked|denylist|invalidated/i.test(JSON.stringify(logoutJ)),
    "honest ack only",
  );
} catch (e) {
  check("uncaught", false, String(e?.stack || e));
} finally {
  await prisma.clubInvite
    .deleteMany({
      where: {
        clubId: { in: [publicClubId, privateClubId, otherClubId].filter(Boolean) },
      },
    })
    .catch(() => {});
  await prisma.club
    .deleteMany({
      where: {
        slug: {
          in: [`pub-${suffix}`, `priv-${suffix}`, `other-${suffix}`],
        },
      },
    })
    .catch(() => {});
  await prisma.$disconnect().catch(() => {});
}

const report = {
  batch: "codex-correction-api-1-6",
  points: [1, 2, 3, 4, 5, 6],
  tested_sha: tipSha,
  tested_at: new Date().toISOString(),
  environment: "local_postgres_integration",
  hosted_claim: false,
  native_claim: false,
  uat_claim: false,
  ocif_claim: false,
  summary: {
    pass: results.filter((r) => r.ok).length,
    fail: results.filter((r) => !r.ok).length,
    total: results.length,
  },
  checks: results,
};
const json = JSON.stringify(report, null, 2) + "\n";
writeFileSync(resolve(ART, "codex-correction-api-smoke.json"), json);
writeFileSync(resolve(AUDIT, "codex-correction-api-evidence.json"), json);
console.log("SUMMARY", report.summary);
process.exit(report.summary.fail ? 1 : 0);
